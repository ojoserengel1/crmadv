import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { createHmac, createDecipheriv } from 'crypto'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)
const UAZAPI_URL = process.env.UAZAPI_SERVER_URL

// Mesma função de descriptografia do webhook
function decryptWhatsAppMedia(encryptedBuf, mediaKeyBase64, mediaType) {
  const mediaKey = Buffer.from(mediaKeyBase64, 'base64')
  const info = Buffer.from('WhatsApp Audio Keys')
  const prk = createHmac('sha256', Buffer.alloc(32)).update(mediaKey).digest()
  const blocks = []
  let prev = Buffer.alloc(0)
  for (let i = 1; i <= 4; i++) {
    const hmac = createHmac('sha256', prk)
    hmac.update(prev)
    hmac.update(info)
    hmac.update(Buffer.from([i]))
    prev = hmac.digest()
    blocks.push(prev)
  }
  const expanded = Buffer.concat(blocks)
  const iv = expanded.slice(0, 16)
  const cipherKey = expanded.slice(16, 48)
  const encContent = encryptedBuf.slice(0, encryptedBuf.length - 10)
  const decipher = createDecipheriv('aes-256-cbc', cipherKey, iv)
  decipher.setAutoPadding(false)
  const dec = Buffer.concat([decipher.update(encContent), decipher.final()])
  const padLen = dec[dec.length - 1]
  return dec.slice(0, dec.length - padLen)
}

// Proxy de áudio PTT — tenta baixar via UazAPI (sessão autenticada do WhatsApp)
// GET /api/chat/audio?messageId=XXX&agenteId=YYY
export async function GET(req) {
  const { searchParams } = new URL(req.url)
  const messageId = searchParams.get('messageId')
  const agenteId = searchParams.get('agenteId')

  if (!messageId || !agenteId) {
    return NextResponse.json({ error: 'messageId e agenteId obrigatórios' }, { status: 400 })
  }

  // Busca token do agente + URL original do CDN (se armazenada)
  const [{ data: agente }, { data: msgRow }] = await Promise.all([
    supabaseAdmin.from('agentes').select('uazapi_token').eq('id', agenteId).single(),
    supabaseAdmin.from('chat_messages')
      .select('message_id, media_url, content')
      .eq('message_id', messageId)
      .single(),
  ])

  if (!agente?.uazapi_token) {
    return NextResponse.json({ error: 'Agente sem token' }, { status: 404 })
  }

  // 1ª tentativa: UazAPI /message/download com campo "id" (correto)
  if (UAZAPI_URL) {
    // Tenta as duas variações de campo que UazAPI pode aceitar
    const attempts = [
      { id: messageId },
      { messageId },
    ]
    for (const body of attempts) {
      try {
        const r = await fetch(`${UAZAPI_URL}/message/download`, {
          method: 'POST',
          headers: { 'token': agente.uazapi_token, 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(15000),
        })
        const respCt = r.headers.get('content-type') || ''
        console.log('[audio-proxy] UazAPI status:', r.status, 'ct:', respCt, 'body:', JSON.stringify(body))
        if (r.ok) {
          if (respCt.includes('audio') || respCt.includes('octet') || respCt.includes('ogg') || respCt.includes('mpeg')) {
            const buf = Buffer.from(await r.arrayBuffer())
            if (buf.length > 100) {
              console.log('[audio-proxy] UazAPI áudio ok, size:', buf.length)
              return new Response(buf, {
                headers: {
                  'Content-Type': 'audio/ogg',
                  'Content-Length': String(buf.length),
                  'Cache-Control': 'public, max-age=3600',
                },
              })
            }
          } else {
            const json = await r.json().catch(() => null)
            console.log('[audio-proxy] UazAPI json:', JSON.stringify(json)?.substring(0, 200))
            if (json?.data && typeof json.data === 'string') {
              const buf = Buffer.from(json.data, 'base64')
              if (buf.length > 100) {
                const mime = json.mimetype || 'audio/ogg'
                return new Response(buf, {
                  headers: { 'Content-Type': mime, 'Content-Length': String(buf.length) },
                })
              }
            }
          }
        } else {
          const err = await r.text()
          console.error('[audio-proxy] UazAPI erro:', r.status, err.substring(0, 100))
        }
      } catch (e) {
        console.error('[audio-proxy] UazAPI exceção:', e.message)
      }
    }
  }

  // 2ª tentativa: se tiver URL do CDN armazenada, tenta descriptografia
  // (funciona se o CDN retornar mais de 26 bytes — nunca acontece para PTT, mas tenta mesmo assim)
  const cdnUrl = msgRow?.media_url
  if (cdnUrl && cdnUrl.startsWith('https://mmg.whatsapp.net')) {
    console.log('[audio-proxy] tentando CDN direto:', cdnUrl.substring(0, 80))
    try {
      const r = await fetch(cdnUrl, {
        headers: { 'User-Agent': 'WhatsApp/2.23.24.82 A', 'Accept': '*/*' },
        signal: AbortSignal.timeout(10000),
      })
      const buf = Buffer.from(await r.arrayBuffer())
      console.log('[audio-proxy] CDN size:', buf.length)
      if (buf.length > 100) {
        return new Response(buf, {
          headers: { 'Content-Type': 'audio/ogg', 'Content-Length': String(buf.length) },
        })
      }
    } catch (e) {
      console.error('[audio-proxy] CDN exceção:', e.message)
    }
  }

  return NextResponse.json({ error: 'Áudio não disponível' }, { status: 404 })
}
