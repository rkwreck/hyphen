'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

interface Message {
  role: 'user' | 'penni'
  text?: string
  deals?: any[]
  imagePreview?: string
}

export default function ChatPage() {
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([
    { role: 'penni', text: "Hey! Ask me about your deals, or send me a photo of a new coupon to save it." }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.push('/login'); return }
      setUserId(session.user.id)
    })
  }, [router])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage() {
    if (!input.trim() || !userId) return
    const userMsg = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', text: userMsg }])
    setLoading(true)

    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: userMsg, userId }),
    })
    const data = await res.json()
    setMessages(prev => [...prev, { role: 'penni', text: data.reply, deals: data.deals }])
    setLoading(false)
  }

  async function sendImage(file: File) {
    if (!userId) return
    const preview = URL.createObjectURL(file)
    setMessages(prev => [...prev, { role: 'user', text: 'Here is a deal photo:', imagePreview: preview }])
    setLoading(true)

    const formData = new FormData()
    formData.append('image', file)
    formData.append('userId', userId)

    const res = await fetch('/api/upload-deal', { method: 'POST', body: formData })
    const data = await res.json()
    setMessages(prev => [...prev, { role: 'penni', text: data.reply }])
    setLoading(false)
  }

  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--pink-50)' }}>
      <div className="border-b bg-white px-4 py-3 flex items-center gap-3" style={{ borderColor: 'var(--pink-100)' }}>
        <button onClick={() => router.push('/dashboard')} className="p-1.5 rounded-lg hover:bg-pink-50" aria-label="Back">
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <div>
          <h1 className="font-semibold text-base" style={{ color: 'var(--pink-700)' }}>Penni</h1>
          <p className="text-xs" style={{ color: '#9ca3af' }}>Your deal assistant</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3 max-w-2xl mx-auto w-full">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className="max-w-xs rounded-2xl px-4 py-2.5 text-sm"
              style={msg.role === 'user'
                ? { background: 'var(--pink-600)', color: 'white', borderRadius: '18px 18px 4px 18px' }
                : { background: 'white', border: '1px solid var(--pink-100)', borderRadius: '18px 18px 18px 4px' }
              }
            >
              {msg.imagePreview && (
                <img src={msg.imagePreview} alt="uploaded coupon" className="rounded-lg mb-2 max-w-full" style={{ maxHeight: 160, objectFit: 'cover' }} />
              )}
              {msg.text && <p style={{ color: msg.role === 'user' ? 'white' : '#1a1a1a' }}>{msg.text}</p>}
              {msg.deals && msg.deals.length > 0 && (
                <div className="flex flex-col gap-2 mt-2">
                  {msg.deals.map((deal: any) => (
                    <div key={deal.id} className="rounded-xl p-3 text-sm" style={{ background: 'var(--pink-50)', border: '1px solid var(--pink-200)' }}>
                      {deal.image_url && (
                        <img src={deal.image_url} alt={deal.store_name} className="rounded-lg mb-2 w-full" style={{ maxHeight: 100, objectFit: 'cover' }} />
                      )}
                      <p className="font-medium" style={{ color: 'var(--pink-800)' }}>{deal.store_name}</p>
                      <p style={{ color: 'var(--pink-600)' }}>{deal.discount_value}</p>
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
            <div className="px-4 py-3 rounded-2xl bg-white border text-sm" style={{ borderColor: 'var(--pink-100)' }}>
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: 'var(--pink-400)', animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: 'var(--pink-400)', animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: 'var(--pink-400)', animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="border-t bg-white px-4 py-3 max-w-2xl mx-auto w-full" style={{ borderColor: 'var(--pink-100)' }}>
        <input type="file" accept="image/*" ref={fileRef} className="hidden" onChange={e => e.target.files?.[0] && sendImage(e.target.files[0])} />
        <div className="flex items-center gap-2">
          <button onClick={() => fileRef.current?.click()} className="p-2 rounded-full border flex-shrink-0" style={{ borderColor: 'var(--pink-200)', color: 'var(--pink-500)' }} aria-label="Upload photo">
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
              <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="12" cy="13" r="4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            placeholder="What are you looking for?"
            className="flex-1"
            style={{ borderRadius: 20, padding: '8px 16px' }}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || loading}
            className="p-2 rounded-full flex-shrink-0"
            style={{ background: input.trim() ? 'var(--pink-600)' : 'var(--pink-200)', color: 'white' }}
            aria-label="Send"
          >
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M12 19V5M5 12l7-7 7 7" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
