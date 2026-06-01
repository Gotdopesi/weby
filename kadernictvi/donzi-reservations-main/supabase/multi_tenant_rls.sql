-- =============================================================================
-- Multi-tenant: společné tabulky (rezervace, tržby, služby…) — každý admin jen svůj barbershop_id
-- Spusť jednou v Supabase SQL Editor (nebo: npm run db:apply s DATABASE_URL v .env.local)
-- =============================================================================

-- Aktuální barbershop = záznam v showcase_barbershop_admins pro přihlášeného uživatele
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

-- --- RLS: authenticated admin vidí jen řádky svého barbershopu ---

ALTER TABLE public.showcase_vydelky ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.showcase_vydelky_sluzby ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.showcase_trzby ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.showcase_rezervace ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.showcase_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.showcase_barbershops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.showcase_barbershop_admins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_select_vydelky" ON public.showcase_vydelky;
CREATE POLICY "admin_select_vydelky"
  ON public.showcase_vydelky FOR SELECT TO authenticated
  USING (barbershop_id = public.showcase_current_barbershop_id());

DROP POLICY IF EXISTS "admin_select_vydelky_sluzby" ON public.showcase_vydelky_sluzby;
CREATE POLICY "admin_select_vydelky_sluzby"
  ON public.showcase_vydelky_sluzby FOR SELECT TO authenticated
  USING (barbershop_id = public.showcase_current_barbershop_id());

DROP POLICY IF EXISTS "authenticated_select_showcase_trzby" ON public.showcase_trzby;
CREATE POLICY "authenticated_select_showcase_trzby"
  ON public.showcase_trzby FOR SELECT TO authenticated
  USING (barbershop_id = public.showcase_current_barbershop_id());

DROP POLICY IF EXISTS "authenticated_select_showcase_rezervace" ON public.showcase_rezervace;
CREATE POLICY "authenticated_select_showcase_rezervace"
  ON public.showcase_rezervace FOR SELECT TO authenticated
  USING (barbershop_id = public.showcase_current_barbershop_id());

DROP POLICY IF EXISTS "authenticated_insert_showcase_rezervace" ON public.showcase_rezervace;
CREATE POLICY "authenticated_insert_showcase_rezervace"
  ON public.showcase_rezervace FOR INSERT TO authenticated
  WITH CHECK (barbershop_id = public.showcase_current_barbershop_id());

DROP POLICY IF EXISTS "authenticated_update_showcase_rezervace" ON public.showcase_rezervace;
CREATE POLICY "authenticated_update_showcase_rezervace"
  ON public.showcase_rezervace FOR UPDATE TO authenticated
  USING (barbershop_id = public.showcase_current_barbershop_id())
  WITH CHECK (barbershop_id = public.showcase_current_barbershop_id());

DROP POLICY IF EXISTS "authenticated_delete_showcase_rezervace" ON public.showcase_rezervace;
CREATE POLICY "authenticated_delete_showcase_rezervace"
  ON public.showcase_rezervace FOR DELETE TO authenticated
  USING (barbershop_id = public.showcase_current_barbershop_id());

DROP POLICY IF EXISTS "authenticated_select_showcase_services" ON public.showcase_services;
CREATE POLICY "authenticated_select_showcase_services"
  ON public.showcase_services FOR SELECT TO authenticated
  USING (barbershop_id = public.showcase_current_barbershop_id());

DROP POLICY IF EXISTS "authenticated_select_showcase_barbershops" ON public.showcase_barbershops;
CREATE POLICY "authenticated_select_showcase_barbershops"
  ON public.showcase_barbershops FOR SELECT TO authenticated
  USING (id = public.showcase_current_barbershop_id());

DROP POLICY IF EXISTS "admin_select_own_barbershop_link" ON public.showcase_barbershop_admins;
CREATE POLICY "admin_select_own_barbershop_link"
  ON public.showcase_barbershop_admins FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Anon: rezervace a volné sloty (veřejný web) — beze změny principu
DROP POLICY IF EXISTS "anon_insert_showcase_rezervace" ON public.showcase_rezervace;
CREATE POLICY "anon_insert_showcase_rezervace"
  ON public.showcase_rezervace FOR INSERT TO anon
  WITH CHECK (true);

DROP POLICY IF EXISTS "anon_select_showcase_rezervace_slots" ON public.showcase_rezervace;
CREATE POLICY "anon_select_showcase_rezervace_slots"
  ON public.showcase_rezervace FOR SELECT TO anon
  USING (booking_date >= (CURRENT_DATE - INTERVAL '1 day'));

-- Každý barbershop = vlastní řádek v showcase_barbershop_admins (UNIQUE user_id)
COMMENT ON TABLE public.showcase_barbershop_admins IS
  'Jeden auth účet = jeden barbershop. Studio Elegance id=1, Donzi id=5, …';
