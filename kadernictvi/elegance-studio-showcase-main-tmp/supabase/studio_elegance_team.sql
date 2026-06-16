-- =============================================================================
-- Studio Elegance — tým kadeřníků (přehledný master skript)
-- DB: hnkcjrvqbeojegujuuyw | slug: studio-elegance
--
-- Pořadí (nová instalace):
--   1. kadernictvi_pracovnici.sql
--   2. showcase_admin_roles.sql
--   3. kadernictvi_pracovnik_sluzby.sql
--   4. tento soubor
--
-- Auth účty: node scripts/seed-dev-admins.mjs  (Supabase Auth nelze plně v SQL)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- §1  Aktivní tým — 3 kadeřníci, fotky = veřejné URL (ne Storage)
-- -----------------------------------------------------------------------------

UPDATE public.kadernictvi_pracovnici s
SET is_active = FALSE, updated_at = now()
FROM public.kadernictvi b
WHERE s.kadernictvi_id = b.id AND b.slug = 'studio-elegance';

INSERT INTO public.kadernictvi_pracovnici (
  kadernictvi_id, first_name, last_name, role_title, bio,
  photo_url, specializations, sort_order, is_active
)
SELECT
  b.id, v.first_name, v.last_name, v.role_title, v.bio,
  v.photo_url, v.specializations, v.sort_order, TRUE
FROM public.kadernictvi b
CROSS JOIN (
  VALUES
    ('Klára',  'Černá',     'Zakladatelka & Master Stylist',
     'Více než 15 let tvořím účesy na míru.',
     'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=800&q=85&auto=format',
     ARRAY['Dámský střih', 'Společenský účes', 'Konzultace']::TEXT[], 1),
    ('Monika', 'Svobodová', 'Senior Stylist',
     'Dámské střihy, foukaná a regenerační péče.',
     'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=800&q=85&auto=format',
     ARRAY['Dámský střih', 'Foukaná', 'Regenerační péče']::TEXT[], 2),
    ('Eliška', 'Mráčková',  'Color Specialist',
     'Balayage, melír a barvení vlasů.',
     'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&q=85&auto=format',
     ARRAY['Balayage', 'Melír', 'Barvení vlasů']::TEXT[], 3)
) AS v(first_name, last_name, role_title, bio, photo_url, specializations, sort_order)
WHERE b.slug = 'studio-elegance'
  AND NOT EXISTS (
    SELECT 1 FROM public.kadernictvi_pracovnici s
    WHERE s.kadernictvi_id = b.id AND s.first_name = v.first_name
  );

UPDATE public.kadernictvi_pracovnici s
SET
  last_name       = v.last_name,
  role_title      = v.role_title,
  bio             = v.bio,
  photo_url       = v.photo_url,
  specializations = v.specializations,
  sort_order      = v.sort_order,
  is_active       = TRUE,
  updated_at      = now()
FROM public.kadernictvi b,
LATERAL (VALUES
  ('Klára',  'Černá',     'Zakladatelka & Master Stylist',
   'Více než 15 let tvořím účesy na míru.',
   'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=800&q=85&auto=format',
   ARRAY['Dámský střih', 'Společenský účes', 'Konzultace']::TEXT[], 1),
  ('Monika', 'Svobodová', 'Senior Stylist',
   'Dámské střihy, foukaná a regenerační péče.',
   'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=800&q=85&auto=format',
   ARRAY['Dámský střih', 'Foukaná', 'Regenerační péče']::TEXT[], 2),
  ('Eliška', 'Mráčková',  'Color Specialist',
   'Balayage, melír a barvení vlasů.',
   'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&q=85&auto=format',
   ARRAY['Balayage', 'Melír', 'Barvení vlasů']::TEXT[], 3)
) AS v(first_name, last_name, role_title, bio, photo_url, specializations, sort_order)
WHERE s.kadernictvi_id = b.id
  AND b.slug = 'studio-elegance'
  AND s.first_name = v.first_name;

-- -----------------------------------------------------------------------------
-- §2  Pracovní doba (minuty od půlnoci; den 0=ne 1=po … 6=so)
--     Prázdný JSON {} = výchozí otevírací doba salónu v aplikaci
-- -----------------------------------------------------------------------------

-- Klára: Po–Pá 9:00–19:00, So 9:00–14:00
UPDATE public.kadernictvi_pracovnici s
SET work_schedule = '{
  "1": {"open": 540, "close": 1140},
  "2": {"open": 540, "close": 1140},
  "3": {"open": 540, "close": 1140},
  "4": {"open": 540, "close": 1140},
  "5": {"open": 540, "close": 1140},
  "6": {"open": 540, "close": 840}
}'::jsonb, updated_at = now()
FROM public.kadernictvi b
WHERE s.kadernictvi_id = b.id AND b.slug = 'studio-elegance' AND s.first_name = 'Klára';

-- Monika: Út–So 10:00–18:00
UPDATE public.kadernictvi_pracovnici s
SET work_schedule = '{
  "2": {"open": 600, "close": 1080},
  "3": {"open": 600, "close": 1080},
  "4": {"open": 600, "close": 1080},
  "5": {"open": 600, "close": 1080},
  "6": {"open": 600, "close": 1080}
}'::jsonb, updated_at = now()
FROM public.kadernictvi b
WHERE s.kadernictvi_id = b.id AND b.slug = 'studio-elegance' AND s.first_name = 'Monika';

-- Eliška: St–Pá 9:00–17:00, So 9:00–13:00 (barvení)
UPDATE public.kadernictvi_pracovnici s
SET work_schedule = '{
  "2": {"open": 540, "close": 1020},
  "3": {"open": 540, "close": 1020},
  "4": {"open": 540, "close": 1020},
  "5": {"open": 540, "close": 1020},
  "6": {"open": 540, "close": 780}
}'::jsonb, updated_at = now()
FROM public.kadernictvi b
WHERE s.kadernictvi_id = b.id AND b.slug = 'studio-elegance' AND s.first_name = 'Eliška';

-- -----------------------------------------------------------------------------
-- §3  Služby — každý aktivní kadeřník nabízí všechny aktivní služby salónu
-- -----------------------------------------------------------------------------

INSERT INTO public.kadernictvi_pracovnik_sluzby (pracovnik_id, service_id)
SELECT s.id, svc.id
FROM public.kadernictvi_pracovnici s
JOIN public.kadernictvi b ON b.id = s.kadernictvi_id
JOIN public.kadernictvi_sluzby svc ON svc.kadernictvi_id = b.id AND svc.is_active = TRUE
WHERE b.slug = 'studio-elegance' AND s.is_active = TRUE
ON CONFLICT DO NOTHING;

-- -----------------------------------------------------------------------------
-- §4  Admin účty kadeřníků (po vytvoření uživatele v Auth)
--     Nahraď <UUID> e-mailem z seed-dev-admins.mjs nebo Supabase → Authentication
-- -----------------------------------------------------------------------------

-- Majitel (bez pracovnik_id):
-- INSERT INTO kadernictvi_admini (kadernictvi_id, user_id, login_label, role)
-- SELECT b.id, '<UUID-majitel>'::uuid, 'majitel', 'owner'
-- FROM kadernictvi b WHERE b.slug = 'studio-elegance'
-- ON CONFLICT (user_id) DO UPDATE SET role = 'owner', pracovnik_id = NULL;

-- Kadeřník (role=staff + pracovnik_id):
-- INSERT INTO kadernictvi_admini (kadernictvi_id, user_id, login_label, role, pracovnik_id)
-- SELECT b.id, '<UUID>'::uuid, 'monika', 'staff', s.id
-- FROM kadernictvi b
-- JOIN kadernictvi_pracovnici s ON s.kadernictvi_id = b.id AND s.first_name = 'Monika'
-- WHERE b.slug = 'studio-elegance'
-- ON CONFLICT (user_id) DO UPDATE SET role = 'staff', pracovnik_id = EXCLUDED.pracovnik_id;

-- -----------------------------------------------------------------------------
-- §5  Kontrola
-- -----------------------------------------------------------------------------

-- SELECT s.first_name, s.sort_order, s.is_active, s.work_schedule, s.photo_url
-- FROM kadernictvi_pracovnici s
-- JOIN kadernictvi b ON b.id = s.kadernictvi_id
-- WHERE b.slug = 'studio-elegance' AND s.is_active
-- ORDER BY s.sort_order;
