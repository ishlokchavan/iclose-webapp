'use client'

import { useRef } from 'react'
import { useFormStatus } from 'react-dom'
import { addActivity } from './actions'

const TYPES = [
  { value: 'note',     label: 'Note' },
  { value: 'call',     label: 'Call' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'email',    label: 'Email' },
  { value: 'meeting',  label: 'Meeting' },
]

const TYPE_ICON: Record<string, string> = {
  note:     '📝',
  call:     '📞',
  whatsapp: '💬',
  email:    '✉️',
  meeting:  '🤝',
}

function Submit() {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending}
      className="h-9 px-4 rounded-lg bg-accent text-white text-[13px] font-semibold
        hover:opacity-90 disabled:opacity-50 transition-opacity shrink-0">
      {pending ? 'Logging…' : 'Log'}
    </button>
  )
}

export function ActivityForm({ leadId }: { leadId: string }) {
  const formRef = useRef<HTMLFormElement>(null)

  async function handle(formData: FormData) {
    await addActivity(formData)
    formRef.current?.reset()
  }

  return (
    <form ref={formRef} action={handle} className="flex flex-col gap-3">
      <input type="hidden" name="lead_id" value={leadId} />
      <div className="flex items-center gap-2">
        <select name="type" defaultValue="note"
          className="h-9 px-3 rounded-lg bg-surface-2 text-[13px] outline-none cursor-pointer
            focus:ring-2 focus:ring-accent/40 appearance-none">
          {TYPES.map((t) => (
            <option key={t.value} value={t.value}>{TYPE_ICON[t.value]} {t.label}</option>
          ))}
        </select>
      </div>
      <div className="flex items-end gap-2">
        <textarea
          name="body"
          required
          rows={2}
          placeholder="Add a note, log a call outcome, record next steps…"
          className="flex-1 px-4 py-2.5 rounded-xl bg-surface-2 text-[14px] resize-none outline-none
            focus:ring-2 focus:ring-accent/40 placeholder:text-text-tertiary"
        />
        <Submit />
      </div>
    </form>
  )
}

export function ActivityIcon({ type }: { type: string }) {
  return <span className="text-[16px] leading-none select-none">{TYPE_ICON[type] ?? '•'}</span>
}
