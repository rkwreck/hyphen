'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Toast from '@/components/Toast'

interface Message {
  role: 'user' | 'penni'
  text?: string
  deals?: any[]
  imagePreview?: string
}

export default function ChatPage() {
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([
    { role: 'penni', text: 'Hey! Ask me about your deals, or send me a photo of a new coupon to save it.' }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' | 'info' } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.push('/login'); return }
      setUserId(session.user.id)
      setAccessToken(session.access_token)
    })
  }, [router])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage() {
    if (!input.trim() || !userId || !accessToken) return
    const userMsg = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', text: userMsg }])
    setLoading(true)

    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: userMsg, userId, accessToken }),
    })
    const data = await res.json()
    if (res.status === 429) {
      setToast({ message: `Oops! ${data.error}`, type: 'error' })
    } else {
      setMessages(prev => [...prev, { role: 'penni', text: data.reply, deals: data.deals }])
    }
    setLoading(false)
  }

  async function sendImage(file: File) {
    if (!userId || !accessToken) return
    const preview = URL.createObjectURL(file)
    setMessages(prev => [...prev, { role: 'user', text: 'Here is a deal photo:', imagePreview: preview }])
    setLoading(true)

    const formData = new FormData()
    formData.append('image', file)
    formData.append('userId', userId)
    formData.append('accessToken', accessToken)

    const res = await fetch('/api/upload-deal', { method: 'POST', body: formData })
    const data = await res.json()
    if (res.status === 429) {
      setToast({ message: `Oops! ${data.error}`, type: 'error' })
    } else {
      setMessages(prev => [...prev, { role: 'penni', text: data.reply }])
    }
    setLoading(false)
  }

  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--p50)' }}>
      {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}
      <div className="border-b bg-white px-4 py-3 flex items-center gap-3" style={{ borderColor: 'var(--p100)' }}>
        <button onClick={() => router.push('/dashboard')} className="p-1.5 rounded-lg" style={{ color: '#6b7280' }} aria-label="Back"
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--p100)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <div>
          <h1 className="font-semibold text-base" style={{ color: 'var(--p700)' }}>Penni</h1>
          <p className="text-xs" style={{ color: '#9ca3af' }}>Your deal assistant</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3 max-w-2xl mx-auto w-full">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className="max-w-xs rounded-2xl px-4 py-2.5 text-sm"
              style={msg.role === 'user'
                ? { background: 'var(--p600)', color: 'white', borderRadius: '18px 18px 4px 18px' }
                : { background: 'white', border: '1px solid var(--p100)', borderRadius: '18px 18px 18px 4px' }
              }
            >
              {msg.imagePreview && (
                <img src={msg.imagePreview} alt="uploaded coupon" className="rounded-lg mb-2 max-w-full" style={{ maxHeight: 160, objectFit: 'cover' }} />
              )}
              {msg.text && <p style={{ color: msg.role === 'user' ? 'white' : '#1a1a1a' }}>{msg.text}</p>}
              {msg.deals && msg.deals.length > 0 && (
                <div className="flex flex-col gap-2 mt-2">
                  {msg.deals.map((deal: any) => (
                    <div key={deal.id} className="rounded-xl p-3 text-sm" style={{ background: 'var(--p50)', border: '1px solid var(--p200)' }}>
                      {deal.image_url && <img src={deal.image_url} alt={deal.store_name} className="rounded-lg mb-2 w-full" style={{ maxHeight: 100, objectFit: 'cover' }} />}
                      <p className="font-medium" style={{ color: 'var(--p800)' }}>{deal.store_name}</p>
                      <p style={{ color: 'var(--p600)' }}>{deal.discount_value}</p>
                      {deal.discount_code && <p style={{ color: '#6b7280' }}>Code: {deal.discount_code}</p>}
                      {deal.expiry_date && (
                        <p style={{ color: deal.expiry_date < today ? '#dc2626' : '#6b7280' }}>
                          {deal.expiry_date < today ? 'Expired' : `Expires ${deal.expiry_date}`}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="px-4 py-3 rounded-2xl bg-white border" style={{ borderColor: 'var(--p100)' }}>
              <div className="flex gap-1">
                {[0, 150, 300].map(d => (
                  <span key={d} className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: 'var(--p400)', animationDelay: `${d}ms` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="border-t bg-white px-4 py-3 max-w-2xl mx-auto w-full" style={{ borderColor: 'var(--p100)' }}>
        <input type="file" accept="image/*" ref={fileRef} className="hidden" onChange={e => e.target.files?.[0] && sendImage(e.target.files[0])} />
        <div className="flex items-center gap-2">
          <button onClick={() => fileRef.current?.click()} className="p-2 rounded-full border flex-shrink-0 transition-colors" style={{ borderColor: 'var(--p200)', color: 'var(--p500)' }} aria-label="Upload photo"
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--p50)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
              <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="12" cy="13" r="4"/>
            </svg>
          </button>
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()} placeholder="What are you looking for?" className="flex-1" style={{ borderRadius: 20, padding: '8px 16px' }} />
          <button onClick={sendMessage} disabled={!input.trim() || loading} className="p-2 rounded-full flex-shrink-0 transition-colors" style={{ background: input.trim() ? 'var(--p600)' : 'var(--p200)', color: 'white' }} aria-label="Send">
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M12 19V5M5 12l7-7 7 7" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
