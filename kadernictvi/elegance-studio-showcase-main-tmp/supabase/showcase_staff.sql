-- Kadeřníci / stylisté salónu + vazba na rezervace
-- Spusť v Supabase SQL Editor (sdílená DB showcase).

CREATE TABLE IF NOT EXISTS public.showcase_staff (
  id BIGSERIAL PRIMARY KEY,
  barbershop_id BIGINT NOT NULL REFERENCES public.showcase_barbershops (id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  role_title TEXT NOT NULL,
  bio TEXT,
  photo_url TEXT NOT NULL,
  specializations TEXT[] NOT NULL DEFAULT '{}',
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS showcase_staff_shop_active_idx
  ON public.showcase_staff (barbershop_id, sort_order)
  WHERE is_active = TRUE;

COMMENT ON TABLE public.showcase_staff IS
  'Tým salónu — fotka, role, bio, specializace; multi-tenant přes barbershop_id.';

ALTER TABLE public.showcase_rezervace
  ADD COLUMN IF NOT EXISTS staff_id BIGINT REFERENCES public.showcase_staff (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS showcase_rezervace_staff_date_idx
  ON public.showcase_rezervace (barbershop_id, staff_id, booking_date)
  WHERE status <> 'canceled';

-- === RLS ===
ALTER TABLE public.showcase_staff ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_active_staff" ON public.showcase_staff;
CREATE POLICY "anon_select_active_staff"
  ON public.showcase_staff FOR SELECT TO anon
  USING (is_active = TRUE);

DROP POLICY IF EXISTS "authenticated_select_staff" ON public.showcase_staff;
CREATE POLICY "authenticated_select_staff"
  ON public.showcase_staff FOR SELECT TO authenticated
  USING (barbershop_id = public.showcase_current_barbershop_id());

DROP POLICY IF EXISTS "authenticated_manage_staff" ON public.showcase_staff;
CREATE POLICY "authenticated_manage_staff"
  ON public.showcase_staff FOR ALL TO authenticated
  USING (barbershop_id = public.showcase_current_barbershop_id())
  WITH CHECK (barbershop_id = public.showcase_current_barbershop_id());

-- === Seed: Studio Elegance (barbershop_id = 1) ===
INSERT INTO public.showcase_staff (
  barbershop_id, first_name, last_name, role_title, bio, photo_url, specializations, sort_order
)
SELECT
  b.id,
  v.first_name,
  v.last_name,
  v.role_title,
  v.bio,
  v.photo_url,
  v.specializations,
  v.sort_order
FROM public.showcase_barbershops b
CROSS JOIN (
  VALUES
    (
      'Klára',
      'Černá',
      'Zakladatelka & Master Stylist',
      'Více než 15 let tvořím účesy, které podtrhnou osobnost klientky. Miluji přirozené linie a precizní střih.',
      'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=800&q=85&auto=format',
      ARRAY['Dámský střih', 'Společenský účes', 'Konzultace']::TEXT[],
      1
    ),
    (
      'Eliška',
      'Mráčková',
      'Color Specialist',
      'Specializuji se na barvení, melír a balayage. Každý odstín ladím na míru podle typu pleti a vlasů.',
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&q=85&auto=format',
      ARRAY['Balayage', 'Melír', 'Barvení vlasů']::TEXT[],
      3
    ),
    (
      'Monika',
      'Svobodová',
      'Senior Stylist',
      'Od klasických střihů po trendy účesy — vždy s ohledem na váš životní styl a péči o vlasy doma.',
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=800&q=85&auto=format',
      ARRAY['Dámský střih', 'Foukaná', 'Regenerační péče']::TEXT[],
      2
    )
) AS v(first_name, last_name, role_title, bio, photo_url, specializations, sort_order)
WHERE b.slug = 'studio-elegance'
  AND NOT EXISTS (
    SELECT 1 FROM public.showcase_staff s WHERE s.barbershop_id = b.id
  );
