-- iClose — 0004: Row-Level Security (PRIMARY authz, ADR-008). Blueprint §49.3
alter table profiles enable row level security;
alter table profile_roles enable row level security;
alter table consents enable row level security;
alter table notification_prefs enable row level security;
alter table developers enable row level security;
alter table areas enable row level security;
alter table media enable row level security;
alter table projects enable row level security;
alter table units enable row level security;
alter table payment_plans enable row level security;
alter table project_media enable row level security;
alter table faqs enable row level security;
alter table content_pages enable row level security;
alter table saved_items enable row level security;
alter table leads enable row level security;
alter table lead_attribution enable row level security;
alter table lead_activities enable row level security;
alter table transactions enable row level security;
alter table transaction_milestones enable row level security;
alter table payment_schedule enable row level security;
alter table commissions enable row level security;
alter table cashback enable row level security;
alter table cashback_events enable row level security;
alter table audit_log enable row level security;
alter table events enable row level security;
alter table notifications enable row level security;
alter table feature_flags enable row level security;
alter table community_identities enable row level security;

-- IDENTITY
create policy profiles_select_own on profiles for select using (id = auth.uid() or is_staff());
create policy profiles_update_own on profiles for update using (id = auth.uid()) with check (id = auth.uid());
create policy roles_select_self_or_staff on profile_roles for select using (profile_id = auth.uid() or is_staff());
create policy roles_super_admin_write on profile_roles for all using (has_role('super_admin')) with check (has_role('super_admin'));
create policy consents_owner on consents for select using (profile_id = auth.uid() or is_staff());
create policy consents_insert_own on consents for insert with check (profile_id = auth.uid());
create policy notifprefs_owner_select on notification_prefs for select using (profile_id = auth.uid() or is_staff());
create policy notifprefs_owner_update on notification_prefs for update using (profile_id = auth.uid()) with check (profile_id = auth.uid());

-- CATALOG
create policy projects_public_read on projects for select using (status = 'published' and deleted_at is null);
create policy projects_staff_read_all on projects for select using (is_staff());
create policy projects_staff_write on projects for all using (is_staff()) with check (is_staff());
create policy developers_public_read on developers for select using (true);
create policy developers_staff_write on developers for all using (is_staff()) with check (is_staff());
create policy areas_public_read on areas for select using (true);
create policy areas_staff_write on areas for all using (is_staff()) with check (is_staff());
create policy media_public_read on media for select using (true);
create policy media_staff_write on media for all using (is_staff()) with check (is_staff());
create policy project_media_public_read on project_media for select using (true);
create policy project_media_staff_write on project_media for all using (is_staff()) with check (is_staff());
create policy faqs_public_read on faqs for select using (true);
create policy faqs_staff_write on faqs for all using (is_staff()) with check (is_staff());
create policy content_public_read on content_pages for select using (status = 'published');
create policy content_staff_read_all on content_pages for select using (is_staff());
create policy content_staff_write on content_pages for all using (is_staff()) with check (is_staff());
create policy units_auth_read on units for select using (auth.uid() is not null);
create policy units_staff_write on units for all using (is_staff()) with check (is_staff());
create policy plans_auth_read on payment_plans for select using (auth.uid() is not null);
create policy plans_staff_write on payment_plans for all using (is_staff()) with check (is_staff());

-- ENGAGEMENT
create policy saved_select_own on saved_items for select using (buyer_id = auth.uid());
create policy saved_insert_own on saved_items for insert with check (buyer_id = auth.uid());
create policy saved_delete_own on saved_items for delete using (buyer_id = auth.uid());

-- CRM / LEADS
create policy leads_buyer_read_own on leads for select using (buyer_id = auth.uid());
create policy leads_rm_read_assigned on leads for select using (assigned_rm = auth.uid());
create policy leads_ops_read_all on leads for select using (has_role('ops_manager') or has_role('super_admin'));
create policy leads_staff_write on leads for update using (is_staff()) with check (is_staff());
create policy lead_attr_staff on lead_attribution for all using (is_staff()) with check (is_staff());
create policy lead_acts_staff on lead_activities for all using (is_staff()) with check (is_staff());

-- TRANSACTIONS
create policy txn_buyer_read_own on transactions for select using (buyer_id = auth.uid());
create policy txn_staff_all on transactions for all using (is_staff()) with check (is_staff());
create policy txn_ms_buyer_read on transaction_milestones for select
  using (exists (select 1 from transactions t where t.id = transaction_id and t.buyer_id = auth.uid()));
create policy txn_ms_staff_all on transaction_milestones for all using (is_staff()) with check (is_staff());
create policy pay_sched_buyer_read on payment_schedule for select
  using (exists (select 1 from transactions t where t.id = transaction_id and t.buyer_id = auth.uid()));
create policy pay_sched_staff_all on payment_schedule for all using (is_staff()) with check (is_staff());

-- COMMISSION + CASHBACK
create policy commissions_staff on commissions for all
  using (has_role('finance') or has_role('ops_manager') or has_role('super_admin'))
  with check (has_role('finance') or has_role('ops_manager') or has_role('super_admin'));
create policy cashback_buyer_read_own on cashback for select using (buyer_id = auth.uid());
create policy cashback_finance_manage on cashback for all
  using (has_role('finance') or has_role('ops_manager') or has_role('super_admin'))
  with check (has_role('finance') or has_role('ops_manager') or has_role('super_admin'));

-- APPEND-ONLY (no update/delete policy => impossible)
create policy audit_insert on audit_log for insert with check (true);
create policy audit_read_staff on audit_log for select
  using (has_role('super_admin') or has_role('finance') or has_role('ops_manager'));
create policy cb_events_insert on cashback_events for insert with check (true);
create policy cb_events_read_staff on cashback_events for select using (is_staff());
create policy events_insert on events for insert with check (true);
create policy events_staff_read on events for select using (is_staff());

-- NOTIFICATIONS / FLAGS / COMMUNITY
create policy notif_owner_read on notifications for select using (profile_id = auth.uid() or is_staff());
create policy flags_read_all on feature_flags for select using (true);
create policy flags_staff_write on feature_flags for all using (has_role('super_admin') or has_role('ops_manager')) with check (has_role('super_admin') or has_role('ops_manager'));
create policy community_owner_all on community_identities for all using (profile_id = auth.uid()) with check (profile_id = auth.uid());
create policy community_auth_read on community_identities for select using (auth.uid() is not null);
