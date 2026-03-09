'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const supabase = createClient()

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const router = useRouter()

  const loadUser = async (authUser) => {
    const { data: profile } = await supabase
      .from('profiles')
      .select('nome, role')
      .eq('id', authUser.id)
      .single()

    if (!profile) return null

    let cliente_id = null
    if (profile.role === 'cliente') {
      const { data: cl } = await supabase
        .from('clientes')
        .select('id')
        .eq('profile_id', authUser.id)
        .single()
      cliente_id = cl?.id
    }

    return { email: authUser.email, nome: profile.nome, role: profile.role, cliente_id }
  }

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        const u = await loadUser(session.user)
        setUser(u)
      }
      setAuthLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        setUser(null)
        setAuthLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const logout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    router.push('/login')
  }

  return (
    <AuthContext.Provider value={{ user, setUser, authLoading, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
