'use client'
import { useState, useRef } from 'react'
import type { Discount } from '@/lib/types'
import Toast from '@/components/Toast'

interface ParsedDeal {
  store_name: string | null
  discount_value: string | null
  expiry_date: string | null
  category: string | null
  discount_code: string | null
  image_url?: string | null
  all_image_urls?: string[]
}

interface Props {
  userId: string
  accessToken: string
  onClose: () => void
  onAdded: (deal: Discount) => void
}

type Stage = 'upload' | 'parsing' | 'confirm'

export default function AddDealModal({ userId, accessToken, onClose, onAdded }: Props) {
  const [stage, setStage] = useState<Stage>('upload')
  const [dragging, setDragging] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [parsed, setParsed] = useState<ParsedDeal | null>(null)
  const [errors, setErrors] = useState<Record<string, boolean>>({})
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' | 'info' } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  function addFiles(newFiles: File[]) {
    const imageFiles = newFiles.filter(f => f.type.startsWith('image/'))
    setSelectedFiles(prev => {
      const combined = [...prev, ...imageFiles].slice(0, 2)
      setImagePreviews(combined.map(f => URL.createObjectURL(f)))
      return combined
    })
  }

  function removeFile(index: number) {
    setSelectedFiles(prev => {
      const updated = prev.filter((_, i) => i !== index)
      setImagePreviews(updated.map(f => URL.createObjectURL(f)))
      return updated
    })
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    addFiles(Array.from(e.dataTransfer.files))
  }

  async function handleContinue() {
    if (!selectedFiles.length) return
    setStage('parsing')
    setToast(null)

    const formData = new FormData()
    selectedFiles.forEach(f => formData.append('images', f))
    formData.append('userId', userId)
    formData.append('accessToken', accessToken)

    try {
      const res = await fetch('/api/upload-deal', { method: 'POST', body: formData })
      const data = await res.json()
      if (res.status === 429 || res.status === 401) {
        setToast({ message: `Oops! ${data.error}`, type: 'error' })
        setStage('upload')
        return
      }
      setParsed(data.parsed)
      // Immediately flag missing required fields so user sees red outlines
      const initialErrors: Record<string, boolean> = {}
      if (!data.parsed?.store_name?.trim()) initialErrors.store_name = true
      if (!data.parsed?.discount_value?.trim()) initialErrors.discount_value = true
      setErrors(initialErrors)
      setStage('confirm')
    } catch {
      setParsed({ store_name: null, discount_value: null, expiry_date: null, category: 'other', discount_code: null })
      setErrors({ store_name: true, discount_value: true })
      setStage('confirm')
    }
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
    try {
      const res = await fetch('/api/save-deal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, accessToken, parsed, imageUrl: parsed.image_url }),
      })
      const data = await res.json()
      if (data.deal) {
        onAdded(data.deal)
      } else {
        setToast({ message: `Couldn't save: ${data.error || 'unknown error'}`, type: 'error' })
        setSaving(false)
      }
    } catch (e) {
      setToast({ message: 'Something went wrong saving your deal. Please try again.', type: 'error' })
      setSaving(false)
    }
  }

  const canContinue = selectedFiles.length > 0

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.4)' }} onClick={onClose}>
        <div className="bg-white rounded-2xl w-full max-w-md border overflow-hidden" style={{ borderColor: 'var(--p200)' }} onClick={e => e.stopPropagation()}>

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--p100)' }}>
            <h2 className="font-semibold text-base">
              {stage === 'upload' || stage === 'parsing' ? 'Add a new deal' : 'Confirm details'}
            </h2>
            <button onClick={onClose} style={{ color: '#9ca3af', fontSize: 22, lineHeight: 1, background: 'none', border: 'none', cursor: 'pointer' }}>×</button>
          </div>

          <div className="p-6">

            {/* Upload stage */}
            {(stage === 'upload' || stage === 'parsing') && (
              <>
                <p className="text-xs mb-3" style={{ color: '#9ca3af' }}>Upload 1–2 photos (front and back)</p>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  ref={fileRef}
                  className="hidden"
                  onChange={e => e.target.files && addFiles(Array.from(e.target.files))}
                />

                {/* Drop zone — only show if fewer than 2 images selected */}
                {selectedFiles.length < 2 && (
                  <div
                    onDragOver={e => { e.preventDefault(); setDragging(true) }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={handleDrop}
                    onClick={() => fileRef.current?.click()}
                    className="rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-3 cursor-pointer transition-colors p-8 mb-3"
                    style={{ borderColor: dragging ? 'var(--p500)' : 'var(--p300)', background: dragging ? 'var(--p50)' : 'white' }}
                  >
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'var(--p50)' }}>
                      <svg width="24" height="24" fill="none" stroke="var(--p400)" strokeWidth="1.8" viewBox="0 0 24 24">
                        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M17 8l-5-5-5 5" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M12 3v12" strokeLinecap="round"/>
                      </svg>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium" style={{ color: 'var(--p700)' }}>
                        {selectedFiles.length === 0 ? 'Drop your coupon or gift card here' : 'Add a second photo (optional)'}
                      </p>
                      <p className="text-xs mt-1" style={{ color: '#9ca3af' }}>
                        {selectedFiles.length === 0 ? 'or click to browse — front & back accepted' : 'or click to browse'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Image previews with remove buttons */}
                {imagePreviews.length > 0 && (
                  <div className="flex gap-2 mb-4">
                    {imagePreviews.map((src, i) => (
                      <div key={i} className="relative flex-1">
                        <img src={src} alt={`preview ${i + 1}`} className="rounded-xl object-cover w-full" style={{ height: 90, border: '1px solid var(--p200)' }} />
                        <button
                          onClick={() => removeFile(i)}
                          className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center text-white text-xs"
                          style={{ background: 'rgba(0,0,0,0.5)', lineHeight: 1 }}
                        >
                          ×
                        </button>
                        <p className="text-xs text-center mt-1" style={{ color: '#9ca3af' }}>{i === 0 ? 'Front' : 'Back'}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Continue button */}
                <div className="flex justify-end mt-2">
                  <button
                    onClick={handleContinue}
                    disabled={!canContinue || stage === 'parsing'}
                    className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors flex items-center gap-2"
                    style={{
                      background: canContinue && stage !== 'parsing' ? 'var(--p600)' : 'var(--p200)',
                      cursor: canContinue && stage !== 'parsing' ? 'pointer' : 'not-allowed',
                    }}
                    onMouseEnter={e => { if (canContinue && stage !== 'parsing') e.currentTarget.style.background = 'var(--p700)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = canContinue && stage !== 'parsing' ? 'var(--p600)' : 'var(--p200)' }}
                  >
                    {stage === 'parsing' ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: 'white' }} />
                        Parsing...
                      </>
                    ) : 'Continue'}
                  </button>
                </div>
              </>
            )}

            {/* Confirm stage */}
            {stage === 'confirm' && parsed && (
              <>
                {imagePreviews.length > 0 && (
                  <div className="flex gap-2 mb-4">
                    {imagePreviews.map((src, i) => (
                      <img key={i} src={src} alt={`preview ${i + 1}`} className="rounded-xl object-cover flex-1" style={{ maxHeight: 110, border: '1px solid var(--p200)' }} />
                    ))}
                  </div>
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
                    <input value={parsed.discount_code || ''} onChange={e => setParsed(p => p ? { ...p, discount_code: e.target.value } : p)} placeholder="e.g. SAVE20" />
                  </div>
                  <div>
                    <label className="text-xs font-medium block mb-1" style={{ color: '#374151' }}>Expiry date (if any)</label>
                    <input type="date" value={parsed.expiry_date?.split('T')[0] || ''} onChange={e => setParsed(p => p ? { ...p, expiry_date: e.target.value || null } : p)} />
                  </div>
                  <div>
                    <label className="text-xs font-medium block mb-1" style={{ color: '#374151' }}>Category</label>
                    <select
                      value={parsed.category || 'other'}
                      onChange={e => setParsed(p => p ? { ...p, category: e.target.value } : p)}
                      className="w-full"
                      style={{ padding: '9px 12px', border: '1px solid var(--p200)', borderRadius: 8, fontSize: 14, background: 'white', color: '#1a1a1a', outline: 'none' }}
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
                  <button
                    onClick={() => { setStage('upload'); setParsed(null) }}
                    className="flex-1 py-2.5 rounded-xl text-sm font-medium border"
                    style={{ borderColor: '#e5e7eb', color: '#6b7280' }}
                  >
                    Re-upload
                  </button>
                  <button
                    onClick={handleConfirm}
                    disabled={saving}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors"
                    style={{ background: 'var(--p600)' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--p700)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'var(--p600)')}
                  >
                    {saving ? 'Saving...' : 'Save deal'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
