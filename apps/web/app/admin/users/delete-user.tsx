'use client'

import { useState } from 'react'
import { useFormStatus } from 'react-dom'
import { deleteUser } from './actions'

function ConfirmButton() {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending}
      className="h-7 px-3 rounded-lg bg-danger/10 text-danger text-[12px] font-semibold
        hover:bg-danger/20 disabled:opacity-50 transition-colors">
      {pending ? 'Deleting…' : 'Confirm delete'}
    </button>
  )
}

export function DeleteUser({ profileId, label }: { profileId: string; label: string }) {
  const [armed, setArmed] = useState(false)

  if (!armed) {
    return (
      <button type="button" onClick={() => setArmed(true)}
        className="text-[12px] text-text-tertiary hover:text-danger transition-colors">
        Delete
      </button>
    )
  }

  return (
    <form action={deleteUser} className="flex items-center gap-2">
      <input type="hidden" name="profile_id" value={profileId} />
      <ConfirmButton />
      <button type="button" onClick={() => setArmed(false)}
        className="text-[12px] text-text-tertiary hover:text-text transition-colors">
        Cancel
      </button>
    </form>
  )
}
