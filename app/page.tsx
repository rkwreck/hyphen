'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.push('/dashboard')
      else router.push('/login')
    })
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--p50)' }}>
      <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--p200)', borderTopColor: 'var(--p600)' }} />
    </div>
  )
}
