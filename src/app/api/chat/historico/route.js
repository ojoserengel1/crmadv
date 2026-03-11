import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function GET(req) {
  const { searchParams } = new URL(req.url)
  const telefone = searchParams.get('telefone')
  // agenteId mantido para compatibilidade, mas não filtra estritamente
  // (mensagens podem ter sido salvas com agente_id diferente por edge cases de routing)

  if (!telefone) return NextResponse.json({ messages: [] })

  // --- chat_messages (sistema atual — webhook salva TODAS as mensagens) ---
  // Filtra apenas por session_id para não perder mensagens com agente_id incorreto ou null
  const { data: rows } = await supabaseAdmin
    .from('chat_messages')
    .select('id, session_id, type, content, media_url, media_type, message_id, created_at')
    .eq('session_id', telefone)
    .order('id', { ascending: true })

  const newMessages = (rows || []).map(m => ({
    id: `db_${m.id}`,
    messageId: m.message_id || null,
    type: m.type,
    content: m.content || '',
    mediaUrl: m.media_url || null,
    mediaType: m.media_type || null,
    timestamp: new Date(m.created_at).getTime(),
  }))

  // --- chat_memory (legado N8N — histórico de conversas antes do novo sistema) ---
  // Sempre consulta para complementar histórico quando chat_messages não tem o histórico completo
  const { data: legacy } = await supabaseAdmin
    .from('chat_memory')
    .select('id, message')
    .eq('session_id', telefone)
    .order('id', { ascending: true })

  const legacyMessages = (legacy || []).map(m => {
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
      timestamp: m.id * 1000, // id sequencial * 1000 como proxy de timestamp relativo
    }
  })

  // Estratégia de merge:
  // - chat_messages tem timestamps reais e captura TUDO via webhook (incluindo mensagens pós-qualificação)
  // - chat_memory tem o histórico N8N (formato legado, pode ter duplicatas com chat_messages)
  //
  // Se chat_messages tem mensagens com AI (tipo 'ai'), significa que o sistema está completo
  // Se chat_messages só tem mensagens humanas, complementa com chat_memory para histórico N8N
  // Se chat_messages está vazio, usa apenas chat_memory
  let messages
  if (newMessages.length === 0) {
    // Sem dados no novo sistema — usa legado
    messages = legacyMessages
  } else {
    const hasAiInNew = newMessages.some(m => m.type === 'ai')
    if (hasAiInNew) {
      // chat_messages tem conversa completa (human + ai) — usa ele como fonte única
      messages = newMessages
    } else {
      // chat_messages tem apenas mensagens humanas (ex: ai responses só em chat_memory)
      // Mescla: legado primeiro (histórico), depois novo (mensagens recentes do lead)
      // Deduplica por conteúdo para evitar repetição de mensagens humanas
      const newContents = new Set(newMessages.map(m => m.content))
      const legacyFiltered = legacyMessages.filter(m => !newContents.has(m.content) || m.type === 'ai')
      messages = [...legacyFiltered, ...newMessages].sort((a, b) => a.timestamp - b.timestamp)
    }
  }

  return NextResponse.json({ messages })
}
