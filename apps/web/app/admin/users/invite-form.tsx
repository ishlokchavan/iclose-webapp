'use client'

import { useFormStatus } from 'react-dom'
import { inviteStaff } from './actions'

const ROLES = [
  { value: 'rm',          label: 'Relationship Manager' },
  { value: 'ops_manager', label: 'Operations Manager' },
  { value: 'finance',     label: 'Finance' },
  { value: 'super_admin', label: 'Super Admin' },
]

const inputCls =
  'h-10 px-3 rounded-lg bg-surface-2 text-[14px] outline-none ' +
  'focus:ring-2 focus:ring-accent/40 placeholder:text-text-tertiary'

function Submit() {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending}
      className="h-10 px-5 rounded-lg bg-accent text-white text-[14px] font-semibold
        hover:opacity-90 disabled:opacity-50 transition-opacity shrink-0">
      {pending ? 'Sending…' : 'Send invite'}
    </button>
  )
}

export function InviteForm() {
  return (
    <form action={inviteStaff}
      className="rounded-2xl bg-surface-2 p-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:flex-wrap">
      <div className="flex flex-col gap-1.5 flex-1 min-w-[200px]">
        <label className="text-[12px] font-medium text-text-secondary">Email *</label>
        <input type="email" name="email" required placeholder="teammate@iclose.ae" className={inputCls} />
      </div>
      <div className="flex flex-col gap-1.5 flex-1 min-w-[160px]">
        <label className="text-[12px] font-medium text-text-secondary">Name</label>
        <input type="text" name="full_name" placeholder="Full name" className={inputCls} />
      </div>
      <div className="flex flex-col gap-1.5 min-w-[180px]">
        <label className="text-[12px] font-medium text-text-secondary">Role</label>
        <select name="role" defaultValue="rm" className={inputCls + ' cursor-pointer appearance-none'}>
          {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>
      </div>
      <Submit />
    </form>
  )
}
