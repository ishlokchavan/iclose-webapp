'use client'

import { useRef } from 'react'
import { useFormStatus } from 'react-dom'
import { grantRole, revokeRole } from './actions'

const GRANTABLE = ['rm', 'ops_manager', 'finance', 'super_admin'] as const

const ROLE_LABEL: Record<string, string> = {
  buyer:       'Buyer',
  rm:          'RM',
  ops_manager: 'Ops',
  finance:     'Finance',
  super_admin: 'Super admin',
  seller:      'Seller',
  advisor:     'Advisor',
}
const ROLE_STYLE: Record<string, string> = {
  buyer:       'bg-surface-3 text-text-secondary',
  rm:          'bg-accent-soft text-accent',
  ops_manager: 'bg-surface-3 text-warning',
  finance:     'bg-surface-3 text-success',
  super_admin: 'bg-danger/10 text-danger',
}

function RevokeBtn() {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending}
      className="ml-1 opacity-50 hover:opacity-100 disabled:opacity-30 transition-opacity text-[10px]">
      ×
    </button>
  )
}

export function RoleControls({
  profileId,
  currentRoles,
  canManage,
}: {
  profileId: string
  currentRoles: string[]
  canManage: boolean
}) {
  const available = GRANTABLE.filter((r) => !currentRoles.includes(r))
  const formRef   = useRef<HTMLFormElement>(null)

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {currentRoles.map((role) => (
        <span key={role}
          className={`inline-flex items-center rounded-pill text-[11px] font-semibold px-2 py-[2px]
            ${ROLE_STYLE[role] ?? 'bg-surface-3 text-text-secondary'}`}>
          {ROLE_LABEL[role] ?? role}
          {canManage && role !== 'buyer' && (
            <form action={revokeRole} className="contents">
              <input type="hidden" name="profile_id" value={profileId} />
              <input type="hidden" name="role"       value={role} />
              <RevokeBtn />
            </form>
          )}
        </span>
      ))}

      {canManage && available.length > 0 && (
        <form ref={formRef} action={grantRole}>
          <input type="hidden" name="profile_id" value={profileId} />
          <select
            name="role"
            defaultValue=""
            onChange={(e) => {
              if (e.currentTarget.value) formRef.current?.requestSubmit()
            }}
            className="h-7 px-2 rounded-lg bg-surface-2 text-[12px] outline-none
              cursor-pointer appearance-none hover:bg-surface-3 transition-colors"
          >
            <option value="" disabled>Add role…</option>
            {available.map((r) => (
              <option key={r} value={r}>{ROLE_LABEL[r]}</option>
            ))}
          </select>
        </form>
      )}
    </div>
  )
}
