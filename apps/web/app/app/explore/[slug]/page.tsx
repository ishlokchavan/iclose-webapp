import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { EnquireForm } from './enquire-form'
import { submitEnquiry } from './actions'
import { YouTubeEmbed } from '@/components/ui/youtube-embed'

// ── types ──────────────────────────────────────────────────────────────
type Rel<T> = T | T[] | null
const one = <T,>(rel: Rel<T>): T | null =>
  !rel ? null : Array.isArray(rel) ? (rel[0] ?? null) : rel

type Unit = {
  id: string
  unit_type: string | null
  bedrooms: number | null
  size_sqft: number | null
  price_from: number | null
  currency: string | null
  availability: string | null
}
type Plan = { id: string; name: string | null; structure: Record<string, number> | null; notes: string | null }
type FAQ  = { id: string; question: string; answer: string; sort_order: number }
type MediaRel = { external_id: string | null }
type ProjectMedia = { role: string; media: Rel<MediaRel> }
type Project = {
  id: string; slug: string; name: string; description: string | null
  handover_quarter: string | null
  price_from: number | null; price_to: number | null
  currency: string | null; availability: string | null; est_yield_pct: number | null
  developer: Rel<{ name: string; website: string | null }>
  area: Rel<{ name: string }>
  units: Unit[]; payment_plans: Plan[]; faqs: FAQ[]
  project_media: ProjectMedia[]
}

// ── helpers ─────────────────────────────────────────────────────────────
const fmt = (n: number | null) => n ? Number(n).toLocaleString('en-US') : '—'

const AVAIL_STYLE: Record<string, string> = {
  available:   'bg-accent-soft text-accent',
  limited:     'bg-surface-3 text-warning',
  sold_out:    'bg-surface-3 text-danger',
  coming_soon: 'bg-surface-3 text-text-secondary',
}
const AVAIL_LABEL: Record<string, string> = {
  available: 'Available', limited: 'Limited', sold_out: 'Sold out', coming_soon: 'Coming soon',
}

function Badge({ status, small = false }: { status: string | null; small?: boolean }) {
  const s = status ?? 'available'
  return (
    <span className={`inline-block rounded-pill font-semibold whitespace-nowrap ${
      small ? 'text-[11px] px-2 py-[2px]' : 'text-[12px] px-3 py-1'
    } ${AVAIL_STYLE[s] ?? 'bg-surface-3 text-text-secondary'}`}>
      {AVAIL_LABEL[s] ?? s}
    </span>
  )
}

const PLAN_LABELS: Record<string, string> = {
  down_payment:         'Down payment',
  during_construction:  'During construction',
  on_handover:          'On handover',
  post_handover:        'Post handover',
}

function PlanBreakdown({ structure }: { structure: Record<string, number> | null }) {
  if (!structure) return null
  const entries = Object.entries(structure)
  return (
    <div className="rounded-xl border border-separator overflow-hidden">
      {entries.map(([key, pct], i) => (
        <div key={key}
          className={`flex items-center justify-between px-4 py-3 ${i > 0 ? 'border-t border-separator' : ''}`}
        >
          <span className="text-[14px] text-text-secondary">
            {PLAN_LABELS[key] ?? key.replace(/_/g, ' ')}
          </span>
          <span className="text-[14px] font-semibold tabular-nums">{pct}%</span>
        </div>
      ))}
    </div>
  )
}

// ── page ────────────────────────────────────────────────────────────────
export default async function ProjectDetail({
  params,
  searchParams,
}: {
  params: { slug: string }
  searchParams: { enquired?: string }
}) {
  const supabase = await createClient()
  const enquired = searchParams.enquired === '1'

  // Fetch profile for form pre-fill
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = user
    ? await supabase.from('profiles').select('full_name, phone').eq('id', user.id).maybeSingle()
    : { data: null }

  const { data } = await supabase
    .from('projects')
    .select(`
      id, slug, name, description,
      handover_quarter, price_from, price_to, currency, availability, est_yield_pct,
      developer:developers(name, website),
      area:areas(name),
      units(id, unit_type, bedrooms, size_sqft, price_from, currency, availability),
      payment_plans(id, name, structure, notes),
      faqs(id, question, answer, sort_order),
      project_media(role, media:media(external_id))
    `)
    .eq('slug', params.slug)
    .eq('status', 'published')
    .is('deleted_at', null)
    .maybeSingle()

  if (!data) notFound()
  const p = data as unknown as Project

  const units     = [...(p.units ?? [])].sort((a, b) => (a.bedrooms ?? 0) - (b.bedrooms ?? 0))
  const faqs      = [...(p.faqs ?? [])].sort((a, b) => a.sort_order - b.sort_order)
  const plan      = p.payment_plans?.[0] ?? null
  const developer = one(p.developer)
  const area      = one(p.area)
  const unitTypes = units.map((u) => u.unit_type).filter((t): t is string => !!t)

  const heroVideoRow = (p.project_media ?? []).find((m) => m.role === 'hero_video')
  const heroVideoId  = heroVideoRow ? (one(heroVideoRow.media))?.external_id ?? null : null

  return (
    <div className="max-w-[840px]">
      {/* Back */}
      <Link href="/app/explore"
        className="inline-flex items-center gap-1 text-[14px] text-text-secondary hover:text-text mb-6 -ml-1">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 18l-6-6 6-6"/>
        </svg>
        Explore
      </Link>

      {/* Badges + title */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <Badge status={p.availability} />
        {p.handover_quarter && (
          <span className="inline-block rounded-pill text-[12px] font-medium bg-surface-2 text-text-secondary px-3 py-1">
            Handover {p.handover_quarter}
          </span>
        )}
      </div>
      <h1 className="text-[32px] md:text-[40px] font-semibold tracking-[-0.02em] leading-tight">
        {p.name}
      </h1>
      {(developer || area) && (
        <p className="mt-2 text-[15px] text-text-secondary">
          {[developer?.name, area?.name].filter(Boolean).join(' · ')}
        </p>
      )}

      {/* Pricing */}
      <div className="mt-6 flex flex-wrap gap-6">
        <div>
          <p className="text-[12px] font-medium text-text-tertiary uppercase tracking-wide">Price from</p>
          <p className="mt-1 text-[22px] font-semibold tabular-nums">
            {p.currency ?? 'AED'} {fmt(p.price_from)}
            {p.price_to && (
              <span className="text-[17px] text-text-secondary font-normal"> – {fmt(p.price_to)}</span>
            )}
          </p>
        </div>
        {p.est_yield_pct && (
          <div>
            <p className="text-[12px] font-medium text-text-tertiary uppercase tracking-wide">Est. rental yield</p>
            <p className="mt-1 text-[22px] font-semibold">{Number(p.est_yield_pct).toFixed(1)}%</p>
          </div>
        )}
      </div>

      {/* Hero video */}
      {heroVideoId && (
        <section className="mt-8">
          <YouTubeEmbed videoId={heroVideoId} title={p.name} />
        </section>
      )}

      {/* Description */}
      {p.description && (
        <section className="mt-8 pt-8 border-t border-separator">
          <p className="text-[16px] text-text-secondary leading-[1.7]">{p.description}</p>
        </section>
      )}

      {/* Units */}
      {units.length > 0 && (
        <section className="mt-8 pt-8 border-t border-separator">
          <h2 className="text-[20px] font-semibold mb-4">Unit types</h2>
          <div className="overflow-x-auto rounded-xl border border-separator">
            <table className="w-full text-[14px]">
              <thead>
                <tr className="bg-surface-2 text-left text-text-secondary">
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium hidden sm:table-cell">Size</th>
                  <th className="px-4 py-3 font-medium">Price from</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {units.map((u, i) => (
                  <tr key={u.id} className={i > 0 ? 'border-t border-separator' : ''}>
                    <td className="px-4 py-3 font-medium">{u.unit_type ?? '—'}</td>
                    <td className="px-4 py-3 text-text-secondary hidden sm:table-cell">
                      {u.size_sqft ? `${Number(u.size_sqft).toLocaleString()} ft²` : '—'}
                    </td>
                    <td className="px-4 py-3 tabular-nums">
                      {u.currency ?? 'AED'} {fmt(u.price_from)}
                    </td>
                    <td className="px-4 py-3"><Badge status={u.availability} small /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Payment plan */}
      {plan && (
        <section className="mt-8 pt-8 border-t border-separator">
          <h2 className="text-[20px] font-semibold mb-1">Payment plan</h2>
          <p className="text-[14px] text-text-secondary mb-4">
            {[plan.name, plan.notes].filter(Boolean).join(' · ')}
          </p>
          <PlanBreakdown structure={plan.structure} />
        </section>
      )}

      {/* FAQs */}
      {faqs.length > 0 && (
        <section className="mt-8 pt-8 border-t border-separator">
          <h2 className="text-[20px] font-semibold mb-4">Common questions</h2>
          <div className="flex flex-col gap-3">
            {faqs.map((faq) => (
              <div key={faq.id} className="rounded-xl bg-surface-2 p-5">
                <p className="text-[15px] font-semibold">{faq.question}</p>
                <p className="mt-2 text-[14px] text-text-secondary leading-relaxed">{faq.answer}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Enquire / success */}
      <section className="mt-10 pt-8 border-t border-separator" id="enquire">
        {enquired ? (
          <div className="rounded-2xl bg-surface-2 p-6">
            <p className="text-[17px] font-semibold">Enquiry received</p>
            <p className="mt-2 text-[15px] text-text-secondary">
              Your relationship manager will be in touch within one business day.
            </p>
          </div>
        ) : (
          <>
            <h2 className="text-[20px] font-semibold mb-1">Enquire about this project</h2>
            <p className="text-[15px] text-text-secondary mb-6">
              Your dedicated relationship manager will guide you through this project — honest answers, no pressure.
            </p>
            <EnquireForm
              action={submitEnquiry}
              projectSlug={p.slug}
              defaultName={profile?.full_name ?? ''}
              defaultPhone={(profile as { phone?: string } | null)?.phone ?? ''}
              unitTypes={unitTypes}
            />
          </>
        )}
      </section>
    </div>
  )
}
