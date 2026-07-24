'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import type { Discount } from '@/lib/types'
import DealCard from '@/components/DealCard'
import AddDealModal from '@/components/AddDealModal'

type Filter = 'all' | 'gift_card' | 'coupon' | 'promo_code' | 'used'
type Sort = 'expiry' | 'store'

const C = {
  bg: 'var(--p50)',
  bgHover: 'var(--p100)',
  border: 'var(--p200)',
  borderStrong: 'var(--p300)',
  text: 'var(--p700)',
  textLight: 'var(--p500)',
  active: 'var(--p600)',
  activeHover: 'var(--p700)',
  white: 'white',
}

export default function DashboardPage() {
  const router = useRouter()
  const [deals, setDeals] = useState<Discount[]>([])
  const [filter, setFilter] = useState<Filter>('all')
  const [sort, setSort] = useState<Sort>('expiry')
  const [sortOpen, setSortOpen] = useState(false)
  const [showAddDeal, setShowAddDeal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [userInitial, setUserInitial] = useState('?')
  const [showUserMenu, setShowUserMenu] = useState(false)
  const sortRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.push('/login'); return }
      setUserId(session.user.id)
      setAccessToken(session.access_token)
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
    try { const supabase = createClient(); await supabase.auth.signOut() } catch (_) {}
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
    <div className="min-h-screen" style={{ background: C.bg }}>
      {showAddDeal && userId && accessToken && (
        <AddDealModal userId={userId} accessToken={accessToken} onClose={() => setShowAddDeal(false)} onAdded={handleDealAdded} />
      )}

      <div className="max-w-5xl mx-auto px-4 py-5">
        {/* Topbar */}
        <div className="flex items-center justify-between mb-6">
          <span className="text-xl font-bold" style={{ color: C.active }}>Hyphen</span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/dashboard/chat')}
              className="text-sm px-4 py-2 rounded-xl border font-medium transition-colors"
              style={{ borderColor: C.active, background: C.white, color: C.active }}
              onMouseEnter={e => { e.currentTarget.style.background = C.bgHover }}
              onMouseLeave={e => { e.currentTarget.style.background = C.white }}
            >
              Talk to Penni
            </button>
            <div className="relative">
              <button
                onClick={e => { e.stopPropagation(); setShowUserMenu(v => !v) }}
                className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold transition-colors"
                style={{ background: C.active }}
                onMouseEnter={e => (e.currentTarget.style.background = C.activeHover)}
                onMouseLeave={e => (e.currentTarget.style.background = C.active)}
              >
                {userInitial}
              </button>
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-36 bg-white rounded-xl border shadow-lg z-50 overflow-hidden" style={{ borderColor: C.border }}>
                  <button
                    onClick={e => { e.stopPropagation(); handleLogout() }}
                    className="w-full text-left px-4 py-3 text-sm transition-colors"
                    style={{ color: '#374151' }}
                    onMouseEnter={e => (e.currentTarget.style.background = C.bgHover)}
                    onMouseLeave={e => (e.currentTarget.style.background = C.white)}
                  >
                    Log out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tabs + Sort */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex gap-2 flex-wrap">
            {tabs.map(tab => (
              <button
                key={tab.value}
                onClick={() => setFilter(tab.value)}
                className="px-4 py-1.5 rounded-full text-sm font-medium border transition-colors"
                style={filter === tab.value
                  ? { background: C.active, color: C.white, borderColor: C.active }
                  : { background: C.white, color: C.text, borderColor: C.border }
                }
                onMouseEnter={e => { if (filter !== tab.value) { e.currentTarget.style.background = C.bgHover; e.currentTarget.style.borderColor = C.borderStrong } }}
                onMouseLeave={e => { if (filter !== tab.value) { e.currentTarget.style.background = C.white; e.currentTarget.style.borderColor = C.border } }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative" ref={sortRef}>
            <button
              onClick={e => { e.stopPropagation(); setSortOpen(v => !v) }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-colors border"
              style={{ color: C.text, borderColor: C.border, background: C.white }}
              onMouseEnter={e => { e.currentTarget.style.background = C.bgHover; e.currentTarget.style.borderColor = C.borderStrong }}
              onMouseLeave={e => { e.currentTarget.style.background = C.white; e.currentTarget.style.borderColor = C.border }}
            >
              <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M3 6h18M6 12h12M9 18h6" strokeLinecap="round"/>
              </svg>
              Sort
            </button>
            {sortOpen && (
              <div className="absolute right-0 mt-1 w-44 bg-white rounded-xl border shadow-lg z-50 overflow-hidden" style={{ borderColor: C.border }}>
                {[{ label: 'Expiry date', value: 'expiry' }, { label: 'Store name', value: 'store' }].map(s => (
                  <button
                    key={s.value}
                    onClick={() => { setSort(s.value as Sort); setSortOpen(false) }}
                    className="w-full text-left px-4 py-3 text-sm flex items-center justify-between"
                    style={{ color: sort === s.value ? C.active : '#374151', fontWeight: sort === s.value ? 600 : 400, background: C.white }}
                    onMouseEnter={e => (e.currentTarget.style.background = C.bgHover)}
                    onMouseLeave={e => (e.currentTarget.style.background = C.white)}
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

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: C.border, borderTopColor: C.active }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <p className="text-base font-medium" style={{ color: '#6b7280' }}>No deals here</p>
            <button
              onClick={() => setShowAddDeal(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors"
              style={{ background: C.active }}
              onMouseEnter={e => (e.currentTarget.style.background = C.activeHover)}
              onMouseLeave={e => (e.currentTarget.style.background = C.active)}
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
                userId={userId || ''}
                accessToken={accessToken || ''}
                onUpdate={handleUpdate}
                onRestore={handleRestore}
                isUsedView={filter === 'used'}
              />
            ))}
            {filter !== 'used' && (
              <button
                onClick={() => setShowAddDeal(true)}
                className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed min-h-48 transition-colors"
                style={{ borderColor: C.border, color: C.textLight, background: 'transparent' }}
                onMouseEnter={e => { e.currentTarget.style.background = C.bgHover; e.currentTarget.style.borderColor = C.active }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = C.border }}
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
