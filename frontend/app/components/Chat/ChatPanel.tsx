'use client'

import { useRef, useState } from 'react'
import { apiFetch } from '@/api-client'
import type { ChatReply } from '@/types'

type Message = { role: 'user' | 'coach'; text: string }

const SUGGESTIONS = [
  'Am I ready for a long run?',
  'How’s my recent pace?',
  'Should I take a rest day?',
]

export default function ChatPanel() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'coach', text: 'Hey! I’m your StrideSense coach. Ask me about your training.' },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)

  async function send(text: string) {
    const message = text.trim()
    if (!message || loading) return
    setInput('')
    setMessages((m) => [...m, { role: 'user', text: message }])
    setLoading(true)
    try {
      const res = await apiFetch<ChatReply>('/chat', {
        method: 'POST',
        body: JSON.stringify({ message }),
      })
      setMessages((m) => [...m, { role: 'coach', text: res.reply }])
    } catch {
      setMessages((m) => [
        ...m,
        { role: 'coach', text: 'Sorry, I couldn’t reach the coach service right now.' },
      ])
    } finally {
      setLoading(false)
      requestAnimationFrame(() => {
        listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })
      })
    }
  }

  return (
    <section className="card flex flex-col p-6">
      <div className="mb-4 flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-gradient text-white shadow-glow">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-5 w-5">
            <path
              d="M21 15a2 2 0 01-2 2H8l-4 4V5a2 2 0 012-2h13a2 2 0 012 2z"
              strokeWidth="1.7"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <div>
          <h2 className="flex items-center gap-2 text-lg font-bold text-ink">
            Coach chat
            <span className="chip bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> online
            </span>
          </h2>
          <p className="text-xs text-ink-muted">Grounded in your run history</p>
        </div>
      </div>

      <div ref={listRef} className="mb-4 max-h-64 space-y-3 overflow-y-auto pr-1">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
                m.role === 'user'
                  ? 'rounded-br-sm bg-brand-gradient text-white'
                  : 'rounded-bl-sm bg-slate-100 text-ink-soft'
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="rounded-2xl rounded-bl-sm bg-slate-100 px-3.5 py-2.5">
              <span className="flex gap-1">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink-muted [animation-delay:-0.2s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink-muted [animation-delay:-0.1s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink-muted" />
              </span>
            </div>
          </div>
        )}
      </div>

      {messages.length <= 1 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => send(s)}
              className="chip border border-slate-200 bg-white text-ink-soft transition hover:border-brand-300 hover:text-brand-700"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <form
        className="flex items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          send(input)
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask your coach…"
          className="field-control flex-1"
        />
        <button type="submit" disabled={loading || !input.trim()} className="btn-primary px-4 py-2.5">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-4 w-4">
            <path d="M4 12l16-8-6 16-2-6-8-2z" strokeWidth="1.8" strokeLinejoin="round" />
          </svg>
        </button>
      </form>
    </section>
  )
}
