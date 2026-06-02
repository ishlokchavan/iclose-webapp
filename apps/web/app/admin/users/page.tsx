import { createClient } from '@/lib/supabase/server'
import { RoleControls } from './role-controls'

export const dynamic = 'force-dynamic'

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default async function AdminUsers() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  // Check if current user is super_admin (for role management controls)
  const { data: myRoles } = user
    ? await supabase.from('profile_roles').select('role').eq('profile_id', user.id)
    : { data: [] }
  const isSuperAdmin = (myRoles ?? []).some((r: { role: string }) => r.role === 'super_admin')

  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, email, phone, created_at, profile_roles!profile_roles_profile_id_fkey(role)')
    .order('created_at', { ascending: false })

  type ProfileRow = {
    id: string
    full_name: string | null
    email: string | null
    phone: string | null
    created_at: string
    profile_roles: { role: string }[]
  }
  const profiles = (data ?? []) as unknown as ProfileRow[]

  const counts = {
    total:  profiles.length,
    buyers: profiles.filter((p) => p.profile_roles.some((r) => r.role === 'buyer' && p.profile_roles.length === 1)).length,
    staff:  profiles.filter((p) => p.profile_roles.some((r) => ['rm','ops_manager','finance','super_admin'].includes(r.role))).length,
  }

  return (
    <div>
      <h1 className="text-[28px] font-semibold tracking-[-0.02em]">Users</h1>
      <p className="mt-2 text-[15px] text-text-secondary">
        Everyone who has signed up. Only super admins can grant or revoke staff roles.
      </p>

      <div className="mt-6 flex flex-wrap gap-4">
        {[
          ['Total', counts.total],
          ['Buyers', counts.buyers],
          ['Staff', counts.staff],
        ].map(([label, count]) => (
          <div key={label} className="rounded-xl bg-surface-2 px-5 py-4 min-w-[90px]">
            <p className="text-[12px] font-medium text-text-tertiary uppercase tracking-wide">{label}</p>
            <p className="mt-1 text-[24px] font-semibold tabular-nums">{count}</p>
          </div>
        ))}
      </div>

      {error && (
        <p className="mt-8 text-[15px] text-danger">Could not load users: {error.message}</p>
      )}

      {!error && profiles.length === 0 && (
        <div className="mt-12 rounded-2xl bg-surface-2 p-8 text-center">
          <p className="text-[17px] font-semibold">No users yet</p>
        </div>
      )}

      {profiles.length > 0 && (
        <div className="mt-8 overflow-hidden rounded-2xl border border-separator">
          {profiles.map((p, i) => {
            const roles = p.profile_roles.map((r) => r.role)
            return (
              <div key={p.id}
                className={`flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between ${
                  i > 0 ? 'border-t border-separator' : ''
                }`}
              >
                <div className="min-w-0">
                  <p className="text-[15px] font-semibold truncate">
                    {p.full_name ?? p.email ?? 'Unknown'}
                  </p>
                  <p className="mt-0.5 text-[13px] text-text-secondary">
                    {p.email ?? '—'}
                    {p.phone ? ` · ${p.phone}` : ''}
                  </p>
                  <p className="mt-0.5 text-[12px] text-text-tertiary">
                    Joined {fmt(p.created_at)}
                  </p>
                </div>
                <div className="shrink-0">
                  <RoleControls
                    profileId={p.id}
                    currentRoles={roles}
                    canManage={isSuperAdmin}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
