'use client'

import { updateCashbackStage } from './actions'
import { ALL_CASHBACK_STAGES, CASHBACK_LABEL } from '@/lib/txn'

export function CashbackStageSelect({ id, current }: { id: string; current: string }) {
  return (
    <form action={updateCashbackStage}>
      <input type="hidden" name="id" value={id} />
      <select
        name="cashback_status"
        defaultValue={current}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        className="h-9 px-3 rounded-lg bg-surface-2 text-[13px] font-medium outline-none cursor-pointer
          focus:ring-2 focus:ring-accent/40 appearance-none pr-7"
      >
        {ALL_CASHBACK_STAGES.map((s) => (
          <option key={s} value={s}>{CASHBACK_LABEL[s] ?? s}</option>
        ))}
      </select>
    </form>
  )
}
