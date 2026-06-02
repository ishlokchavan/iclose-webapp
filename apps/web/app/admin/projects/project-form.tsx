'use client'

import { useFormStatus } from 'react-dom'
import { useState, useEffect } from 'react'

export type ProjectDefaults = {
  name?: string
  slug?: string
  developer_id?: string
  area_id?: string
  description?: string
  handover_quarter?: string
  price_from?: string
  price_to?: string
  currency?: string
  availability?: string
  est_yield_pct?: string
  commission_pct?: string
  cashback_payout_pct?: string
  cashback_floor?: string
}

type Lookup = { id: string; name: string }

type Props = {
  defaults?: ProjectDefaults
  developers: Lookup[]
  areas: Lookup[]
  slugLocked?: boolean // true when editing an existing project
}

const inputCls =
  'w-full h-10 px-3 rounded-lg bg-surface-2 text-[14px] outline-none ' +
  'focus:ring-2 focus:ring-accent/40 placeholder:text-text-tertiary'
const labelCls = 'text-[12px] font-medium text-text-secondary'

function toSlug(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80)
}

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending}
      className="h-10 px-5 rounded-lg bg-accent text-white text-[14px] font-semibold
        hover:opacity-90 disabled:opacity-50 transition-opacity">
      {pending ? 'Saving…' : label}
    </button>
  )
}

export function ProjectForm({ defaults = {}, developers, areas, slugLocked = false }: Props) {
  const [name, setName]         = useState(defaults.name ?? '')
  const [slug, setSlug]         = useState(defaults.slug ?? '')
  const [slugTouched, setSlugTouched] = useState(slugLocked)

  useEffect(() => {
    if (!slugTouched) setSlug(toSlug(name))
  }, [name, slugTouched])

  return (
    <div className="flex flex-col gap-8">

      {/* ── Details ── */}
      <section>
        <h3 className="text-[15px] font-semibold mb-4">Details</h3>
        <div className="flex flex-col gap-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className={labelCls}>Project name *</label>
              <input name="name" required value={name} onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Emaar Beachfront" className={inputCls} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelCls}>Slug (URL path) *</label>
              <input name="slug" required value={slug}
                readOnly={slugLocked}
                onChange={(e) => { setSlugTouched(true); setSlug(e.target.value) }}
                placeholder="emaar-beachfront"
                className={inputCls + (slugLocked ? ' opacity-50 cursor-not-allowed' : '')} />
              {slugLocked && (
                <p className="text-[11px] text-text-tertiary">Slug is locked on published projects to preserve URLs.</p>
              )}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className={labelCls}>Developer</label>
              <select name="developer_id" defaultValue={defaults.developer_id ?? ''}
                className={inputCls + ' cursor-pointer appearance-none'}>
                <option value="">— select —</option>
                {developers.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelCls}>Area</label>
              <select name="area_id" defaultValue={defaults.area_id ?? ''}
                className={inputCls + ' cursor-pointer appearance-none'}>
                <option value="">— select —</option>
                {areas.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>Description</label>
            <textarea name="description" rows={4} defaultValue={defaults.description ?? ''}
              placeholder="Project overview shown on the detail page…"
              className="w-full px-3 py-2.5 rounded-lg bg-surface-2 text-[14px] resize-none outline-none
                focus:ring-2 focus:ring-accent/40 placeholder:text-text-tertiary" />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className={labelCls}>Handover quarter</label>
              <input name="handover_quarter" defaultValue={defaults.handover_quarter ?? ''}
                placeholder="e.g. Q4 2027" className={inputCls} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelCls}>Availability</label>
              <select name="availability" defaultValue={defaults.availability ?? 'available'}
                className={inputCls + ' cursor-pointer appearance-none'}>
                <option value="available">Available</option>
                <option value="limited">Limited</option>
                <option value="coming_soon">Coming soon</option>
                <option value="sold_out">Sold out</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section className="pt-6 border-t border-separator">
        <h3 className="text-[15px] font-semibold mb-4">Pricing</h3>
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>Price from</label>
            <input type="number" name="price_from" min={0} step={1000}
              defaultValue={defaults.price_from ?? ''}
              placeholder="1500000" className={inputCls} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>Price to</label>
            <input type="number" name="price_to" min={0} step={1000}
              defaultValue={defaults.price_to ?? ''}
              placeholder="optional" className={inputCls} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>Currency</label>
            <select name="currency" defaultValue={defaults.currency ?? 'AED'}
              className={inputCls + ' cursor-pointer appearance-none'}>
              <option value="AED">AED</option>
              <option value="USD">USD</option>
            </select>
          </div>
        </div>
        <div className="mt-4 max-w-[160px]">
          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>Est. rental yield %</label>
            <input type="number" name="est_yield_pct" min={0} max={20} step={0.1}
              defaultValue={defaults.est_yield_pct ?? ''}
              placeholder="6.5" className={inputCls} />
          </div>
        </div>
      </section>

      {/* ── Commission (internal) ── */}
      <section className="pt-6 border-t border-separator">
        <h3 className="text-[15px] font-semibold mb-1">Commission <span className="text-text-tertiary font-normal">(internal — never buyer-visible)</span></h3>
        <p className="text-[12px] text-text-tertiary mb-4">Pre-VAT, pre-Corporate-Tax. See Blueprint §13.</p>
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>Developer commission %</label>
            <input type="number" name="commission_pct" min={0} max={20} step={0.25}
              defaultValue={defaults.commission_pct ?? ''}
              placeholder="4.0" className={inputCls} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>Cashback payout %</label>
            <input type="number" name="cashback_payout_pct" min={0} max={100} step={1}
              defaultValue={defaults.cashback_payout_pct ?? ''}
              placeholder="50" className={inputCls} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>Cashback floor (AED)</label>
            <input type="number" name="cashback_floor" min={0} step={1000}
              defaultValue={defaults.cashback_floor ?? '0'}
              placeholder="0" className={inputCls} />
          </div>
        </div>
      </section>

      <div>
        <Submit label={slugLocked ? 'Save changes' : 'Create project'} />
      </div>
    </div>
  )
}
