/**
 * POST /api/admin/configurar-webhooks
 * Configura o webhook da UazAPI em TODAS as instâncias conectadas
 * apontando para o nosso app. Rodar uma vez após deploy ou quando
 * adicionar novos clientes com instâncias já existentes.
 */
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const UAZAPI_URL = process.env.UAZAPI_SERVER_URL
const APP_URL = process.env.NEXT_PUBLIC_APP_URL

export async function POST() {
  if (!APP_URL) {
    return NextResponse.json({ error: 'NEXT_PUBLIC_APP_URL não configurada' }, { status: 500 })
  }

  // Busca todos os agentes com token UazAPI (instâncias existentes)
  const { data: agentes, error } = await supabaseAdmin
    .from('agentes')
    .select('id, nome, instancia_wpp, uazapi_token')
    .not('uazapi_token', 'is', null)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const webhookUrl = `${APP_URL}/api/webhook/whatsapp`
  const results = []

  for (const agente of (agentes || [])) {
    try {
      const res = await fetch(`${UAZAPI_URL}/webhook`, {
        method: 'POST',
        headers: { 'token': agente.uazapi_token, 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: webhookUrl, events: ['messages'], enabled: true }),
      })
      const data = await res.json()
      results.push({ agente: agente.nome, instancia: agente.instancia_wpp, ok: res.ok, webhook: data?.[0]?.url })
    } catch (err) {
      results.push({ agente: agente.nome, instancia: agente.instancia_wpp, ok: false, error: err.message })
    }
  }

  return NextResponse.json({ webhookUrl, total: agentes?.length, results })
}
