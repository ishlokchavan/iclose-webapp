import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { TXN_PIPELINE, TXN_STATUS_LABEL, TXN_TYPE_LABEL, txnStatusIndex, isTerminal, money } from '@/lib/txn'
import { TxnStatusSelect } from './status-select'
import {
  updateTransaction, addMilestone, toggleMilestone, deleteMilestone,
  addInstallment, toggleInstallmentPaid, deleteInstallment,
} from './actions'

export const dynamic = 'force-dynamic'

type Rel<T> = T | T[] | null
const one = <T,>(rel: Rel<T>): T | null =>
  !rel ? null : Array.isArray(rel) ? (rel[0] ?? null) : rel

const dInput = (iso: string | null) => (iso ? iso.slice(0, 10) : '')
const dShow  = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'

const inputCls = 'h-10 px-3 rounded-lg bg-surface-2 text-[14px] outline-none focus:ring-2 focus:ring-accent/40 w-full'
const labelCls = 'text-[12px] font-medium text-text-secondary'

export default async function TxnDetail({ params }: { params: { id: string } }) {
  const supabase = await createClient()

  const { data: txnRaw } = await supabase
    .from('transactions')
    .select(`
      id, status, type, unit_price, currency, developer_registration_ref,
      booked_at, spa_signed_at, oqood_registered_at, handover_estimate, created_at, lead_id,
      buyer:profiles!transactions_buyer_id_fkey(full_name, email, phone),
      project:projects(name, slug)
    `)
    .eq('id', params.id)
    .maybeSingle()
  if (!txnRaw) notFound()

  const t = txnRaw as any
  const buyer = one(t.buyer)
  const project = one(t.project)

  const { data: milestones } = await supabase
    .from('transaction_milestones')
    .select('id, label, kind, status, progress_pct, due_date, completed_at, sort_order')
    .eq('transaction_id', t.id)
    .order('sort_order', { ascending: true })

  const { data: schedule } = await supabase
    .from('payment_schedule')
    .select('id, installment_no, amount, currency, due_date, status, paid_at')
    .eq('transaction_id', t.id)
    .order('installment_no', { ascending: true })

  const ms = milestones ?? []
  const ps = schedule ?? []
  const paidTotal = ps.filter((p) => p.status === 'paid').reduce((s, p) => s + Number(p.amount ?? 0), 0)
  const schedTotal = ps.reduce((s, p) => s + Number(p.amount ?? 0), 0)
  const curIdx = txnStatusIndex(t.status)

  return (
    <div className="max-w-[820px]">
      <Link href="/admin/transactions"
        className="inline-flex items-center gap-1.5 text-[13px] text-text-secondary hover:text-text transition-colors mb-6">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
        </svg>
        Transactions
      </Link>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[24px] font-semibold tracking-[-0.02em]">
            {buyer?.full_name ?? buyer?.email ?? 'Unknown buyer'}
          </h1>
          <p className="mt-1 text-[14px] text-text-secondary">
            {[buyer?.email, buyer?.phone].filter(Boolean).join(' · ')}
          </p>
          <p className="mt-0.5 text-[14px] text-text-secondary">
            {project?.name ?? '—'} · {TXN_TYPE_LABEL[t.type] ?? t.type}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {t.lead_id && (
            <Link href={`/admin/leads/${t.lead_id}`}
              className="text-[13px] text-text-secondary hover:text-text px-3 h-9 inline-flex items-center rounded-lg hover:bg-surface-2 transition-colors">
              View lead
            </Link>
          )}
          <TxnStatusSelect id={t.id} current={t.status} />
        </div>
      </div>

      {/* Status pipeline */}
      <div className="mt-6 flex flex-wrap gap-1.5">
        {TXN_PIPELINE.map((s, i) => {
          const reached = !isTerminal(t.status) && curIdx >= i
          return (
            <span key={s}
              className={`rounded-pill px-2.5 py-1 text-[11px] font-medium ${
                t.status === s ? 'bg-accent text-white'
                : reached ? 'bg-accent-soft text-accent'
                : 'bg-surface-2 text-text-tertiary'
              }`}>
              {TXN_STATUS_LABEL[s]}
            </span>
          )
        })}
        {isTerminal(t.status) && (
          <span className="rounded-pill px-2.5 py-1 text-[11px] font-semibold bg-surface-3 text-danger">
            {TXN_STATUS_LABEL[t.status]}
          </span>
        )}
      </div>

      {/* Key details */}
      <section className="mt-8 pt-8 border-t border-separator">
        <h2 className="text-[18px] font-semibold mb-4">Deal details</h2>
        <form action={updateTransaction} className="flex flex-col gap-4">
          <input type="hidden" name="id" value={t.id} />
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className={labelCls}>Unit price</label>
              <input type="number" name="unit_price" min={0} step={1000} defaultValue={t.unit_price ?? ''} className={inputCls} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelCls}>Currency</label>
              <select name="currency" defaultValue={t.currency ?? 'AED'} className={inputCls + ' cursor-pointer appearance-none'}>
                <option value="AED">AED</option><option value="USD">USD</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelCls}>Developer reg. ref</label>
              <input type="text" name="developer_registration_ref" defaultValue={t.developer_registration_ref ?? ''} className={inputCls} />
            </div>
          </div>
          <div className="grid sm:grid-cols-4 gap-4">
            {[
              ['booked_at', 'Booked'],
              ['spa_signed_at', 'SPA signed'],
              ['oqood_registered_at', 'Oqood registered'],
              ['handover_estimate', 'Handover (est.)'],
            ].map(([name, label]) => (
              <div key={name} className="flex flex-col gap-1.5">
                <label className={labelCls}>{label}</label>
                <input type="date" name={name} defaultValue={dInput(t[name])} className={inputCls} />
              </div>
            ))}
          </div>
          <div>
            <button type="submit"
              className="h-10 px-5 rounded-lg bg-accent text-white text-[14px] font-semibold hover:opacity-90 transition-opacity">
              Save details
            </button>
          </div>
        </form>
      </section>

      {/* Milestones */}
      <section className="mt-10 pt-8 border-t border-separator">
        <h2 className="text-[18px] font-semibold mb-1">Construction milestones</h2>
        <p className="text-[13px] text-text-tertiary mb-4">Track progress the buyer sees on their purchase.</p>

        {ms.length > 0 && (
          <div className="rounded-xl border border-separator overflow-hidden mb-4">
            {ms.map((m, i) => {
              const done = m.status === 'completed'
              return (
                <div key={m.id} className={`flex items-center gap-3 p-3 ${i > 0 ? 'border-t border-separator' : ''}`}>
                  <form action={toggleMilestone}>
                    <input type="hidden" name="id" value={m.id} />
                    <input type="hidden" name="transaction_id" value={t.id} />
                    <input type="hidden" name="done" value={done ? '0' : '1'} />
                    <button type="submit" title={done ? 'Mark pending' : 'Mark complete'}
                      className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                        done ? 'bg-accent border-accent text-white' : 'border-separator hover:border-accent'
                      }`}>
                      {done && <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M20 6L9 17l-5-5"/></svg>}
                    </button>
                  </form>
                  <div className="min-w-0 flex-1">
                    <p className={`text-[14px] font-medium ${done ? 'text-text-tertiary line-through' : ''}`}>{m.label}</p>
                    <p className="text-[12px] text-text-tertiary">
                      {m.due_date ? `Due ${dShow(m.due_date)}` : 'No due date'}
                      {m.progress_pct != null ? ` · ${m.progress_pct}%` : ''}
                    </p>
                  </div>
                  <form action={deleteMilestone}>
                    <input type="hidden" name="id" value={m.id} />
                    <input type="hidden" name="transaction_id" value={t.id} />
                    <button type="submit" className="text-text-tertiary hover:text-danger text-[12px] transition-colors">Remove</button>
                  </form>
                </div>
              )
            })}
          </div>
        )}

        <form action={addMilestone} className="flex flex-wrap items-end gap-3">
          <input type="hidden" name="transaction_id" value={t.id} />
          <div className="flex flex-col gap-1.5 flex-1 min-w-[180px]">
            <label className={labelCls}>Milestone</label>
            <input type="text" name="label" required placeholder="e.g. Foundation complete" className={inputCls} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>Due date</label>
            <input type="date" name="due_date" className={inputCls} />
          </div>
          <button type="submit" className="h-10 px-4 rounded-lg bg-surface-2 hover:bg-surface-3 text-[13px] font-semibold transition-colors">
            Add
          </button>
        </form>
      </section>

      {/* Payment schedule */}
      <section className="mt-10 pt-8 border-t border-separator">
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="text-[18px] font-semibold">Payment schedule</h2>
          {ps.length > 0 && (
            <span className="text-[13px] text-text-tertiary tabular-nums">
              {money(paidTotal, t.currency ?? 'AED')} paid of {money(schedTotal, t.currency ?? 'AED')}
            </span>
          )}
        </div>

        {ps.length > 0 && (
          <div className="rounded-xl border border-separator overflow-hidden mb-4">
            {ps.map((p, i) => {
              const paid = p.status === 'paid'
              return (
                <div key={p.id} className={`flex items-center gap-3 p-3 ${i > 0 ? 'border-t border-separator' : ''}`}>
                  <span className="w-7 h-7 rounded-full bg-surface-2 text-[12px] font-semibold flex items-center justify-center shrink-0 tabular-nums">
                    {p.installment_no}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] font-medium tabular-nums">{money(p.amount, p.currency ?? 'AED')}</p>
                    <p className="text-[12px] text-text-tertiary">
                      {p.due_date ? `Due ${dShow(p.due_date)}` : 'No due date'}
                      {paid && p.paid_at ? ` · paid ${dShow(p.paid_at)}` : ''}
                    </p>
                  </div>
                  <form action={toggleInstallmentPaid}>
                    <input type="hidden" name="id" value={p.id} />
                    <input type="hidden" name="transaction_id" value={t.id} />
                    <input type="hidden" name="paid" value={paid ? '0' : '1'} />
                    <button type="submit"
                      className={`rounded-pill px-3 py-1 text-[12px] font-semibold transition-colors ${
                        paid ? 'bg-success/10 text-success' : 'bg-surface-2 text-text-secondary hover:bg-surface-3'
                      }`}>
                      {paid ? 'Paid' : 'Mark paid'}
                    </button>
                  </form>
                  <form action={deleteInstallment}>
                    <input type="hidden" name="id" value={p.id} />
                    <input type="hidden" name="transaction_id" value={t.id} />
                    <button type="submit" className="text-text-tertiary hover:text-danger text-[12px] transition-colors">Remove</button>
                  </form>
                </div>
              )
            })}
          </div>
        )}

        <form action={addInstallment} className="flex flex-wrap items-end gap-3">
          <input type="hidden" name="transaction_id" value={t.id} />
          <input type="hidden" name="currency" value={t.currency ?? 'AED'} />
          <div className="flex flex-col gap-1.5 flex-1 min-w-[140px]">
            <label className={labelCls}>Amount ({t.currency ?? 'AED'})</label>
            <input type="number" name="amount" required min={0} step={1000} placeholder="e.g. 150000" className={inputCls} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>Due date</label>
            <input type="date" name="due_date" className={inputCls} />
          </div>
          <button type="submit" className="h-10 px-4 rounded-lg bg-surface-2 hover:bg-surface-3 text-[13px] font-semibold transition-colors">
            Add
          </button>
        </form>
      </section>
    </div>
  )
}
