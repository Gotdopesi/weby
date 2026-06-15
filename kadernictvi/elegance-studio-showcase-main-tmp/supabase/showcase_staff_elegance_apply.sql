-- Studio Elegance: 3 aktivní kadeřníci, fotky jen jako URL (bez Supabase Storage)
-- Spusť v SQL Editoru: https://supabase.com/dashboard/project/hnkcjrvqbeojegujuuyw/sql

-- Deaktivovat starý tým (Tomáš atd. zmizí z webu, záznamy v DB zůstanou)
UPDATE public.showcase_staff s
SET is_active = FALSE, updated_at = now()
FROM public.showcase_barbershops b
WHERE s.barbershop_id = b.id AND b.slug = 'studio-elegance';

-- Vložit / doplnit 3 kadeřníky (pokud chybí)
INSERT INTO public.showcase_staff (
  barbershop_id, first_name, last_name, role_title, bio, photo_url, specializations, sort_order, is_active
)
SELECT
  b.id,
  v.first_name,
  v.last_name,
  v.role_title,
  v.bio,
  v.photo_url,
  v.specializations,
  v.sort_order,
  TRUE
FROM public.showcase_barbershops b
CROSS JOIN (
  VALUES
    (
      'Klára', 'Černá', 'Zakladatelka & Master Stylist',
      'Více než 15 let tvořím účesy na míru.',
      'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=800&q=85&auto=format',
      ARRAY['Dámský střih', 'Společenský účes', 'Konzultace']::TEXT[], 1
    ),
    (
      'Monika', 'Svobodová', 'Senior Stylist',
      'Dámské střihy, foukaná a regenerační péče.',
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=800&q=85&auto=format',
      ARRAY['Dámský střih', 'Foukaná', 'Regenerační péče']::TEXT[], 2
    ),
    (
      'Eliška', 'Mráčková', 'Color Specialist',
      'Balayage, melír a barvení vlasů.',
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&q=85&auto=format',
      ARRAY['Balayage', 'Melír', 'Barvení vlasů']::TEXT[], 3
    )
) AS v(first_name, last_name, role_title, bio, photo_url, specializations, sort_order)
WHERE b.slug = 'studio-elegance'
  AND NOT EXISTS (
    SELECT 1 FROM public.showcase_staff s
    WHERE s.barbershop_id = b.id AND s.first_name = v.first_name
  );

-- Aktualizovat existující 3 (fotky URL, aktivní)
UPDATE public.showcase_staff s
SET
  last_name = v.last_name,
  role_title = v.role_title,
  bio = v.bio,
  photo_url = v.photo_url,
  specializations = v.specializations,
  sort_order = v.sort_order,
  is_active = TRUE,
  updated_at = now()
FROM public.showcase_barbershops b,
LATERAL (VALUES
  ('Klára', 'Černá', 'Zakladatelka & Master Stylist',
   'Více než 15 let tvořím účesy na míru.',
   'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=800&q=85&auto=format',
   ARRAY['Dámský střih', 'Společenský účes', 'Konzultace']::TEXT[], 1),
  ('Monika', 'Svobodová', 'Senior Stylist',
   'Dámské střihy, foukaná a regenerační péče.',
   'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=800&q=85&auto=format',
   ARRAY['Dámský střih', 'Foukaná', 'Regenerační péče']::TEXT[], 2),
  ('Eliška', 'Mráčková', 'Color Specialist',
   'Balayage, melír a barvení vlasů.',
   'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&q=85&auto=format',
   ARRAY['Balayage', 'Melír', 'Barvení vlasů']::TEXT[], 3)
) AS v(first_name, last_name, role_title, bio, photo_url, specializations, sort_order)
WHERE s.barbershop_id = b.id
  AND b.slug = 'studio-elegance'
  AND s.first_name = v.first_name;

COMMENT ON COLUMN public.showcase_staff.photo_url IS
  'Veřejná URL fotky (web/CDN). Nepoužívej Supabase Storage.';

-- Propojení služeb se všemi aktivními kadeřníky
INSERT INTO public.showcase_staff_services (staff_id, service_id)
SELECT s.id, svc.id
FROM public.showcase_staff s
JOIN public.showcase_barbershops b ON b.id = s.barbershop_id
JOIN public.showcase_services svc ON svc.barbershop_id = b.id AND svc.is_active = TRUE
WHERE b.slug = 'studio-elegance' AND s.is_active = TRUE
ON CONFLICT DO NOTHING;
