'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError(error.message); setLoading(false) }
    else router.push('/dashboard')
  }

  async function handleGoogle() {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: { access_type: 'offline', prompt: 'consent' },
      },
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--p50)' }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-semibold" style={{ color: 'var(--p600)' }}>Hyphen</h1>
          <p className="text-sm mt-1" style={{ color: '#6b7280' }}>Your personal deal keeper</p>
        </div>
        <div className="bg-white rounded-2xl p-8 border" style={{ borderColor: 'var(--p200)' }}>
          <h2 className="text-lg font-medium mb-6">Sign in</h2>
          {error && <p className="text-sm mb-4 p-3 rounded-lg" style={{ background: '#FEF2F2', color: '#991B1B' }}>{error}</p>}
          <button onClick={handleGoogle} className="w-full flex items-center justify-center gap-3 py-2.5 rounded-xl border text-sm font-medium mb-4" style={{ borderColor: '#e5e7eb', color: '#374151' }}>
            <svg width="18" height="18" viewBox="0 0 48 48">
              <path fill="#FFC107" d="M43.6 20H24v8h11.3C33.7 33.1 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 20-8 20-20 0-1.3-.1-2.7-.4-4z"/>
              <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 15.1 18.9 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
              <path fill="#4CAF50" d="M24 44c5.2 0 9.9-1.9 13.5-5l-6.2-5.2C29.5 35.6 26.9 36 24 36c-5.2 0-9.6-2.9-11.3-7.1l-6.5 5C9.5 39.6 16.3 44 24 44z"/>
              <path fill="#1976D2" d="M43.6 20H24v8h11.3c-.8 2.3-2.3 4.2-4.3 5.5l6.2 5.2C41 34.9 44 29.9 44 24c0-1.3-.1-2.7-.4-4z"/>
            </svg>
            Continue with Google
          </button>
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px" style={{ background: '#e5e7eb' }} />
            <span className="text-xs" style={{ color: '#9ca3af' }}>or</span>
            <div className="flex-1 h-px" style={{ background: '#e5e7eb' }} />
          </div>
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block" style={{ color: '#374151' }}>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@email.com" required />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block" style={{ color: '#374151' }}>Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
            </div>
            <button type="submit" className="w-full py-2.5 rounded-xl text-sm font-medium text-white mt-1" style={{ background: 'var(--p600)' }} disabled={loading}>
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
          <p className="text-sm text-center mt-6" style={{ color: '#6b7280' }}>
            No account?{' '}
            <Link href="/signup" style={{ color: 'var(--p600)', fontWeight: 500 }}>Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
