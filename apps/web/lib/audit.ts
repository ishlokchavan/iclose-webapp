import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'

type AuditEntry = {
  actorId: string | null
  action: string
  entityType: string
  entityId?: string | null
  before?: Record<string, unknown> | null
  after?: Record<string, unknown> | null
}

// Append-only audit trail. Never throws — auditing must not break the action.
export async function recordAudit(supabase: SupabaseClient, e: AuditEntry): Promise<void> {
  try {
    await supabase.from('audit_log').insert({
      actor_id:    e.actorId,
      action:      e.action,
      entity_type: e.entityType,
      entity_id:   e.entityId ?? null,
      before:      e.before ?? null,
      after:       e.after ?? null,
    })
  } catch (err) {
    console.error('[audit] write failed', err)
  }
}
