import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

// Endpoint temporário para capturar o payload real da UazAPI
// Salva o raw body em chat_messages para visualizar no Supabase
export async function POST(req) {
  try {
    const body = await req.json()
    await supabaseAdmin.from('chat_messages').insert({
      agente_id: null,
      session_id: 'DEBUG',
      type: 'human',
      content: JSON.stringify(body, null, 2),
    })
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ ok: true, err: err.message })
  }
}
