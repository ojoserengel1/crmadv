import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(req) {
  const { agenteId, clienteId } = await req.json()

  if (!agenteId) {
    return NextResponse.json({ error: 'agenteId obrigatório' }, { status: 400 })
  }

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  // Limpar dados da instância no Supabase
  // (A instância na UazAPI fica inativa — pode ser reconectada no futuro)
  const { error: dbErr } = await admin
    .from('agentes')
    .update({ uazapi_instance_id: null, uazapi_token: null, instancia_wpp: null })
    .eq('id', agenteId)

  if (dbErr) {
    return NextResponse.json({ error: dbErr.message }, { status: 500 })
  }

  // Limpar instância de todos os outros agentes do cliente (multi-agente)
  if (clienteId) {
    await admin
      .from('agentes')
      .update({ uazapi_instance_id: null, uazapi_token: null, instancia_wpp: null })
      .eq('cliente_id', clienteId)
      .neq('id', agenteId)
  }

  return NextResponse.json({ success: true })
}
