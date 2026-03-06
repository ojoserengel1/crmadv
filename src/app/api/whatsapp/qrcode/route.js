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
    .select('uazapi_instance_id, uazapi_token')
    .eq('id', agenteId)
    .single()

  if (!agente?.uazapi_token) {
    return NextResponse.json({ error: 'Instância não encontrada' }, { status: 404 })
  }

  try {
    // Verificar status atual
    const statusRes = await fetch(`${UAZAPI_URL}/instance/status?token=${agente.uazapi_token}`)
    const statusData = await statusRes.json()

    // Se conectado, retornar connected
    if (statusData.status?.connected === true) {
      return NextResponse.json({ connected: true })
    }

    // Se tem QR code no status, retornar
    if (statusData.instance?.qrcode) {
      return NextResponse.json({ qrCode: statusData.instance.qrcode })
    }

    // QR expirou — gerar novo chamando /instance/connect
    const connectRes = await fetch(`${UAZAPI_URL}/instance/connect`, {
      method: 'POST',
      headers: {
        'token': agente.uazapi_token,
        'Content-Type': 'application/json',
      },
    })
    const connectData = await connectRes.json()

    if (connectData.status?.connected === true) {
      return NextResponse.json({ connected: true })
    }

    if (connectData.instance?.qrcode) {
      return NextResponse.json({ qrCode: connectData.instance.qrcode })
    }

    return NextResponse.json({ waiting: true })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
