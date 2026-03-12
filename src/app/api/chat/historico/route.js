import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function GET(req) {
  const { searchParams } = new URL(req.url)
  const telefone = searchParams.get('telefone')
  const agenteId = searchParams.get('agenteId')

  if (!telefone) return NextResponse.json({ messages: [] })

  // Busca todos os agentes do mesmo cliente para isolamento correto
  // Um lead pode ter sido salvo sob qualquer agente do cliente (edge case de routing multi-agente)
  // mas NUNCA deve vazar mensagens entre clientes distintos
  let agentesDoCliente = agenteId ? [agenteId] : []
  if (agenteId) {
    const { data: agente } = await supabaseAdmin
      .from('agentes')
      .select('cliente_id')
      .eq('id', agenteId)
      .maybeSingle()

    if (agente?.cliente_id) {
      const { data: irmãos } = await supabaseAdmin
        .from('agentes')
        .select('id')
        .eq('cliente_id', agente.cliente_id)
      agentesDoCliente = (irmãos || []).map(a => a.id)
    }
  }

  // --- chat_messages (sistema atual — webhook salva TODAS as mensagens) ---
  // Filtra por session_id (telefone) + agente IN {todos agentes do cliente}
  // Garante isolamento entre clientes sem perder mensagens de routing multi-agente interno
  let newMessages = []
  if (agentesDoCliente.length > 0) {
    const { data: rows } = await supabaseAdmin
      .from('chat_messages')
      .select('id, session_id, type, content, media_url, media_type, message_id, created_at')
      .eq('session_id', telefone)
      .in('agente_id', agentesDoCliente)
      .order('id', { ascending: true })

    newMessages = (rows || []).map(m => ({
      id: `db_${m.id}`,
      messageId: m.message_id || null,
      type: m.type,
      content: m.content || '',
      mediaUrl: m.media_url || null,
      mediaType: m.media_type || null,
      timestamp: new Date(m.created_at).getTime(),
    }))
  }

  // --- chat_memory (legado N8N) ---
  // N8N usa session_id no formato "{agente_id}:{telefone}" (multi-agente) ou "{telefone}" (legado)
  //
  // Estratégia de isolamento:
  //   1. Tenta primeiro o formato isolado: "{agente_id}:{telefone}" → sem risco de cross-client
  //   2. Só usa fallback "{telefone}" se não encontrou nada no formato isolado
  //      (necessário para N8N legado single-agent, mas risco mínimo pois chat_messages já existe)
  let legacyMessages = []
  {
    let legacyRows = null

    // Passo 1: formato isolado por agente (N8N multi-agente atual)
    if (agenteId) {
      const { data } = await supabaseAdmin
        .from('chat_memory')
        .select('id, session_id, message')
        .eq('session_id', `${agenteId}:${telefone}`)
        .order('id', { ascending: true })
      if (data?.length) legacyRows = data
    }

    // Passo 2: fallback formato legado — só se o formato isolado não retornou nada
    if (!legacyRows) {
      const { data } = await supabaseAdmin
        .from('chat_memory')
        .select('id, session_id, message')
        .eq('session_id', telefone)
        .order('id', { ascending: true })
      legacyRows = data
    }

    legacyMessages = (legacyRows || []).map(m => {
      const msg = typeof m.message === 'string' ? JSON.parse(m.message) : m.message
      const content = msg?.content || msg?.data?.content || msg?.kwargs?.content || ''
      const lcClassName = Array.isArray(msg?.id) ? msg.id[msg.id.length - 1] : null
      const rawType = String((msg?.type === 'constructor' && lcClassName) ? lcClassName : (msg?.type || lcClassName || ''))
      const type = rawType.toLowerCase().includes('human') ? 'human'
        : rawType.toLowerCase().includes('ai') ? 'ai'
        : rawType || 'human'
      return {
        id: `legacy_${m.id}`,
        type,
        content,
        mediaUrl: msg?.media_url || null,
        mediaType: msg?.media_type || null,
        timestamp: m.id * 1000, // id sequencial como proxy de tempo relativo
      }
    })
  }

  // Estratégia de merge:
  // - chat_messages: timestamps reais, captura tudo via webhook (incluindo pós-qualificação)
  // - chat_memory: histórico N8N, pode ter duplicatas com chat_messages
  //
  // Se chat_messages tem AI → conversa completa no novo sistema → usa só chat_messages
  // Se chat_messages tem só human → complementa com legado (respostas da IA estão no chat_memory)
  // Se chat_messages vazio → usa apenas chat_memory
  let messages
  if (newMessages.length === 0) {
    messages = legacyMessages
  } else {
    const hasAiInNew = newMessages.some(m => m.type === 'ai')
    if (hasAiInNew) {
      // Conversa completa em chat_messages — usa como fonte única
      messages = newMessages
    } else {
      // chat_messages só tem mensagens humanas; chat_memory tem o histórico com respostas IA
      // Mescla: deduplica mensagens humanas com mesmo conteúdo
      const newContents = new Set(newMessages.map(m => m.content))
      const legacyFiltered = legacyMessages.filter(m => !newContents.has(m.content) || m.type === 'ai')
      messages = [...legacyFiltered, ...newMessages].sort((a, b) => a.timestamp - b.timestamp)
    }
  }

  return NextResponse.json({ messages })
}
