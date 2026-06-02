import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { OnboardingForm } from './onboarding-form'
import { completeOnboarding } from './actions'

export default async function Onboarding() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/sign-in')

  // Skip if already completed
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, phone, onboarding_completed')
    .eq('id', user.id)
    .maybeSingle()
  if (profile?.onboarding_completed) redirect('/app/explore')

  // Load areas for the multi-select
  const { data: areas } = await supabase
    .from('areas')
    .select('id, name')
    .order('name', { ascending: true })

  return (
    <div className="max-w-[560px] mx-auto pt-4">
      <h1 className="text-[28px] font-semibold tracking-[-0.02em]">Welcome to iClose</h1>
      <p className="mt-2 text-[15px] text-text-secondary">
        A few quick details so your relationship manager can give you the most relevant advice.
      </p>

      <div className="mt-8">
        <OnboardingForm
          action={completeOnboarding}
          defaultName={(profile as { full_name?: string } | null)?.full_name ?? ''}
          defaultPhone={(profile as { phone?: string } | null)?.phone ?? ''}
          areas={(areas ?? []) as { id: string; name: string }[]}
        />
      </div>

      <p className="mt-6 text-[12px] text-text-tertiary text-center">
        You can update these details any time from My iClose.
      </p>
    </div>
  )
}
