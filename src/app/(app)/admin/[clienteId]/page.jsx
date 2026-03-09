'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { AdminEditorView, co } from '@/components/App'

const supabase = createClient()

export default function Page({ params }) {
  const { clienteId } = params
  const [cliente, setCliente] = useState(null)

  useEffect(() => {
    supabase
      .from('clientes')
      .select('*')
      .eq('id', clienteId)
      .single()
      .then(({ data }) => setCliente(data))
  }, [clienteId])

  if (!cliente) {
    return (
      <div style={{ padding: 40, color: co.textMuted, fontSize: 14 }}>Carregando...</div>
    )
  }

  return <AdminEditorView cliente={cliente} />
}
