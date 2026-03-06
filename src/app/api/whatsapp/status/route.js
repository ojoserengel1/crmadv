import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const UAZAPI_URL = process.env.UAZAPI_SERVER_URL

export async function GET(req) {
  const { searchParams } = new URL(req.url)
  const agenteId = searchParams.get('agenteId')

  if (!agenteId) {
    return NextResponse.json({ error: 'agenteId obrigatório' }, { status: 400 })
  }

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { data: agente } = await admin
    .from('agentes')
    .select('uazapi_token')
    .eq('id', agenteId)
    .single()

  if (!agente?.uazapi_token) {
    return NextResponse.json({ connected: false, noInstance: true })
  }

  try {
    const res = await fetch(`${UAZAPI_URL}/instance/status?token=${agente.uazapi_token}`)
    const data = await res.json()
    return NextResponse.json({ connected: data.status?.connected === true })
  } catch (err) {
    return NextResponse.json({ connected: false, error: err.message })
  }
}
