import Link from 'next/link'
import { SignInForm } from './sign-in-form'

const ERRORS: Record<string, string> = {
  email: 'Enter a valid email address.',
  send:  'Could not send the link. Please try again.',
  link:  'That link has expired or was already used. Request a new one.',
  auth:  'Sign-in failed. Please try again.',
}

export default function SignIn({
  searchParams,
}: {
  searchParams: { sent?: string; error?: string }
}) {
  const sent  = searchParams.sent ? decodeURIComponent(searchParams.sent) : null
  const error = searchParams.error ? (ERRORS[searchParams.error] ?? 'Something went wrong.') : null

  return (
    <main className="min-h-screen grid place-items-center px-6">
      <div className="w-full max-w-[360px]">
        <h1 className="text-[28px] font-semibold tracking-[-0.02em] text-center">
          <span className="text-accent">i</span>Close
        </h1>
        <p className="mt-2 text-[15px] text-text-secondary text-center">
          Sign in to continue. No spam, ever.
        </p>

        {error && (
          <p className="mt-6 rounded-lg bg-danger/10 text-danger px-4 py-3 text-[14px] text-center">
            {error}
          </p>
        )}

        {sent ? (
          <div className="mt-8 rounded-xl bg-accent-soft px-5 py-6 text-center">
            <p className="text-[15px] text-accent font-medium">Check your email</p>
            <p className="mt-1 text-[14px] text-text-secondary">
              We sent a sign-in link to <strong>{sent}</strong>.
            </p>
            <Link href="/auth/sign-in"
              className="mt-4 inline-block text-[13px] text-text-secondary hover:text-text transition-colors">
              Use a different email
            </Link>
          </div>
        ) : (
          <SignInForm />
        )}
      </div>
    </main>
  )
}
