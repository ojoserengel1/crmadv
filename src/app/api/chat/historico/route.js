import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function GET(req) {
  const { searchParams } = new URL(req.url)
  const telefone = searchParams.get('telefone')

  if (!telefone) return NextResponse.json({ messages: [] })

  // Lê de chat_messages (fonte principal — populada pelo webhook direto da UazAPI)
  const { data: rows } = await supabaseAdmin
    .from('chat_messages')
    .select('id, session_id, type, content, media_url, media_type, created_at')
    .eq('session_id', telefone)
    .order('id', { ascending: true })

  let messages = (rows || []).map(m => ({
    id: `db_${m.id}`,
    messageId: m.message_id || null, // ID WhatsApp para proxy de áudio PTT
    type: m.type,
    content: m.content || '',
    mediaUrl: m.media_url || null,
    mediaType: m.media_type || null,
    timestamp: new Date(m.created_at).getTime(),
  }))

  // Se chat_messages vazio, tenta chat_memory (histórico legado do N8N)
  if (!messages.length) {
    const { data: legacy } = await supabaseAdmin
      .from('chat_memory')
      .select('id, message')
      .eq('session_id', telefone)
      .order('id', { ascending: true })

    messages = (legacy || []).map(m => {
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
        timestamp: m.id,
      }
    })
  }

  return NextResponse.json({ messages })
}
