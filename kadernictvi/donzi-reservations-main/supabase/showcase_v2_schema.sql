-- =============================================================================
-- Studio Elegance v2 — portfolio_poptavky, multi-admin, vydelky, purge rezervací
-- Spusť po showcase_schema.sql v Supabase SQL Editor.
-- =============================================================================

-- 1) Hlavní tabulka poptávek z webu (kontaktní formulář)
CREATE TABLE IF NOT EXISTS public.portfolio_poptavky (
  id BIGSERIAL PRIMARY KEY,
  kadernictvi_id BIGINT REFERENCES public.kadernictvi (id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'read', 'done')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS portfolio_poptavky_created_idx ON public.portfolio_poptavky (created_at DESC);

-- 2) Admin účet ↔ salón (Supabase Auth user_id)
CREATE TABLE IF NOT EXISTS public.kadernictvi_admini (
  id BIGSERIAL PRIMARY KEY,
  kadernictvi_id BIGINT NOT NULL REFERENCES public.kadernictvi (id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  login_label TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id),
  UNIQUE (kadernictvi_id, user_id)
);

ALTER TABLE public.kadernictvi
  ADD COLUMN IF NOT EXISTS admin_email TEXT;

COMMENT ON TABLE public.kadernictvi_admini IS
  'Propojení auth.users s jedním barbershopem. Po přihlášení admin vidí jen svůj kadernictvi_id.';

-- 3) Měsíční výdělky (agregát pro admin /trzby)
CREATE TABLE IF NOT EXISTS public.kadernictvi_vydelky (
  id BIGSERIAL PRIMARY KEY,
  kadernictvi_id BIGINT NOT NULL REFERENCES public.kadernictvi (id) ON DELETE CASCADE,
  month_key TEXT NOT NULL CHECK (month_key ~ '^\d{4}-\d{2}$'),
  earned NUMERIC(12, 2) NOT NULL DEFAULT 0,
  planned NUMERIC(12, 2) NOT NULL DEFAULT 0,
  total NUMERIC(12, 2) NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (kadernictvi_id, month_key)
);

-- 4) Výdělky po službách (read-only přehled v admin Služby)
CREATE TABLE IF NOT EXISTS public.kadernictvi_vydelky_sluzby (
  id BIGSERIAL PRIMARY KEY,
  kadernictvi_id BIGINT NOT NULL REFERENCES public.kadernictvi (id) ON DELETE CASCADE,
  service_id BIGINT REFERENCES public.kadernictvi_sluzby (id) ON DELETE SET NULL,
  service_name TEXT NOT NULL,
  month_key TEXT NOT NULL CHECK (month_key ~ '^\d{4}-\d{2}$'),
  price NUMERIC(10, 2) NOT NULL DEFAULT 0,
  count_earned INT NOT NULL DEFAULT 0,
  count_planned INT NOT NULL DEFAULT 0,
  count_total INT NOT NULL DEFAULT 0,
  amount_earned NUMERIC(12, 2) NOT NULL DEFAULT 0,
  amount_planned NUMERIC(12, 2) NOT NULL DEFAULT 0,
  amount_total NUMERIC(12, 2) NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (kadernictvi_id, service_id, month_key)
);

CREATE INDEX IF NOT EXISTS kadernictvi_vydelky_sluzby_month_idx
  ON public.kadernictvi_vydelky_sluzby (kadernictvi_id, month_key);

-- Aktuální barbershop přihlášeného uživatele
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

-- Přepočet výdělků z kadernictvi_trzby pro daný měsíc
CREATE OR REPLACE FUNCTION public.kadernictvi_obnovit_vydelky(
  p_kadernictvi_id BIGINT,
  p_month_key TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_earned NUMERIC(12, 2);
  v_planned NUMERIC(12, 2);
BEGIN
  SELECT
    COALESCE(SUM(amount) FILTER (WHERE revenue_kind = 'earned'), 0),
    COALESCE(SUM(amount) FILTER (WHERE revenue_kind = 'planned'), 0)
  INTO v_earned, v_planned
  FROM public.kadernictvi_trzby t
  WHERE t.kadernictvi_id = p_kadernictvi_id
    AND to_char(t.booking_date, 'YYYY-MM') = p_month_key
    AND t.revenue_kind <> 'canceled';

  -- Minulé měsíce: plán už nezobrazujeme (jen vyděláno)
  IF p_month_key < to_char(CURRENT_DATE, 'YYYY-MM') THEN
    v_planned := 0;
  END IF;

  INSERT INTO public.kadernictvi_vydelky (kadernictvi_id, month_key, earned, planned, total, updated_at)
  VALUES (p_kadernictvi_id, p_month_key, v_earned, v_planned, v_earned + v_planned, now())
  ON CONFLICT (kadernictvi_id, month_key) DO UPDATE SET
    earned = EXCLUDED.earned,
    planned = EXCLUDED.planned,
    total = EXCLUDED.total,
    updated_at = now();

  DELETE FROM public.kadernictvi_vydelky_sluzby
  WHERE kadernictvi_id = p_kadernictvi_id AND month_key = p_month_key;

  INSERT INTO public.kadernictvi_vydelky_sluzby (
    kadernictvi_id, service_id, service_name, month_key, price,
    count_earned, count_planned, count_total,
    amount_earned, amount_planned, amount_total, updated_at
  )
  SELECT
    p_kadernictvi_id,
    t.service_id,
    t.service_name,
    p_month_key,
    COALESCE(s.price, AVG(t.amount), 0),
    COUNT(*) FILTER (WHERE t.revenue_kind = 'earned')::INT,
    COUNT(*) FILTER (WHERE t.revenue_kind = 'planned')::INT,
    COUNT(*)::INT,
    COALESCE(SUM(t.amount) FILTER (WHERE t.revenue_kind = 'earned'), 0),
    COALESCE(SUM(t.amount) FILTER (WHERE t.revenue_kind = 'planned'), 0),
    COALESCE(SUM(t.amount) FILTER (WHERE t.revenue_kind IN ('earned', 'planned')), 0),
    now()
  FROM public.kadernictvi_trzby t
  LEFT JOIN public.kadernictvi_sluzby s ON s.id = t.service_id
  WHERE t.kadernictvi_id = p_kadernictvi_id
    AND to_char(t.booking_date, 'YYYY-MM') = p_month_key
    AND t.revenue_kind <> 'canceled'
  GROUP BY t.service_id, t.service_name, s.price;
END;
$$;

CREATE OR REPLACE FUNCTION public.kadernictvi_obnovit_vydelky_for_trzby_row()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_shop BIGINT;
  v_month TEXT;
BEGIN
  v_shop := COALESCE(NEW.kadernictvi_id, OLD.kadernictvi_id);
  v_month := to_char(COALESCE(NEW.booking_date, OLD.booking_date), 'YYYY-MM');
  IF v_shop IS NOT NULL AND v_month IS NOT NULL THEN
    PERFORM public.kadernictvi_obnovit_vydelky(v_shop, v_month);
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_refresh_vydelky ON public.kadernictvi_trzby;
CREATE TRIGGER trg_refresh_vydelky
  AFTER INSERT OR UPDATE OR DELETE ON public.kadernictvi_trzby
  FOR EACH ROW
  EXECUTE FUNCTION public.kadernictvi_obnovit_vydelky_for_trzby_row();

-- Backfill výdělků
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT DISTINCT kadernictvi_id, to_char(booking_date, 'YYYY-MM') AS mk
    FROM public.kadernictvi_trzby
    WHERE kadernictvi_id IS NOT NULL
  LOOP
    PERFORM public.kadernictvi_obnovit_vydelky(r.kadernictvi_id, r.mk);
  END LOOP;
END $$;

-- 5) Automatické mazání starých rezervací (starší než 1 měsíc od data termínu)
CREATE OR REPLACE FUNCTION public.showcase_purge_old_rezervace()
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INT;
BEGIN
  WITH deleted AS (
    DELETE FROM public.kadernictvi_rezervace
    WHERE booking_date < (CURRENT_DATE - INTERVAL '1 month')
    RETURNING id
  )
  SELECT COUNT(*)::INT INTO v_count FROM deleted;
  RETURN v_count;
END;
$$;

-- Volitelně: pg_cron (Supabase → Database → Extensions → pg_cron)
-- SELECT cron.schedule('showcase-purge-rezervace', '0 3 * * *', $$SELECT public.showcase_purge_old_rezervace()$$);

-- 6) RLS — portfolio_poptavky
ALTER TABLE public.portfolio_poptavky ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_insert_portfolio_poptavky" ON public.portfolio_poptavky;
CREATE POLICY "anon_insert_portfolio_poptavky"
  ON public.portfolio_poptavky FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_select_portfolio_poptavky" ON public.portfolio_poptavky;
CREATE POLICY "authenticated_select_portfolio_poptavky"
  ON public.portfolio_poptavky FOR SELECT TO authenticated
  USING (
    kadernictvi_id IS NULL
    OR kadernictvi_id = public.kadernictvi_aktualni_id()
  );

-- RLS — barbershop admins (jen vlastní řádek)
ALTER TABLE public.kadernictvi_admini ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_select_own_barbershop_link" ON public.kadernictvi_admini;
CREATE POLICY "admin_select_own_barbershop_link"
  ON public.kadernictvi_admini FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- RLS — vydelky (jen vlastní salón)
ALTER TABLE public.kadernictvi_vydelky ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kadernictvi_vydelky_sluzby ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_select_vydelky" ON public.kadernictvi_vydelky;
CREATE POLICY "admin_select_vydelky"
  ON public.kadernictvi_vydelky FOR SELECT TO authenticated
  USING (kadernictvi_id = public.kadernictvi_aktualni_id());

DROP POLICY IF EXISTS "admin_select_vydelky_sluzby" ON public.kadernictvi_vydelky_sluzby;
CREATE POLICY "admin_select_vydelky_sluzby"
  ON public.kadernictvi_vydelky_sluzby FOR SELECT TO authenticated
  USING (kadernictvi_id = public.kadernictvi_aktualni_id());

-- Užší RLS na rezervace / služby / tržby — jen vlastní barbershop
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

DROP POLICY IF EXISTS "authenticated_all_kadernictvi_sluzby" ON public.kadernictvi_sluzby;
DROP POLICY IF EXISTS "authenticated_select_kadernictvi_sluzby" ON public.kadernictvi_sluzby;
CREATE POLICY "authenticated_select_kadernictvi_sluzby"
  ON public.kadernictvi_sluzby FOR SELECT TO authenticated
  USING (kadernictvi_id = public.kadernictvi_aktualni_id());

DROP POLICY IF EXISTS "authenticated_select_kadernictvi_trzby" ON public.kadernictvi_trzby;
CREATE POLICY "authenticated_select_kadernictvi_trzby"
  ON public.kadernictvi_trzby FOR SELECT TO authenticated
  USING (kadernictvi_id = public.kadernictvi_aktualni_id());

DROP POLICY IF EXISTS "authenticated_select_kadernictvi" ON public.kadernictvi;
CREATE POLICY "authenticated_select_kadernictvi"
  ON public.kadernictvi FOR SELECT TO authenticated
  USING (id = public.kadernictvi_aktualni_id());

-- Propojení admina pro barbershop id=1 (nahraď USER_UUID z Authentication → Users)
-- INSERT INTO public.kadernictvi_admini (kadernictvi_id, user_id, login_label)
-- VALUES (1, 'USER_UUID'::uuid, 'studio-elegance')
-- ON CONFLICT (user_id) DO UPDATE SET kadernictvi_id = EXCLUDED.kadernictvi_id;

ALTER TABLE public.kadernictvi_rezervace
  ADD COLUMN IF NOT EXISTS duration_minutes INT DEFAULT 60;

COMMENT ON COLUMN public.kadernictvi_rezervace.duration_minutes IS
  'Délka služby v minutách — pro blokování slotů po 30 min.';

-- =============================================================================
-- PŘIDÁNÍ DALŠÍHO BARBERSHOPU (barber #2, #3…)
-- =============================================================================
-- 1) INSERT INTO kadernictvi (name, slug, email) VALUES ('Salon XY', 'salon-xy', 'info@xy.cz');
-- 2) INSERT INTO kadernictvi_sluzby (kadernictvi_id, name, price, duration_minutes) VALUES (2, 'Pánský střih', 650, 45);
-- 3) V Supabase Auth vytvoř uživatele → INSERT INTO kadernictvi_admini (kadernictvi_id, user_id, login_label) VALUES (2, 'UUID', 'salon-xy');
UPDATE public.kadernictvi
SET admin_email = COALESCE(admin_email, email)
WHERE slug = 'studio-elegance';
