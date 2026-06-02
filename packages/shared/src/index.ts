// Shared, framework-agnostic types & constants (mirror DB enums where useful).
export const CASHBACK_STATUS = [
  'not_eligible','eligible','pending_commission','commission_received','approved',
  'clearing_window','payable','paid','reconciled','cancelled','clawed_back','recovery','on_hold',
] as const
export type CashbackStatus = (typeof CASHBACK_STATUS)[number]

export const LEAD_STATUS = [
  'new','qualifying','qualified','disqualified','assigned','advising',
  'shortlisted','ready_to_book','attribution_locked','converted','nurturing','dormant',
] as const
export type LeadStatus = (typeof LEAD_STATUS)[number]

export const STAFF_ROLES = ['rm','ops_manager','finance','super_admin'] as const
