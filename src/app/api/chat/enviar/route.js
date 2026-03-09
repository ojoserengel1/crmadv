import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const UAZAPI_URL = process.env.UAZAPI_SERVER_URL

async function tryFetch(url, options) {
  try {
    const r = await fetch(url, options)
    const body = await r.text()
    console.log(`[enviar] ${options.method} ${url} → ${r.status}:`, body.substring(0, 200))
    return { ok: r.ok, status: r.status, body }
  } catch (e) {
    console.error(`[enviar] fetch exception ${url}:`, e.message)
    return { ok: false, status: 0, body: e.message }
  }
}

export async function POST(req) {
  try {
    const { agenteId, telefone, tipo, conteudo, duration } = await req.json()

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

    // Envia via UazAPI — múltiplos fallbacks por tipo
    let uazOk = false
    let uazBody = null
    let messageId = null

    if (tipo === 'text') {
      const r = await tryFetch(`${UAZAPI_URL}/send/text`, {
        method: 'POST', headers,
        body: JSON.stringify({ number: telefone, text: conteudo }),
      })
      uazOk = r.ok
      if (r.ok) {
        try { const j = JSON.parse(r.body); messageId = j?.messageid || j?.messageId || j?.id || j?.key?.id || null } catch (_) {}
      }
      if (!uazOk) return NextResponse.json({ error: `UazAPI texto erro ${r.status}: ${r.body}` }, { status: 500 })

    } else if (tipo === 'ptt' || tipo === 'audio') {
      // 1ª: /send/media type=ptt
      let r = await tryFetch(`${UAZAPI_URL}/send/media`, {
        method: 'POST', headers,
        body: JSON.stringify({ number: telefone, file: conteudo, type: 'ptt' }),
      })
      // 2ª: /send/audio
      if (!r.ok) {
        r = await tryFetch(`${UAZAPI_URL}/send/audio`, {
          method: 'POST', headers,
          body: JSON.stringify({ number: telefone, url: conteudo }),
        })
      }
      uazOk = r.ok
      if (r.ok) {
        try { const j = JSON.parse(r.body); messageId = j?.messageid || j?.messageId || j?.id || j?.key?.id || null } catch (_) {}
      }

    } else if (tipo === 'image') {
      // 1ª: /send/media type=image
      let r = await tryFetch(`${UAZAPI_URL}/send/media`, {
        method: 'POST', headers,
        body: JSON.stringify({ number: telefone, file: conteudo, type: 'image' }),
      })
      // 2ª: /send/image com url
      if (!r.ok) {
        r = await tryFetch(`${UAZAPI_URL}/send/image`, {
          method: 'POST', headers,
          body: JSON.stringify({ number: telefone, url: conteudo, caption: '' }),
        })
      }
      // 3ª: /send/media type=image com url em vez de file
      if (!r.ok) {
        r = await tryFetch(`${UAZAPI_URL}/send/media`, {
          method: 'POST', headers,
          body: JSON.stringify({ number: telefone, url: conteudo, type: 'image' }),
        })
      }
      uazOk = r.ok
      if (r.ok) {
        try { const j = JSON.parse(r.body); messageId = j?.messageid || j?.messageId || j?.id || j?.key?.id || null } catch (_) {}
      }

    } else {
      // document
      // 1ª: /send/media type=document
      let r = await tryFetch(`${UAZAPI_URL}/send/media`, {
        method: 'POST', headers,
        body: JSON.stringify({ number: telefone, file: conteudo, type: 'document' }),
      })
      // 2ª: /send/document com url
      if (!r.ok) {
        r = await tryFetch(`${UAZAPI_URL}/send/document`, {
          method: 'POST', headers,
          body: JSON.stringify({ number: telefone, url: conteudo, filename: conteudo.split('/').pop() }),
        })
      }
      uazOk = r.ok
      if (r.ok) {
        try { const j = JSON.parse(r.body); messageId = j?.messageid || j?.messageId || j?.id || j?.key?.id || null } catch (_) {}
      }
    }

    // Salva em chat_messages independente de falha UazAPI (exceto texto)
    // Para texto, já retornamos erro acima se falhou
    // Para mídia: salva sempre para não perder o registro — se UazAPI falhou, loga aviso
    if (!uazOk && tipo !== 'text') {
      console.warn(`[enviar] UazAPI falhou para tipo=${tipo}, mas salvando no chat mesmo assim`)
    }

    const displayContent = tipo === 'text' ? conteudo
      : tipo === 'ptt' && duration ? `[ptt:${duration}s] ${conteudo}`
      : `[${tipo}] ${conteudo}`

    await supabaseAdmin.from('chat_messages').insert({
      agente_id: agenteId,
      session_id: telefone,
      type: 'agent',
      content: displayContent,
      media_url: tipo !== 'text' ? conteudo : null,
      media_type: tipo !== 'text' ? tipo : null,
      cliente_id: agente.cliente_id || null,
      message_id: messageId,
    })

    // Retorna sucesso mesmo se UazAPI de mídia falhou (mensagem fica no chat)
    // Retorna aviso para o frontend poder exibir feedback ao usuário
    if (!uazOk) {
      return NextResponse.json({ success: true, warning: 'Mensagem salva no chat mas pode não ter chegado ao WhatsApp' })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Erro em /api/chat/enviar:', err)
    return NextResponse.json({ error: err.message || 'Erro interno' }, { status: 500 })
  }
}
