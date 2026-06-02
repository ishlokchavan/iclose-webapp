-- Auto-set sla_first_response_due to +24h on every new lead.
-- Only fires when the value is not already provided by the caller.

create or replace function set_lead_sla()
returns trigger language plpgsql as $$
begin
  if NEW.sla_first_response_due is null then
    NEW.sla_first_response_due := NEW.created_at + interval '24 hours';
  end if;
  return NEW;
end;
$$;

drop trigger if exists leads_set_sla on leads;

create trigger leads_set_sla
  before insert on leads
  for each row execute function set_lead_sla();
