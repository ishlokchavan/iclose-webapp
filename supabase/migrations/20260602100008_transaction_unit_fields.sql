-- Simplify transactions toward the cashback-first model.
-- Capture the purchased unit's details directly on the transaction, and track a
-- simplified buyer-facing cashback stage (commission/cashback journey) rather
-- than the full RERA property pipeline.

alter table transactions
  add column if not exists unit_no text,
  add column if not exists category text,        -- offplan | ready | commercial
  add column if not exists property_type text,   -- apartment | villa | townhouse | penthouse | land | duplex
  add column if not exists area_id uuid references areas(id),
  add column if not exists developer_id uuid references developers(id),
  add column if not exists cashback_status text not null default 'purchased';

comment on column transactions.cashback_status is 'Simplified buyer-facing cashback journey stage';
