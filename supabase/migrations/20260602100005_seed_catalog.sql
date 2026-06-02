-- iClose — 0005: catalog seed (developers, areas, off-plan projects, units, plans, faqs).
-- DEV/STAGING seed data only. Idempotent (ON CONFLICT / NOT EXISTS), safe to re-run.
-- Projects are seeded as DRAFT on purpose: staff publish them via /admin/projects,
-- which is what makes them appear on /app/explore (RLS shows only status='published').
-- NOTE: commission_pct / cashback_payout_pct / cashback_floor are INTERNAL — never buyer-visible.

-- ── Developers ────────────────────────────────────────────
insert into developers (name, slug, description, website, track_record) values
  ('Emaar Properties', 'emaar',
   'Dubai''s largest master developer, behind Downtown Dubai, Dubai Marina and Dubai Hills Estate.',
   'https://www.emaar.com', '{"founded": 1997, "delivered_units": 85000}'),
  ('Sobha Realty', 'sobha',
   'Backward-integrated developer known for build quality, anchored by the Sobha Hartland community in MBR City.',
   'https://www.sobharealty.com', '{"founded": 1976, "delivered_units": 30000}'),
  ('DAMAC Properties', 'damac',
   'Luxury developer with a large branded-residence portfolio across Dubai.',
   'https://www.damacproperties.com', '{"founded": 2002, "delivered_units": 47000}'),
  ('Binghatti Developers', 'binghatti',
   'Fast-moving developer recognised for distinctive architecture and high-yield mid-market towers.',
   'https://www.binghatti.com', '{"founded": 2008, "delivered_units": 10000}'),
  ('Meraas', 'meraas',
   'Lifestyle developer behind City Walk, Bluewaters and Central Park.',
   'https://www.meraas.com', '{"founded": 2007}')
on conflict (slug) do nothing;

-- ── Areas ─────────────────────────────────────────────────
insert into areas (name, slug, description, geo_lat, geo_lng, intelligence) values
  ('Dubai Creek Harbour', 'dubai-creek-harbour',
   'Waterfront master community on Dubai Creek with the future Creek Tower and a marina lifestyle.',
   25.2030, 55.3530, '{"vibe": "waterfront", "metro": "planned"}'),
  ('Sobha Hartland', 'sobha-hartland',
   'Green, low-density community in MBR City, minutes from Downtown and Ras Al Khor sanctuary.',
   25.1850, 55.3050, '{"vibe": "green", "schools": true}'),
  ('Business Bay', 'business-bay',
   'Central canal-side district adjoining Downtown Dubai, dense with towers and offices.',
   25.1880, 55.2630, '{"vibe": "urban", "metro": true}'),
  ('Dubai Hills Estate', 'dubai-hills-estate',
   'Master community built around an 18-hole championship golf course and Dubai Hills Mall.',
   25.1100, 55.2480, '{"vibe": "golf", "schools": true}'),
  ('Jumeirah Village Circle', 'jvc',
   'Established mid-market community popular for high rental yields and family townhouses.',
   25.0590, 55.2090, '{"vibe": "value", "yield": "high"}'),
  ('City Walk', 'city-walk',
   'Walkable urban district by Meraas with retail, dining and the Central Park community.',
   25.2070, 55.2620, '{"vibe": "urban-lifestyle"}')
on conflict (slug) do nothing;

-- ── Projects (seeded as DRAFT) ────────────────────────────
insert into projects (
  slug, name, developer_id, area_id, status, description,
  handover_quarter, handover_date, price_from, price_to, currency, availability,
  commission_pct, cashback_payout_pct, cashback_floor, est_yield_pct
)
select v.slug, v.name, d.id, a.id, 'draft'::project_status, v.description,
       v.handover_quarter, v.handover_date, v.price_from, v.price_to, 'AED', v.availability::availability_status,
       v.commission_pct, v.cashback_payout_pct, 0, v.est_yield_pct
from (values
  ('creek-waters-2', 'Creek Waters 2', 'emaar', 'dubai-creek-harbour',
   'Waterfront 1–3 bedroom apartments on the Creek promenade, with a 60/40 payment plan and direct marina access.',
   'Q4 2027', date '2027-12-31', 1600000, 4200000, 'available', 5.50, 4.00, 6.50),
  ('golf-grand', 'Golf Grand', 'emaar', 'dubai-hills-estate',
   'Apartments overlooking the championship golf course, a short walk from Dubai Hills Mall and the park.',
   'Q2 2027', date '2027-06-30', 1900000, 5300000, 'limited', 5.00, 3.75, 6.00),
  ('sobha-one', 'Sobha One', 'sobha', 'sobha-hartland',
   'Five interconnected towers with a 1.2km elevated podium garden and golf views over Ras Al Khor.',
   'Q1 2028', date '2028-03-31', 1500000, 6100000, 'available', 6.00, 4.50, 7.00),
  ('volta', 'Volta', 'damac', 'business-bay',
   'Wellness-focused tower on Sheikh Zayed Road with sky gym, climbing wall and a 70/30 plan.',
   'Q3 2027', date '2027-09-30', 1750000, 4900000, 'available', 6.00, 4.00, 6.80),
  ('binghatti-amber', 'Binghatti Amber', 'binghatti', 'jvc',
   'High-yield studios to 2-bedroom apartments in the heart of JVC, with a fast handover timeline.',
   'Q4 2026', date '2026-12-31', 750000, 1850000, 'coming_soon', 6.50, 5.00, 8.00),
  ('central-park-plaza', 'Central Park Plaza', 'meraas', 'city-walk',
   'Park-facing apartments in the Central Park community at City Walk, with direct podium-to-park access.',
   'Q2 2027', date '2027-06-30', 1400000, 3600000, 'limited', 5.50, 4.25, 6.20)
) as v(slug, name, developer_slug, area_slug, description,
       handover_quarter, handover_date, price_from, price_to, availability,
       commission_pct, cashback_payout_pct, est_yield_pct)
join developers d on d.slug = v.developer_slug
join areas a on a.slug = v.area_slug
on conflict (slug) do nothing;

-- ── Units (per project) ───────────────────────────────────
insert into units (project_id, unit_type, bedrooms, size_sqft, price_from, currency, availability, total_count, available_count)
select p.id, u.unit_type, u.bedrooms, u.size_sqft, u.price_from, 'AED', u.availability::availability_status, u.total_count, u.available_count
from (values
  ('creek-waters-2', '1 Bedroom Apartment', 1, 720,  1600000, 'available', 120, 64),
  ('creek-waters-2', '2 Bedroom Apartment', 2, 1150, 2450000, 'available', 90,  41),
  ('creek-waters-2', '3 Bedroom Apartment', 3, 1680, 3600000, 'limited',   40,  9),
  ('golf-grand',     '1 Bedroom Apartment', 1, 740,  1900000, 'limited',   80,  12),
  ('golf-grand',     '2 Bedroom Apartment', 2, 1180, 2900000, 'available', 70,  28),
  ('sobha-one',      '1 Bedroom Apartment', 1, 700,  1500000, 'available', 150, 88),
  ('sobha-one',      '2 Bedroom Apartment', 2, 1100, 2300000, 'available', 120, 52),
  ('sobha-one',      '3 Bedroom Apartment', 3, 1620, 3700000, 'available', 60,  31),
  ('volta',          'Studio',              0, 430,  1100000, 'available', 100, 70),
  ('volta',          '1 Bedroom Apartment', 1, 760,  1750000, 'available', 110, 55),
  ('binghatti-amber','Studio',              0, 380,  750000,  'coming_soon', 90, 90),
  ('binghatti-amber','1 Bedroom Apartment', 1, 690,  1050000, 'coming_soon', 80, 80),
  ('central-park-plaza','1 Bedroom Apartment', 1, 710, 1400000, 'available', 95, 60),
  ('central-park-plaza','2 Bedroom Apartment', 2, 1140, 2200000, 'limited',  60, 14)
) as u(project_slug, unit_type, bedrooms, size_sqft, price_from, availability, total_count, available_count)
join projects p on p.slug = u.project_slug
where not exists (
  select 1 from units ex where ex.project_id = p.id and ex.unit_type = u.unit_type
);

-- ── Payment plans (one headline plan per project) ─────────
insert into payment_plans (project_id, name, structure, notes)
select p.id, pp.name, pp.structure::jsonb, pp.notes
from (values
  ('creek-waters-2', '60/40', '{"during_construction": 60, "on_handover": 40, "down_payment": 10}', 'Booking 10%, staged to 60% during construction, 40% on handover.'),
  ('golf-grand',     '80/20', '{"during_construction": 80, "on_handover": 20, "down_payment": 10}', 'Standard Emaar plan with 20% on handover.'),
  ('sobha-one',      '60/40', '{"during_construction": 60, "on_handover": 40, "down_payment": 20}', '20% down payment, balance staged to handover.'),
  ('volta',          '70/30', '{"during_construction": 70, "on_handover": 30, "down_payment": 20}', 'DAMAC 70/30 construction-linked plan.'),
  ('binghatti-amber','70/30', '{"during_construction": 70, "on_handover": 30, "down_payment": 20}', 'Short timeline, construction-linked instalments.'),
  ('central-park-plaza','65/35', '{"during_construction": 65, "on_handover": 35, "down_payment": 10}', 'Meraas plan with post-handover component.')
) as pp(project_slug, name, structure, notes)
join projects p on p.slug = pp.project_slug
where not exists (
  select 1 from payment_plans ex where ex.project_id = p.id
);

-- ── A couple of project FAQs ──────────────────────────────
insert into faqs (project_id, question, answer, sort_order)
select p.id, f.question, f.answer, f.sort_order
from (values
  ('creek-waters-2', 'Is this freehold for foreign buyers?', 'Yes. Dubai Creek Harbour is a designated freehold area open to all nationalities.', 0),
  ('creek-waters-2', 'When is handover?', 'The developer''s current estimate is Q4 2027. Construction milestones are tracked in your iClose dashboard.', 1),
  ('sobha-one',      'What is the service charge estimate?', 'Indicative service charges are shared by your relationship manager once the unit is selected; figures are pre-VAT.', 0)
) as f(project_slug, question, answer, sort_order)
join projects p on p.slug = f.project_slug
where not exists (
  select 1 from faqs ex where ex.project_id = p.id and ex.question = f.question
);
