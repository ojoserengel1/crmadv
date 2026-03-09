'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { LoginPage } from '@/components/App'
import { useAuth } from '@/contexts/AuthContext'

export default function Page() {
  const { user, setUser } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (user) {
      router.replace(user.role === 'admin' ? '/admin' : '/leads')
    }
  }, [user])

  const handleLogin = (userData) => {
    setUser(userData)
    router.push(userData.role === 'admin' ? '/admin' : '/leads')
  }

  return <LoginPage onLogin={handleLogin} />
}
