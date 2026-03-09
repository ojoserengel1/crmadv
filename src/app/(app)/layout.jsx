'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Sidebar, co } from '@/components/App'
import { useAuth } from '@/contexts/AuthContext'

function pathnameToTab(pathname) {
  if (pathname.startsWith('/admin')) return 'clientes'
  if (pathname.startsWith('/leads')) return 'kanban'
  if (pathname.startsWith('/chat')) return 'chat'
  if (pathname.startsWith('/configuracoes')) return 'config'
  if (pathname.startsWith('/analytics')) return 'analytics'
  return null
}

export default function AppLayout({ children }) {
  const { user, authLoading, logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login')
    }
  }, [user, authLoading])

  if (authLoading || !user) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: co.bg, fontFamily: "'Inter', sans-serif" }}>
        <p style={{ margin: 0, fontSize: 14, color: co.textMuted }}>Carregando...</p>
      </div>
    )
  }

  const activeTab = pathnameToTab(pathname)

  const handleTabChange = (tab) => {
    if (tab === 'kanban') router.push('/leads')
    else if (tab === 'chat') router.push('/chat')
    else if (tab === 'config') router.push('/configuracoes')
    else if (tab === 'clientes') router.push('/admin')
    else if (tab === 'analytics') router.push('/analytics')
  }

  const handleConfigNav = (agenteId) => {
    router.push(`/configuracoes/${agenteId}/whatsapp`)
  }

  return (
    <div style={{ display: 'flex', height: '100vh', background: co.bg, fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", color: co.text }}>
      <Sidebar user={user} activeTab={activeTab} onTabChange={handleTabChange} onLogout={logout} onConfigNav={handleConfigNav} />
      <div style={{ flex: 1, overflow: 'hidden' }}>{children}</div>
    </div>
  )
}
