-- Oprava RLS pro admin — tržby, výdělky, plán (vydelky / vydelky_sluzby / trzby)
-- Spusť v Supabase → SQL Editor (celý skript)

-- Spolehlivější funkce: vrátí barbershop_id přihlášeného admina (ne NULL pokud je propojen)
CREATE OR REPLACE FUNCTION public.showcase_current_barbershop_id()
RETURNS BIGINT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT barbershop_id
  FROM public.showcase_barbershop_admins
  WHERE user_id = auth.uid()
  LIMIT 1;
$$;

-- Pomocná: admin má přístup k danému barbershopu
CREATE OR REPLACE FUNCTION public.showcase_admin_has_barbershop(p_barbershop_id BIGINT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.showcase_barbershop_admins
    WHERE user_id = auth.uid()
      AND barbershop_id = p_barbershop_id
  );
$$;

-- showcase_vydelky
ALTER TABLE public.showcase_vydelky ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_select_vydelky" ON public.showcase_vydelky;
CREATE POLICY "admin_select_vydelky"
  ON public.showcase_vydelky FOR SELECT TO authenticated
  USING (
    barbershop_id IN (
      SELECT barbershop_id FROM public.showcase_barbershop_admins WHERE user_id = auth.uid()
    )
  );

-- showcase_vydelky_sluzby
ALTER TABLE public.showcase_vydelky_sluzby ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_select_vydelky_sluzby" ON public.showcase_vydelky_sluzby;
CREATE POLICY "admin_select_vydelky_sluzby"
  ON public.showcase_vydelky_sluzby FOR SELECT TO authenticated
  USING (
    barbershop_id IN (
      SELECT barbershop_id FROM public.showcase_barbershop_admins WHERE user_id = auth.uid()
    )
  );

-- showcase_trzby
ALTER TABLE public.showcase_trzby ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated_select_showcase_trzby" ON public.showcase_trzby;
CREATE POLICY "authenticated_select_showcase_trzby"
  ON public.showcase_trzby FOR SELECT TO authenticated
  USING (
    barbershop_id IN (
      SELECT barbershop_id FROM public.showcase_barbershop_admins WHERE user_id = auth.uid()
    )
  );

-- showcase_rezervace (admin čtení)
DROP POLICY IF EXISTS "authenticated_select_showcase_rezervace" ON public.showcase_rezervace;
CREATE POLICY "authenticated_select_showcase_rezervace"
  ON public.showcase_rezervace FOR SELECT TO authenticated
  USING (
    barbershop_id IN (
      SELECT barbershop_id FROM public.showcase_barbershop_admins WHERE user_id = auth.uid()
    )
  );

-- showcase_services
DROP POLICY IF EXISTS "authenticated_select_showcase_services" ON public.showcase_services;
CREATE POLICY "authenticated_select_showcase_services"
  ON public.showcase_services FOR SELECT TO authenticated
  USING (
    barbershop_id IN (
      SELECT barbershop_id FROM public.showcase_barbershop_admins WHERE user_id = auth.uid()
    )
  );

-- showcase_barbershops (kredit SMS banner)
DROP POLICY IF EXISTS "authenticated_select_showcase_barbershops" ON public.showcase_barbershops;
CREATE POLICY "authenticated_select_showcase_barbershops"
  ON public.showcase_barbershops FOR SELECT TO authenticated
  USING (
    id IN (
      SELECT barbershop_id FROM public.showcase_barbershop_admins WHERE user_id = auth.uid()
    )
  );

-- Přepočet statistik pro Donzi (aktuální měsíc) — po existujících rezervacích
-- SELECT public.showcase_refresh_vydelky(
--   (SELECT id FROM public.showcase_barbershops WHERE slug = 'donzi-dobruska'),
--   to_char(CURRENT_DATE, 'YYYY-MM')
-- );
