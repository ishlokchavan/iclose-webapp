import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import {
  CASHBACK_STAGES, CASHBACK_LABEL, cashbackStageIndex, isCashbackTerminal,
  CATEGORY_OPTIONS, PROPERTY_TYPE_OPTIONS, money,
} from '@/lib/txn'
import { CashbackStageSelect } from './status-select'
import { updateTransaction } from './actions'

export const dynamic = 'force-dynamic'

type Rel<T> = T | T[] | null
const one = <T,>(rel: Rel<T>): T | null =>
  !rel ? null : Array.isArray(rel) ? (rel[0] ?? null) : rel

const inputCls = 'h-10 px-3 rounded-lg bg-surface-2 text-[14px] outline-none focus:ring-2 focus:ring-accent/40 w-full'
const selectCls = inputCls + ' cursor-pointer appearance-none'
const labelCls = 'text-[12px] font-medium text-text-secondary'

export default async function TxnDetail({ params }: { params: { id: string } }) {
  const supabase = await createClient()

  const { data: txnRaw } = await supabase
    .from('transactions')
    .select(`
      id, cashback_status, unit_no, category, property_type, area_id, developer_id,
      unit_price, currency, created_at, lead_id,
      buyer:profiles!transactions_buyer_id_fkey(full_name, email, phone),
      project:projects(name, slug)
    `)
    .eq('id', params.id)
    .maybeSingle()
  if (!txnRaw) notFound()

  const t = txnRaw as any
  const buyer = one(t.buyer)
  const project = one(t.project)

  const [{ data: areas }, { data: developers }] = await Promise.all([
    supabase.from('areas').select('id, name').order('name'),
    supabase.from('developers').select('id, name').order('name'),
  ])

  const stage = t.cashback_status ?? 'purchased'
  const curIdx = cashbackStageIndex(stage)

  return (
    <div className="max-w-[760px]">
      <Link href="/admin/transactions"
        className="inline-flex items-center gap-1.5 text-[13px] text-text-secondary hover:text-text transition-colors mb-6">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
        </svg>
        Deals
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
          {project && (
            <p className="mt-0.5 text-[14px] text-text-secondary">{project.name}</p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {t.lead_id && (
            <Link href={`/admin/leads/${t.lead_id}`}
              className="text-[13px] text-text-secondary hover:text-text px-3 h-9 inline-flex items-center rounded-lg hover:bg-surface-2 transition-colors">
              View lead
            </Link>
          )}
          <CashbackStageSelect id={t.id} current={stage} />
        </div>
      </div>

      {/* Cashback journey */}
      <div className="mt-6 flex flex-wrap gap-1.5">
        {CASHBACK_STAGES.map((s, i) => {
          const reached = !isCashbackTerminal(stage) && curIdx >= i
          return (
            <span key={s}
              className={`rounded-pill px-2.5 py-1 text-[11px] font-medium ${
                stage === s ? 'bg-accent text-white'
                : reached ? 'bg-accent-soft text-accent'
                : 'bg-surface-2 text-text-tertiary'
              }`}>
              {CASHBACK_LABEL[s]}
            </span>
          )
        })}
        {isCashbackTerminal(stage) && (
          <span className="rounded-pill px-2.5 py-1 text-[11px] font-semibold bg-surface-3 text-danger">
            {CASHBACK_LABEL[stage]}
          </span>
        )}
      </div>

      {/* Unit details */}
      <section className="mt-8 pt-8 border-t border-separator">
        <h2 className="text-[18px] font-semibold mb-4">Unit details</h2>
        <form action={updateTransaction} className="flex flex-col gap-4">
          <input type="hidden" name="id" value={t.id} />
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className={labelCls}>Unit no.</label>
              <input type="text" name="unit_no" defaultValue={t.unit_no ?? ''} placeholder="e.g. A-1204" className={inputCls} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelCls}>Category</label>
              <select name="category" defaultValue={t.category ?? ''} className={selectCls}>
                <option value="">—</option>
                {CATEGORY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelCls}>Property type</label>
              <select name="property_type" defaultValue={t.property_type ?? ''} className={selectCls}>
                <option value="">—</option>
                {PROPERTY_TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className={labelCls}>Location</label>
              <select name="area_id" defaultValue={t.area_id ?? ''} className={selectCls}>
                <option value="">—</option>
                {(areas ?? []).map((a: { id: string; name: string }) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelCls}>Developer</label>
              <select name="developer_id" defaultValue={t.developer_id ?? ''} className={selectCls}>
                <option value="">—</option>
                {(developers ?? []).map((d: { id: string; name: string }) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <label className={labelCls}>Purchase price</label>
              <input type="number" name="unit_price" min={0} step={1000} defaultValue={t.unit_price ?? ''} className={inputCls} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelCls}>Currency</label>
              <select name="currency" defaultValue={t.currency ?? 'AED'} className={selectCls}>
                <option value="AED">AED</option><option value="USD">USD</option>
              </select>
            </div>
          </div>

          <div>
            <button type="submit"
              className="h-10 px-5 rounded-lg bg-accent text-white text-[14px] font-semibold hover:opacity-90 transition-opacity">
              Save
            </button>
          </div>
        </form>
      </section>

      <p className="mt-8 text-[12px] text-text-tertiary">
        Payment terms follow the developer&rsquo;s plan for this project. Cashback amounts are computed
        internally once the developer&rsquo;s commission is received.
      </p>
    </div>
  )
}
