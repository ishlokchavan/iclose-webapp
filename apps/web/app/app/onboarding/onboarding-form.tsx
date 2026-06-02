'use client'

import { useFormStatus } from 'react-dom'
import { Button } from '@/components/ui/button'

type Area = { id: string; name: string }

type Props = {
  action: (formData: FormData) => Promise<void>
  defaultName: string
  defaultPhone: string
  areas: Area[]
}

const BUDGET_BANDS = [
  { value: 'under_1m', label: 'Under AED 1M' },
  { value: '1m_2m',    label: 'AED 1M – 2M'  },
  { value: '2m_4m',    label: 'AED 2M – 4M'  },
  { value: '4m_8m',    label: 'AED 4M – 8M'  },
  { value: 'over_8m',  label: 'Over AED 8M'  },
]

const inputCls =
  'w-full h-11 px-4 rounded-lg bg-surface-2 text-[15px] outline-none ' +
  'focus:ring-2 focus:ring-accent/40 placeholder:text-text-tertiary'

function Submit() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" size="lg" disabled={pending} className="w-full">
      {pending ? 'Setting up…' : "Let's go"}
    </Button>
  )
}

export function OnboardingForm({ action, defaultName, defaultPhone, areas }: Props) {
  return (
    <form action={action} className="flex flex-col gap-5">
      {/* Details */}
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

      {/* Budget */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[13px] font-medium text-text-secondary">Budget</label>
        <select name="budget_band" className={inputCls + ' cursor-pointer'}>
          <option value="">Not sure yet</option>
          {BUDGET_BANDS.map((b) => (
            <option key={b.value} value={b.value}>{b.label}</option>
          ))}
        </select>
      </div>

      {/* Areas */}
      {areas.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-[13px] font-medium text-text-secondary">
            Areas you are interested in <span className="text-text-tertiary">(select any)</span>
          </p>
          <div className="grid sm:grid-cols-2 gap-2">
            {areas.map((a) => (
              <label key={a.id}
                className="flex items-center gap-3 h-11 px-4 rounded-lg bg-surface-2 cursor-pointer
                  hover:bg-surface-3 transition-colors text-[14px] has-[:checked]:bg-accent-soft
                  has-[:checked]:text-accent has-[:checked]:font-medium"
              >
                <input
                  type="checkbox" name="preferred_areas" value={a.id}
                  className="accent-accent w-4 h-4 shrink-0"
                />
                {a.name}
              </label>
            ))}
          </div>
        </div>
      )}

      <Submit />
    </form>
  )
}
