import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { StatusSelect } from '../status-select'
import { AssignSelect } from '../assign-select'
import { ActivityForm, ActivityIcon } from './activity-form'

export const dynamic = 'force-dynamic'

const STAFF_ROLES = ['rm', 'ops_manager', 'finance', 'super_admin']

type Rel<T> = T | T[] | null
const one = <T,>(rel: Rel<T>): T | null =>
  !rel ? null : Array.isArray(rel) ? (rel[0] ?? null) : rel

function fmt(iso: string, opts?: Intl.DateTimeFormatOptions) {
  return new Date(iso).toLocaleDateString('en-GB', opts ?? {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}
function fmtTime(iso: string) {
  return new Date(iso).toLocaleString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

const STATUS_STYLE: Record<string, string> = {
  new:           'bg-accent-soft text-accent',
  assigned:      'bg-surface-3 text-text-secondary',
  in_progress:   'bg-surface-3 text-warning',
  converted:     'bg-success/10 text-success',
  disqualified:  'bg-surface-3 text-danger',
  dormant:       'bg-surface-3 text-text-tertiary',
}

export default async function LeadDetail({ params }: { params: { id: string } }) {
  const supabase = await createClient()

  // Auth + staff check
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) notFound()
  const { data: roles } = await supabase
    .from('profile_roles').select('role').eq('profile_id', user.id)
  const isStaff = (roles ?? []).some((r: { role: string }) => STAFF_ROLES.includes(r.role))
  if (!isStaff) notFound()

  // Lead
  const { data: leadRaw } = await supabase
    .from('leads')
    .select(`
      id, status, unit_type, created_at, assigned_rm,
      score, sla_first_response_due, first_responded_at,
      buyer:profiles!leads_buyer_id_fkey(id, full_name, email, phone),
      project:projects(id, name, slug),
      lead_attribution(source, referrer, utm, created_at)
    `)
    .eq('id', params.id)
    .is('deleted_at', null)
    .maybeSingle()

  if (!leadRaw) notFound()

  type Lead = typeof leadRaw & {
    buyer: Rel<{ id: string; full_name: string | null; email: string | null; phone: string | null }>
    project: Rel<{ id: string; name: string; slug: string }>
    lead_attribution: Rel<{ source: string | null; referrer: string | null; utm: Record<string,string> | null; created_at: string }>
  }
  const lead = leadRaw as unknown as Lead
  const buyer       = one(lead.buyer)
  const project     = one(lead.project)
  const attribution = one(lead.lead_attribution)

  // Activities (newest first)
  const { data: activitiesRaw } = await supabase
    .from('lead_activities')
    .select('id, type, body, created_at, actor:profiles!lead_activities_actor_id_fkey(full_name, email)')
    .eq('lead_id', params.id)
    .order('created_at', { ascending: false })

  type Activity = {
    id: string; type: string; body: string | null; created_at: string
    actor: Rel<{ full_name: string | null; email: string | null }>
  }
  const activities = (activitiesRaw ?? []) as unknown as Activity[]

  // Staff for assign select
  const { data: staffRows } = await supabase
    .from('profile_roles')
    .select('role, profile:profiles!profile_roles_profile_id_fkey(id, full_name, email)')
    .in('role', STAFF_ROLES)

  const staffMap = new Map<string, { id: string; label: string }>()
  for (const row of (staffRows ?? []) as unknown as {
    profile: Rel<{ id: string; full_name: string | null; email: string | null }>
  }[]) {
    const prof = one(row.profile)
    if (prof) staffMap.set(prof.id, { id: prof.id, label: prof.full_name ?? prof.email ?? 'Staff' })
  }
  const staff = [...staffMap.values()].sort((a, b) => a.label.localeCompare(b.label))

  // SLA indicator
  const slaDate   = lead.sla_first_response_due ? new Date(lead.sla_first_response_due) : null
  const slaBreached = slaDate && !lead.first_responded_at && slaDate < new Date()

  return (
    <div className="max-w-[800px]">
      {/* Back */}
      <Link href="/admin/leads"
        className="inline-flex items-center gap-1.5 text-[13px] text-text-secondary hover:text-text transition-colors mb-6">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
        </svg>
        All leads
      </Link>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-[24px] font-semibold tracking-[-0.02em]">
              {buyer?.full_name ?? buyer?.email ?? 'Unknown buyer'}
            </h1>
            <span className={`rounded-pill px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide
              ${STATUS_STYLE[lead.status] ?? 'bg-surface-3 text-text-secondary'}`}>
              {lead.status.replace(/_/g, ' ')}
            </span>
          </div>
          <p className="mt-1 text-[14px] text-text-secondary">
            {[buyer?.email, buyer?.phone].filter(Boolean).join(' · ')}
          </p>
          <p className="mt-0.5 text-[14px] text-text-secondary">
            {project?.name ?? '—'}
            {lead.unit_type ? ` · ${lead.unit_type}` : ''}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <AssignSelect leadId={lead.id} current={lead.assigned_rm} staff={staff} />
          <StatusSelect leadId={lead.id} current={lead.status} />
        </div>
      </div>

      {/* Meta grid */}
      <div className="mt-6 grid sm:grid-cols-2 gap-4">
        {/* Lead info */}
        <div className="rounded-2xl bg-surface-2 p-5 flex flex-col gap-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-text-tertiary mb-1">Lead</p>
          {[
            ['Created',  fmt(lead.created_at)],
            ['Source',   attribution?.source ?? '—'],
            ['Referrer', attribution?.referrer
              ? (() => { try { return new URL(attribution.referrer).pathname } catch { return attribution.referrer } })()
              : '—'],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between gap-2 text-[13px]">
              <span className="text-text-tertiary">{k}</span>
              <span className="font-medium text-right truncate max-w-[180px]" title={String(v)}>{v}</span>
            </div>
          ))}
        </div>

        {/* SLA */}
        <div className="rounded-2xl bg-surface-2 p-5 flex flex-col gap-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-text-tertiary mb-1">SLA</p>
          {[
            ['First response due', slaDate ? fmt(slaDate.toISOString()) : '—'],
            ['First responded',    lead.first_responded_at ? fmt(lead.first_responded_at) : '—'],
            ['Score',              lead.score != null ? String(lead.score) : '—'],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between gap-2 text-[13px]">
              <span className="text-text-tertiary">{k}</span>
              <span className={`font-medium ${k === 'First response due' && slaBreached ? 'text-danger' : ''}`}>
                {v}{k === 'First response due' && slaBreached ? ' — overdue' : ''}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Activity */}
      <section className="mt-10">
        <h2 className="text-[18px] font-semibold mb-4">Activity</h2>
        <ActivityForm leadId={lead.id} />

        {activities.length > 0 && (
          <div className="mt-6 flex flex-col gap-1">
            {activities.map((act) => {
              const actor = one(act.actor)
              const actorLabel = actor?.full_name ?? actor?.email ?? 'Staff'
              return (
                <div key={act.id}
                  className="flex gap-3 py-4 border-b border-separator last:border-0">
                  <div className="mt-0.5 w-8 h-8 rounded-full bg-surface-2 flex items-center justify-center shrink-0">
                    <ActivityIcon type={act.type} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="text-[13px] font-semibold capitalize">{act.type}</span>
                      <span className="text-[12px] text-text-tertiary">{actorLabel} · {fmtTime(act.created_at)}</span>
                    </div>
                    {act.body && (
                      <p className="mt-1 text-[14px] text-text-secondary whitespace-pre-wrap">{act.body}</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {activities.length === 0 && (
          <p className="mt-6 text-[14px] text-text-tertiary">No activity logged yet.</p>
        )}
      </section>
    </div>
  )
}
