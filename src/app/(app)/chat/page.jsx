'use client'

import { useAuth } from '@/contexts/AuthContext'
import { ChatView } from '@/components/App'

export default function Page() {
  const { user } = useAuth()
  if (!user) return null
  return <ChatView clienteId={user.cliente_id} />
}
