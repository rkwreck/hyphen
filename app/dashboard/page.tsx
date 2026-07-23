'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import type { Discount } from '@/lib/types'
import DealCard from '@/components/DealCard'
import AddDealModal from '@/components/AddDealModal'

type Filter = 'all' | 'gift_card' | 'coupon' | 'promo_code' | 'used'
type Sort = 'expiry' | 'store'

export default function DashboardPage() {
  const router = useRouter()
  const [deals, setDeals] = useState<Discount[]>([])
  const [filter, setFilter] = useState<Filter>('all')
  const [sort, setSort] = useState<Sort>('expiry')
  const [sortOpen, setSortOpen] = useState(false)
  const [showAddDeal, setShowAddDeal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [userInitial, setUserInitial] = useState('?')
  const [showUserMenu, setShowUserMenu] = useState(false)
  const sortRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.push('/login'); return }
      setUserId(session.user.id)
      const email = session.user.email || ''
      const name = session.user.user_metadata?.full_name || ''
      setUserInitial((name || email).charAt(0).toUpperCase())
      fetchDeals(supabase, session.user.id)
    })
  }, [router])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) setSortOpen(false)
    }
    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [])

  async function fetchDeals(supabase: any, uid: string) {
    const { data } = await supabase.from('discounts').select('*').eq('user_id', uid)
    setDeals(data || [])
    setLoading(false)
  }

  async function handleUpdate(id: string, savedAmount: number | null) {
    const supabase = createClient()
    const deal = deals.find(d => d.id === id)
    if (!deal) return
    const isDollar = deal.discount_value?.startsWith('$') || deal.category === 'gift_card'
    if (isDollar && savedAmount !== null && deal.discount_value) {
      const orig = parseFloat(deal.discount_value.replace(/[^0-9.]/g, ''))
      const remaining = Math.max(0, orig - savedAmount)
      const fullyUsed = remaining <= 0
      const newValue = fullyUsed ? deal.discount_value : `$${remaining.toFixed(2)} remaining`
      await supabase.from('discounts').update({ discount_value: newValue, is_used: fullyUsed }).eq('id', id)
      setDeals(prev => prev.map(d => d.id === id ? { ...d, discount_value: newValue, is_used: fullyUsed } : d))
    } else {
      await supabase.from('discounts').update({ is_used: true }).eq('id', id)
      setDeals(prev => prev.map(d => d.id === id ? { ...d, is_used: true } : d))
    }
  }

  async function handleRestore(id: string) {
    const supabase = createClient()
    await supabase.from('discounts').update({ is_used: false }).eq('id', id)
    setDeals(prev => prev.map(d => d.id === id ? { ...d, is_used: false } : d))
  }

  async function handleLogout() {
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
    } catch(_) {}
    window.location.href = '/login'
  }

  function handleDealAdded(deal: Discount) {
    setDeals(prev => [deal, ...prev])
    setShowAddDeal(false)
  }

  const filtered = deals
    .filter(d => {
      if (filter === 'used') return d.is_used
      if (d.is_used) return false
      if (filter === 'all') return true
      return d.category === filter
    })
    .sort((a, b) => {
      if (sort === 'store') return (a.store_name || '').localeCompare(b.store_name || '')
      if (!a.expiry_date) return 1
      if (!b.expiry_date) return -1
      return a.expiry_date.localeCompare(b.expiry_date)
    })

  const tabs: { label: string; value: Filter }[] = [
    { label: 'All', value: 'all' },
    { label: 'Gift cards', value: 'gift_card' },
    { label: 'Coupons', value: 'coupon' },
    { label: 'Promo codes', value: 'promo_code' },
    { label: 'Used', value: 'used' },
  ]

  return (
    <div className="min-h-screen" style={{ background: 'var(--pink-50)' }}>
      {showAddDeal && userId && (
        <AddDealModal userId={userId} onClose={() => setShowAddDeal(false)} onAdded={handleDealAdded} />
      )}

      <div className="max-w-5xl mx-auto px-4 py-5">
        <div className="flex items-center justify-between mb-5">
          <span className="text-xl font-semibold" style={{ color: 'var(--pink-700)' }}>Hyphen</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push('/dashboard/chat')}
              className="text-sm px-4 py-2 rounded-xl border font-medium transition-colors"
              style={{ borderColor: 'var(--pink-300)', background: 'var(--pink-50)', color: 'var(--pink-700)' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--pink-100)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'var(--pink-50)')}
            >
              Talk to Penni
            </button>
            <div className="relative">
              <button
                onClick={e => { e.stopPropagation(); setShowUserMenu(v => !v) }}
                className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-semibold transition-colors"
                style={{ background: 'var(--pink-600)' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--pink-700)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'var(--pink-600)')}
              >
                {userInitial}
              </button>
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-36 bg-white rounded-xl border shadow-lg z-50 overflow-hidden" style={{ borderColor: 'var(--pink-100)' }}>
                  <button
                    onClick={e => { e.stopPropagation(); handleLogout() }}
                    className="w-full text-left px-4 py-3 text-sm transition-colors"
                    style={{ color: '#374151' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--pink-50)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'white')}
                  >
                    Log out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mb-5">
          <div className="flex gap-2 flex-wrap">
            {tabs.map(tab => (
              <button
                key={tab.value}
                onClick={() => setFilter(tab.value)}
                className="px-4 py-1.5 rounded-full text-sm font-medium border transition-colors"
                style={filter === tab.value
                  ? { background: 'var(--pink-600)', color: 'white', borderColor: 'var(--pink-600)' }
                  : { background: 'white', color: 'var(--pink-700)', borderColor: 'var(--pink-200)' }
                }
                onMouseEnter={e => { if (filter !== tab.value) e.currentTarget.style.background = 'var(--pink-100)' }}
                onMouseLeave={e => { if (filter !== tab.value) e.currentTarget.style.background = 'white' }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative" ref={sortRef}>
            <button
              onClick={e => { e.stopPropagation(); setSortOpen(v => !v) }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm transition-colors"
              style={{ color: '#6b7280' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--pink-100)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M3 6h18M6 12h12M9 18h6" strokeLinecap="round"/>
              </svg>
              Sort
            </button>
            {sortOpen && (
              <div className="absolute right-0 mt-1 w-44 bg-white rounded-xl border shadow-lg z-50 overflow-hidden" style={{ borderColor: 'var(--pink-100)' }}>
                {[{ label: 'Expiry date', value: 'expiry' }, { label: 'Store name', value: 'store' }].map(s => (
                  <button
                    key={s.value}
                    onClick={() => { setSort(s.value as Sort); setSortOpen(false) }}
                    className="w-full text-left px-4 py-3 text-sm flex items-center justify-between"
                    style={{ color: sort === s.value ? 'var(--pink-700)' : '#374151', fontWeight: sort === s.value ? 500 : 400, background: 'white' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--pink-50)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'white')}
                  >
                    {s.label}
                    {sort === s.value && (
                      <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--pink-200)', borderTopColor: 'var(--pink-600)' }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <p className="text-base font-medium" style={{ color: '#6b7280' }}>No deals here</p>
            <button
              onClick={() => setShowAddDeal(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white transition-colors"
              style={{ background: 'var(--pink-600)' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--pink-700)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'var(--pink-600)')}
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M12 5v14M5 12h14" strokeLinecap="round"/>
              </svg>
              Add a new deal
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(deal => (
              <DealCard
                key={deal.id}
                deal={deal}
                onUpdate={handleUpdate}
                onRestore={handleRestore}
                isUsedView={filter === 'used'}
              />
            ))}
            {filter !== 'used' && (
              <button
                onClick={() => setShowAddDeal(true)}
                className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed min-h-48 transition-colors"
                style={{ borderColor: 'var(--pink-200)', color: 'var(--pink-400)', background: 'transparent' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--pink-50)'; e.currentTarget.style.borderColor = 'var(--pink-300)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'var(--pink-200)' }}
              >
                <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M12 5v14M5 12h14" strokeLinecap="round"/>
                </svg>
                <span className="text-sm font-medium">Add a new deal</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
