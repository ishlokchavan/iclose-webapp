import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { TXN_STATUS_LABEL, money, isTerminal } from '@/lib/txn'

export const dynamic = 'force-dynamic'

type Rel<T> = T | T[] | null
const one = <T,>(rel: Rel<T>): T | null =>
  !rel ? null : Array.isArray(rel) ? (rel[0] ?? null) : rel

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default async function AdminTransactions() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('transactions')
    .select(`
      id, status, unit_price, currency, created_at,
      buyer:profiles!transactions_buyer_id_fkey(full_name, email),
      project:projects(name)
    `)
    .order('created_at', { ascending: false })

  type Row = {
    id: string; status: string; unit_price: number | null; currency: string | null; created_at: string
    buyer: Rel<{ full_name: string | null; email: string | null }>
    project: Rel<{ name: string }>
  }
  const txns = (data ?? []) as unknown as Row[]

  const active = txns.filter((t) => !isTerminal(t.status)).length
  const pipelineValue = txns
    .filter((t) => !isTerminal(t.status))
    .reduce((sum, t) => sum + Number(t.unit_price ?? 0), 0)

  return (
    <div>
      <h1 className="text-[28px] font-semibold tracking-[-0.02em]">Transactions</h1>
      <p className="mt-2 text-[15px] text-text-secondary">
        Every booking from reservation through to title transfer.
      </p>

      <div className="mt-6 flex flex-wrap gap-4">
        {[
          ['Total', String(txns.length)],
          ['Active', String(active)],
          ['Active value', money(pipelineValue)],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl bg-surface-2 px-5 py-4 min-w-[110px]">
            <p className="text-[12px] font-medium text-text-tertiary uppercase tracking-wide">{label}</p>
            <p className="mt-1 text-[22px] font-semibold tabular-nums">{value}</p>
          </div>
        ))}
      </div>

      {error && <p className="mt-8 text-[15px] text-danger">Could not load transactions: {error.message}</p>}

      {!error && txns.length === 0 && (
        <div className="mt-12 rounded-2xl bg-surface-2 p-8 text-center">
          <p className="text-[17px] font-semibold">No transactions yet</p>
          <p className="mt-2 text-[15px] text-text-secondary">
            Convert a lead into a transaction from its detail page to start one.
          </p>
        </div>
      )}

      {txns.length > 0 && (
        <div className="mt-8 overflow-hidden rounded-2xl border border-separator">
          {txns.map((t, i) => {
            const buyer = one(t.buyer)
            const project = one(t.project)
            return (
              <Link key={t.id} href={`/admin/transactions/${t.id}`}
                className={`flex flex-col gap-2 p-4 hover:bg-surface-2 transition-colors md:flex-row md:items-center md:justify-between ${
                  i > 0 ? 'border-t border-separator' : ''
                }`}>
                <div className="min-w-0">
                  <p className="text-[15px] font-semibold">{buyer?.full_name ?? buyer?.email ?? 'Unknown buyer'}</p>
                  <p className="mt-0.5 text-[13px] text-text-secondary">
                    {project?.name ?? '—'} · {fmt(t.created_at)}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-[14px] font-semibold tabular-nums">{money(t.unit_price, t.currency ?? 'AED')}</span>
                  <span className={`rounded-pill px-3 py-1 text-[12px] font-semibold ${
                    isTerminal(t.status) ? 'bg-surface-3 text-danger' : 'bg-accent-soft text-accent'
                  }`}>
                    {TXN_STATUS_LABEL[t.status] ?? t.status}
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
