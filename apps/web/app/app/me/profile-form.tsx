'use client'

import { useState } from 'react'
import { useFormStatus } from 'react-dom'
import { Button } from '@/components/ui/button'
import { BUDGET_BANDS } from '@/lib/buyer'

type Area = { id: string; name: string }

type Props = {
  action: (formData: FormData) => Promise<void>
  defaultName: string
  defaultPhone: string
  defaultBudget: string
  defaultAreaIds: string[]
  areas: Area[]
}

const inputCls =
  'w-full h-11 px-4 rounded-lg bg-surface-2 text-[15px] outline-none ' +
  'focus:ring-2 focus:ring-accent/40 placeholder:text-text-tertiary'

function Submit() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" size="md" disabled={pending} className="w-full sm:w-auto">
      {pending ? 'Saving…' : 'Save changes'}
    </Button>
  )
}

export function ProfileForm({
  action, defaultName, defaultPhone, defaultBudget, defaultAreaIds, areas,
}: Props) {
  const [saved, setSaved] = useState(false)

  async function handle(formData: FormData) {
    await action(formData)
    setSaved(true)
  }

  return (
    <form action={handle} className="flex flex-col gap-5" onChange={() => setSaved(false)}>
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] font-medium text-text-secondary">Your name</label>
          <input type="text" name="name" defaultValue={defaultName} placeholder="Full name" className={inputCls} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] font-medium text-text-secondary">Phone</label>
          <input type="tel" name="phone" defaultValue={defaultPhone} placeholder="+971 50 000 0000" className={inputCls} />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-[13px] font-medium text-text-secondary">Budget</label>
        <select name="budget_band" defaultValue={defaultBudget} className={inputCls + ' cursor-pointer'}>
          <option value="">Not sure yet</option>
          {BUDGET_BANDS.map((b) => (
            <option key={b.value} value={b.value}>{b.label}</option>
          ))}
        </select>
      </div>

      {areas.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-[13px] font-medium text-text-secondary">Areas you are interested in</p>
          <div className="grid sm:grid-cols-2 gap-2">
            {areas.map((a) => (
              <label key={a.id}
                className="flex items-center gap-3 h-11 px-4 rounded-lg bg-surface-2 cursor-pointer
                  hover:bg-surface-3 transition-colors text-[14px] has-[:checked]:bg-accent-soft
                  has-[:checked]:text-accent has-[:checked]:font-medium"
              >
                <input
                  type="checkbox" name="preferred_areas" value={a.id}
                  defaultChecked={defaultAreaIds.includes(a.id)}
                  className="accent-accent w-4 h-4 shrink-0"
                />
                {a.name}
              </label>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center gap-3">
        <Submit />
        {saved && <span className="text-[14px] text-success font-medium">Saved</span>}
      </div>
    </form>
  )
}
