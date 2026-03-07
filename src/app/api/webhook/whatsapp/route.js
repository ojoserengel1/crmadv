import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

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

// Re-hospeda mídia no Supabase Storage para evitar CORS e URLs expiradas.
// Para imagens: usa JPEGThumbnail (base64 já decodificado) pois o CDN do WhatsApp
// serve dados criptografados. Para áudio: tenta baixar do CDN.
async function rehostMedia(url, mediaType, messageid, base64Thumbnail = null) {
  if (!messageid) return url
  try {
    await ensureBucket()
    let buf, ct, ext

    if (base64Thumbnail && mediaType === 'image') {
      // Thumbnail JPEG já decodificado — não precisa baixar do CDN criptografado
      buf = Buffer.from(base64Thumbnail, 'base64')
      ct = 'image/jpeg'
      ext = 'jpg'
      console.log('[rehost] usando JPEGThumbnail, size:', buf.length)
    } else if (url) {
      // Para áudio/outros: tenta baixar do CDN
      console.log('[rehost] baixando do CDN:', url.substring(0, 80))
      const res = await fetch(url, { signal: AbortSignal.timeout(9000) })
      if (!res.ok) {
        console.error('[rehost] CDN falhou:', res.status)
        return url
      }
      const ctRaw = res.headers.get('content-type') || 'application/octet-stream'
      ct = ctRaw === 'application/octet-stream'
        ? (mediaType === 'ptt' || mediaType === 'audio' ? 'audio/ogg'
          : mediaType === 'video' ? 'video/mp4'
          : ctRaw)
        : ctRaw
      ext = ct.includes('ogg') ? 'ogg'
        : ct.includes('mp3') || ct.includes('mpeg') ? 'mp3'
        : ct.includes('mp4') ? 'mp4'
        : mediaType === 'ptt' || mediaType === 'audio' ? 'ogg'
        : 'bin'
      buf = Buffer.from(await res.arrayBuffer())
      console.log('[rehost] CDN buf size:', buf.length, 'ct:', ct)
    } else {
      return null
    }

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
    // JPEGThumbnail: base64 já decodificado, disponível para imagens
    const jpegThumbnail = (typeof msg.content === 'object' && msg.content?.JPEGThumbnail) || null

    // Log para diagnóstico de URLs de mídia
    if (mediaType) {
      console.log('[webhook] mídia detectada:', JSON.stringify({
        mediaType,
        msgMediaUrl: msg.mediaUrl || null,
        contentUrl: (typeof msg.content === 'object' && msg.content?.URL) ? msg.content.URL.substring(0, 60) : null,
        hasJpegThumbnail: !!jpegThumbnail,
        contentKeys: typeof msg.content === 'object' ? Object.keys(msg.content) : null,
      }))
    }

    // Para fromMe=false (lead enviou): session_id = telefone do lead (sender_pn)
    // Para fromMe=true (bot enviou): session_id = telefone do contato (chatid)
    const rawTelefone = fromMe ? (chatid || sender_pn || null) : (sender_pn || null)
    const telefone = normalizarTelefone(rawTelefone)

    if (!telefone) {
      console.log('[webhook] telefone nulo após normalização:', JSON.stringify({ rawTelefone, fromMe, sender_pn, chatid }))
      return NextResponse.json({ ok: true })
    }

    // Busca agente pela instância — pega também webhook_path para relay N8N
    const { data: agente } = await supabaseAdmin
      .from('agentes')
      .select('id, webhook_path')
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
    // Imagens: usa JPEGThumbnail (já decodificado — CDN do WhatsApp serve dados criptografados)
    // Áudio: tenta baixar do CDN diretamente
    let finalMediaUrl = mediaUrl
    if (jpegThumbnail || mediaUrl) {
      const mid = messageid || `tmp_${Date.now()}`
      finalMediaUrl = await rehostMedia(mediaUrl, mediaType, mid, jpegThumbnail)
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
