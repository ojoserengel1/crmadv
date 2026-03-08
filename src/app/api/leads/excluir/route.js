import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function DELETE(req) {
  try {
    const { leadId } = await req.json()
    if (!leadId) return NextResponse.json({ error: 'leadId obrigatório' }, { status: 400 })

    const { error } = await supabaseAdmin.from('leads').delete().eq('id', leadId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
