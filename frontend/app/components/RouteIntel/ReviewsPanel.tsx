'use client'

import { useEffect, useState } from 'react'
import { apiFetch } from '@/api-client'
import { useAuth } from '@/providers/AuthProvider'

type Review = {
  review_id: number
  route_slug: string
  author: string
  rating: number
  comment: string
  created_at: string
}
type Aggregate = { average: number; count: number }

function Stars({ value, size = 'sm' }: { value: number; size?: 'sm' | 'lg' }) {
  const cls = size === 'lg' ? 'h-6 w-6' : 'h-4 w-4'
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} viewBox="0 0 20 20" className={cls}>
          <path
            d="M10 1.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L10 15.9 4.8 17.6l1-5.8L1.5 7.7l5.9-.9L10 1.5z"
            fill={i <= Math.round(value) ? '#f59e0b' : '#e2e8f0'}
          />
        </svg>
      ))}
    </span>
  )
}

export default function ReviewsPanel({ slug }: { slug: string }) {
  const { user } = useAuth()
  const [reviews, setReviews] = useState<Review[]>([])
  const [agg, setAgg] = useState<Aggregate>({ average: 0, count: 0 })
  const [servedBy, setServedBy] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [rating, setRating] = useState(5)
  const [hover, setHover] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    try {
      const res = await apiFetch<{ items: Review[]; aggregate: Aggregate; served_by: string }>(
        `/route-intel/reviews?route_slug=${encodeURIComponent(slug)}`,
      )
      setReviews(res.items)
      setAgg(res.aggregate)
      setServedBy(res.served_by)
    } catch {
      setError('Could not load reviews — is the API running?')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      await apiFetch('/route-intel/reviews', {
        method: 'POST',
        body: JSON.stringify({
          route_slug: slug,
          rating,
          comment: comment.trim(),
          author: user?.displayName ?? user?.email?.split('@')[0] ?? 'Anonymous',
          idempotency_key: `${slug}:${user?.uid ?? 'anon'}:${Date.now()}`,
        }),
      })
      setComment('')
      setRating(5)
      await load()
    } catch {
      setError('Failed to submit review.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="card p-6">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-ink">Runner reviews</h3>
          <p className="text-xs text-ink-muted">What locals think of this route</p>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-black text-ink">{agg.average.toFixed(1)}</span>
            <Stars value={agg.average} />
          </div>
          <p className="text-[11px] text-ink-muted">{agg.count} review{agg.count === 1 ? '' : 's'}</p>
        </div>
      </div>

      {/* Add review */}
      <form onSubmit={submit} className="mb-5 rounded-2xl border border-slate-200/70 bg-slate-50/60 p-4">
        <div className="mb-2 flex items-center gap-3">
          <span className="text-sm font-semibold text-ink-soft">Your rating</span>
          <span className="flex items-center gap-0.5" onMouseLeave={() => setHover(0)}>
            {[1, 2, 3, 4, 5].map((i) => (
              <button
                key={i}
                type="button"
                onMouseEnter={() => setHover(i)}
                onClick={() => setRating(i)}
                className="transition-transform hover:scale-110"
                aria-label={`${i} star`}
              >
                <svg viewBox="0 0 20 20" className="h-6 w-6">
                  <path
                    d="M10 1.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L10 15.9 4.8 17.6l1-5.8L1.5 7.7l5.9-.9L10 1.5z"
                    fill={i <= (hover || rating) ? '#f59e0b' : '#e2e8f0'}
                  />
                </svg>
              </button>
            ))}
          </span>
        </div>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Share how the run felt — footing, climbs, scenery…"
          rows={2}
          className="field-control resize-none"
        />
        <div className="mt-3 flex items-center justify-between">
          <span className="text-[11px] text-ink-muted">
            Posting as <b>{user?.displayName ?? user?.email?.split('@')[0] ?? 'Anonymous'}</b>
          </span>
          <button type="submit" disabled={submitting} className="btn-primary px-4 py-2 text-sm">
            {submitting ? 'Posting…' : 'Post review'}
          </button>
        </div>
        {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
      </form>

      {/* List */}
      {loading ? (
        <div className="space-y-2">
          {[0, 1].map((i) => (
            <div key={i} className="skeleton h-16 w-full" />
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <p className="rounded-xl bg-slate-50 px-3 py-6 text-center text-sm text-ink-muted">
          No reviews yet — be the first to run it and report back.
        </p>
      ) : (
        <ul className="space-y-3">
          {reviews.map((r) => (
            <li key={r.review_id} className="animate-fade-up rounded-2xl border border-slate-100 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-gradient text-xs font-bold text-white">
                    {r.author.charAt(0).toUpperCase()}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-ink">{r.author}</p>
                    <p className="text-[11px] text-ink-muted">
                      {new Date(r.created_at).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
                <Stars value={r.rating} />
              </div>
              {r.comment && <p className="mt-2 text-sm text-ink-soft">{r.comment}</p>}
            </li>
          ))}
        </ul>
      )}

      {servedBy && (
        <p className="mt-4 text-center text-[10px] text-slate-400">
          served by node {servedBy} · distributed review service
        </p>
      )}
    </div>
  )
}
