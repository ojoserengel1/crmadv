import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(req) {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) {
    return NextResponse.json(
      { error: 'SUPABASE_SERVICE_ROLE_KEY não configurada no servidor.' },
      { status: 500 }
    )
  }

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    serviceKey,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { email, nome, nome_cliente, senha } = await req.json()

  if (!email || !nome || !nome_cliente || !senha) {
    return NextResponse.json({ error: 'Todos os campos são obrigatórios.' }, { status: 400 })
  }

  // Cria o usuário no Auth
  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email,
    password: senha,
    email_confirm: true,
    user_metadata: { nome },
  })

  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 400 })
  }

  // Upsert do profile (pode já ter sido criado por trigger)
  await admin.from('profiles').upsert({
    id: authData.user.id,
    email,
    nome,
    role: 'cliente',
    ativo: true,
  })

  // Cria o cliente
  const { data: cliente, error: clienteError } = await admin
    .from('clientes')
    .insert({ profile_id: authData.user.id, nome_cliente, ativo: true })
    .select()
    .single()

  if (clienteError) {
    return NextResponse.json({ error: clienteError.message }, { status: 400 })
  }

  return NextResponse.json({ success: true, cliente })
}
