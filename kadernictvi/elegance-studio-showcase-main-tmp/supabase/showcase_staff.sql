-- Kadeřníci / stylisté salónu + vazba na rezervace
-- Spusť v Supabase SQL Editor (sdílená DB showcase).

CREATE TABLE IF NOT EXISTS public.kadernictvi_pracovnici (
  id BIGSERIAL PRIMARY KEY,
  kadernictvi_id BIGINT NOT NULL REFERENCES public.kadernictvi (id) ON DELETE CASCADE,
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

CREATE INDEX IF NOT EXISTS kadernictvi_pracovnici_shop_active_idx
  ON public.kadernictvi_pracovnici (kadernictvi_id, sort_order)
  WHERE is_active = TRUE;

COMMENT ON TABLE public.kadernictvi_pracovnici IS
  'Tým salónu — fotka, role, bio, specializace; multi-tenant přes kadernictvi_id.';

ALTER TABLE public.kadernictvi_rezervace
  ADD COLUMN IF NOT EXISTS pracovnik_id BIGINT REFERENCES public.kadernictvi_pracovnici (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS kadernictvi_rezervace_staff_date_idx
  ON public.kadernictvi_rezervace (kadernictvi_id, pracovnik_id, booking_date)
  WHERE status <> 'canceled';

-- === RLS ===
ALTER TABLE public.kadernictvi_pracovnici ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_active_staff" ON public.kadernictvi_pracovnici;
CREATE POLICY "anon_select_active_staff"
  ON public.kadernictvi_pracovnici FOR SELECT TO anon
  USING (is_active = TRUE);

DROP POLICY IF EXISTS "authenticated_select_staff" ON public.kadernictvi_pracovnici;
CREATE POLICY "authenticated_select_staff"
  ON public.kadernictvi_pracovnici FOR SELECT TO authenticated
  USING (kadernictvi_id = public.kadernictvi_aktualni_id());

DROP POLICY IF EXISTS "authenticated_manage_staff" ON public.kadernictvi_pracovnici;
CREATE POLICY "authenticated_manage_staff"
  ON public.kadernictvi_pracovnici FOR ALL TO authenticated
  USING (kadernictvi_id = public.kadernictvi_aktualni_id())
  WITH CHECK (kadernictvi_id = public.kadernictvi_aktualni_id());

-- === Seed: Studio Elegance (kadernictvi_id = 1) ===
INSERT INTO public.kadernictvi_pracovnici (
  kadernictvi_id, first_name, last_name, role_title, bio, photo_url, specializations, sort_order
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
FROM public.kadernictvi b
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
    SELECT 1 FROM public.kadernictvi_pracovnici s WHERE s.kadernictvi_id = b.id
  );
