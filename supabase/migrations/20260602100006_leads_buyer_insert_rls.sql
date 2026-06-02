-- iClose — 0006: buyer lead-creation RLS.
-- Buyers can insert their own leads + attribution. Staff write policy already
-- covers everything for staff. No update/delete for buyers — only staff modify leads.

create policy leads_buyer_insert on leads
  for insert
  with check (buyer_id = auth.uid());

create policy lead_attr_buyer_insert on lead_attribution
  for insert
  with check (
    exists (
      select 1 from leads l
      where l.id = lead_id and l.buyer_id = auth.uid()
    )
  );
