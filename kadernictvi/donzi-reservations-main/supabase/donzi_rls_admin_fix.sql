-- Oprava RLS pro admin — tržby, výdělky, plán (vydelky / vydelky_sluzby / trzby)
-- Spusť v Supabase → SQL Editor (celý skript)

-- Spolehlivější funkce: vrátí kadernictvi_id přihlášeného admina (ne NULL pokud je propojen)
CREATE OR REPLACE FUNCTION public.kadernictvi_aktualni_id()
RETURNS BIGINT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT kadernictvi_id
  FROM public.kadernictvi_admini
  WHERE user_id = auth.uid()
  LIMIT 1;
$$;

-- Pomocná: admin má přístup k danému barbershopu
CREATE OR REPLACE FUNCTION public.showcase_admin_has_barbershop(p_kadernictvi_id BIGINT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.kadernictvi_admini
    WHERE user_id = auth.uid()
      AND kadernictvi_id = p_kadernictvi_id
  );
$$;

-- kadernictvi_vydelky
ALTER TABLE public.kadernictvi_vydelky ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_select_vydelky" ON public.kadernictvi_vydelky;
CREATE POLICY "admin_select_vydelky"
  ON public.kadernictvi_vydelky FOR SELECT TO authenticated
  USING (
    kadernictvi_id IN (
      SELECT kadernictvi_id FROM public.kadernictvi_admini WHERE user_id = auth.uid()
    )
  );

-- kadernictvi_vydelky_sluzby
ALTER TABLE public.kadernictvi_vydelky_sluzby ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_select_vydelky_sluzby" ON public.kadernictvi_vydelky_sluzby;
CREATE POLICY "admin_select_vydelky_sluzby"
  ON public.kadernictvi_vydelky_sluzby FOR SELECT TO authenticated
  USING (
    kadernictvi_id IN (
      SELECT kadernictvi_id FROM public.kadernictvi_admini WHERE user_id = auth.uid()
    )
  );

-- kadernictvi_trzby
ALTER TABLE public.kadernictvi_trzby ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated_select_kadernictvi_trzby" ON public.kadernictvi_trzby;
CREATE POLICY "authenticated_select_kadernictvi_trzby"
  ON public.kadernictvi_trzby FOR SELECT TO authenticated
  USING (
    kadernictvi_id IN (
      SELECT kadernictvi_id FROM public.kadernictvi_admini WHERE user_id = auth.uid()
    )
  );

-- kadernictvi_rezervace (admin čtení)
DROP POLICY IF EXISTS "authenticated_select_kadernictvi_rezervace" ON public.kadernictvi_rezervace;
CREATE POLICY "authenticated_select_kadernictvi_rezervace"
  ON public.kadernictvi_rezervace FOR SELECT TO authenticated
  USING (
    kadernictvi_id IN (
      SELECT kadernictvi_id FROM public.kadernictvi_admini WHERE user_id = auth.uid()
    )
  );

-- kadernictvi_sluzby
DROP POLICY IF EXISTS "authenticated_select_kadernictvi_sluzby" ON public.kadernictvi_sluzby;
CREATE POLICY "authenticated_select_kadernictvi_sluzby"
  ON public.kadernictvi_sluzby FOR SELECT TO authenticated
  USING (
    kadernictvi_id IN (
      SELECT kadernictvi_id FROM public.kadernictvi_admini WHERE user_id = auth.uid()
    )
  );

-- kadernictvi (kredit SMS banner)
DROP POLICY IF EXISTS "authenticated_select_kadernictvi" ON public.kadernictvi;
CREATE POLICY "authenticated_select_kadernictvi"
  ON public.kadernictvi FOR SELECT TO authenticated
  USING (
    id IN (
      SELECT kadernictvi_id FROM public.kadernictvi_admini WHERE user_id = auth.uid()
    )
  );

-- Přepočet statistik pro Donzi (aktuální měsíc) — po existujících rezervacích
-- SELECT public.kadernictvi_obnovit_vydelky(
--   (SELECT id FROM public.kadernictvi WHERE slug = 'donzi-dobruska'),
--   to_char(CURRENT_DATE, 'YYYY-MM')
-- );
