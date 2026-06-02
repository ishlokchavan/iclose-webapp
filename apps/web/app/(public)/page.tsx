import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function Home() {
  return (
    <main className="min-h-screen">
      <header className="flex items-center justify-between px-6 md:px-16 h-16">
        <span className="text-[20px] font-semibold tracking-tight">
          <span className="text-accent">i</span>Close
        </span>
        <Link href="/auth/sign-in"><Button variant="tinted" size="sm">Sign in</Button></Link>
      </header>

      <section className="px-6 md:px-16 pt-16 md:pt-32 max-w-[1120px] mx-auto">
        <p className="text-accent text-[15px] font-semibold mb-4">Dubai &amp; UAE Real Estate</p>
        <h1 className="text-[40px] md:text-[72px] leading-[1.05] font-semibold tracking-[-0.03em] max-w-[18ch]">
          Buy Dubai property without paying agent commission.
        </h1>
        <p className="mt-6 text-[17px] md:text-[20px] text-text-secondary max-w-[60ch]">
          You pay zero. The whole commission comes back to you as cashback — confirmed in writing before you sign.
        </p>
        <div className="mt-8 flex gap-3">
          <Link href="/auth/sign-in"><Button size="lg">Get started</Button></Link>
          <Link href="/how-it-works"><Button variant="secondary" size="lg">How it works</Button></Link>
        </div>

        <div className="mt-16 grid gap-4 md:grid-cols-3 pb-32">
          {[
            ['Zero commission', 'You never pay brokerage. Ever.'],
            ['100% cashback', 'The commission is returned to you, in writing.'],
            ['One honest advisor', 'No spam, no swarm of agents. Every project in one place.'],
          ].map(([t, d]) => (
            <div key={t} className="rounded-2xl bg-surface-2 p-6 shadow-1">
              <h3 className="text-[17px] font-semibold">{t}</h3>
              <p className="mt-2 text-[15px] text-text-secondary">{d}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
