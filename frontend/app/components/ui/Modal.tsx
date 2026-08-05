'use client'

import { useEffect } from 'react'

export default function Modal({
  open,
  onClose,
  children,
  className = 'max-w-4xl',
}: {
  open: boolean
  onClose: () => void
  children: React.ReactNode
  className?: string
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[80] overflow-y-auto">
      {/* backdrop */}
      <div className="fixed inset-0 bg-ink/60 backdrop-blur-sm animate-backdrop-in" onClick={onClose} aria-hidden />
      {/* centering wrapper — the panel caps itself to the viewport and scrolls internally */}
      <div className="relative flex min-h-full items-center justify-center p-4 sm:p-6">
        <div className={`relative w-full ${className} animate-modal-in`}>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/80 text-ink-soft shadow-lift ring-1 ring-slate-200/70 backdrop-blur transition hover:rotate-90 hover:text-ink"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-4 w-4">
              <path d="M6 6l12 12M18 6L6 18" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
          {children}
        </div>
      </div>
    </div>
  )
}
