import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST(req) {
  try {
    const { agente_id, cliente_id, nome, telefone, nicho, etapa_id, resumo } = await req.json()

    if (!agente_id || !cliente_id || !nome || !telefone) {
      return NextResponse.json({ error: 'agente_id, cliente_id, nome e telefone são obrigatórios' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('leads')
      .insert({
        agente_id,
        cliente_id,
        nome: nome.trim(),
        telefone: telefone.trim().replace(/\D/g, ''),
        nicho: nicho?.trim() || null,
        etapa_id: etapa_id || null,
        resumo: resumo?.trim() || null,
        status: 'novo',
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ lead: data })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
