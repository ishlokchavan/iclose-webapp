import { createClient } from '@/lib/supabase/server'
import { StatusSelect } from './status-select'

export const dynamic = 'force-dynamic'

type Rel<T> = T | T[] | null
const one = <T,>(rel: Rel<T>): T | null =>
  !rel ? null : Array.isArray(rel) ? (rel[0] ?? null) : rel

type Lead = {
  id: string; status: string; unit_type: string | null; created_at: string
  buyer:   Rel<{ full_name: string | null; email: string | null; phone: string | null }>
  project: Rel<{ name: string }>
  lead_attribution: Rel<{ source: string | null; referrer: string | null }>
}

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default async function AdminLeads() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('leads')
    .select(`
      id, status, unit_type, created_at,
      buyer:profiles(full_name, email, phone),
      project:projects(name),
      lead_attribution(source, referrer)
    `)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  const leads = (data ?? []) as unknown as Lead[]

  const counts = leads.reduce(
    (acc, l) => ({ ...acc, [l.status]: (acc[l.status] ?? 0) + 1 }),
    {} as Record<string, number>
  )
  const newCount  = counts['new']  ?? 0
  const openCount = leads.filter((l) => !['converted', 'disqualified', 'dormant'].includes(l.status)).length

  return (
    <div>
      <h1 className="text-[28px] font-semibold tracking-[-0.02em]">Leads</h1>
      <p className="mt-2 text-[15px] text-text-secondary">
        Every enquiry from the platform, in one place.
      </p>

      <div className="mt-6 flex flex-wrap gap-4">
        {[
          ['Total', leads.length],
          ['New', newCount],
          ['Open', openCount],
        ].map(([label, count]) => (
          <div key={label} className="rounded-xl bg-surface-2 px-5 py-4 min-w-[100px]">
            <p className="text-[12px] font-medium text-text-tertiary uppercase tracking-wide">{label}</p>
            <p className="mt-1 text-[24px] font-semibold tabular-nums">{count}</p>
          </div>
        ))}
      </div>

      {error && (
        <p className="mt-8 text-[15px] text-danger">Could not load leads: {error.message}</p>
      )}

      {!error && leads.length === 0 && (
        <div className="mt-12 rounded-2xl bg-surface-2 p-8 text-center">
          <p className="text-[17px] font-semibold">No leads yet</p>
          <p className="mt-2 text-[15px] text-text-secondary">
            Enquiries submitted on project pages will appear here.
          </p>
        </div>
      )}

      {leads.length > 0 && (
        <div className="mt-8 overflow-hidden rounded-2xl border border-separator">
          {leads.map((lead, i) => {
            const buyer      = one(lead.buyer)
            const project    = one(lead.project)
            const attribution = one(lead.lead_attribution)
            return (
              <div key={lead.id}
                className={`flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between ${
                  i > 0 ? 'border-t border-separator' : ''
                }`}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[15px] font-semibold">
                      {buyer?.full_name ?? buyer?.email ?? 'Unknown buyer'}
                    </span>
                    {buyer?.phone && (
                      <span className="text-[13px] text-text-tertiary">{buyer.phone}</span>
                    )}
                  </div>
                  <p className="mt-0.5 text-[13px] text-text-secondary">
                    {project?.name ?? '—'}
                    {lead.unit_type ? ` · ${lead.unit_type}` : ''}
                  </p>
                  <p className="mt-0.5 text-[12px] text-text-tertiary">
                    {fmt(lead.created_at)}
                    {attribution?.source ? ` · via ${attribution.source}` : ''}
                  </p>
                </div>

                <div className="shrink-0">
                  <StatusSelect leadId={lead.id} current={lead.status} />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
