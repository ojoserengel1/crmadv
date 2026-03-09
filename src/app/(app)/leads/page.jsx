'use client'

import { useAuth } from '@/contexts/AuthContext'
import { KanbanView } from '@/components/App'

export default function Page() {
  const { user } = useAuth()
  if (!user) return null
  return <KanbanView clienteId={user.cliente_id} />
}
