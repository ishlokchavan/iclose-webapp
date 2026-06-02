// Simplified, cashback-first transaction model.
// The buyer mainly wants to know: did the purchase go through, are we waiting on
// the developer's commission, and has cashback been paid. We do NOT surface
// commission amounts or guarantee cashback here (internal + legal posture).

export const CASHBACK_STAGES = [
  'purchased',
  'awaiting_commission',
  'commission_received',
  'cashback_paid',
] as const

export const CASHBACK_TERMINAL = ['cancelled', 'not_eligible'] as const

export type CashbackStage = (typeof CASHBACK_STAGES)[number] | (typeof CASHBACK_TERMINAL)[number]

export const CASHBACK_LABEL: Record<string, string> = {
  purchased:            'Purchased',
  awaiting_commission:  'Awaiting developer commission',
  commission_received:  'Commission received',
  cashback_paid:        'Cashback paid',
  cancelled:            'Cancelled',
  not_eligible:         'Not eligible',
}

export const ALL_CASHBACK_STAGES = [...CASHBACK_STAGES, ...CASHBACK_TERMINAL]

export function cashbackStageIndex(stage: string): number {
  return (CASHBACK_STAGES as readonly string[]).indexOf(stage)
}

export function isCashbackTerminal(stage: string): boolean {
  return (CASHBACK_TERMINAL as readonly string[]).includes(stage)
}

// Unit detail picklists.
export const CATEGORY_OPTIONS = [
  { value: 'offplan',    label: 'Off-plan' },
  { value: 'ready',      label: 'Ready' },
  { value: 'commercial', label: 'Commercial' },
] as const

export const PROPERTY_TYPE_OPTIONS = [
  { value: 'apartment', label: 'Apartment' },
  { value: 'villa',     label: 'Villa' },
  { value: 'townhouse', label: 'Townhouse' },
  { value: 'penthouse', label: 'Penthouse' },
  { value: 'land',      label: 'Land' },
  { value: 'duplex',    label: 'Duplex' },
] as const

export const labelOf = (
  opts: readonly { value: string; label: string }[],
  value: string | null | undefined,
): string | null => (value ? (opts.find((o) => o.value === value)?.label ?? value) : null)

export function money(amount: number | null | undefined, currency = 'AED'): string {
  if (amount == null) return '—'
  return `${currency} ${Number(amount).toLocaleString('en-US')}`
}
