'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'

export default function SignupPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    })
    if (error) { setError(error.message); setLoading(false) }
    else router.push('/dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--pink-50)' }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-semibold" style={{ color: 'var(--pink-700)' }}>Penni</h1>
          <p className="text-sm mt-1" style={{ color: '#6b7280' }}>Your personal deal keeper</p>
        </div>
        <div className="bg-white rounded-2xl p-8 border" style={{ borderColor: 'var(--pink-100)' }}>
          <h2 className="text-lg font-medium mb-6">Create account</h2>
          {error && <p className="text-sm mb-4 p-3 rounded-lg" style={{ background: '#FEF2F2', color: '#991B1B' }}>{error}</p>}
          <form onSubmit={handleSignup} className="flex flex-col gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block" style={{ color: '#374151' }}>Name</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Your name" required />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block" style={{ color: '#374151' }}>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@email.com" required />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block" style={{ color: '#374151' }}>Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} />
            </div>
            <button type="submit" className="btn-primary mt-2" disabled={loading}>
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>
          <p className="text-sm text-center mt-6" style={{ color: '#6b7280' }}>
            Already have an account?{' '}
            <Link href="/login" style={{ color: 'var(--pink-600)', fontWeight: 500 }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
