import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { createHmac, createDecipheriv } from 'crypto'

// Descriptografa mídia do WhatsApp usando HKDF + AES-256-CBC
// Referência: protocolo de criptografia E2E do WhatsApp
function decryptWhatsAppMedia(encryptedBuf, mediaKeyBase64, mediaType) {
  const mediaKey = Buffer.from(mediaKeyBase64, 'base64')
  const infoMap = {
    image: 'WhatsApp Image Keys',
    video: 'WhatsApp Video Keys',
    audio: 'WhatsApp Audio Keys',
    ptt: 'WhatsApp Audio Keys',
    document: 'WhatsApp Document Keys',
  }
  // RFC 5869 HKDF — sem null byte no info (compatível com baileys/whatsapp-web.js)
  const info = Buffer.from(infoMap[mediaType] || 'WhatsApp Image Keys')
  // HKDF-Extract: PRK = HMAC-SHA256(salt=zeros, IKM=mediaKey)
  const prk = createHmac('sha256', Buffer.alloc(32)).update(mediaKey).digest()
  // HKDF-Expand: 112 bytes
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
  // Arquivo criptografado = [dados AES-CBC][10 bytes MAC]
  const encContent = encryptedBuf.slice(0, encryptedBuf.length - 10)
  const decipher = createDecipheriv('aes-256-cbc', cipherKey, iv)
  decipher.setAutoPadding(false)
  const dec = Buffer.concat([decipher.update(encContent), decipher.final()])
  // Remove padding PKCS7 manual
  const padLen = dec[dec.length - 1]
  return dec.slice(0, dec.length - padLen)
}

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

// URL base do servidor N8N (sem barra final)
const N8N_BASE_URL = process.env.N8N_BASE_URL

// Garante que o bucket chat-media existe (executa uma vez por cold start)
let bucketReady = false
async function ensureBucket() {
  if (bucketReady) return
  const { error } = await supabaseAdmin.storage.createBucket('chat-media', { public: true })
  if (!error || error.message?.includes('already exists') || error.message?.includes('duplicate')) {
    bucketReady = true
  }
}

// Re-hospeda mídia no Supabase Storage.
// Áudio PTT: usa UazAPI /message/download (autenticado). Imagens: CDN + decrypt HKDF.
// Fallback: usa JPEGThumbnail se tudo falhar.
async function rehostMedia(url, mediaType, messageid, mediaKey = null, jpegThumbnail = null, mimetype = null, uazapiToken = null, content = null) {
  if (!messageid) return url
  try {
    await ensureBucket()
    let buf, ct, ext

    const isPtt = mediaType === 'ptt' || mediaType === 'audio'

    // Para PTT/áudio: tenta UazAPI /message/download primeiro
    // UazAPI mantém sessão autenticada e pode baixar o arquivo real
    if (isPtt && uazapiToken) {
      const UAZAPI_URL = process.env.UAZAPI_SERVER_URL
      if (UAZAPI_URL) {
        try {
          console.log('[rehost] tentando UazAPI /message/download para PTT, msgid:', messageid)
          const r = await fetch(`${UAZAPI_URL}/message/download`, {
            method: 'POST',
            headers: { 'token': uazapiToken, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              messageId: messageid,
              url: url || undefined,
              mediaKey: mediaKey || undefined,
              mimetype: mimetype || undefined,
              directPath: content?.directPath || undefined,
            }),
            signal: AbortSignal.timeout(20000),
          })
          const respCt = r.headers.get('content-type') || ''
          console.log('[rehost] UazAPI download status:', r.status, 'ct:', respCt)
          if (r.ok) {
            if (respCt.includes('audio') || respCt.includes('octet') || respCt.includes('ogg') || respCt.includes('mpeg')) {
              buf = Buffer.from(await r.arrayBuffer())
              ct = respCt.split(';')[0].trim()
              ext = ct.includes('ogg') ? 'ogg' : ct.includes('mp4') ? 'm4a' : ct.includes('mpeg') || ct.includes('mp3') ? 'mp3' : ct.includes('aac') ? 'aac' : 'ogg'
              console.log('[rehost] UazAPI áudio ok, size:', buf.length, 'ct:', ct)
            } else {
              // Resposta JSON — pode ter base64 ou URL
              const json = await r.json()
              console.log('[rehost] UazAPI json keys:', Object.keys(json))
              if (json.data && typeof json.data === 'string') {
                buf = Buffer.from(json.data, 'base64')
                ct = json.mimetype || (mimetype ? mimetype.split(';')[0].trim() : 'audio/ogg')
                ext = ct.includes('ogg') ? 'ogg' : ct.includes('mp4') ? 'm4a' : 'ogg'
                console.log('[rehost] UazAPI json base64, size:', buf.length)
              } else if (json.url) {
                // Retornou URL pública diretamente — usa ela
                console.log('[rehost] UazAPI retornou URL:', json.url)
                return json.url
              } else {
                console.log('[rehost] UazAPI json sem data/url:', JSON.stringify(json).substring(0, 200))
              }
            }
          } else {
            const errText = await r.text()
            console.error('[rehost] UazAPI download erro:', r.status, errText.substring(0, 200))
          }
        } catch (e) {
          console.error('[rehost] UazAPI download exceção:', e.message)
        }
      }
    }

    // Para imagens (e fallback de áudio): CDN + descriptografia HKDF
    if (!buf && url && mediaKey) {
      // mms3=true faz o CDN retornar apenas o sidecar (26 bytes) para PTT — não funciona.
      // Remove o parâmetro para forçar download do arquivo inteiro (funciona para imagens).
      let cleanUrl = url
      try {
        const u = new URL(url)
        u.searchParams.delete('mms3')
        cleanUrl = u.toString()
      } catch (_) {}
      if (cleanUrl !== url) console.log('[rehost] URL sem mms3:', cleanUrl.substring(0, 100))

      let encBuf = null
      for (let attempt = 0; attempt < 2; attempt++) {
        const fetchUrl = attempt === 0 ? cleanUrl : url
        const r = await fetch(fetchUrl, {
          headers: { 'User-Agent': 'WhatsApp/2.23.24.82 A', 'Accept': '*/*' },
          signal: AbortSignal.timeout(10000),
        })
        if (!r.ok) { console.error('[rehost] CDN status:', r.status); break }
        encBuf = Buffer.from(await r.arrayBuffer())
        console.log(`[rehost] tentativa ${attempt+1} enc size:`, encBuf.length)
        if (encBuf.length > 100) break
        await new Promise(r2 => setTimeout(r2, 1000))
      }
      if (encBuf && encBuf.length > 100) {
        console.log('[rehost] enc size:', encBuf.length, 'mediaType:', mediaType)
        try {
          buf = decryptWhatsAppMedia(encBuf, mediaKey, mediaType)
          ct = mimetype && mimetype !== 'application/octet-stream' ? mimetype
            : mediaType === 'image' ? 'image/jpeg'
            : isPtt ? 'audio/ogg'
            : mediaType === 'video' ? 'video/mp4'
            : 'application/octet-stream'
          ct = ct.split(';')[0].trim()
          ext = ct.includes('jpeg') || ct.includes('jpg') ? 'jpg'
            : ct.includes('png') ? 'png'
            : ct.includes('webp') ? 'webp'
            : ct.includes('ogg') ? 'ogg'
            : ct.includes('mp4') && !isPtt ? 'mp4'
            : ct.includes('mp4') ? 'm4a'
            : ct.includes('mpeg') || ct.includes('mp3') ? 'mp3'
            : ct.includes('aac') ? 'aac'
            : mediaType === 'image' ? 'jpg'
            : isPtt ? 'ogg'
            : 'bin'
          console.log('[rehost] descriptografado ok, size:', buf.length, 'ct:', ct, 'ext:', ext)
        } catch (decErr) {
          console.error('[rehost] descriptografia falhou:', decErr.message)
          buf = null
        }
      } else {
        console.error('[rehost] CDN não retornou dados suficientes:', encBuf?.length ?? 0, 'bytes')
      }
    }

    // Fallback para thumbnail se descriptografia falhar (só imagens)
    if (!buf && jpegThumbnail && mediaType === 'image') {
      buf = Buffer.from(jpegThumbnail, 'base64')
      ct = 'image/jpeg'
      ext = 'jpg'
      console.log('[rehost] fallback thumbnail, size:', buf.length)
    }

    if (!buf) return url

    const fname = `${messageid}.${ext}`
    const { error: upErr } = await supabaseAdmin.storage
      .from('chat-media')
      .upload(fname, buf, { contentType: ct, upsert: true })
    if (upErr) {
      console.error('[rehost] upload err:', upErr.message)
      return url
    }
    const { data: pub } = supabaseAdmin.storage.from('chat-media').getPublicUrl(fname)
    console.log('[rehost] URL final:', pub.publicUrl)
    return pub.publicUrl
  } catch (e) {
    console.error('[rehost] exceção:', e.message)
    return url
  }
}

// Normaliza telefone para o mesmo formato usado na tabela leads
// Ex: "554797094291@s.whatsapp.net" → "5547997094291"
function normalizarTelefone(input) {
  if (!input) return null
  // Remove sufixo WhatsApp (@s.whatsapp.net, @lid, etc.)
  let str = String(input).split('@')[0]
  // Remove não-dígitos
  let numero = str.replace(/\D/g, '')
  // Corrige código de país duplicado
  if (numero.startsWith('5555')) numero = numero.replace(/^555+/, '55')
  // Remove código de país para normalização
  if (numero.startsWith('55')) numero = numero.slice(2)
  if (numero.length < 10 || numero.length > 11) return null
  const ddd = numero.slice(0, 2)
  let telefone = numero.slice(2)
  // Adiciona dígito 9 para números de 8 dígitos (antigos)
  if (telefone.length === 8) telefone = '9' + telefone
  if (!telefone.startsWith('9')) telefone = '9' + telefone.slice(1)
  const final = `55${ddd}${telefone}`
  if (final.length !== 13) return null
  return final
}

export async function POST(req) {
  try {
    const body = await req.json()

    // UazAPI envia payload flat (sem wrapper body)
    const instanceName = body?.instanceName
    const msg = body?.message

    if (!instanceName || !msg) {
      console.log('[webhook] payload inválido:', JSON.stringify({ instanceName, hasMsg: !!msg }))
      return NextResponse.json({ ok: true })
    }

    // chatid (minúsculo) = número do contato (destino/origem da conversa)
    const { sender_pn, chatid, text, fromMe, messageid, messageTimestamp } = msg

    // Para mídia: URL está em msg.content.URL (objeto), não em msg.mediaUrl
    // msg.mediaType = 'image' | 'audio' | 'ptt' | 'video' | 'document'
    // msg.type = 'media' (genérico) para todos os tipos de mídia
    const mediaType = msg.mediaType || null
    const mediaUrl = (msg.mediaUrl) ||
      (typeof msg.content === 'object' && msg.content?.URL) || null
    // Campos do content para descriptografia e tipo MIME real
    const jpegThumbnail = (typeof msg.content === 'object' && msg.content?.JPEGThumbnail) || null
    const mediaKey = (typeof msg.content === 'object' && msg.content?.mediaKey) || null
    const mimetype = (typeof msg.content === 'object' && msg.content?.mimetype) || null

    // Log completo para diagnóstico de áudio
    if (mediaType === 'ptt' || mediaType === 'audio') {
      const msgFields = Object.keys(msg).reduce((acc, k) => {
        if (k === 'content') return acc
        acc[k] = msg[k]
        return acc
      }, {})
      console.log('[audio-debug] msg fields:', JSON.stringify(msgFields))
      console.log('[audio-debug] content keys:', typeof msg.content === 'object' ? Object.keys(msg.content) : msg.content)
      if (typeof msg.content === 'object') {
        const { JPEGThumbnail: _, ...contentNoThumb } = msg.content
        console.log('[audio-debug] content (sem thumbnail):', JSON.stringify(contentNoThumb))
      }
    }

    // Para fromMe=false (lead enviou): session_id = telefone do lead (sender_pn)
    // Para fromMe=true (bot enviou): session_id = telefone do contato (chatid)
    const rawTelefone = fromMe ? (chatid || sender_pn || null) : (sender_pn || null)
    const telefone = normalizarTelefone(rawTelefone)

    if (!telefone) {
      console.log('[webhook] telefone nulo após normalização:', JSON.stringify({ rawTelefone, fromMe, sender_pn, chatid }))
      return NextResponse.json({ ok: true })
    }

    // Busca agente pela instância — pega também webhook_path para relay N8N e token UazAPI
    const { data: agente } = await supabaseAdmin
      .from('agentes')
      .select('id, webhook_path, uazapi_token')
      .eq('instancia_wpp', instanceName)
      .single()

    const agenteId = agente?.id || null

    // fromMe=true: pode ser IA (N8N) ou operador (CRM)
    // Se enviado via CRM, já foi salvo pelo /api/chat/enviar como 'agent'
    // O upsert com onConflict:message_id deduplicará se message_id bater
    const type = fromMe ? 'ai' : 'human'

    // messageTimestamp já vem em milissegundos da UazAPI
    const createdAt = messageTimestamp ? new Date(messageTimestamp).toISOString() : new Date().toISOString()

    // Re-hospeda mídia no Supabase Storage
    // PTT: usa UazAPI /message/download; imagens: CDN + decrypt HKDF; fallback thumbnail
    let finalMediaUrl = mediaUrl
    if (mediaUrl || jpegThumbnail) {
      const mid = messageid || `tmp_${Date.now()}`
      const rawContent = typeof msg.content === 'object' ? msg.content : null
      finalMediaUrl = await rehostMedia(mediaUrl, mediaType, mid, mediaKey, jpegThumbnail, mimetype, agente?.uazapi_token, rawContent)
    }

    // Salva em chat_messages (message_id garante deduplicação)
    if (messageid) {
      const { error: upsertErr } = await supabaseAdmin.from('chat_messages').upsert(
        {
          agente_id: agenteId,
          session_id: telefone,
          type,
          content: text || null,
          media_url: finalMediaUrl || null,
          media_type: finalMediaUrl ? (mediaType || 'media') : null,
          message_id: messageid,
          created_at: createdAt,
        },
        { onConflict: 'message_id', ignoreDuplicates: true }
      )
      if (upsertErr) console.error('[webhook] upsert erro:', upsertErr.message)
    } else {
      const { error: insertErr } = await supabaseAdmin.from('chat_messages').insert({
        agente_id: agenteId,
        session_id: telefone,
        type,
        content: text || null,
        media_url: finalMediaUrl || null,
        media_type: finalMediaUrl ? (mediaType || 'media') : null,
        created_at: createdAt,
      })
      if (insertErr) console.error('[webhook] insert erro:', insertErr.message)
    }

    // Repassa ao N8N somente mensagens recebidas (fromMe=false)
    // URL por agente: N8N_BASE_URL/webhook/{webhook_path}
    if (!fromMe && N8N_BASE_URL && agente?.webhook_path) {
      const n8nUrl = `${N8N_BASE_URL}/webhook/${agente.webhook_path}`
      try {
        const n8nRes = await fetch(n8nUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        console.log(`[webhook] relay N8N (${agente.webhook_path}) status:`, n8nRes.status)
      } catch (err) {
        console.error(`[webhook] relay N8N (${agente.webhook_path}) erro:`, err.message)
      }
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[webhook/whatsapp] erro:', err.message)
    return NextResponse.json({ ok: true }) // sempre 200 para UazAPI não retentar
  }
}
