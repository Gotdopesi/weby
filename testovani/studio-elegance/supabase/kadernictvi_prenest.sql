-- =============================================================================
-- Přejmenování showcase_* → kadernictvi_* (přehledné české názvy)
-- Spusť jednou v Supabase SQL Editoru (projekt hnkcjrvqbeojegujuuyw)
-- =============================================================================

-- §1 Tabulky
ALTER TABLE IF EXISTS public.showcase_barbershops RENAME TO kadernictvi;
ALTER TABLE IF EXISTS public.showcase_barbershop_admins RENAME TO kadernictvi_admini;
ALTER TABLE IF EXISTS public.showcase_staff RENAME TO kadernictvi_pracovnici;
ALTER TABLE IF EXISTS public.showcase_rezervace RENAME TO kadernictvi_rezervace;
ALTER TABLE IF EXISTS public.showcase_services RENAME TO kadernictvi_sluzby;
ALTER TABLE IF EXISTS public.showcase_staff_services RENAME TO kadernictvi_pracovnik_sluzby;
ALTER TABLE IF EXISTS public.showcase_staff_blocks RENAME TO kadernictvi_pracovnik_blokace;
ALTER TABLE IF EXISTS public.showcase_zakaznici RENAME TO kadernictvi_zakaznici;
ALTER TABLE IF EXISTS public.showcase_sms_vyuctovani RENAME TO kadernictvi_sms;
ALTER TABLE IF EXISTS public.showcase_trzby RENAME TO kadernictvi_trzby;
ALTER TABLE IF EXISTS public.showcase_vydelky RENAME TO kadernictvi_vydelky;
ALTER TABLE IF EXISTS public.showcase_vydelky_sluzby RENAME TO kadernictvi_vydelky_sluzby;

-- §2 Sloupce kadernictvi_id
ALTER TABLE IF EXISTS public.kadernictvi_admini RENAME COLUMN barbershop_id TO kadernictvi_id;
ALTER TABLE IF EXISTS public.kadernictvi_pracovnici RENAME COLUMN barbershop_id TO kadernictvi_id;
ALTER TABLE IF EXISTS public.kadernictvi_rezervace RENAME COLUMN barbershop_id TO kadernictvi_id;
ALTER TABLE IF EXISTS public.kadernictvi_sluzby RENAME COLUMN barbershop_id TO kadernictvi_id;
ALTER TABLE IF EXISTS public.kadernictvi_zakaznici RENAME COLUMN barbershop_id TO kadernictvi_id;
ALTER TABLE IF EXISTS public.kadernictvi_sms RENAME COLUMN barbershop_id TO kadernictvi_id;
ALTER TABLE IF EXISTS public.kadernictvi_trzby RENAME COLUMN barbershop_id TO kadernictvi_id;
ALTER TABLE IF EXISTS public.kadernictvi_vydelky RENAME COLUMN barbershop_id TO kadernictvi_id;
ALTER TABLE IF EXISTS public.kadernictvi_vydelky_sluzby RENAME COLUMN barbershop_id TO kadernictvi_id;
ALTER TABLE IF EXISTS public.kadernictvi_pracovnik_blokace RENAME COLUMN barbershop_id TO kadernictvi_id;
ALTER TABLE IF EXISTS public.portfolio_poptavky RENAME COLUMN barbershop_id TO kadernictvi_id;

-- §3 Sloupce pracovnik_id
ALTER TABLE IF EXISTS public.kadernictvi_admini RENAME COLUMN staff_id TO pracovnik_id;
ALTER TABLE IF EXISTS public.kadernictvi_rezervace RENAME COLUMN staff_id TO pracovnik_id;
ALTER TABLE IF EXISTS public.kadernictvi_pracovnik_sluzby RENAME COLUMN staff_id TO pracovnik_id;
ALTER TABLE IF EXISTS public.kadernictvi_pracovnik_blokace RENAME COLUMN staff_id TO pracovnik_id;

-- §4 SMS — evidence per pracovník (vyúčtování na konci měsíce)
ALTER TABLE public.kadernictvi_sms
  ADD COLUMN IF NOT EXISTS pracovnik_id BIGINT REFERENCES public.kadernictvi_pracovnici (id) ON DELETE SET NULL;

UPDATE public.kadernictvi_sms s
SET pracovnik_id = r.pracovnik_id
FROM public.kadernictvi_rezervace r
WHERE r.id = s.rezervace_id AND s.pracovnik_id IS NULL;

CREATE INDEX IF NOT EXISTS kadernictvi_sms_pracovnik_sent_idx
  ON public.kadernictvi_sms (kadernictvi_id, pracovnik_id, sent_at DESC);

COMMENT ON TABLE public.kadernictvi IS 'Salony / kadeřnictví (multi-tenant).';
COMMENT ON TABLE public.kadernictvi_pracovnici IS 'Kadeřníci salónu — photo_url = externí URL.';
COMMENT ON TABLE public.kadernictvi_rezervace IS 'Rezervace klientů.';
COMMENT ON TABLE public.kadernictvi_sluzby IS 'Ceník služeb salónu.';
COMMENT ON TABLE public.kadernictvi_sms IS 'Vyúčtování SMS per salón a pracovník (bez limitu).';

-- §5 Funkce (nahradí showcase_*)
DROP FUNCTION IF EXISTS public.showcase_current_barbershop_id();
DROP FUNCTION IF EXISTS public.showcase_current_admin_role();
DROP FUNCTION IF EXISTS public.showcase_current_staff_id();

CREATE OR REPLACE FUNCTION public.kadernictvi_aktualni_id()
RETURNS BIGINT LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT kadernictvi_id FROM public.kadernictvi_admini WHERE user_id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.kadernictvi_admin_role()
RETURNS TEXT LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(
    (SELECT role FROM public.kadernictvi_admini WHERE user_id = auth.uid() LIMIT 1),
    'owner'
  );
$$;

CREATE OR REPLACE FUNCTION public.kadernictvi_aktualni_pracovnik_id()
RETURNS BIGINT LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT pracovnik_id FROM public.kadernictvi_admini
  WHERE user_id = auth.uid() AND role = 'staff' LIMIT 1;
$$;

-- §6 RLS — smazat staré policies (showcase názvy)
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT policyname, tablename FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN (
        'kadernictvi', 'kadernictvi_admini', 'kadernictvi_pracovnici', 'kadernictvi_rezervace',
        'kadernictvi_sluzby', 'kadernictvi_pracovnik_sluzby', 'kadernictvi_pracovnik_blokace',
        'kadernictvi_zakaznici', 'kadernictvi_sms', 'kadernictvi_trzby', 'kadernictvi_vydelky',
        'kadernictvi_vydelky_sluzby'
      )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
  END LOOP;
END $$;

-- kadernictvi (salony)
ALTER TABLE public.kadernictvi ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_vidi_sve_kadernictvi" ON public.kadernictvi FOR SELECT TO authenticated
  USING (id = public.kadernictvi_aktualni_id());

-- pracovnici
ALTER TABLE public.kadernictvi_pracovnici ENABLE ROW LEVEL SECURITY;
CREATE POLICY "verejne_aktivni_pracovnici" ON public.kadernictvi_pracovnici FOR SELECT TO anon
  USING (is_active = TRUE);
CREATE POLICY "admin_vidi_pracovniky" ON public.kadernictvi_pracovnici FOR SELECT TO authenticated
  USING (kadernictvi_id = public.kadernictvi_aktualni_id());
CREATE POLICY "admin_spravuje_pracovniky" ON public.kadernictvi_pracovnici FOR ALL TO authenticated
  USING (kadernictvi_id = public.kadernictvi_aktualni_id())
  WITH CHECK (kadernictvi_id = public.kadernictvi_aktualni_id());
CREATE POLICY "pracovnik_upravuje_sebe" ON public.kadernictvi_pracovnici FOR UPDATE TO authenticated
  USING (kadernictvi_id = public.kadernictvi_aktualni_id() AND (
    public.kadernictvi_admin_role() = 'owner' OR id = public.kadernictvi_aktualni_pracovnik_id()
  ))
  WITH CHECK (kadernictvi_id = public.kadernictvi_aktualni_id() AND (
    public.kadernictvi_admin_role() = 'owner' OR id = public.kadernictvi_aktualni_pracovnik_id()
  ));

-- sluzby
ALTER TABLE public.kadernictvi_sluzby ENABLE ROW LEVEL SECURITY;
CREATE POLICY "verejne_aktivni_sluzby" ON public.kadernictvi_sluzby FOR SELECT TO anon
  USING (is_active = TRUE);
CREATE POLICY "admin_sluzby" ON public.kadernictvi_sluzby FOR ALL TO authenticated
  USING (kadernictvi_id = public.kadernictvi_aktualni_id())
  WITH CHECK (kadernictvi_id = public.kadernictvi_aktualni_id());

-- pracovnik_sluzby
ALTER TABLE public.kadernictvi_pracovnik_sluzby ENABLE ROW LEVEL SECURITY;
CREATE POLICY "verejne_pracovnik_sluzby" ON public.kadernictvi_pracovnik_sluzby FOR SELECT TO anon, authenticated
  USING (TRUE);
CREATE POLICY "admin_pracovnik_sluzby" ON public.kadernictvi_pracovnik_sluzby FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.kadernictvi_pracovnici p
    WHERE p.id = pracovnik_id AND p.kadernictvi_id = public.kadernictvi_aktualni_id()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.kadernictvi_pracovnici p
    WHERE p.id = pracovnik_id AND p.kadernictvi_id = public.kadernictvi_aktualni_id()
  ));

-- rezervace
ALTER TABLE public.kadernictvi_rezervace ENABLE ROW LEVEL SECURITY;
CREATE POLICY "verejne_vlozit_rezervaci" ON public.kadernictvi_rezervace FOR INSERT TO anon
  WITH CHECK (TRUE);
CREATE POLICY "verejne_sloty_rezervaci" ON public.kadernictvi_rezervace FOR SELECT TO anon
  USING (booking_date >= (CURRENT_DATE - INTERVAL '1 day'));
CREATE POLICY "admin_cte_rezervace" ON public.kadernictvi_rezervace FOR SELECT TO authenticated
  USING (kadernictvi_id = public.kadernictvi_aktualni_id() AND (
    public.kadernictvi_admin_role() = 'owner' OR pracovnik_id = public.kadernictvi_aktualni_pracovnik_id()
  ));
CREATE POLICY "admin_vlozi_rezervaci" ON public.kadernictvi_rezervace FOR INSERT TO authenticated
  WITH CHECK (kadernictvi_id = public.kadernictvi_aktualni_id() AND (
    public.kadernictvi_admin_role() = 'owner' OR pracovnik_id = public.kadernictvi_aktualni_pracovnik_id()
  ));
CREATE POLICY "admin_upravuje_rezervaci" ON public.kadernictvi_rezervace FOR UPDATE TO authenticated
  USING (kadernictvi_id = public.kadernictvi_aktualni_id() AND (
    public.kadernictvi_admin_role() = 'owner' OR pracovnik_id = public.kadernictvi_aktualni_pracovnik_id()
  ))
  WITH CHECK (kadernictvi_id = public.kadernictvi_aktualni_id() AND (
    public.kadernictvi_admin_role() = 'owner' OR pracovnik_id = public.kadernictvi_aktualni_pracovnik_id()
  ));
CREATE POLICY "admin_smaze_rezervaci" ON public.kadernictvi_rezervace FOR DELETE TO authenticated
  USING (kadernictvi_id = public.kadernictvi_aktualni_id() AND (
    public.kadernictvi_admin_role() = 'owner' OR pracovnik_id = public.kadernictvi_aktualni_pracovnik_id()
  ));

-- blokace
ALTER TABLE public.kadernictvi_pracovnik_blokace ENABLE ROW LEVEL SECURITY;
CREATE POLICY "verejne_blokace_sloty" ON public.kadernictvi_pracovnik_blokace FOR SELECT TO anon
  USING (block_date >= (CURRENT_DATE - INTERVAL '1 day'));
CREATE POLICY "admin_cte_blokace" ON public.kadernictvi_pracovnik_blokace FOR SELECT TO authenticated
  USING (kadernictvi_id = public.kadernictvi_aktualni_id() AND (
    public.kadernictvi_admin_role() = 'owner' OR pracovnik_id = public.kadernictvi_aktualni_pracovnik_id()
  ));
CREATE POLICY "admin_vlozi_blokaci" ON public.kadernictvi_pracovnik_blokace FOR INSERT TO authenticated
  WITH CHECK (kadernictvi_id = public.kadernictvi_aktualni_id() AND (
    public.kadernictvi_admin_role() = 'owner' OR pracovnik_id = public.kadernictvi_aktualni_pracovnik_id()
  ));
CREATE POLICY "admin_smaze_blokaci" ON public.kadernictvi_pracovnik_blokace FOR DELETE TO authenticated
  USING (kadernictvi_id = public.kadernictvi_aktualni_id() AND (
    public.kadernictvi_admin_role() = 'owner' OR pracovnik_id = public.kadernictvi_aktualni_pracovnik_id()
  ));

-- zakaznici, vydelky, trzby — jen majitel
ALTER TABLE public.kadernictvi_zakaznici ENABLE ROW LEVEL SECURITY;
CREATE POLICY "majitel_zakaznici" ON public.kadernictvi_zakaznici FOR SELECT TO authenticated
  USING (kadernictvi_id = public.kadernictvi_aktualni_id() AND public.kadernictvi_admin_role() = 'owner');
CREATE POLICY "majitel_zakaznici_uprava" ON public.kadernictvi_zakaznici FOR UPDATE TO authenticated
  USING (kadernictvi_id = public.kadernictvi_aktualni_id() AND public.kadernictvi_admin_role() = 'owner')
  WITH CHECK (kadernictvi_id = public.kadernictvi_aktualni_id() AND public.kadernictvi_admin_role() = 'owner');

ALTER TABLE public.kadernictvi_vydelky ENABLE ROW LEVEL SECURITY;
CREATE POLICY "majitel_vydelky" ON public.kadernictvi_vydelky FOR SELECT TO authenticated
  USING (kadernictvi_id = public.kadernictvi_aktualni_id() AND public.kadernictvi_admin_role() = 'owner');

ALTER TABLE public.kadernictvi_vydelky_sluzby ENABLE ROW LEVEL SECURITY;
CREATE POLICY "majitel_vydelky_sluzby" ON public.kadernictvi_vydelky_sluzby FOR SELECT TO authenticated
  USING (kadernictvi_id = public.kadernictvi_aktualni_id() AND public.kadernictvi_admin_role() = 'owner');

ALTER TABLE public.kadernictvi_trzby ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_trzby" ON public.kadernictvi_trzby FOR SELECT TO authenticated
  USING (kadernictvi_id = public.kadernictvi_aktualni_id());

ALTER TABLE public.kadernictvi_sms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "majitel_sms" ON public.kadernictvi_sms FOR SELECT TO authenticated
  USING (kadernictvi_id = public.kadernictvi_aktualni_id() AND public.kadernictvi_admin_role() = 'owner');

-- §7 Vyúčtování SMS na konci měsíce (příklad dotazu)
-- SELECT kadernictvi_id, pracovnik_id, date_trunc('month', sent_at) AS mesic,
--        COUNT(*) AS pocet_sms, SUM(amount) AS castka_kc
-- FROM kadernictvi_sms
-- GROUP BY 1, 2, 3 ORDER BY 3 DESC, 2;
