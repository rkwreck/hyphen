'use client'

interface Props {
  onClose: () => void
  onSort: (sort: 'expiry' | 'store') => void
  currentSort: 'expiry' | 'store'
}

export default function Sidebar({ onClose, onSort, currentSort }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex" onClick={onClose}>
      <div
        className="w-56 h-full flex flex-col py-5 px-4 bg-white"
        style={{ borderRight: '1px solid var(--p100)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold" style={{ color: 'var(--p700)' }}>Menu</h2>
          <button onClick={onClose} className="p-1 rounded-lg" style={{ color: '#9ca3af' }} aria-label="Close">
            <i className="ti ti-x" style={{ fontSize: 18 }} />
          </button>
        </div>

        <p className="text-xs uppercase tracking-wider font-medium mb-2" style={{ color: '#9ca3af' }}>Sort by</p>
        {(['expiry', 'store'] as const).map(s => (
          <button
            key={s}
            onClick={() => { onSort(s); onClose() }}
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm mb-1 w-full text-left"
            style={{
              background: currentSort === s ? 'var(--p100)' : 'transparent',
              color: currentSort === s ? 'var(--p700)' : '#374151',
              fontWeight: currentSort === s ? 500 : 400,
            }}
          >
            <i className={`ti ti-${s === 'expiry' ? 'calendar' : 'building-store'}`} style={{ fontSize: 16 }} aria-hidden="true" />
            {s === 'expiry' ? 'Expiry date' : 'Store name'}
          </button>
        ))}
      </div>
      <div className="flex-1" style={{ background: 'rgba(0,0,0,0.2)' }} />
    </div>
  )
}
