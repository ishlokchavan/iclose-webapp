-- iClose — 0002: core schema (all tables). Blueprint §33.3–§33.10

-- IDENTITY & PROFILE
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text, email text, phone text, avatar_url text,
  buyer_type text, budget_band text, preferred_areas uuid[] default '{}',
  theme_pref text default 'system', onboarding_completed boolean default false,
  created_at timestamptz default now(), updated_at timestamptz default now(), deleted_at timestamptz
);
create table profile_roles (
  profile_id uuid references profiles(id) on delete cascade,
  role user_role not null, granted_by uuid references profiles(id),
  granted_at timestamptz default now(), primary key (profile_id, role)
);
create table consents (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) on delete cascade,
  consent_type text not null, granted boolean not null, version text not null,
  source text, created_at timestamptz default now()
);
create index consents_lookup_idx on consents (profile_id, consent_type, created_at desc);
create table notification_prefs (
  profile_id uuid primary key references profiles(id) on delete cascade,
  email_enabled boolean default true, whatsapp_enabled boolean default false,
  marketing_enabled boolean default false, updated_at timestamptz default now()
);

-- CATALOG
create table developers (
  id uuid primary key default gen_random_uuid(),
  name text not null, slug text unique not null, description text, logo_url text,
  track_record jsonb default '{}', website text,
  created_at timestamptz default now(), updated_at timestamptz default now()
);
create table areas (
  id uuid primary key default gen_random_uuid(),
  name text not null, slug text unique not null, city text default 'Dubai',
  description text, intelligence jsonb default '{}',
  geo_lat numeric(9,6), geo_lng numeric(9,6),
  created_at timestamptz default now(), updated_at timestamptz default now()
);
create table media (
  id uuid primary key default gen_random_uuid(),
  type media_type not null, provider media_provider not null, external_id text,
  storage_path text, title text, description text, duration_seconds int,
  thumbnail_url text, metadata jsonb default '{}', created_at timestamptz default now()
);
create table projects (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null, name text not null,
  developer_id uuid references developers(id), area_id uuid references areas(id),
  status project_status default 'draft', description text,
  handover_quarter text, handover_date date,
  price_from numeric(14,2), price_to numeric(14,2), currency char(3) default 'AED',
  availability availability_status default 'available',
  commission_pct numeric(5,2), cashback_payout_pct numeric(5,2),
  cashback_floor numeric(14,2) default 0, est_yield_pct numeric(5,2),
  intelligence jsonb default '{}', search_tsv tsvector, published_at timestamptz,
  created_at timestamptz default now(), updated_at timestamptz default now(), deleted_at timestamptz
);
create index projects_status_idx on projects (status) where deleted_at is null;
create index projects_area_idx on projects (area_id);
create index projects_developer_idx on projects (developer_id);
create index projects_price_idx on projects (price_from);
create index projects_handover_idx on projects (handover_date);
create index projects_tsv_idx on projects using gin (search_tsv);
create index projects_name_trgm_idx on projects using gin (name gin_trgm_ops);
create table units (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  unit_type text, bedrooms int, size_sqft numeric(10,2),
  price_from numeric(14,2), currency char(3) default 'AED',
  availability availability_status default 'available',
  total_count int, available_count int, floorplan_media_id uuid references media(id),
  attributes jsonb default '{}',
  created_at timestamptz default now(), updated_at timestamptz default now()
);
create index units_project_idx on units (project_id);
create table payment_plans (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  name text, structure jsonb not null, notes text, created_at timestamptz default now()
);
create table project_media (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  media_id uuid references media(id) on delete cascade,
  role text not null, sort_order int default 0, created_at timestamptz default now()
);
create index project_media_project_idx on project_media (project_id, role, sort_order);
create table faqs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  question text not null, answer text not null, sort_order int default 0,
  created_at timestamptz default now()
);
create table content_pages (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null, type text not null, title text not null, body_md text,
  seo jsonb default '{}', status project_status default 'draft', published_at timestamptz,
  created_at timestamptz default now(), updated_at timestamptz default now()
);

-- ENGAGEMENT
create table saved_items (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid references profiles(id) on delete cascade,
  project_id uuid references projects(id) on delete cascade,
  unit_id uuid references units(id) on delete set null,
  created_at timestamptz default now(), unique (buyer_id, project_id, unit_id)
);
create index saved_items_buyer_idx on saved_items (buyer_id);

-- CRM / LEADS (spine pt.1)
create table leads (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid references profiles(id) on delete set null,
  project_id uuid references projects(id), unit_type text,
  status lead_status default 'new', assigned_rm uuid references profiles(id),
  score int, sla_first_response_due timestamptz, first_responded_at timestamptz,
  created_at timestamptz default now(), updated_at timestamptz default now(), deleted_at timestamptz
);
create index leads_status_idx on leads (status);
create index leads_assigned_idx on leads (assigned_rm);
create index leads_buyer_idx on leads (buyer_id);
create index leads_created_idx on leads (created_at desc);
create table lead_attribution (
  lead_id uuid primary key references leads(id) on delete cascade,
  source text, utm jsonb default '{}', referrer text, session_id text,
  device jsonb default '{}', engagement_context jsonb default '{}',
  developer_id uuid references developers(id), developer_registration_ref text,
  attribution_locked_at timestamptz, created_at timestamptz default now()
);
create table lead_activities (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references leads(id) on delete cascade,
  actor_id uuid references profiles(id), type text not null, body text,
  metadata jsonb default '{}', created_at timestamptz default now()
);
create index lead_activities_lead_idx on lead_activities (lead_id, created_at desc);

-- TRANSACTIONS (spine pt.2)
create table transactions (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references leads(id), buyer_id uuid references profiles(id),
  project_id uuid references projects(id), unit_id uuid references units(id),
  type txn_type default 'offplan_primary', status txn_status default 'reserved',
  unit_price numeric(14,2), currency char(3) default 'AED',
  payment_plan_id uuid references payment_plans(id), developer_registration_ref text,
  booked_at timestamptz, spa_signed_at timestamptz, oqood_registered_at timestamptz,
  handover_estimate date, created_at timestamptz default now(), updated_at timestamptz default now()
);
create index transactions_buyer_idx on transactions (buyer_id);
create index transactions_status_idx on transactions (status);
create index transactions_lead_idx on transactions (lead_id);
create table transaction_milestones (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid references transactions(id) on delete cascade,
  kind text not null, label text not null, status text default 'pending',
  progress_pct numeric(5,2), due_date date, completed_at timestamptz,
  media_id uuid references media(id), sort_order int default 0,
  created_at timestamptz default now(), updated_at timestamptz default now()
);
create index txn_milestones_idx on transaction_milestones (transaction_id, sort_order);
create table payment_schedule (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid references transactions(id) on delete cascade,
  installment_no int, amount numeric(14,2), currency char(3) default 'AED',
  due_date date, paid_at timestamptz, status text default 'due',
  created_at timestamptz default now()
);

-- CASHBACK + COMMISSION (spine pt.3, audited)
create table commissions (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid references transactions(id), developer_id uuid references developers(id),
  gross_amount numeric(14,2), received_amount numeric(14,2) default 0, currency char(3) default 'AED',
  invoiced_at timestamptz, received_at timestamptz, status text default 'pending',
  notes text, created_at timestamptz default now(), updated_at timestamptz default now()
);
create table cashback (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid references transactions(id), buyer_id uuid references profiles(id),
  commission_id uuid references commissions(id), status cashback_status default 'not_eligible',
  formula jsonb not null default '{}', computed_amount numeric(14,2), paid_amount numeric(14,2),
  currency char(3) default 'AED', clearing_until timestamptz, payout_ref text,
  kyc_status text default 'pending', buyer_bank jsonb,
  created_at timestamptz default now(), updated_at timestamptz default now()
);
create index cashback_buyer_idx on cashback (buyer_id);
create index cashback_status_idx on cashback (status);
create index cashback_txn_idx on cashback (transaction_id);
create table cashback_events (
  id uuid primary key default gen_random_uuid(),
  cashback_id uuid references cashback(id) on delete cascade,
  from_status cashback_status, to_status cashback_status,
  actor_id uuid references profiles(id), role_at_action user_role,
  amount numeric(14,2), note text, created_at timestamptz default now()
);
create index cashback_events_idx on cashback_events (cashback_id, created_at);

-- PLATFORM: audit, events (outbox), notifications, flags, community
create table audit_log (
  id bigint generated always as identity primary key,
  actor_id uuid references profiles(id), actor_role user_role, action text not null,
  entity_type text, entity_id uuid, before jsonb, after jsonb,
  ip inet, user_agent text, created_at timestamptz default now()
);
create index audit_entity_idx on audit_log (entity_type, entity_id, created_at desc);
create index audit_actor_idx on audit_log (actor_id, created_at desc);
create table events (
  id bigint generated always as identity primary key,
  type text not null, payload jsonb not null, status text default 'pending',
  attempts int default 0, available_at timestamptz default now(),
  processed_at timestamptz, created_at timestamptz default now()
);
create index events_status_idx on events (status, available_at);
create table notifications (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) on delete cascade,
  channel text not null, template text not null, payload jsonb default '{}',
  dedupe_key text unique, status text default 'queued', sent_at timestamptz,
  created_at timestamptz default now()
);
create table feature_flags (
  key text primary key, enabled boolean default false, rollout jsonb default '{}',
  updated_at timestamptz default now()
);
create table community_identities (
  profile_id uuid primary key references profiles(id) on delete cascade,
  handle text unique not null, avatar_seed text, verified_buyer boolean default false,
  created_at timestamptz default now()
);
