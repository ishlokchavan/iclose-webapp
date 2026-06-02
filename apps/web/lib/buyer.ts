// Buyer-facing option sets, shared between onboarding and profile editing.
export const BUDGET_BANDS = [
  { value: 'under_1m', label: 'Under AED 1M' },
  { value: '1m_2m',    label: 'AED 1M – 2M'  },
  { value: '2m_4m',    label: 'AED 2M – 4M'  },
  { value: '4m_8m',    label: 'AED 4M – 8M'  },
  { value: 'over_8m',  label: 'Over AED 8M'  },
] as const

export function budgetLabel(value: string | null | undefined): string | null {
  if (!value) return null
  return BUDGET_BANDS.find((b) => b.value === value)?.label ?? null
}
