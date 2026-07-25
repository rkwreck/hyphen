'use client'
import { Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'

function CallbackHandler() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const supabase = createClient()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        subscription.unsubscribe()
        router.replace('/dashboard')
      }
    })

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.replace('/dashboard')
    })

    return () => subscription.unsubscribe()
  }, [router, searchParams])

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--p50)' }}>
      <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--p200)', borderTopColor: 'var(--p600)' }} />
    </div>
  )
}

export default function AuthCallback() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--p50)' }}>
        <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--p200)', borderTopColor: 'var(--p600)' }} />
      </div>
    }>
      <CallbackHandler />
    </Suspense>
  )
}
