import Link from 'next/link'
import { Button } from '@/components/ui/button'

const steps = [
  ['Browse every project, honestly', 'See real availability, payment plans, and balanced pros and cons — not sales hype.'],
  ['Get one dedicated advisor', 'A single relationship manager helps you decide. No commission pressure, because you are not paying it.'],
  ['Buy through iClose', 'We register your purchase with the developer and handle the process to handover.'],
  ['Get your cashback', 'When the developer settles, the commission comes back to you — confirmed in writing before you sign.'],
]

export default function HowItWorks() {
  return (
    <main className="min-h-screen px-6 md:px-16 max-w-[800px] mx-auto pt-16 pb-32">
      <Link href="/" className="text-accent text-[15px]">&larr; iClose</Link>
      <h1 className="mt-6 text-[34px] md:text-[44px] font-semibold tracking-[-0.02em]">From sign-up to keys.</h1>
      <p className="mt-4 text-[17px] text-text-secondary">In your favour at every stage. Here is the whole model — there is no catch.</p>
      <ol className="mt-12 space-y-8">
        {steps.map(([t, d], i) => (
          <li key={t} className="flex gap-5">
            <span className="shrink-0 h-9 w-9 rounded-pill bg-accent-soft text-accent grid place-items-center font-semibold">{i + 1}</span>
            <div>
              <h2 className="text-[20px] font-semibold">{t}</h2>
              <p className="mt-1 text-[16px] text-text-secondary">{d}</p>
            </div>
          </li>
        ))}
      </ol>
      <div className="mt-12"><Link href="/auth/sign-in"><Button size="lg">Get started</Button></Link></div>
    </main>
  )
}
