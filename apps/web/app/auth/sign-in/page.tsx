'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

export default function SignIn() {
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)

  async function google() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${location.origin}/auth/callback` },
    })
  }
  async function magic() {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${location.origin}/auth/callback` },
    })
    if (!error) setSent(true)
  }

  return (
    <main className="min-h-screen grid place-items-center px-6">
      <div className="w-full max-w-[360px]">
        <h1 className="text-[28px] font-semibold tracking-[-0.02em] text-center">
          <span className="text-accent">i</span>Close
        </h1>
        <p className="mt-2 text-[15px] text-text-secondary text-center">Sign in to continue. No spam, ever.</p>

        <div className="mt-8 space-y-3">
          <Button onClick={google} size="lg" className="w-full">Continue with Google</Button>
          <div className="text-center text-[13px] text-text-tertiary">or</div>
          {sent ? (
            <p className="text-[15px] text-success text-center">Check your email for the sign-in link.</p>
          ) : (
            <>
              <input
                type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
                className="w-full h-11 px-4 rounded-md bg-surface-2 text-[17px] outline-none"
              />
              <Button onClick={magic} variant="secondary" size="lg" className="w-full" disabled={!email}>
                Email me a link
              </Button>
            </>
          )}
        </div>
      </div>
    </main>
  )
}
