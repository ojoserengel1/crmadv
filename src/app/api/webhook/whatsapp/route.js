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

// Re-hospeda imagens no Supabase Storage via CDN + descriptografia HKDF.
// PTT/áudio: CDN do WhatsApp serve apenas sidecar de 26 bytes (protocolo mms3),
// impossível baixar servidor-a-servidor. Retorna null para PTT — UI exibe placeholder.
async function rehostMedia(url, mediaType, messageid, mediaKey = null, jpegThumbnail = null, mimetype = null) {
  if (!messageid) return url

  const isPtt = mediaType === 'ptt' || mediaType === 'audio'
  // PTT: não tenta download — CDN sempre retorna 26 bytes (streaming sidecar)
  if (isPtt) return null

  try {
    await ensureBucket()
    let buf, ct, ext

    // CDN do WhatsApp + descriptografia HKDF (funciona para imagens/vídeos/documentos)
    if (url && mediaKey) {
      let cleanUrl = url
      try {
        const u = new URL(url)
        u.searchParams.delete('mms3')
        cleanUrl = u.toString()
      } catch (_) {}

      let encBuf = null
      for (let attempt = 0; attempt < 2; attempt++) {
        const fetchUrl = attempt === 0 ? cleanUrl : url
        const r = await fetch(fetchUrl, {
          headers: { 'User-Agent': 'WhatsApp/2.23.24.82 A', 'Accept': '*/*' },
          signal: AbortSignal.timeout(10000),
        })
        if (!r.ok) { console.error('[rehost] CDN status:', r.status); break }
        encBuf = Buffer.from(await r.arrayBuffer())
        console.log(`[rehost] enc size tentativa ${attempt+1}:`, encBuf.length)
        if (encBuf.length > 100) break
        await new Promise(r2 => setTimeout(r2, 1000))
      }
      if (encBuf && encBuf.length > 100) {
        try {
          buf = decryptWhatsAppMedia(encBuf, mediaKey, mediaType)
          ct = mimetype && mimetype !== 'application/octet-stream' ? mimetype.split(';')[0].trim()
            : mediaType === 'image' ? 'image/jpeg'
            : mediaType === 'video' ? 'video/mp4'
            : 'application/octet-stream'
          ext = ct.includes('jpeg') || ct.includes('jpg') ? 'jpg'
            : ct.includes('png') ? 'png'
            : ct.includes('webp') ? 'webp'
            : ct.includes('mp4') ? 'mp4'
            : ct.includes('mpeg') || ct.includes('mp3') ? 'mp3'
            : ct.includes('aac') ? 'aac'
            : 'bin'
          console.log('[rehost] ok, size:', buf.length, 'ct:', ct)
        } catch (decErr) {
          console.error('[rehost] descriptografia falhou:', decErr.message)
          buf = null
        }
      } else {
        console.error('[rehost] CDN retornou poucos bytes:', encBuf?.length ?? 0)
      }
    }

    // Fallback thumbnail para imagens
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
    // Campos do content para descriptografia, tipo MIME e duração
    const jpegThumbnail = (typeof msg.content === 'object' && msg.content?.JPEGThumbnail) || null
    const mediaKey = (typeof msg.content === 'object' && msg.content?.mediaKey) || null
    const mimetype = (typeof msg.content === 'object' && msg.content?.mimetype) || null
    const audioDuration = (typeof msg.content === 'object' && msg.content?.seconds) || null
    const audioWaveform = (typeof msg.content === 'object' && msg.content?.waveform) || null

    // Para fromMe=false (lead enviou): session_id = telefone do lead (sender_pn)
    // Para fromMe=true (bot enviou): session_id = telefone do contato (chatid)
    const rawTelefone = fromMe ? (chatid || sender_pn || null) : (sender_pn || null)
    const telefone = normalizarTelefone(rawTelefone)

    if (!telefone) {
      console.log('[webhook] telefone nulo após normalização:', JSON.stringify({ rawTelefone, fromMe, sender_pn, chatid }))
      return NextResponse.json({ ok: true })
    }

    // Nome do remetente (lead) — usado no cadastro direto do lead
    const senderName = msg.senderName || null

    // Busca agentes pela instância (pode haver múltiplos na mesma instância)
    // ORDER BY created_at garante fallback determinístico (sempre o mesmo agente "padrão")
    const { data: agentesInstancia } = await supabaseAdmin
      .from('agentes')
      .select('id, cliente_id, webhook_path, ia_ativa, frase_gatilho, nicho')
      .eq('instancia_wpp', instanceName)
      .order('created_at', { ascending: true })

    let agente = agentesInstancia?.[0] || null

    // Multi-agente: rotear para o agente correto
    // Lead lookup roda para fromMe=true E fromMe=false (IA e humano)
    if (agentesInstancia && agentesInstancia.length > 1) {
      // 1. Busca lead existente pelo telefone — identifica o agente que atende este contato
      const { data: leadExistente } = await supabaseAdmin
        .from('leads')
        .select('agente_id')
        .eq('telefone', telefone)
        .in('agente_id', agentesInstancia.map(a => a.id))
        .order('id', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (leadExistente) {
        agente = agentesInstancia.find(a => a.id === leadExistente.agente_id) || agente
      } else if (!fromMe) {
        // 2. Lead novo (só para mensagens do contato) → match frase_gatilho no texto
        // Ordena por especificidade (frase mais longa primeiro) para evitar match prematuro
        const lower = (text || '').toLowerCase()
        const sortedBySpec = [...agentesInstancia].sort((a, b) => (b.frase_gatilho?.length || 0) - (a.frase_gatilho?.length || 0))
        const matched = sortedBySpec.find(a => a.frase_gatilho && lower.includes(a.frase_gatilho.toLowerCase()))
        if (matched) agente = matched
        // 3. Fallback → primeiro agente (agente já é agentesInstancia[0])
      }
    }

    const agenteId = agente?.id || null
    const clienteId = agente?.cliente_id || null
    const iaAtiva = agente?.ia_ativa ?? false

    // fromMe=true: pode ser IA (N8N) ou operador (CRM)
    // Se enviado via CRM, já foi salvo pelo /api/chat/enviar como 'agent'
    // O upsert com onConflict:message_id deduplicará se message_id bater
    const type = fromMe ? 'ai' : 'human'

    // messageTimestamp já vem em milissegundos da UazAPI
    const createdAt = messageTimestamp ? new Date(messageTimestamp).toISOString() : new Date().toISOString()

    // Re-hospeda imagens/vídeos no Supabase Storage via CDN + HKDF.
    // PTT/áudio: retorna null (CDN não serve o arquivo, só sidecar de 26 bytes).
    const isPtt = mediaType === 'ptt' || mediaType === 'audio'
    let finalMediaUrl = mediaUrl
    if (mediaUrl || jpegThumbnail) {
      const mid = messageid || `tmp_${Date.now()}`
      finalMediaUrl = await rehostMedia(mediaUrl, mediaType, mid, mediaKey, jpegThumbnail, mimetype)
    }

    // content: para PTT armazena duração + waveform; para outros armazena texto
    // Formato: [ptt:6s:BASE64_WAVEFORM] — waveform opcional
    const contentToSave = isPtt
      ? `[ptt:${audioDuration || 0}s${audioWaveform ? ':' + audioWaveform : ''}]`
      : (text || null)

    // media_url: para PTT guarda CDN URL original (proxy de áudio usará para tentar download)
    //            para outros tipos usa URL do Supabase Storage (descriptografada)
    const mediaUrlToSave = isPtt ? (mediaUrl || null) : (finalMediaUrl || null)

    // media_type: sempre salvo para PTT (UI usa para renderizar card de voz)
    const mediaTypeToSave = mediaType || (finalMediaUrl ? 'media' : null)

    // Salva em chat_messages (message_id garante deduplicação)
    if (messageid) {
      const { error: upsertErr } = await supabaseAdmin.from('chat_messages').upsert(
        {
          agente_id: agenteId,
          cliente_id: clienteId,
          session_id: telefone,
          type,
          content: contentToSave,
          media_url: mediaUrlToSave,
          media_type: mediaTypeToSave,
          message_id: messageid,
          created_at: createdAt,
        },
        { onConflict: 'message_id', ignoreDuplicates: true }
      )
      if (upsertErr) console.error('[webhook] upsert erro:', upsertErr.message)
    } else {
      const { error: insertErr } = await supabaseAdmin.from('chat_messages').insert({
        agente_id: agenteId,
        cliente_id: clienteId,
        session_id: telefone,
        type,
        content: contentToSave,
        media_url: mediaUrlToSave,
        media_type: mediaTypeToSave,
        created_at: createdAt,
      })
      if (insertErr) console.error('[webhook] insert erro:', insertErr.message)
    }

    // Verifica situação do lead no funil — usado para:
    //   1) decidir se repassa ao N8N (leadJaProcessado)
    //   2) decidir se cadastra o lead direto (leadAtual=null + frase_gatilho match)
    // Critério robusto: lead passou da primeira etapa do funil (não muda com edição de status/resumo)
    // Se advogado mover o lead de volta para etapa 1, a IA volta a responder (intencional)
    let leadJaProcessado = false
    let leadAtual = null
    let primeiraEtapa = null
    if (!fromMe && agenteId) {
      const results = await Promise.all([
        supabaseAdmin.from('leads')
          .select('etapa_id, resumo')
          .eq('telefone', telefone)
          .eq('agente_id', agenteId)
          .maybeSingle(),
        supabaseAdmin.from('etapas_funil')
          .select('id')
          .eq('agente_id', agenteId)
          .order('ordem', { ascending: true })
          .limit(1)
          .maybeSingle(),
      ])
      leadAtual = results[0].data
      primeiraEtapa = results[1].data
      if (leadAtual) {
        const foiDaPrimeiraEtapa = primeiraEtapa && leadAtual.etapa_id !== primeiraEtapa.id
        const temResumo = !!leadAtual.resumo
        if (foiDaPrimeiraEtapa || temResumo) {
          leadJaProcessado = true
          console.log(`[webhook] lead já processado pela IA, não relaying N8N (${telefone}, etapa: ${leadAtual.etapa_id})`)
        }
      }
    }

    // Cadastra lead diretamente no CRM quando mensagem contém frase_gatilho
    // Independente do N8N — garante que o lead existe mesmo se N8N falhar ou recusar
    // N8N pode sobrescrever apenas o nome (ON CONFLICT DO UPDATE SET nome=...) sem conflito
    if (!fromMe && !leadJaProcessado && !leadAtual && primeiraEtapa && agenteId) {
      const fraGatilho = (agente?.frase_gatilho || '').trim().toLowerCase()
      const msgLower = (text || '').toLowerCase()
      // Só registra se frase_gatilho está configurada no agente E mensagem a contém
      const deveRegistrar = fraGatilho && msgLower.includes(fraGatilho)
      if (deveRegistrar) {
        const { error: leadErr } = await supabaseAdmin.from('leads').upsert(
          {
            agente_id: agenteId,
            cliente_id: clienteId,
            etapa_id: primeiraEtapa.id,
            telefone,
            nome: senderName,
            nicho: agente?.nicho || null,
            status: 'Atendimento (IA)',
          },
          { onConflict: 'agente_id,telefone', ignoreDuplicates: true }
        )
        if (leadErr) console.error('[webhook] erro ao criar lead:', leadErr.message)
        else console.log(`[webhook] lead registrado diretamente: ${telefone} → agente ${agenteId}`)
      }
    }

    // Repassa ao N8N somente mensagens recebidas (fromMe=false) e lead não qualificado
    // URL por agente: N8N_BASE_URL/webhook/{webhook_path}
    if (!fromMe && !leadJaProcessado && N8N_BASE_URL && agente?.webhook_path) {
      const n8nUrl = `${N8N_BASE_URL}/webhook/${agente.webhook_path}`
      try {
        const n8nRes = await fetch(n8nUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          // Inclui agente_id, cliente_id e ia_ativa no payload para o N8N controlar o fluxo
          body: JSON.stringify({ ...body, agente_id: agenteId, cliente_id: clienteId, ia_ativa: iaAtiva }),
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
