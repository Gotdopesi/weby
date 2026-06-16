-- Oprava trigger funkcí po přejmenování tabulek showcase_* → kadernictvi_*
-- Spusť v Supabase SQL Editoru nebo přes migraci.

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

DROP FUNCTION IF EXISTS public.showcase_refresh_vydelky_for_trzby_row();
DROP FUNCTION IF EXISTS public.showcase_refresh_vydelky(BIGINT, TEXT);
