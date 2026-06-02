'use client'

import { useFormStatus } from 'react-dom'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { sendMagicLink } from './actions'

function MagicSubmit() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" variant="secondary" size="lg" className="w-full" disabled={pending}>
      {pending ? 'Sending…' : 'Email me a link'}
    </Button>
  )
}

export function SignInForm() {
  const supabase = createClient()

  async function google() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${location.origin}/auth/callback` },
    })
  }

  return (
    <div className="mt-8 space-y-3">
      <Button onClick={google} size="lg" className="w-full">Continue with Google</Button>
      <div className="text-center text-[13px] text-text-tertiary">or</div>
      <form action={sendMagicLink} className="space-y-3">
        <input
          type="email" name="email" required
          placeholder="you@email.com"
          className="w-full h-11 px-4 rounded-md bg-surface-2 text-[17px] outline-none
            focus:ring-2 focus:ring-accent/40"
        />
        <MagicSubmit />
      </form>
    </div>
  )
}
