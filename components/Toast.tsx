'use client'
import { useEffect, useState } from 'react'

interface Props {
  message: string
  type?: 'error' | 'success' | 'info'
  onDismiss: () => void
  duration?: number
}

export default function Toast({ message, type = 'error', onDismiss, duration = 5000 }: Props) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => { setVisible(false); setTimeout(onDismiss, 300) }, duration)
    return () => clearTimeout(t)
  }, [duration, onDismiss])

  const colors = {
    error: { bg: '#FEF2F2', border: '#FECACA', text: '#991B1B', icon: '#EF4444' },
    success: { bg: '#F0FDF4', border: '#BBF7D0', text: '#166534', icon: '#22C55E' },
    info: { bg: 'var(--p50)', border: 'var(--p200)', text: 'var(--p800)', icon: 'var(--p500)' },
  }[type]

  return (
    <div
      className="fixed top-4 right-4 z-[100] max-w-sm w-full transition-all duration-300"
      style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(-8px)' }}
    >
      <div className="rounded-2xl border p-4 shadow-lg flex items-start gap-3" style={{ background: colors.bg, borderColor: colors.border }}>
        <div className="flex-shrink-0 mt-0.5">
          {type === 'error' && (
            <svg width="18" height="18" fill="none" stroke={colors.icon} strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 8v4M12 16h.01" strokeLinecap="round"/>
            </svg>
          )}
          {type === 'success' && (
            <svg width="18" height="18" fill="none" stroke={colors.icon} strokeWidth="2" viewBox="0 0 24 24">
              <path d="M22 11.08V12a10 10 0 11-5.93-9.14" strokeLinecap="round"/>
              <path d="M22 4L12 14.01l-3-3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
          {type === 'info' && (
            <svg width="18" height="18" fill="none" stroke={colors.icon} strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 16v-4M12 8h.01" strokeLinecap="round"/>
            </svg>
          )}
        </div>
        <p className="text-sm flex-1 leading-snug" style={{ color: colors.text }}>{message}</p>
        <button onClick={() => { setVisible(false); setTimeout(onDismiss, 300) }} style={{ color: colors.text, opacity: 0.5, background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, lineHeight: 1, flexShrink: 0 }}>×</button>
      </div>
    </div>
  )
}
