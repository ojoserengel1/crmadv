'use client'

import { useRouter } from 'next/navigation'
import { AdminClientesView } from '@/components/App'

export default function Page() {
  const router = useRouter()
  return <AdminClientesView onSelectCliente={(cl) => router.push(`/admin/${cl.id}`)} />
}
