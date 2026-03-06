import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(req) {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) {
    return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY não configurada.' }, { status: 500 })
  }

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    serviceKey,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { cliente_id, profile_id, nome_cliente, nome } = await req.json()

  if (!cliente_id || !nome_cliente) {
    return NextResponse.json({ error: 'Campos obrigatórios ausentes.' }, { status: 400 })
  }

  const { error: clienteError } = await admin
    .from('clientes')
    .update({ nome_cliente })
    .eq('id', cliente_id)

  if (clienteError) {
    return NextResponse.json({ error: clienteError.message }, { status: 400 })
  }

  if (profile_id && nome) {
    await admin.from('profiles').update({ nome }).eq('id', profile_id)
  }

  return NextResponse.json({ success: true })
}
