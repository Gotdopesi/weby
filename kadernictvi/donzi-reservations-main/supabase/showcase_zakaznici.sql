-- Zákazníci salónu — agregace z rezervací (multi-tenant přes kadernictvi_id)

ALTER TABLE public.kadernictvi_rezervace
  ADD COLUMN IF NOT EXISTS note TEXT;

CREATE TABLE IF NOT EXISTS public.kadernictvi_zakaznici (
  id BIGSERIAL PRIMARY KEY,
  kadernictvi_id BIGINT NOT NULL REFERENCES public.kadernictvi (id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL DEFAULT '',
  note TEXT,
  visit_count INT NOT NULL DEFAULT 0 CHECK (visit_count >= 0),
  first_visit_date DATE,
  last_visit_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (kadernictvi_id, email)
);

CREATE INDEX IF NOT EXISTS kadernictvi_zakaznici_shop_visits_idx
  ON public.kadernictvi_zakaznici (kadernictvi_id, visit_count DESC);

CREATE INDEX IF NOT EXISTS kadernictvi_zakaznici_shop_email_idx
  ON public.kadernictvi_zakaznici (kadernictvi_id, lower(email));

COMMENT ON TABLE public.kadernictvi_zakaznici IS
  'Zákazníci salónu — automaticky z online/admin rezervací.';

CREATE OR REPLACE FUNCTION public.showcase_upsert_zakaznik_from_rezervace()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email TEXT;
BEGIN
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;

  v_email := lower(trim(COALESCE(NEW.email, '')));
  IF v_email = '' OR NEW.kadernictvi_id IS NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.status = 'canceled' THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.kadernictvi_zakaznici (
      kadernictvi_id, email, first_name, last_name, note,
      visit_count, first_visit_date, last_visit_date, updated_at
    )
    VALUES (
      NEW.kadernictvi_id,
      v_email,
      COALESCE(NULLIF(trim(NEW.first_name), ''), '—'),
      COALESCE(NULLIF(trim(NEW.last_name), ''), ''),
      NULLIF(trim(COALESCE(NEW.note, '')), ''),
      CASE WHEN NEW.booking_date <= CURRENT_DATE THEN 1 ELSE 0 END,
      CASE WHEN NEW.booking_date <= CURRENT_DATE THEN NEW.booking_date ELSE NULL END,
      CASE WHEN NEW.booking_date <= CURRENT_DATE THEN NEW.booking_date ELSE NULL END,
      now()
    )
    ON CONFLICT (kadernictvi_id, email) DO UPDATE SET
      first_name = EXCLUDED.first_name,
      last_name = EXCLUDED.last_name,
      note = COALESCE(EXCLUDED.note, kadernictvi_zakaznici.note),
      visit_count = kadernictvi_zakaznici.visit_count
        + CASE WHEN NEW.booking_date <= CURRENT_DATE THEN 1 ELSE 0 END,
      last_visit_date = CASE
        WHEN NEW.booking_date <= CURRENT_DATE THEN NEW.booking_date
        ELSE kadernictvi_zakaznici.last_visit_date
      END,
      first_visit_date = COALESCE(
        kadernictvi_zakaznici.first_visit_date,
        CASE WHEN NEW.booking_date <= CURRENT_DATE THEN NEW.booking_date ELSE NULL END
      ),
      updated_at = now();
  ELSIF TG_OP = 'UPDATE' AND OLD.status = 'canceled' AND NEW.status IS DISTINCT FROM 'canceled' THEN
    UPDATE public.kadernictvi_zakaznici SET
      visit_count = visit_count
        + CASE WHEN NEW.booking_date <= CURRENT_DATE THEN 1 ELSE 0 END,
      last_visit_date = CASE
        WHEN NEW.booking_date <= CURRENT_DATE THEN NEW.booking_date
        ELSE last_visit_date
      END,
      first_visit_date = COALESCE(
        first_visit_date,
        CASE WHEN NEW.booking_date <= CURRENT_DATE THEN NEW.booking_date ELSE NULL END
      ),
      updated_at = now()
    WHERE kadernictvi_id = NEW.kadernictvi_id AND email = v_email;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_showcase_zakaznik_from_rezervace ON public.kadernictvi_rezervace;
CREATE TRIGGER trg_showcase_zakaznik_from_rezervace
  AFTER INSERT OR UPDATE ON public.kadernictvi_rezervace
  FOR EACH ROW
  EXECUTE FUNCTION public.showcase_upsert_zakaznik_from_rezervace();

-- Backfill ze stávajících rezervací
INSERT INTO public.kadernictvi_zakaznici (
  kadernictvi_id, email, first_name, last_name, note,
  visit_count, first_visit_date, last_visit_date
)
SELECT
  r.kadernictvi_id,
  lower(trim(r.email)) AS email,
  (array_agg(r.first_name ORDER BY r.booking_date DESC, r.booking_time DESC))[1] AS first_name,
  COALESCE((array_agg(r.last_name ORDER BY r.booking_date DESC, r.booking_time DESC))[1], '') AS last_name,
  (array_agg(r.note ORDER BY r.booking_date DESC) FILTER (WHERE r.note IS NOT NULL AND trim(r.note) <> ''))[1] AS note,
  COUNT(*) FILTER (WHERE r.booking_date <= CURRENT_DATE)::INT AS visit_count,
  MIN(r.booking_date) FILTER (WHERE r.booking_date <= CURRENT_DATE) AS first_visit_date,
  MAX(r.booking_date) FILTER (WHERE r.booking_date <= CURRENT_DATE) AS last_visit_date
FROM public.kadernictvi_rezervace r
WHERE r.kadernictvi_id IS NOT NULL
  AND r.email IS NOT NULL
  AND trim(r.email) <> ''
  AND COALESCE(r.status, '') <> 'canceled'
GROUP BY r.kadernictvi_id, lower(trim(r.email))
ON CONFLICT (kadernictvi_id, email) DO UPDATE SET
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  note = COALESCE(EXCLUDED.note, kadernictvi_zakaznici.note),
  visit_count = EXCLUDED.visit_count,
  first_visit_date = EXCLUDED.first_visit_date,
  last_visit_date = EXCLUDED.last_visit_date,
  updated_at = now();

ALTER TABLE public.kadernictvi_zakaznici ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_select_kadernictvi_zakaznici" ON public.kadernictvi_zakaznici;
CREATE POLICY "admin_select_kadernictvi_zakaznici"
  ON public.kadernictvi_zakaznici FOR SELECT TO authenticated
  USING (kadernictvi_id = public.kadernictvi_aktualni_id());

DROP POLICY IF EXISTS "admin_update_kadernictvi_zakaznici" ON public.kadernictvi_zakaznici;
CREATE POLICY "admin_update_kadernictvi_zakaznici"
  ON public.kadernictvi_zakaznici FOR UPDATE TO authenticated
  USING (kadernictvi_id = public.kadernictvi_aktualni_id())
  WITH CHECK (kadernictvi_id = public.kadernictvi_aktualni_id());

-- Přepočet návštěv — jen proběhlé termíny (booking_date <= dnes)
UPDATE public.kadernictvi_zakaznici z
SET
  visit_count = c.cnt,
  first_visit_date = c.first_d,
  last_visit_date = c.last_d,
  updated_at = now()
FROM (
  SELECT
    r.kadernictvi_id,
    lower(trim(r.email)) AS email,
    COUNT(*) FILTER (WHERE COALESCE(r.status, '') <> 'canceled' AND r.booking_date <= CURRENT_DATE)::INT AS cnt,
    MIN(r.booking_date) FILTER (WHERE COALESCE(r.status, '') <> 'canceled' AND r.booking_date <= CURRENT_DATE) AS first_d,
    MAX(r.booking_date) FILTER (WHERE COALESCE(r.status, '') <> 'canceled' AND r.booking_date <= CURRENT_DATE) AS last_d
  FROM public.kadernictvi_rezervace r
  WHERE r.email IS NOT NULL AND trim(r.email) <> ''
  GROUP BY r.kadernictvi_id, lower(trim(r.email))
) c
WHERE z.kadernictvi_id = c.kadernictvi_id AND z.email = c.email;
