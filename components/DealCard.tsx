'use client'
import { useState } from 'react'
import type { Discount } from '@/lib/types'
import { formatDate, daysUntil } from '@/lib/utils'
import UseModal from './UseModal'

interface Props {
  deal: Discount
  onUpdate: (id: string, remaining: number | null, used: boolean) => void
  onRestore: (id: string) => void
  isUsedView: boolean
}

export default function DealCard({ deal, onUpdate, onRestore, isUsedView }: Props) {
  const [showModal, setShowModal] = useState(false)
  const du = daysUntil(deal.expiry_date)
  const expiring = du !== null && du <= 7 && !deal.is_used && du > 0

  const typeLabel: Record<string, string> = {
    gift_card: 'Gift card', coupon: 'Coupon', promo_code: 'Promo code'
  }

  const icon = deal.category === 'gift_card' ? 'credit-card'
    : deal.category === 'coupon' ? 'scissors' : 'tag'

  const isDollar = deal.discount_value?.startsWith('$') ||
    deal.category === 'gift_card'

  const displayValue = isDollar && deal.discount_value !== null
    ? deal.discount_value
    : deal.discount_value || '—'

  let expiryText = 'No expiry'
  if (deal.expiry_date) {
    if (du !== null && du <= 0) expiryText = 'Expired'
    else if (expiring) expiryText = `Expires in ${du} day${du === 1 ? '' : 's'}`
    else expiryText = `Expires ${formatDate(deal.expiry_date)}`
  }

  return (
    <>
      <div
        className="bg-white rounded-2xl flex flex-col overflow-hidden border transition-opacity"
        style={{
          borderColor: expiring ? 'var(--pink-300)' : 'var(--pink-100)',
          borderWidth: expiring ? '1.5px' : '1px',
          opacity: deal.is_used ? 0.45 : 1,
        }}
      >
        <div className="h-24 flex items-center justify-center overflow-hidden" style={{ background: 'var(--pink-50)' }}>
          {deal.image_url ? (
            <img src={deal.image_url} alt={deal.store_name} className="w-full h-full object-cover" />
          ) : (
            <i className={`ti ti-${icon}`} style={{ fontSize: 28, color: expiring ? 'var(--pink-400)' : 'var(--pink-200)' }} aria-hidden="true" />
          )}
        </div>

        <div className="p-3 flex flex-col gap-1 flex-1">
          <p className="text-xs uppercase tracking-wider font-medium" style={{ color: 'var(--pink-400)' }}>
            {typeLabel[deal.category || ''] || deal.category || 'deal'}
          </p>
          <p className="font-semibold text-sm leading-tight">{deal.store_name}</p>
          <p className="text-sm font-medium" style={{ color: 'var(--pink-700)' }}>{displayValue}</p>
          {deal.discount_code && (
            <span className="text-xs px-2 py-0.5 rounded-full self-start" style={{ background: 'var(--pink-100)', color: 'var(--pink-700)' }}>
              {deal.discount_code}
            </span>
          )}
          <p className="text-xs mt-1" style={{ color: expiring ? 'var(--pink-700)' : '#9ca3af', fontWeight: expiring ? 500 : 400 }}>
            {expiryText}
          </p>
        </div>

        <div className="px-3 pb-3">
          {deal.is_used ? (
            <button
              onClick={() => onRestore(deal.id)}
              className="w-full text-sm py-2 rounded-xl border font-medium"
              style={{ borderColor: 'var(--pink-200)', color: 'var(--pink-600)', background: 'white' }}
            >
              Restore
            </button>
          ) : (
            <button
              onClick={() => setShowModal(true)}
              className="w-full text-sm py-2 rounded-xl font-medium text-white"
              style={{ background: 'var(--pink-600)' }}
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
