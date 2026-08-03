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
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-3 sm:p-6">
      <div
        className="fixed inset-0 bg-ink/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div className={`relative my-2 w-full animate-pop-in ${className}`}>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute -right-2 -top-2 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-ink-soft shadow-lift transition hover:rotate-90 hover:text-ink"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-4 w-4">
            <path d="M6 6l12 12M18 6L6 18" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
        {children}
      </div>
    </div>
  )
}
