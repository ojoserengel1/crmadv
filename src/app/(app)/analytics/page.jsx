'use client'

import { useAuth } from '@/contexts/AuthContext'
import { AnalyticsView } from '@/components/App'

export default function Page() {
  const { user } = useAuth()
  if (!user) return null
  return <AnalyticsView clienteId={user.cliente_id} />
}
