'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import type { Discount } from '@/lib/types'
import DealCard from '@/components/DealCard'
import Sidebar from '@/components/Sidebar'

type Filter = 'all' | 'gift_card' | 'coupon' | 'promo_code' | 'used'
type Sort = 'expiry' | 'store'

export default function DashboardPage() {
  const router = useRouter()
  const [deals, setDeals] = useState<Discount[]>([])
  const [filter, setFilter] = useState<Filter>('all')
  const [sort, setSort] = useState<Sort>('expiry')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.push('/login'); return }
      setUserId(session.user.id)
      fetchDeals(supabase, session.user.id)
    })
  }, [router])

  async function fetchDeals(supabase: any, uid: string) {
    const { data } = await supabase
      .from('discounts')
      .select('*')
      .eq('user_id', uid)
    setDeals(data || [])
    setLoading(false)
  }

  async function handleUpdate(id: string, savedAmount: number | null, _used: boolean) {
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
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
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
      {sidebarOpen && (
        <Sidebar
          onClose={() => setSidebarOpen(false)}
          onSort={setSort}
          currentSort={sort}
        />
      )}

      <div className="max-w-5xl mx-auto px-4 py-5">
        <div className="flex items-center justify-between mb-5">
          <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-xl hover:bg-pink-100 transition-colors" aria-label="Open menu">
            <i className="ti ti-menu-2" style={{ fontSize: 20, color: '#6b7280' }} />
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push('/dashboard/chat')}
              className="text-sm px-4 py-2 rounded-xl border font-medium"
              style={{ borderColor: 'var(--pink-300)', background: 'var(--pink-50)', color: 'var(--pink-700)' }}
            >
              Talk to Penni
            </button>
            <button onClick={handleLogout} className="text-sm px-4 py-2 rounded-xl border" style={{ borderColor: '#e5e7eb', color: '#6b7280' }}>
              Log out
            </button>
          </div>
        </div>

        <div className="flex gap-2 mb-5 flex-wrap">
          {tabs.map(tab => (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value)}
              className="px-4 py-1.5 rounded-full text-sm font-medium border transition-colors"
              style={filter === tab.value
                ? tab.value === 'used'
                  ? { background: '#6b7280', color: 'white', borderColor: '#6b7280' }
                  : { background: 'var(--pink-600)', color: 'white', borderColor: 'var(--pink-600)' }
                : tab.value === 'used'
                  ? { background: '#f3f4f6', color: '#9ca3af', borderColor: '#e5e7eb' }
                  : { background: 'white', color: 'var(--pink-700)', borderColor: 'var(--pink-200)' }
              }
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--pink-200)', borderTopColor: 'var(--pink-600)' }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-base font-medium" style={{ color: '#6b7280' }}>No deals here</p>
            <p className="text-sm mt-1" style={{ color: '#9ca3af' }}>Talk to Penni to add your first deal</p>
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
          </div>
        )}
      </div>
    </div>
  )
}
