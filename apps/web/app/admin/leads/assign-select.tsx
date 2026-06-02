'use client'

import { assignLead } from './actions'

type Staff = { id: string; label: string }

export function AssignSelect({
  leadId, current, staff,
}: {
  leadId: string
  current: string | null
  staff: Staff[]
}) {
  return (
    <form action={assignLead}>
      <input type="hidden" name="id" value={leadId} />
      <select
        name="assigned_rm"
        defaultValue={current ?? ''}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        className={`rounded-pill px-3 py-1 text-[12px] font-medium border-none cursor-pointer
          outline-none appearance-none ${
            current ? 'bg-accent-soft text-accent' : 'bg-surface-3 text-text-secondary'
          }`}
      >
        <option value="">Unassigned</option>
        {staff.map((s) => (
          <option key={s.id} value={s.id}>{s.label}</option>
        ))}
      </select>
    </form>
  )
}
