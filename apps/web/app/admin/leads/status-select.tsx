'use client'

import { updateLeadStatus } from './actions'

const ALL_STATUSES = [
  'new', 'qualifying', 'qualified', 'disqualified', 'assigned',
  'advising', 'shortlisted', 'ready_to_book', 'attribution_locked',
  'converted', 'nurturing', 'dormant',
] as const

const fmtStatus = (s: string) =>
  s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())

const STATUS_STYLE: Record<string, string> = {
  new:               'bg-accent-soft text-accent',
  qualifying:        'bg-surface-3 text-warning',
  qualified:         'bg-surface-3 text-warning',
  assigned:          'bg-surface-3 text-warning',
  advising:          'bg-surface-3 text-warning',
  shortlisted:       'bg-surface-3 text-warning',
  ready_to_book:     'bg-surface-3 text-warning',
  attribution_locked:'bg-surface-3 text-text-secondary',
  converted:         'bg-surface-3 text-text',
  disqualified:      'bg-surface-3 text-danger',
  dormant:           'bg-surface-3 text-text-tertiary',
  nurturing:         'bg-surface-3 text-text-secondary',
}

export function StatusSelect({ leadId, current }: { leadId: string; current: string }) {
  return (
    <form action={updateLeadStatus}>
      <input type="hidden" name="id" value={leadId} />
      <select
        name="status"
        defaultValue={current}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        className={`rounded-pill px-3 py-1 text-[12px] font-semibold border-none cursor-pointer
          outline-none appearance-none pr-6 ${STATUS_STYLE[current] ?? 'bg-surface-3 text-text'}`}
        style={{ backgroundImage: 'none' }}
      >
        {ALL_STATUSES.map((s) => (
          <option key={s} value={s}>{fmtStatus(s)}</option>
        ))}
      </select>
    </form>
  )
}
