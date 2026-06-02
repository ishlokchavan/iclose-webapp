'use client'

import { useFormStatus } from 'react-dom'
import { Button } from '@/components/ui/button'

function Submit() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" size="lg" disabled={pending} className="w-full sm:w-auto">
      {pending ? 'Sending…' : 'Submit enquiry'}
    </Button>
  )
}

type Props = {
  action: (formData: FormData) => Promise<void>
  projectSlug: string
  defaultName: string
  defaultPhone: string
  unitTypes: string[]
}

const inputCls =
  'w-full h-11 px-4 rounded-lg bg-surface-2 text-[15px] outline-none ' +
  'focus:ring-2 focus:ring-accent/40 placeholder:text-text-tertiary'

export function EnquireForm({ action, projectSlug, defaultName, defaultPhone, unitTypes }: Props) {
  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="project_slug" value={projectSlug} />

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] font-medium text-text-secondary">Your name</label>
          <input
            type="text" name="name" required
            defaultValue={defaultName}
            placeholder="Full name"
            className={inputCls}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] font-medium text-text-secondary">Phone (optional)</label>
          <input
            type="tel" name="phone"
            defaultValue={defaultPhone}
            placeholder="+971 50 000 0000"
            className={inputCls}
          />
        </div>
      </div>

      {unitTypes.length > 1 && (
        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] font-medium text-text-secondary">Unit type you are interested in</label>
          <select name="unit_type" className={inputCls + ' cursor-pointer'}>
            <option value="">Any</option>
            {unitTypes.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      )}

      <Submit />

      <p className="text-[12px] text-text-tertiary">
        Your relationship manager will be in touch within one business day. No spam, ever.
      </p>
    </form>
  )
}
