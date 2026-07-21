'use client'
import { useState, useRef } from 'react'
import type { Discount } from '@/lib/types'

interface Props {
  deal: Discount
  isDollar: boolean
  onClose: () => void
  onConfirm: (savedAmount: number | null) => void
}

type Tab = 'upload' | 'manual'
type Stage = 'input' | 'parsed'

export default function UseModal({ deal, isDollar, onClose, onConfirm }: Props) {
  const [tab, setTab] = useState<Tab>('upload')
  const [stage, setStage] = useState<Stage>('input')
  const [before, setBefore] = useState('')
  const [after, setAfter] = useState('')
  const [parsing, setParsing] = useState(false)
  const [parsedSaved, setParsedSaved] = useState<number | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const saved = before && after ? parseFloat(before) - parseFloat(after) : null
  const validManual = saved !== null && saved >= 0 && parseFloat(before) > 0

  async function handleFileUpload(file: File) {
    setParsing(true)
    const formData = new FormData()
    formData.append('receipt', file)
    formData.append('dealId', deal.id)
    formData.append('discountValue', deal.discount_value || '')
    try {
      const res = await fetch('/api/parse-receipt', { method: 'POST', body: formData })
      const data = await res.json()
      setParsedSaved(data.saved)
      setStage('parsed')
    } catch {
      setParsedSaved(null)
      setStage('parsed')
    }
    setParsing(false)
  }

  function handleConfirm() {
    if (stage === 'parsed') { onConfirm(parsedSaved); return }
    if (tab === 'manual' && validManual) { onConfirm(saved); return }
    onConfirm(null)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.4)' }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl p-6 w-full max-w-sm border"
        style={{ borderColor: 'var(--pink-100)' }}
        onClick={e => e.stopPropagation()}
      >
        <h2 className="font-semibold text-base mb-1">Using: {deal.store_name}</h2>
        <p className="text-sm mb-4" style={{ color: '#9ca3af' }}>
          {isDollar
            ? 'Upload your receipt or enter amounts to track remaining balance'
            : 'Upload your receipt or enter amounts to calculate your savings'}
        </p>

        {stage === 'input' && (
          <>
            <div className="flex gap-2 mb-4">
              {(['upload', 'manual'] as Tab[]).map(t => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className="flex-1 py-2 rounded-xl text-xs font-medium border"
                  style={tab === t
                    ? { background: 'var(--pink-600)', color: 'white', borderColor: 'var(--pink-600)' }
                    : { background: 'white', color: 'var(--pink-700)', borderColor: 'var(--pink-200)' }}
                >
                  {t === 'upload' ? 'Upload receipt' : 'Enter manually'}
                </button>
              ))}
            </div>

            {tab === 'upload' && (
              <>
                <input type="file" accept="image/*,application/pdf" ref={fileRef} className="hidden"
                  onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0])} />
                <div
                  onClick={() => fileRef.current?.click()}
                  className="rounded-xl p-6 text-center cursor-pointer mb-4 border-2 border-dashed"
                  style={{ borderColor: 'var(--pink-200)', background: 'var(--pink-50)' }}
                >
                  {parsing ? (
                    <p className="text-sm font-medium" style={{ color: 'var(--pink-500)' }}>Parsing receipt...</p>
                  ) : (
                    <>
                      <i className="ti ti-receipt" style={{ fontSize: 32, color: 'var(--pink-300)', display: 'block', marginBottom: 6 }} aria-hidden="true" />
                      <p className="text-sm font-medium" style={{ color: 'var(--pink-500)' }}>Tap to upload receipt</p>
                      <p className="text-xs mt-1" style={{ color: '#9ca3af' }}>JPG, PNG, or PDF</p>
                    </>
                  )}
                </div>
              </>
            )}

            {tab === 'manual' && (
              <div className="flex flex-col gap-3 mb-4">
                <div>
                  <label className="text-xs font-medium block mb-1" style={{ color: '#374151' }}>Total before discount</label>
                  <input type="number" value={before} onChange={e => setBefore(e.target.value)} placeholder="e.g. 45.00" className="w-full" />
                </div>
                <div>
                  <label className="text-xs font-medium block mb-1" style={{ color: '#374151' }}>Total after discount (what you paid)</label>
                  <input type="number" value={after} onChange={e => setAfter(e.target.value)} placeholder="e.g. 38.00" className="w-full" />
                </div>
                {validManual && (
                  <div className="rounded-xl p-3 text-center" style={{ background: 'var(--pink-50)', border: '1px solid var(--pink-200)' }}>
                    <p className="text-xs" style={{ color: '#9ca3af' }}>Discount used</p>
                    <p className="text-xl font-bold" style={{ color: 'var(--pink-700)' }}>${saved!.toFixed(2)}</p>
                    <p className="text-xs mt-1" style={{ color: 'var(--pink-500)' }}>
                      {isDollar && deal.discount_value
                        ? (() => {
                            const orig = parseFloat(deal.discount_value.replace(/[^0-9.]/g, ''))
                            const rem = Math.max(0, orig - saved!)
                            return rem > 0 ? `$${rem.toFixed(2)} remaining on this deal` : 'Full amount used — will move to archive'
                          })()
                        : 'Discount fully used — will move to archive'}
                    </p>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {stage === 'parsed' && (
          <div className="rounded-xl p-4 text-center mb-4" style={{ background: 'var(--pink-50)', border: '1px solid var(--pink-200)' }}>
            <p className="text-xs mb-1" style={{ color: '#9ca3af' }}>Parsed from receipt</p>
            <p className="text-xl font-bold" style={{ color: 'var(--pink-700)' }}>
              {parsedSaved !== null ? `$${parsedSaved.toFixed(2)} saved` : 'Could not parse'}
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--pink-500)' }}>
              {isDollar ? 'Full amount used — moving to archive' : 'Discount fully used — moving to archive'}
            </p>
          </div>
        )}

        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-medium border" style={{ borderColor: '#e5e7eb', color: '#6b7280' }}>
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={tab === 'manual' && stage === 'input' && !validManual}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white"
            style={{ background: (tab === 'manual' && stage === 'input' && !validManual) ? 'var(--pink-200)' : 'var(--pink-600)' }}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  )
}
