import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProfileForm } from './profile-form'
import { updateProfile } from './actions'
import { budgetLabel } from '@/lib/buyer'

export const dynamic = 'force-dynamic'

type Rel<T> = T | T[] | null
const one = <T,>(rel: Rel<T>): T | null =>
  !rel ? null : Array.isArray(rel) ? (rel[0] ?? null) : rel

const fmtStatus = (s: string) =>
  s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

export default async function Me() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/sign-in')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email, phone, budget_band, preferred_areas')
    .eq('id', user.id)
    .maybeSingle()

  const { data: areas } = await supabase
    .from('areas').select('id, name').order('name', { ascending: true })

  const { data: leadsData } = await supabase
    .from('leads')
    .select('id, status, unit_type, created_at, project:projects(name, slug)')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  type Lead = {
    id: string; status: string; unit_type: string | null; created_at: string
    project: Rel<{ name: string; slug: string }>
  }
  const leads = (leadsData ?? []) as unknown as Lead[]
  const preferredAreaIds = (profile?.preferred_areas as string[] | null) ?? []
  const budget = budgetLabel(profile?.budget_band as string | null)

  async function signOut() {
    'use server'
    const sb = await createClient()
    await sb.auth.signOut()
    redirect('/')
  }

  return (
    <div className="max-w-[640px]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-semibold tracking-[-0.02em]">My iClose</h1>
          <p className="mt-1 text-[15px] text-text-secondary">
            {profile?.email ?? user.email}
          </p>
        </div>
        <form action={signOut}>
          <button className="text-[14px] text-text-secondary hover:text-text h-9 px-3 rounded-lg hover:bg-surface-2 transition-colors">
            Sign out
          </button>
        </form>
      </div>

      {/* Quick summary */}
      <div className="mt-6 flex flex-wrap gap-3">
        {budget && (
          <span className="rounded-pill bg-surface-2 text-[13px] px-3 py-1.5">Budget: {budget}</span>
        )}
        <span className="rounded-pill bg-surface-2 text-[13px] px-3 py-1.5">
          {preferredAreaIds.length} preferred {preferredAreaIds.length === 1 ? 'area' : 'areas'}
        </span>
        <span className="rounded-pill bg-surface-2 text-[13px] px-3 py-1.5">
          {leads.length} {leads.length === 1 ? 'enquiry' : 'enquiries'}
        </span>
      </div>

      {/* Enquiry history */}
      <section className="mt-10">
        <h2 className="text-[20px] font-semibold mb-4">Your enquiries</h2>
        {leads.length === 0 ? (
          <div className="rounded-2xl bg-surface-2 p-6 text-center">
            <p className="text-[15px] text-text-secondary">
              You haven&apos;t enquired about any projects yet.
            </p>
            <Link href="/app/explore"
              className="mt-2 inline-block text-[15px] font-medium text-accent hover:opacity-80">
              Explore projects
            </Link>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-separator">
            {leads.map((lead, i) => {
              const project = one(lead.project)
              return (
                <div key={lead.id}
                  className={`flex items-center justify-between gap-3 p-4 ${
                    i > 0 ? 'border-t border-separator' : ''
                  }`}
                >
                  <div className="min-w-0">
                    {project ? (
                      <Link href={`/app/explore/${project.slug}`}
                        className="text-[15px] font-semibold hover:text-accent transition-colors">
                        {project.name}
                      </Link>
                    ) : (
                      <span className="text-[15px] font-semibold">Project</span>
                    )}
                    <p className="mt-0.5 text-[12px] text-text-tertiary">
                      {fmtDate(lead.created_at)}{lead.unit_type ? ` · ${lead.unit_type}` : ''}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-pill bg-surface-2 text-[12px] font-semibold px-3 py-1">
                    {fmtStatus(lead.status)}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* Edit details */}
      <section className="mt-10 pt-8 border-t border-separator">
        <h2 className="text-[20px] font-semibold mb-4">Your details</h2>
        <ProfileForm
          action={updateProfile}
          defaultName={(profile?.full_name as string | null) ?? ''}
          defaultPhone={(profile?.phone as string | null) ?? ''}
          defaultBudget={(profile?.budget_band as string | null) ?? ''}
          defaultAreaIds={preferredAreaIds}
          areas={(areas ?? []) as { id: string; name: string }[]}
        />
      </section>
    </div>
  )
}
