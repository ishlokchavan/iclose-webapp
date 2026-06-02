-- iClose — 0003: functions + triggers. Blueprint §33 / §49.2
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create trigger trg_profiles_updated    before update on profiles               for each row execute function public.set_updated_at();
create trigger trg_developers_updated  before update on developers             for each row execute function public.set_updated_at();
create trigger trg_areas_updated       before update on areas                  for each row execute function public.set_updated_at();
create trigger trg_projects_updated    before update on projects               for each row execute function public.set_updated_at();
create trigger trg_units_updated       before update on units                  for each row execute function public.set_updated_at();
create trigger trg_content_updated     before update on content_pages          for each row execute function public.set_updated_at();
create trigger trg_notifprefs_updated  before update on notification_prefs     for each row execute function public.set_updated_at();
create trigger trg_txn_updated         before update on transactions           for each row execute function public.set_updated_at();
create trigger trg_txnms_updated       before update on transaction_milestones for each row execute function public.set_updated_at();
create trigger trg_commissions_updated before update on commissions            for each row execute function public.set_updated_at();
create trigger trg_cashback_updated    before update on cashback               for each row execute function public.set_updated_at();
create trigger trg_flags_updated       before update on feature_flags          for each row execute function public.set_updated_at();

create or replace function public.projects_search_tsv()
returns trigger language plpgsql as $$
begin
  new.search_tsv :=
    setweight(to_tsvector('simple', coalesce(new.name,'')), 'A') ||
    setweight(to_tsvector('simple', coalesce(new.description,'')), 'C');
  return new;
end; $$;
create trigger trg_projects_tsv before insert or update on projects
  for each row execute function public.projects_search_tsv();

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (new.id, new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url')
  on conflict (id) do nothing;
  insert into public.profile_roles (profile_id, role) values (new.id, 'buyer') on conflict do nothing;
  insert into public.notification_prefs (profile_id) values (new.id) on conflict do nothing;
  return new;
end; $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.has_role(target user_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profile_roles pr where pr.profile_id = auth.uid() and pr.role = target);
$$;
create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profile_roles pr
    where pr.profile_id = auth.uid() and pr.role in ('rm','ops_manager','finance','super_admin'));
$$;
