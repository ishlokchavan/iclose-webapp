-- iClose — 0001: extensions + enums (state machines as types). Blueprint §33.2
create extension if not exists pgcrypto;
create extension if not exists pg_trgm;

create type user_role as enum
  ('buyer','rm','ops_manager','super_admin','finance','seller','advisor');
create type lead_status as enum
  ('new','qualifying','qualified','disqualified','assigned','advising',
   'shortlisted','ready_to_book','attribution_locked','converted','nurturing','dormant');
create type txn_status as enum
  ('reserved','booked','spa_signed','oqood_registered','under_construction',
   'handover','title_transferred','cancelled','defaulted');
create type txn_type as enum ('offplan_primary','offplan_assignment','secondary_resale');
create type cashback_status as enum
  ('not_eligible','eligible','pending_commission','commission_received','approved',
   'clearing_window','payable','paid','reconciled','cancelled','clawed_back','recovery','on_hold');
create type project_status as enum ('draft','published','archived');
create type availability_status as enum ('available','limited','sold_out','coming_soon');
create type media_provider as enum ('youtube','mux','cloudflare_stream','upload');
create type media_type as enum ('video','image','brochure_pdf','floorplan','document');
