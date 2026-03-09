'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

export default function Page() {
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!user?.cliente_id) return
    supabase
      .from('agentes')
      .select('id')
      .eq('cliente_id', user.cliente_id)
      .order('created_at')
      .limit(1)
      .single()
      .then(({ data }) => {
        if (data?.id) router.replace(`/configuracoes/${data.id}/whatsapp`)
      })
  }, [user])

  return null
}
