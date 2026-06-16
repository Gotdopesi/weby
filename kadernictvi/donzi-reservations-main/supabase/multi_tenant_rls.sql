-- =============================================================================
-- Multi-tenant: společné tabulky (rezervace, tržby, služby…) — každý admin jen svůj kadernictvi_id
-- Spusť jednou v Supabase SQL Editor (nebo: npm run db:apply s DATABASE_URL v .env.local)
-- =============================================================================

-- Aktuální barbershop = záznam v kadernictvi_admini pro přihlášeného uživatele
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

-- --- RLS: authenticated admin vidí jen řádky svého barbershopu ---

ALTER TABLE public.kadernictvi_vydelky ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kadernictvi_vydelky_sluzby ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kadernictvi_trzby ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kadernictvi_rezervace ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kadernictvi_sluzby ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kadernictvi ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kadernictvi_admini ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_select_vydelky" ON public.kadernictvi_vydelky;
CREATE POLICY "admin_select_vydelky"
  ON public.kadernictvi_vydelky FOR SELECT TO authenticated
  USING (kadernictvi_id = public.kadernictvi_aktualni_id());

DROP POLICY IF EXISTS "admin_select_vydelky_sluzby" ON public.kadernictvi_vydelky_sluzby;
CREATE POLICY "admin_select_vydelky_sluzby"
  ON public.kadernictvi_vydelky_sluzby FOR SELECT TO authenticated
  USING (kadernictvi_id = public.kadernictvi_aktualni_id());

DROP POLICY IF EXISTS "authenticated_select_kadernictvi_trzby" ON public.kadernictvi_trzby;
CREATE POLICY "authenticated_select_kadernictvi_trzby"
  ON public.kadernictvi_trzby FOR SELECT TO authenticated
  USING (kadernictvi_id = public.kadernictvi_aktualni_id());

DROP POLICY IF EXISTS "authenticated_select_kadernictvi_rezervace" ON public.kadernictvi_rezervace;
CREATE POLICY "authenticated_select_kadernictvi_rezervace"
  ON public.kadernictvi_rezervace FOR SELECT TO authenticated
  USING (kadernictvi_id = public.kadernictvi_aktualni_id());

DROP POLICY IF EXISTS "authenticated_insert_kadernictvi_rezervace" ON public.kadernictvi_rezervace;
CREATE POLICY "authenticated_insert_kadernictvi_rezervace"
  ON public.kadernictvi_rezervace FOR INSERT TO authenticated
  WITH CHECK (kadernictvi_id = public.kadernictvi_aktualni_id());

DROP POLICY IF EXISTS "authenticated_update_kadernictvi_rezervace" ON public.kadernictvi_rezervace;
CREATE POLICY "authenticated_update_kadernictvi_rezervace"
  ON public.kadernictvi_rezervace FOR UPDATE TO authenticated
  USING (kadernictvi_id = public.kadernictvi_aktualni_id())
  WITH CHECK (kadernictvi_id = public.kadernictvi_aktualni_id());

DROP POLICY IF EXISTS "authenticated_delete_kadernictvi_rezervace" ON public.kadernictvi_rezervace;
CREATE POLICY "authenticated_delete_kadernictvi_rezervace"
  ON public.kadernictvi_rezervace FOR DELETE TO authenticated
  USING (kadernictvi_id = public.kadernictvi_aktualni_id());

DROP POLICY IF EXISTS "authenticated_select_kadernictvi_sluzby" ON public.kadernictvi_sluzby;
CREATE POLICY "authenticated_select_kadernictvi_sluzby"
  ON public.kadernictvi_sluzby FOR SELECT TO authenticated
  USING (kadernictvi_id = public.kadernictvi_aktualni_id());

DROP POLICY IF EXISTS "authenticated_select_kadernictvi" ON public.kadernictvi;
CREATE POLICY "authenticated_select_kadernictvi"
  ON public.kadernictvi FOR SELECT TO authenticated
  USING (id = public.kadernictvi_aktualni_id());

DROP POLICY IF EXISTS "admin_select_own_barbershop_link" ON public.kadernictvi_admini;
CREATE POLICY "admin_select_own_barbershop_link"
  ON public.kadernictvi_admini FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Anon: rezervace a volné sloty (veřejný web) — beze změny principu
DROP POLICY IF EXISTS "anon_insert_kadernictvi_rezervace" ON public.kadernictvi_rezervace;
CREATE POLICY "anon_insert_kadernictvi_rezervace"
  ON public.kadernictvi_rezervace FOR INSERT TO anon
  WITH CHECK (true);

DROP POLICY IF EXISTS "anon_select_kadernictvi_rezervace_slots" ON public.kadernictvi_rezervace;
CREATE POLICY "anon_select_kadernictvi_rezervace_slots"
  ON public.kadernictvi_rezervace FOR SELECT TO anon
  USING (booking_date >= (CURRENT_DATE - INTERVAL '1 day'));

-- Každý barbershop = vlastní řádek v kadernictvi_admini (UNIQUE user_id)
COMMENT ON TABLE public.kadernictvi_admini IS
  'Jeden auth účet = jeden barbershop. Studio Elegance id=1, Donzi id=5, …';
