import * as React from 'react'

type Variant = 'primary' | 'secondary' | 'tinted' | 'plain' | 'destructive'
type Size = 'sm' | 'md' | 'lg'

const base =
  'inline-flex items-center justify-center font-medium rounded-pill transition-transform ' +
  'duration-[150ms] ease-standard active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none'

const variants: Record<Variant, string> = {
  primary: 'bg-accent text-text-on-accent hover:bg-accent-press',
  secondary: 'bg-surface-2 text-text hover:bg-surface-3',
  tinted: 'bg-accent-soft text-accent',
  plain: 'bg-transparent text-accent hover:opacity-80',
  destructive: 'bg-danger text-white',
}
const sizes: Record<Size, string> = {
  sm: 'h-9 px-4 text-[15px]',
  md: 'h-11 px-6 text-[17px]',
  lg: 'h-[52px] px-8 text-[17px]',
}

export function Button(
  { variant = 'primary', size = 'md', className = '', ...props }:
  React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }
) {
  return <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...props} />
}
