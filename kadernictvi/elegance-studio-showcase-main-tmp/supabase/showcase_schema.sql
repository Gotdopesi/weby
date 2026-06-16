-- =============================================================================
-- Studio Elegance — přejmenování na showcase_* + tabulka tržeb
-- Spusť v Supabase → SQL Editor (celý skript).
-- =============================================================================

-- 1) Přejmenování existujících tabulek (bez ztráty dat)
DO $$
BEGIN
  IF to_regclass('public.rezervace') IS NOT NULL AND to_regclass('public.kadernictvi_rezervace') IS NULL THEN
    ALTER TABLE public.rezervace RENAME TO kadernictvi_rezervace;
  END IF;
  IF to_regclass('public.barbershops') IS NOT NULL AND to_regclass('public.kadernictvi') IS NULL THEN
    ALTER TABLE public.barbershops RENAME TO kadernictvi;
  END IF;
  IF to_regclass('public.services') IS NOT NULL AND to_regclass('public.kadernictvi_sluzby') IS NULL THEN
    ALTER TABLE public.services RENAME TO kadernictvi_sluzby;
  END IF;
  IF to_regclass('public.booking_slots') IS NOT NULL AND to_regclass('public.showcase_booking_slots') IS NULL THEN
    ALTER TABLE public.booking_slots RENAME TO showcase_booking_slots;
  END IF;
END $$;

-- 2) Barbershop (pokud ještě neexistuje)
CREATE TABLE IF NOT EXISTS public.kadernictvi (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  email TEXT,
  sms_price NUMERIC(4, 2) DEFAULT 1.30,
  credit_balance NUMERIC(10, 2) DEFAULT 500.00,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.kadernictvi (name, slug, email, sms_price, credit_balance)
VALUES ('Studio Elegance', 'studio-elegance', 'info@studioelegance.cz', 1.30, 500.00)
ON CONFLICT (slug) DO NOTHING;

-- 3) Služby (střihy + cena + délka)
CREATE TABLE IF NOT EXISTS public.kadernictvi_sluzby (
  id BIGSERIAL PRIMARY KEY,
  kadernictvi_id BIGINT NOT NULL REFERENCES public.kadernictvi (id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
  duration_minutes INT NOT NULL DEFAULT 60 CHECK (duration_minutes > 0),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (kadernictvi_id, name)
);

ALTER TABLE public.kadernictvi_sluzby
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;

-- 4) Rezervace (pokud tabulka nevznikla přejmenováním, vytvoř minimální strukturu)
CREATE TABLE IF NOT EXISTS public.kadernictvi_rezervace (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kadernictvi_id BIGINT REFERENCES public.kadernictvi (id),
  service_id BIGINT REFERENCES public.kadernictvi_sluzby (id),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  service TEXT NOT NULL,
  booking_date DATE NOT NULL,
  booking_time TEXT NOT NULL,
  total_price NUMERIC(10, 2),
  status TEXT NOT NULL DEFAULT 'confirmed',
  sms_sent BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.kadernictvi_rezervace
  ADD COLUMN IF NOT EXISTS kadernictvi_id BIGINT REFERENCES public.kadernictvi (id),
  ADD COLUMN IF NOT EXISTS service_id BIGINT REFERENCES public.kadernictvi_sluzby (id),
  ADD COLUMN IF NOT EXISTS total_price NUMERIC(10, 2),
  ADD COLUMN IF NOT EXISTS sms_sent BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE public.kadernictvi_rezervace ALTER COLUMN status SET DEFAULT 'confirmed';
UPDATE public.kadernictvi_rezervace SET status = 'confirmed' WHERE status IS NULL OR status = 'pending';

UPDATE public.kadernictvi_rezervace r
SET kadernictvi_id = (SELECT id FROM public.kadernictvi WHERE slug = 'studio-elegance' LIMIT 1)
WHERE r.kadernictvi_id IS NULL;

-- 5) Tržby (odvozené z rezervací — synchronizuje trigger)
CREATE TABLE IF NOT EXISTS public.kadernictvi_trzby (
  id BIGSERIAL PRIMARY KEY,
  rezervace_id UUID NOT NULL UNIQUE REFERENCES public.kadernictvi_rezervace (id) ON DELETE CASCADE,
  kadernictvi_id BIGINT NOT NULL REFERENCES public.kadernictvi (id) ON DELETE CASCADE,
  service_id BIGINT REFERENCES public.kadernictvi_sluzby (id) ON DELETE SET NULL,
  service_name TEXT NOT NULL,
  amount NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (amount >= 0),
  revenue_kind TEXT NOT NULL CHECK (revenue_kind IN ('earned', 'planned', 'canceled')),
  booking_date DATE NOT NULL,
  booking_time TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS kadernictvi_trzby_month_idx
  ON public.kadernictvi_trzby (kadernictvi_id, booking_date);

-- Výpočet druhu tržby a částky
CREATE OR REPLACE FUNCTION public.showcase_resolve_revenue_kind(
  p_status TEXT,
  p_booking_date DATE,
  p_booking_time TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_at TIMESTAMPTZ;
  v_h INT;
  v_m INT;
BEGIN
  IF p_status = 'canceled' THEN
    RETURN 'canceled';
  END IF;
  v_h := split_part(p_booking_time, ':', 1)::INT;
  v_m := COALESCE(NULLIF(split_part(p_booking_time, ':', 2), '')::INT, 0);
  v_at := (p_booking_date::TIMESTAMP + make_interval(hours => v_h, mins => v_m));
  IF p_status = 'completed' OR v_at < now() THEN
    RETURN 'earned';
  END IF;
  RETURN 'planned';
END;
$$;

CREATE OR REPLACE FUNCTION public.showcase_sync_trzby_from_rezervace()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_amount NUMERIC(10, 2);
  v_kind TEXT;
BEGIN
  IF TG_OP = 'DELETE' THEN
    DELETE FROM public.kadernictvi_trzby WHERE rezervace_id = OLD.id;
    RETURN OLD;
  END IF;

  v_amount := COALESCE(
    NEW.total_price,
    (SELECT s.price FROM public.kadernictvi_sluzby s WHERE s.id = NEW.service_id),
    0
  );
  v_kind := public.showcase_resolve_revenue_kind(NEW.status, NEW.booking_date, NEW.booking_time);

  INSERT INTO public.kadernictvi_trzby (
    rezervace_id, kadernictvi_id, service_id, service_name, amount, revenue_kind, booking_date, booking_time, updated_at
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.kadernictvi_id, (SELECT id FROM public.kadernictvi ORDER BY id LIMIT 1)),
    NEW.service_id,
    NEW.service,
    v_amount,
    v_kind,
    NEW.booking_date,
    NEW.booking_time,
    now()
  )
  ON CONFLICT (rezervace_id) DO UPDATE SET
    kadernictvi_id = EXCLUDED.kadernictvi_id,
    service_id = EXCLUDED.service_id,
    service_name = EXCLUDED.service_name,
    amount = EXCLUDED.amount,
    revenue_kind = EXCLUDED.revenue_kind,
    booking_date = EXCLUDED.booking_date,
    booking_time = EXCLUDED.booking_time,
    updated_at = now();

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_showcase_sync_trzby ON public.kadernictvi_rezervace;
CREATE TRIGGER trg_showcase_sync_trzby
  AFTER INSERT OR UPDATE OR DELETE ON public.kadernictvi_rezervace
  FOR EACH ROW
  EXECUTE FUNCTION public.showcase_sync_trzby_from_rezervace();

-- Backfill tržeb ze stávajících rezervací
INSERT INTO public.kadernictvi_trzby (
  rezervace_id, kadernictvi_id, service_id, service_name, amount, revenue_kind, booking_date, booking_time
)
SELECT
  r.id,
  COALESCE(r.kadernictvi_id, (SELECT id FROM public.kadernictvi ORDER BY id LIMIT 1)),
  r.service_id,
  r.service,
  COALESCE(r.total_price, s.price, 0),
  public.showcase_resolve_revenue_kind(r.status, r.booking_date, r.booking_time),
  r.booking_date,
  r.booking_time
FROM public.kadernictvi_rezervace r
LEFT JOIN public.kadernictvi_sluzby s ON s.id = r.service_id
ON CONFLICT (rezervace_id) DO UPDATE SET
  amount = EXCLUDED.amount,
  revenue_kind = EXCLUDED.revenue_kind,
  updated_at = now();

-- Výchozí služby
INSERT INTO public.kadernictvi_sluzby (kadernictvi_id, name, price, duration_minutes)
SELECT b.id, v.name, v.price, v.duration_minutes
FROM public.kadernictvi b
CROSS JOIN (
  VALUES
    ('Dámský střih', 890::numeric, 60),
    ('Pánský střih', 590::numeric, 45),
    ('Barvení vlasů', 1490::numeric, 120),
    ('Balayage', 2890::numeric, 180),
    ('Melír', 1790::numeric, 150),
    ('Společenský účes', 1290::numeric, 90)
) AS v(name, price, duration_minutes)
WHERE b.slug = 'studio-elegance'
ON CONFLICT (kadernictvi_id, name) DO NOTHING;

-- 6) RLS
ALTER TABLE public.kadernictvi ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kadernictvi_sluzby ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kadernictvi_rezervace ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kadernictvi_trzby ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_insert_kadernictvi_rezervace" ON public.kadernictvi_rezervace;
CREATE POLICY "anon_insert_kadernictvi_rezervace"
  ON public.kadernictvi_rezervace FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "anon_select_kadernictvi_rezervace_slots" ON public.kadernictvi_rezervace;
CREATE POLICY "anon_select_kadernictvi_rezervace_slots"
  ON public.kadernictvi_rezervace FOR SELECT TO anon
  USING (booking_date >= (CURRENT_DATE - INTERVAL '1 day'));

DROP POLICY IF EXISTS "authenticated_select_kadernictvi_rezervace" ON public.kadernictvi_rezervace;
CREATE POLICY "authenticated_select_kadernictvi_rezervace"
  ON public.kadernictvi_rezervace FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "authenticated_insert_kadernictvi_rezervace" ON public.kadernictvi_rezervace;
CREATE POLICY "authenticated_insert_kadernictvi_rezervace"
  ON public.kadernictvi_rezervace FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_update_kadernictvi_rezervace" ON public.kadernictvi_rezervace;
CREATE POLICY "authenticated_update_kadernictvi_rezervace"
  ON public.kadernictvi_rezervace FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_delete_kadernictvi_rezervace" ON public.kadernictvi_rezervace;
CREATE POLICY "authenticated_delete_kadernictvi_rezervace"
  ON public.kadernictvi_rezervace FOR DELETE TO authenticated USING (true);

DROP POLICY IF EXISTS "anon_select_kadernictvi_sluzby" ON public.kadernictvi_sluzby;
CREATE POLICY "anon_select_kadernictvi_sluzby"
  ON public.kadernictvi_sluzby FOR SELECT TO anon, authenticated
  USING (is_active = true OR auth.role() = 'authenticated');

DROP POLICY IF EXISTS "authenticated_all_kadernictvi_sluzby" ON public.kadernictvi_sluzby;
CREATE POLICY "authenticated_all_kadernictvi_sluzby"
  ON public.kadernictvi_sluzby FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_select_kadernictvi" ON public.kadernictvi;
CREATE POLICY "authenticated_select_kadernictvi"
  ON public.kadernictvi FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "authenticated_select_kadernictvi_trzby" ON public.kadernictvi_trzby;
CREATE POLICY "authenticated_select_kadernictvi_trzby"
  ON public.kadernictvi_trzby FOR SELECT TO authenticated USING (true);

-- Realtime: Database → Replication → kadernictvi
