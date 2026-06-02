'use client'

import { updateTransactionStatus } from './actions'
import { ALL_TXN_STATUSES, TXN_STATUS_LABEL } from '@/lib/txn'

export function TxnStatusSelect({ id, current }: { id: string; current: string }) {
  return (
    <form action={updateTransactionStatus}>
      <input type="hidden" name="id" value={id} />
      <select
        name="status"
        defaultValue={current}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        className="h-9 px-3 rounded-lg bg-surface-2 text-[13px] font-medium outline-none cursor-pointer
          focus:ring-2 focus:ring-accent/40 appearance-none pr-7"
      >
        {ALL_TXN_STATUSES.map((s) => (
          <option key={s} value={s}>{TXN_STATUS_LABEL[s] ?? s}</option>
        ))}
      </select>
    </form>
  )
}
