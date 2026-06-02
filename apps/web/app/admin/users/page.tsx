import { createClient } from '@/lib/supabase/server'
import { RoleControls } from './role-controls'
import { InviteForm } from './invite-form'
import { DeleteUser } from './delete-user'

export const dynamic = 'force-dynamic'

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

const INVITE_ERRORS: Record<string, string> = {
  forbidden: 'Only super admins can invite teammates.',
  email:     'Enter a valid email address.',
  role:      'Choose a valid role.',
  create:    'Could not create the account. The email may already be in use.',
}

export default async function AdminUsers({
  searchParams,
}: {
  searchParams: {
    invited?: string; mode?: string; invite_error?: string; email_failed?: string; t?: string
    deleted?: string; delete_error?: string
  }
}) {
  const supabase = await createClient()

  const invitedEmail = searchParams.invited ? decodeURIComponent(searchParams.invited) : null
  const inviteMode   = searchParams.mode ?? null
  const inviteError  = searchParams.invite_error ? (INVITE_ERRORS[searchParams.invite_error] ?? 'Invite failed.') : null
  const emailFailed  = searchParams.email_failed
    ? decodeURIComponent(searchParams.email_failed)
    : null
  // Changes on every submit so the uncontrolled invite form remounts (clears).
  const formKey = searchParams.t ?? 'idle'

  const deleted = searchParams.deleted === '1'
  const rawDeleteErr = searchParams.delete_error ? decodeURIComponent(searchParams.delete_error) : null
  const deleteError = !rawDeleteErr ? null
    : rawDeleteErr === 'self'      ? 'You can’t delete your own account.'
    : rawDeleteErr === 'forbidden' ? 'Only super admins can delete users.'
    : /foreign key|violates/i.test(rawDeleteErr)
      ? 'Can’t delete this user — they have linked records (lead activity, audit history, or transactions). Revoke their roles instead.'
      : `Delete failed: ${rawDeleteErr}`

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

      {/* Invite result banner */}
      {invitedEmail && !emailFailed && (
        <div className="mt-6 rounded-xl bg-accent-soft text-accent px-4 py-3 text-[14px]">
          {inviteMode === 'existing'
            ? <>That account already existed — <strong>{invitedEmail}</strong> has been granted the role and notified.</>
            : <>Invite sent to <strong>{invitedEmail}</strong> via Brevo. They&rsquo;ll activate their account from the email.</>}
        </div>
      )}
      {invitedEmail && emailFailed && (
        <div className="mt-6 rounded-xl bg-warning/10 text-warning px-4 py-3 text-[14px]">
          <p className="font-semibold">
            {inviteMode === 'existing'
              ? <>Role granted to {invitedEmail}, but the notification email didn&rsquo;t send.</>
              : <>Account created for {invitedEmail} and the role was granted, but the invite email didn&rsquo;t send.</>}
          </p>
          <p className="mt-1 opacity-90">Brevo error: {emailFailed}</p>
          <p className="mt-1 opacity-90">
            Set <code className="font-mono">BREVO_SMTP_USER</code>, <code className="font-mono">BREVO_SMTP_KEY</code> and a
            verified <code className="font-mono">BREVO_FROM</code> in Vercel, then redeploy. Until then no emails
            (including sign-in links) will send.
          </p>
        </div>
      )}
      {inviteError && (
        <div className="mt-6 rounded-xl bg-danger/10 text-danger px-4 py-3 text-[14px]">{inviteError}</div>
      )}

      {/* Delete result banner */}
      {deleted && (
        <div className="mt-6 rounded-xl bg-accent-soft text-accent px-4 py-3 text-[14px]">
          User deleted.
        </div>
      )}
      {deleteError && (
        <div className="mt-6 rounded-xl bg-danger/10 text-danger px-4 py-3 text-[14px]">{deleteError}</div>
      )}

      {/* Invite teammate (super admins only) */}
      {isSuperAdmin && (
        <section className="mt-8">
          <h2 className="text-[15px] font-semibold mb-3">Invite a teammate</h2>
          <InviteForm key={formKey} />
        </section>
      )}

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
                <div className="shrink-0 flex items-center gap-4">
                  <RoleControls
                    profileId={p.id}
                    currentRoles={roles}
                    canManage={isSuperAdmin}
                  />
                  {isSuperAdmin && user && p.id !== user.id && (
                    <DeleteUser profileId={p.id} label={p.full_name ?? p.email ?? 'this user'} />
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
