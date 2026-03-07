/**
 * POST /api/admin/migrar-chat
 * Migra mensagens de chat_memory (N8N) → chat_messages (novo sistema)
 * Chamada uma única vez para popular o histórico existente.
 */
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST() {
  // Lê todo chat_memory
  const { data: rows, error } = await supabaseAdmin
    .from('chat_memory')
    .select('id, session_id, message')
    .order('id', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Busca mapeamento telefone → agente_id via leads
  const telefones = [...new Set((rows || []).map(r => r.session_id).filter(Boolean))]
  const { data: leads } = await supabaseAdmin
    .from('leads')
    .select('telefone, agente_id')
    .in('telefone', telefones)

  const agenteMap = {}
  for (const l of (leads || [])) agenteMap[l.telefone] = l.agente_id

  let inserted = 0
  let skipped = 0

  for (const row of (rows || [])) {
    const msg = typeof row.message === 'string' ? JSON.parse(row.message) : row.message
    const content = msg?.content || msg?.data?.content || msg?.kwargs?.content || ''
    if (!content) { skipped++; continue }

    const lcClassName = Array.isArray(msg?.id) ? msg.id[msg.id.length - 1] : null
    const rawType = String((msg?.type === 'constructor' && lcClassName) ? lcClassName : (msg?.type || lcClassName || ''))
    const type = rawType.toLowerCase().includes('human') ? 'human'
      : rawType.toLowerCase().includes('ai') ? 'ai'
      : rawType === 'agent' ? 'agent'
      : 'human'

    const { error: insErr } = await supabaseAdmin.from('chat_messages').insert({
      agente_id: agenteMap[row.session_id] || null,
      session_id: row.session_id,
      type,
      content,
      media_url: msg?.media_url || null,
      media_type: msg?.media_type || null,
    })

    if (insErr) skipped++
    else inserted++
  }

  return NextResponse.json({ total: rows?.length, inserted, skipped })
}
