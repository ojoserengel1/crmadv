import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

// URL base do servidor N8N (sem barra final)
// Ex: https://n8n.grupoadv.com.br
const N8N_BASE_URL = process.env.N8N_BASE_URL

export async function POST(req) {
  try {
    const body = await req.json()

    const instanceName = body?.body?.instanceName
    const msg = body?.body?.message

    if (!instanceName || !msg) {
      return NextResponse.json({ ok: true })
    }

    const { sender_pn, text, fromMe, messageid, mediaUrl, type: msgType, messageTimestamp } = msg

    // Para fromMe=true (bot enviou): o contato pode estar em sender_pn, to_pn, recipient, chatId, etc.
    // Tentamos todos os campos possíveis — logamos o payload para identificar o correto
    const telefone = fromMe
      ? (msg.to_pn || msg.recipient_pn || msg.recipient || msg.chatId || msg.contact || sender_pn || null)
      : (sender_pn || null)

    // Log para debug de fromMe=true (descubrir campo correto do destinatário)
    if (fromMe) {
      console.log('[webhook] fromMe=true payload:', JSON.stringify({ sender_pn, to_pn: msg.to_pn, recipient_pn: msg.recipient_pn, chatId: msg.chatId, contact: msg.contact, telefone, text: text?.slice(0,30) }))
    }

    if (!telefone) return NextResponse.json({ ok: true })

    // Busca agente pela instância — pega também webhook_path para relay N8N
    const { data: agente } = await supabaseAdmin
      .from('agentes')
      .select('id, webhook_path')
      .eq('instancia_wpp', instanceName)
      .single()

    const agenteId = agente?.id || null

    const type = fromMe ? 'ai' : 'human'

    // Salva em chat_messages (message_id garante deduplicação)
    if (messageid) {
      await supabaseAdmin.from('chat_messages').upsert(
        {
          agente_id: agenteId,
          session_id: telefone,
          type,
          content: text || null,
          media_url: mediaUrl || null,
          media_type: mediaUrl ? (msgType || 'media') : null,
          message_id: messageid,
          created_at: messageTimestamp ? new Date(messageTimestamp * 1000).toISOString() : new Date().toISOString(),
        },
        { onConflict: 'message_id', ignoreDuplicates: true }
      )
    } else {
      await supabaseAdmin.from('chat_messages').insert({
        agente_id: agenteId,
        session_id: telefone,
        type,
        content: text || null,
        media_url: mediaUrl || null,
        media_type: mediaUrl ? (msgType || 'media') : null,
        created_at: messageTimestamp ? new Date(messageTimestamp * 1000).toISOString() : new Date().toISOString(),
      })
    }

    // Repassa ao N8N somente mensagens recebidas (fromMe=false)
    // URL por agente: N8N_BASE_URL/webhook/{webhook_path}
    if (!fromMe && N8N_BASE_URL && agente?.webhook_path) {
      const n8nUrl = `${N8N_BASE_URL}/webhook/${agente.webhook_path}`
      fetch(n8nUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }).catch(err => console.error(`[webhook] relay N8N (${agente.webhook_path}) erro:`, err.message))
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[webhook/whatsapp] erro:', err.message)
    return NextResponse.json({ ok: true }) // sempre 200 para UazAPI não retentar
  }
}
