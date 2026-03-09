'use client'

import { useAuth } from '@/contexts/AuthContext'
import { ConfigView } from '@/components/App'

export default function Page({ params }) {
  const { user } = useAuth()
  if (!user) return null
  return (
    <ConfigView
      key={`${params.agenteId}-${params.secao}`}
      clienteId={user.cliente_id}
      initAgenteId={params.agenteId}
      initSection={params.secao}
    />
  )
}
