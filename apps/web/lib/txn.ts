// Transaction status pipeline + labels. Mirrors the txn_status enum.
// Cashback/commission figures are NOT part of this module — they are internal
// (projects.commission_pct etc.) and computed in the cashback engine (S6).

export const TXN_PIPELINE = [
  'reserved',
  'booked',
  'spa_signed',
  'oqood_registered',
  'under_construction',
  'handover',
  'title_transferred',
] as const

export const TXN_TERMINAL = ['cancelled', 'defaulted'] as const

export type TxnStatus = (typeof TXN_PIPELINE)[number] | (typeof TXN_TERMINAL)[number]

export const TXN_STATUS_LABEL: Record<string, string> = {
  reserved:           'Reserved',
  booked:             'Booked',
  spa_signed:         'SPA signed',
  oqood_registered:   'Oqood registered',
  under_construction: 'Under construction',
  handover:           'Handover',
  title_transferred:  'Title transferred',
  cancelled:          'Cancelled',
  defaulted:          'Defaulted',
}

export const TXN_TYPE_LABEL: Record<string, string> = {
  offplan_primary:    'Off-plan (primary)',
  offplan_assignment: 'Off-plan (assignment)',
  secondary_resale:   'Secondary resale',
}

export const ALL_TXN_STATUSES = [...TXN_PIPELINE, ...TXN_TERMINAL]

export function txnStatusIndex(status: string): number {
  return (TXN_PIPELINE as readonly string[]).indexOf(status)
}

export function isTerminal(status: string): boolean {
  return (TXN_TERMINAL as readonly string[]).includes(status)
}

export function money(amount: number | null | undefined, currency = 'AED'): string {
  if (amount == null) return '—'
  return `${currency} ${Number(amount).toLocaleString('en-US')}`
}
