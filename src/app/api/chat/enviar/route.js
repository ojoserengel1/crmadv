import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const UAZAPI_URL = process.env.UAZAPI_SERVER_URL

export async function POST(req) {
  try {
    const { agenteId, telefone, tipo, conteudo } = await req.json()

    if (!agenteId || !telefone || !tipo || !conteudo) {
      return NextResponse.json({ error: 'Parâmetros obrigatórios: agenteId, telefone, tipo, conteudo' }, { status: 400 })
    }

    // Busca token do agente
    const { data: agente, error: agenteErr } = await supabaseAdmin
      .from('agentes')
      .select('uazapi_token, cliente_id')
      .eq('id', agenteId)
      .single()

    if (agenteErr || !agente?.uazapi_token) {
      return NextResponse.json({ error: 'Agente não encontrado ou sem token UazAPI' }, { status: 404 })
    }

    const headers = {
      'token': agente.uazapi_token,
      'Content-Type': 'application/json',
    }

    // Envia via UazAPI — endpoint específico por tipo
    let uazRes
    if (tipo === 'text') {
      uazRes = await fetch(`${UAZAPI_URL}/send/text`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ number: telefone, text: conteudo }),
      })
    } else if (tipo === 'ptt' || tipo === 'audio') {
      uazRes = await fetch(`${UAZAPI_URL}/send/audio`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ number: telefone, url: conteudo }),
      })
    } else if (tipo === 'image') {
      uazRes = await fetch(`${UAZAPI_URL}/send/image`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ number: telefone, url: conteudo, caption: '' }),
      })
    } else {
      uazRes = await fetch(`${UAZAPI_URL}/send/document`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ number: telefone, url: conteudo, filename: conteudo.split('/').pop() }),
      })
    }

    if (!uazRes.ok) {
      const errText = await uazRes.text()
      console.error('UazAPI erro:', uazRes.status, errText)
      return NextResponse.json({ error: `UazAPI erro ${uazRes.status}: ${errText}` }, { status: 500 })
    }

    // Captura messageid da resposta UazAPI (para deduplicar com o webhook fromMe=true)
    // UazAPI retorna campo "messageid" (lowercase) na resposta do send
    let messageId = null
    try {
      const uazBody = await uazRes.json()
      messageId = uazBody?.messageid || uazBody?.messageId || uazBody?.id || uazBody?.key?.id || null
      if (!messageId) console.log('[enviar] resposta UazAPI sem messageid:', JSON.stringify(uazBody))
    } catch (_) {}

    // Salva em chat_messages como mensagem do operador
    await supabaseAdmin.from('chat_messages').insert({
      agente_id: agenteId,
      session_id: telefone,
      type: 'agent',
      content: tipo === 'text' ? conteudo : `[${tipo}] ${conteudo}`,
      media_url: tipo !== 'text' ? conteudo : null,
      media_type: tipo !== 'text' ? tipo : null,
      cliente_id: agente.cliente_id || null,
      message_id: messageId, // null se UazAPI não retornar — webhook fromMe=true será ignorado pelo ON CONFLICT
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Erro em /api/chat/enviar:', err)
    return NextResponse.json({ error: err.message || 'Erro interno' }, { status: 500 })
  }
}
