'use client'
import { useState } from 'react'
import type { Discount } from '@/lib/types'
import { formatDate, daysUntil } from '@/lib/utils'
import UseModal from './UseModal'
import EditDealModal from './EditDealModal'

interface Props {
  deal: Discount
  userId: string
  accessToken: string
  onUpdate: (id: string, remaining: number | null, used: boolean) => void
  onRestore: (id: string) => void
  onEdit: (updated: Discount) => void
  isUsedView: boolean
}

export default function DealCard({ deal, userId, accessToken, onUpdate, onRestore, onEdit, isUsedView }: Props) {
  const [showModal, setShowModal] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const du = daysUntil(deal.expiry_date)
  const expiring = du !== null && du <= 7 && !deal.is_used && du > 0

  const typeLabel: Record<string, string> = {
    gift_card: 'Gift card', coupon: 'Coupon', promo_code: 'Promo code'
  }

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
        className="bg-white rounded-2xl flex flex-col overflow-hidden border transition-all relative"
        style={{
          borderColor: expiring ? 'var(--p400)' : 'var(--p200)',
          borderWidth: expiring ? '2px' : '1px',
          opacity: deal.is_used ? 0.5 : 1,
          boxShadow: expiring ? '0 0 0 1px var(--p300)' : 'none',
        }}
      >
        {/* Edit button */}
        {!deal.is_used && (
          <button
            onClick={() => setShowEdit(true)}
            className="absolute top-2 right-2 z-10 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
            style={{ background: 'rgba(255,255,255,0.9)', color: 'var(--p600)' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'white')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.9)')}
            aria-label="Edit deal"
          >
            <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        )}

        <div className="h-24 flex items-center justify-center overflow-hidden" style={{ background: 'var(--p50)' }}>
          {deal.image_url ? (
            <img src={deal.image_url} alt={deal.store_name} className="w-full h-full object-cover" />
          ) : (
            <svg width="28" height="28" fill="none" stroke="var(--p300)" strokeWidth="1.5" viewBox="0 0 24 24">
              <path d="M20 12V22H4V12M22 7H2v5h20V7zM12 22V7M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z" strokeLinecap="round" strokeLinejoin="round"/>
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
            {expiring && <span aria-hidden="true">⚠ </span>}{expiryText}
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
          onConfirm={(saved) => { setShowModal(false); onUpdate(deal.id, saved, true) }}
        />
      )}

      {showEdit && (
        <EditDealModal
          deal={deal}
          userId={userId}
          accessToken={accessToken}
          onClose={() => setShowEdit(false)}
          onSaved={(updated) => { setShowEdit(false); onEdit(updated) }}
        />
      )}
    </>
  )
}
