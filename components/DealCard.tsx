'use client'
import { useState } from 'react'
import type { Discount } from '@/lib/types'
import { formatDate, daysUntil } from '@/lib/utils'
import UseModal from './UseModal'

interface Props {
  deal: Discount
  userId: string
  accessToken: string
  onUpdate: (id: string, remaining: number | null, used: boolean) => void
  onRestore: (id: string) => void
  isUsedView: boolean
}

export default function DealCard({ deal, userId, accessToken, onUpdate, onRestore, isUsedView }: Props) {
  const [showModal, setShowModal] = useState(false)
  const du = daysUntil(deal.expiry_date)
  const expiring = du !== null && du <= 7 && !deal.is_used && du > 0

  const typeLabel: Record<string, string> = {
    gift_card: 'Gift card', coupon: 'Coupon', promo_code: 'Promo code'
  }

  const icon = deal.category === 'gift_card' ? 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z'
    : deal.category === 'coupon' ? 'M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z'
    : 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z'

  const isDollar = deal.discount_value?.startsWith('$') || deal.category === 'gift_card'

  let expiryText = 'No expiry'
  if (deal.expiry_date) {
    if (du !== null && du <= 0) expiryText = 'Expired'
    else if (expiring) expiryText = `Expires in ${du} day${du === 1 ? '' : 's'}`
    else expiryText = `Expires ${formatDate(deal.expiry_date)}`
  }

  return (
    <>
      <div
        className="bg-white rounded-2xl flex flex-col overflow-hidden border transition-all"
        style={{
          borderColor: expiring ? 'var(--p400)' : 'var(--p200)',
          borderWidth: expiring ? '2px' : '1px',
          opacity: deal.is_used ? 0.5 : 1,
          boxShadow: expiring ? '0 0 0 1px var(--p300)' : 'none',
        }}
      >
        <div className="h-24 flex items-center justify-center overflow-hidden" style={{ background: 'var(--p50)' }}>
          {deal.image_url ? (
            <img src={deal.image_url} alt={deal.store_name} className="w-full h-full object-cover" />
          ) : (
            <svg width="28" height="28" fill="none" stroke="var(--p300)" strokeWidth="1.5" viewBox="0 0 24 24">
              <path d={icon} strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </div>

        <div className="p-3 flex flex-col gap-1 flex-1">
          <p className="text-xs uppercase tracking-wider font-semibold" style={{ color: 'var(--p400)' }}>
            {typeLabel[deal.category || ''] || deal.category || 'deal'}
          </p>
          <p className="font-bold text-sm leading-tight">{deal.store_name}</p>
          <p className="text-sm font-semibold" style={{ color: 'var(--p600)' }}>{deal.discount_value}</p>
          {deal.discount_code && (
            <span className="text-xs px-2 py-0.5 rounded-full self-start font-medium" style={{ background: 'var(--p100)', color: 'var(--p700)', border: '1px solid var(--p200)' }}>
              {deal.discount_code}
            </span>
          )}
          <p className="text-xs mt-1 font-medium" style={{ color: expiring ? 'var(--p600)' : '#9ca3af' }}>
            {expiryText}
          </p>
        </div>

        <div className="px-3 pb-3">
          {deal.is_used ? (
            <button
              onClick={() => onRestore(deal.id)}
              className="w-full text-sm py-2 rounded-xl border font-semibold transition-colors"
              style={{ borderColor: 'var(--p300)', color: 'var(--p600)', background: 'white' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--p50)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'white')}
            >
              Restore
            </button>
          ) : (
            <button
              onClick={() => setShowModal(true)}
              className="w-full text-sm py-2 rounded-xl font-semibold text-white transition-colors"
              style={{ background: 'var(--p600)' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--p700)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'var(--p600)')}
            >
              Use
            </button>
          )}
        </div>
      </div>

      {showModal && (
        <UseModal
          deal={deal}
          isDollar={isDollar}
          userId={userId}
          accessToken={accessToken}
          onClose={() => setShowModal(false)}
          onConfirm={(saved) => {
            setShowModal(false)
            onUpdate(deal.id, saved, true)
          }}
        />
      )}
    </>
  )
}
