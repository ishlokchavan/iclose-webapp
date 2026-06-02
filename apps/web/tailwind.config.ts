import type { Config } from 'tailwindcss'

// Tailwind reads the semantic CSS variables from globals.css (the brand token layer).
// Rule (brand §13): reference tokens, never raw hex, in feature code.
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        accent: 'var(--accent)',
        'accent-press': 'var(--accent-press)',
        'accent-soft': 'var(--accent-soft)',
        success: 'var(--success)',
        warning: 'var(--warning)',
        danger: 'var(--danger)',
        surface: 'var(--surface)',
        'surface-2': 'var(--surface-2)',
        'surface-3': 'var(--surface-3)',
        text: 'var(--text)',
        'text-secondary': 'var(--text-secondary)',
        'text-tertiary': 'var(--text-tertiary)',
        separator: 'var(--separator)',
        'text-on-accent': 'var(--text-on-accent)',
      },
      borderRadius: {
        xs: '6px', sm: '8px', md: '12px', lg: '16px', xl: '20px', '2xl': '28px', pill: '980px',
      },
      spacing: {
        1: '4px', 2: '8px', 3: '16px', 4: '24px', 6: '32px', 8: '48px', 16: '96px', 32: '128px',
      },
      boxShadow: {
        1: 'var(--shadow-1)', 2: 'var(--shadow-2)', 3: 'var(--shadow-3)', 4: 'var(--shadow-4)',
      },
      fontFamily: { sans: 'var(--font-sans)' },
      screens: { sm: '480px', md: '768px', lg: '1024px', xl: '1280px', '2xl': '1536px' },
      transitionTimingFunction: { standard: 'cubic-bezier(.2,.7,.2,1)' },
    },
  },
  plugins: [],
}
export default config
