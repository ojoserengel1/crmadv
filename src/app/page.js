'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { co } from '@/components/App'

export default function Page() {
  const { user, authLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      router.replace('/login')
      return
    }
    router.replace(user.role === 'admin' ? '/admin' : '/leads')
  }, [user, authLoading])

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: co.bg }}>
      <p style={{ color: co.textMuted, fontSize: 14, fontFamily: "'Inter', sans-serif" }}>Carregando...</p>
    </div>
  )
}
