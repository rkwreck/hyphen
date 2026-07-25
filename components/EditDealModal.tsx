'use client'
import { useState } from 'react'
import type { Discount } from '@/lib/types'
import Toast from '@/components/Toast'

interface Props {
  deal: Discount
  userId: string
  accessToken: string
  onClose: () => void
  onSaved: (updated: Discount) => void
}

export default function EditDealModal({ deal, userId, accessToken, onClose, onSaved }: Props) {
  const [storeName, setStoreName] = useState(deal.store_name || '')
  const [discountValue, setDiscountValue] = useState(deal.discount_value || '')
  const [discountCode, setDiscountCode] = useState(deal.discount_code || '')
  const [expiryDate, setExpiryDate] = useState(deal.expiry_date?.split('T')[0] || '')
  const [category, setCategory] = useState(deal.category || 'other')
  const [errors, setErrors] = useState<Record<string, boolean>>({})
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' | 'info' } | null>(null)

  function validate() {
    const errs: Record<string, boolean> = {}
    if (!storeName.trim()) errs.store_name = true
    if (!discountValue.trim()) errs.discount_value = true
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSave() {
    if (!validate()) return
    setSaving(true)
    try {
      const res = await fetch('/api/update-deal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId, accessToken, dealId: deal.id,
          updates: {
            store_name: storeName,
            discount_value: discountValue,
            discount_code: discountCode || null,
            expiry_date: expiryDate || null,
            category,
          },
        }),
      })
      const data = await res.json()
      if (data.deal) {
        onSaved(data.deal)
      } else {
        setToast({ message: `Couldn't save: ${data.error || 'unknown error'}`, type: 'error' })
        setSaving(false)
      }
    } catch {
      setToast({ message: 'Something went wrong. Please try again.', type: 'error' })
      setSaving(false)
    }
  }

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.4)' }} onClick={onClose}>
        <div className="bg-white rounded-2xl w-full max-w-md border overflow-hidden" style={{ borderColor: 'var(--p200)' }} onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--p100)' }}>
            <h2 className="font-semibold text-base">Edit deal</h2>
            <button onClick={onClose} style={{ color: '#9ca3af', fontSize: 22, lineHeight: 1, background: 'none', border: 'none', cursor: 'pointer' }}>×</button>
          </div>

          <div className="p-6 flex flex-col gap-3">
            <div>
              <label className="text-xs font-medium block mb-1" style={{ color: '#374151' }}>Brand / Store name *</label>
              <input value={storeName} onChange={e => { setStoreName(e.target.value); setErrors(er => ({ ...er, store_name: false })) }} placeholder="e.g. Target" style={{ borderColor: errors.store_name ? '#ef4444' : undefined }} />
              {errors.store_name && <p className="text-xs mt-1" style={{ color: '#ef4444' }}>Please enter the store name</p>}
            </div>
            <div>
              <label className="text-xs font-medium block mb-1" style={{ color: '#374151' }}>Discount / Amount *</label>
              <input value={discountValue} onChange={e => { setDiscountValue(e.target.value); setErrors(er => ({ ...er, discount_value: false })) }} placeholder="e.g. 20% off or $10" style={{ borderColor: errors.discount_value ? '#ef4444' : undefined }} />
              {errors.discount_value && <p className="text-xs mt-1" style={{ color: '#ef4444' }}>Please enter the discount amount</p>}
            </div>
            <div>
              <label className="text-xs font-medium block mb-1" style={{ color: '#374151' }}>Promo code (if any)</label>
              <input value={discountCode} onChange={e => setDiscountCode(e.target.value)} placeholder="e.g. SAVE20" />
            </div>
            <div>
              <label className="text-xs font-medium block mb-1" style={{ color: '#374151' }}>Expiry date (if any)</label>
              <input type="date" value={expiryDate} onChange={e => setExpiryDate(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium block mb-1" style={{ color: '#374151' }}>Category</label>
              <select value={category} onChange={e => setCategory(e.target.value)} className="w-full" style={{ padding: '9px 12px', border: '1px solid var(--p200)', borderRadius: 8, fontSize: 14, background: 'white', color: '#1a1a1a', outline: 'none' }}>
                <option value="gift_card">Gift card</option>
                <option value="coupon">Coupon</option>
                <option value="promo_code">Promo code</option>
                <option value="groceries">Groceries</option>
                <option value="dining">Dining</option>
                <option value="retail">Retail</option>
                <option value="travel">Travel</option>
                <option value="entertainment">Entertainment</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="flex gap-2 mt-3">
              <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-medium border" style={{ borderColor: '#e5e7eb', color: '#6b7280' }}>Cancel</button>
              <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors" style={{ background: 'var(--p600)' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--p700)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'var(--p600)')}
              >
                {saving ? 'Saving...' : 'Save changes'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
