import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function DELETE(req) {
  try {
    const { clienteId, profileId } = await req.json()
    if (!clienteId || !profileId) return NextResponse.json({ error: 'clienteId e profileId obrigatórios' }, { status: 400 })

    // Exclui clientes (cascade: agentes → leads, etapas, perguntas, chat_memory)
    const { error: errCliente } = await supabaseAdmin.from('clientes').delete().eq('id', clienteId)
    if (errCliente) return NextResponse.json({ error: errCliente.message }, { status: 500 })

    // Exclui profile
    await supabaseAdmin.from('profiles').delete().eq('id', profileId)

    // Exclui usuário do Auth
    await supabaseAdmin.auth.admin.deleteUser(profileId)

    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
