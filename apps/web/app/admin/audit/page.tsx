import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const CAN_READ = ['super_admin', 'finance', 'ops_manager']

type Rel<T> = T | T[] | null
const one = <T,>(rel: Rel<T>): T | null =>
  !rel ? null : Array.isArray(rel) ? (rel[0] ?? null) : rel

const ACTION_LABEL: Record<string, string> = {
  'lead.status_change': 'changed lead status',
  'lead.assign':        'assigned a lead',
  'lead.unassign':      'unassigned a lead',
  'project.publish':    'published a project',
  'project.unpublish':  'unpublished a project',
  'project.archive':    'archived a project',
  'role.grant':         'granted a role',
  'role.revoke':        'revoked a role',
  'user.invite':        'invited a teammate',
  'user.delete':        'deleted a user',
}

// Subtle colour by action family (dots only — keeps to the one-accent rule).
const ACTION_DOT: Record<string, string> = {
  project: 'bg-accent',
  lead:    'bg-warning',
  role:    'bg-text-tertiary',
  user:    'bg-danger',
}

function fmt(iso: string) {
  return new Date(iso).toLocaleString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

function detail(action: string, before: Record<string, unknown> | null, after: Record<string, unknown> | null): string | null {
  if (action === 'lead.status_change' && after?.status) return `→ ${String(after.status).replace(/_/g, ' ')}`
  if (action.startsWith('role.'))   return (after?.role ?? before?.role) ? String(after?.role ?? before?.role) : null
  if (action === 'user.invite')     return [after?.email, after?.role].filter(Boolean).join(' · ') || null
  if (action === 'user.delete')     return before?.email ? String(before.email) : null
  if (action === 'lead.assign' && after?.assigned_rm) return 'assigned'
  return null
}

export default async function AdminAudit() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: myRoles } = user
    ? await supabase.from('profile_roles').select('role').eq('profile_id', user.id)
    : { data: [] }
  const canRead = (myRoles ?? []).some((r: { role: string }) => CAN_READ.includes(r.role))

  if (!canRead) {
    return (
      <div>
        <h1 className="text-[28px] font-semibold tracking-[-0.02em]">Audit log</h1>
        <div className="mt-8 rounded-2xl bg-surface-2 p-8 text-center">
          <p className="text-[15px] text-text-secondary">
            The audit log is available to operations, finance, and super admins only.
          </p>
        </div>
      </div>
    )
  }

  const { data, error } = await supabase
    .from('audit_log')
    .select('id, action, entity_type, entity_id, before, after, created_at, actor:profiles!audit_log_actor_id_fkey(full_name, email)')
    .order('created_at', { ascending: false })
    .limit(200)

  type Row = {
    id: number
    action: string
    entity_type: string | null
    entity_id: string | null
    before: Record<string, unknown> | null
    after: Record<string, unknown> | null
    created_at: string
    actor: Rel<{ full_name: string | null; email: string | null }>
  }
  const rows = (data ?? []) as unknown as Row[]

  return (
    <div className="max-w-[820px]">
      <h1 className="text-[28px] font-semibold tracking-[-0.02em]">Audit log</h1>
      <p className="mt-2 text-[15px] text-text-secondary">
        Every state change on the platform — who did what, when. Append-only.
      </p>

      {error && (
        <p className="mt-8 text-[15px] text-danger">Could not load the audit log: {error.message}</p>
      )}

      {!error && rows.length === 0 && (
        <div className="mt-12 rounded-2xl bg-surface-2 p-8 text-center">
          <p className="text-[15px] text-text-secondary">No activity recorded yet.</p>
        </div>
      )}

      {rows.length > 0 && (
        <div className="mt-8 flex flex-col">
          {rows.map((row, i) => {
            const actor = one(row.actor)
            const who   = actor?.full_name ?? actor?.email ?? 'System'
            const verb  = ACTION_LABEL[row.action] ?? row.action
            const dot   = ACTION_DOT[row.action.split('.')[0]] ?? 'bg-text-tertiary'
            const det   = detail(row.action, row.before, row.after)
            return (
              <div key={row.id}
                className={`flex gap-3 py-3.5 ${i > 0 ? 'border-t border-separator' : ''}`}>
                <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${dot}`} />
                <div className="min-w-0 flex-1">
                  <p className="text-[14px]">
                    <span className="font-semibold">{who}</span>
                    <span className="text-text-secondary"> {verb}</span>
                    {det && <span className="text-text-secondary"> · {det}</span>}
                  </p>
                  <p className="mt-0.5 text-[12px] text-text-tertiary">
                    {fmt(row.created_at)}
                    {row.entity_type ? ` · ${row.entity_type}` : ''}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
