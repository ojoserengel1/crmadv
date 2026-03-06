import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const UAZAPI_URL = process.env.UAZAPI_SERVER_URL
const UAZAPI_ADMIN_TOKEN = process.env.UAZAPI_ADMIN_TOKEN

export async function POST(req) {
  const { agenteId, nomeInstancia } = await req.json()

  if (!agenteId || !nomeInstancia) {
    return NextResponse.json({ error: 'agenteId e nomeInstancia são obrigatórios' }, { status: 400 })
  }

  // 1. Criar instância na UazAPI
  let uazData
  try {
    const uazRes = await fetch(`${UAZAPI_URL}/instance/create`, {
      method: 'POST',
      headers: {
        'adminToken': UAZAPI_ADMIN_TOKEN,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: nomeInstancia, qrcode: true }),
    })

    uazData = await uazRes.json()

    if (!uazRes.ok || uazData.error) {
      return NextResponse.json({ error: uazData.error || `UazAPI erro ${uazRes.status}` }, { status: uazRes.status || 500 })
    }
  } catch (err) {
    return NextResponse.json({ error: `Falha ao comunicar com UazAPI: ${err.message}` }, { status: 500 })
  }

  const instanceId = uazData.instance?.id
  const instanceToken = uazData.instance?.token || uazData.token

  if (!instanceId || !instanceToken) {
    return NextResponse.json({ error: 'Resposta inesperada da UazAPI' }, { status: 500 })
  }

  // 2. Iniciar conexão para gerar QR Code
  let qrCode = null
  try {
    const connectRes = await fetch(`${UAZAPI_URL}/instance/connect`, {
      method: 'POST',
      headers: {
        'token': instanceToken,
        'Content-Type': 'application/json',
      },
    })
    const connectData = await connectRes.json()
    qrCode = connectData.instance?.qrcode || null
  } catch (_) {
    // Continua mesmo sem QR inicial — frontend irá fazer poll
  }

  // 3. Salvar instanceId + token no Supabase
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { error: dbErr } = await admin
    .from('agentes')
    .update({
      uazapi_instance_id: instanceId,
      uazapi_token: instanceToken,
      instancia_wpp: nomeInstancia,
    })
    .eq('id', agenteId)

  if (dbErr) {
    return NextResponse.json({ error: dbErr.message }, { status: 500 })
  }

  return NextResponse.json({ instanceId, instanceToken, qrCode })
}
