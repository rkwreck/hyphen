'use client'
import { useState, useRef, useCallback } from 'react'
import type { Discount } from '@/lib/types'

interface ParsedDeal {
  store_name: string | null
  discount_value: string | null
  expiry_date: string | null
  category: string | null
  discount_code: string | null
  image_url?: string | null
}

interface Props {
  userId: string
  onClose: () => void
  onAdded: (deal: Discount) => void
}

type Stage = 'upload' | 'confirm'

export default function AddDealModal({ userId, onClose, onAdded }: Props) {
  const [stage, setStage] = useState<Stage>('upload')
  const [dragging, setDragging] = useState(false)
  const [parsing, setParsing] = useState(false)
  const [parsed, setParsed] = useState<ParsedDeal | null>(null)
  const [errors, setErrors] = useState<Record<string, boolean>>({})
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    if (!file.type.startsWith('image/')) return
    setImagePreview(URL.createObjectURL(file))
    setParsing(true)

    const formData = new FormData()
    formData.append('image', file)
    formData.append('userId', userId)

    try {
      const res = await fetch('/api/upload-deal', { method: 'POST', body: formData })
      const data = await res.json()
      setParsed(data.parsed)
      setStage('confirm')
    } catch {
      setParsed({ store_name: null, discount_value: null, expiry_date: null, category: 'other', discount_code: null })
      setStage('confirm')
    }
    setParsing(false)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  function validate() {
    const errs: Record<string, boolean> = {}
    if (!parsed?.store_name?.trim()) errs.store_name = true
    if (!parsed?.discount_value?.trim()) errs.discount_value = true
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleConfirm() {
    if (!validate() || !parsed) return
    setSaving(true)

    const res = await fetch('/api/save-deal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, parsed, imageUrl: parsed.image_url }),
    })
    const data = await res.json()
    if (data.deal) onAdded(data.deal)
    setSaving(false)
  }

  function formatDateForInput(iso: string | null) {
    if (!iso) return ''
    return iso.split('T')[0]
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.4)' }} onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md border overflow-hidden" style={{ borderColor: 'var(--pink-100)' }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--pink-100)' }}>
          <h2 className="font-semibold text-base">
            {stage === 'upload' ? 'Add a new deal' : 'Confirm details'}
          </h2>
          <button onClick={onClose} style={{ color: '#9ca3af', fontSize: 22, lineHeight: 1, background: 'none', border: 'none', cursor: 'pointer' }}>×</button>
        </div>

        <div className="p-6">
          {stage === 'upload' && (
            <>
              <input type="file" accept="image/*" ref={fileRef} className="hidden" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
              <div
                onDragOver={e => { e.preventDefault(); setDragging(true) }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileRef.current?.click()}
                className="rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-3 cursor-pointer transition-colors p-10"
                style={{ borderColor: dragging ? 'var(--pink-500)' : 'var(--pink-200)', background: dragging ? 'var(--pink-50)' : 'white' }}
              >
                {parsing ? (
                  <>
                    <div className="w-8 h-8 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--pink-200)', borderTopColor: 'var(--pink-600)' }} />
                    <p className="text-sm font-medium" style={{ color: 'var(--pink-600)' }}>Parsing your deal...</p>
                  </>
                ) : (
                  <>
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: 'var(--pink-50)' }}>
                      <svg width="28" height="28" fill="none" stroke="var(--pink-400)" strokeWidth="1.8" viewBox="0 0 24 24">
                        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M17 8l-5-5-5 5" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M12 3v12" strokeLinecap="round"/>
                      </svg>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium" style={{ color: 'var(--pink-700)' }}>Drop your coupon or gift card here</p>
                      <p className="text-xs mt-1" style={{ color: '#9ca3af' }}>or click to browse files</p>
                    </div>
                  </>
                )}
              </div>
            </>
          )}

          {stage === 'confirm' && parsed && (
            <>
              {imagePreview && (
                <img src={imagePreview} alt="deal" className="w-full rounded-xl mb-4 object-cover" style={{ maxHeight: 140 }} />
              )}
              <p className="text-sm mb-4" style={{ color: '#6b7280' }}>
                Confirm the details below. Fields outlined in red need your input.
              </p>
              <div className="flex flex-col gap-3">
                <div>
                  <label className="text-xs font-medium block mb-1" style={{ color: '#374151' }}>Brand / Store name *</label>
                  <input
                    value={parsed.store_name || ''}
                    onChange={e => { setParsed(p => p ? { ...p, store_name: e.target.value } : p); setErrors(er => ({ ...er, store_name: false })) }}
                    placeholder="e.g. Target"
                    style={{ borderColor: errors.store_name ? '#ef4444' : undefined }}
                  />
                  {errors.store_name && <p className="text-xs mt-1" style={{ color: '#ef4444' }}>Please enter the store name</p>}
                </div>
                <div>
                  <label className="text-xs font-medium block mb-1" style={{ color: '#374151' }}>Discount / Amount *</label>
                  <input
                    value={parsed.discount_value || ''}
                    onChange={e => { setParsed(p => p ? { ...p, discount_value: e.target.value } : p); setErrors(er => ({ ...er, discount_value: false })) }}
                    placeholder="e.g. 20% off or $10"
                    style={{ borderColor: errors.discount_value ? '#ef4444' : undefined }}
                  />
                  {errors.discount_value && <p className="text-xs mt-1" style={{ color: '#ef4444' }}>Please enter the discount amount</p>}
                </div>
                <div>
                  <label className="text-xs font-medium block mb-1" style={{ color: '#374151' }}>Promo code (if any)</label>
                  <input
                    value={parsed.discount_code || ''}
                    onChange={e => setParsed(p => p ? { ...p, discount_code: e.target.value } : p)}
                    placeholder="e.g. SAVE20"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium block mb-1" style={{ color: '#374151' }}>Expiry date (if any)</label>
                  <input
                    type="date"
                    value={formatDateForInput(parsed.expiry_date)}
                    onChange={e => setParsed(p => p ? { ...p, expiry_date: e.target.value || null } : p)}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium block mb-1" style={{ color: '#374151' }}>Category</label>
                  <select
                    value={parsed.category || 'other'}
                    onChange={e => setParsed(p => p ? { ...p, category: e.target.value } : p)}
                    className="w-full"
                    style={{ padding: '9px 12px', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 14, background: 'white', color: '#1a1a1a', outline: 'none' }}
                  >
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
              </div>
              <div className="flex gap-2 mt-5">
                <button onClick={() => setStage('upload')} className="flex-1 py-2.5 rounded-xl text-sm font-medium border" style={{ borderColor: '#e5e7eb', color: '#6b7280' }}>
                  Re-upload
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={saving}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white"
                  style={{ background: 'var(--pink-600)' }}
                >
                  {saving ? 'Saving...' : 'Save deal'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
