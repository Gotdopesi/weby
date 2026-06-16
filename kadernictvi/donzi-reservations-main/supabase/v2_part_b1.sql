CREATE OR REPLACE FUNCTION public.kadernictvi_aktualni_id()
RETURNS BIGINT LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT kadernictvi_id FROM public.kadernictvi_admini WHERE user_id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.kadernictvi_obnovit_vydelky(p_kadernictvi_id BIGINT, p_month_key TEXT)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_earned NUMERIC(12,2); v_planned NUMERIC(12,2);
BEGIN
  SELECT COALESCE(SUM(amount) FILTER (WHERE revenue_kind = 'earned'),0),
         COALESCE(SUM(amount) FILTER (WHERE revenue_kind = 'planned'),0)
  INTO v_earned, v_planned FROM public.kadernictvi_trzby t
  WHERE t.kadernictvi_id = p_kadernictvi_id AND to_char(t.booking_date,'YYYY-MM') = p_month_key AND t.revenue_kind <> 'canceled';
  IF p_month_key < to_char(CURRENT_DATE,'YYYY-MM') THEN v_planned := 0; END IF;
  INSERT INTO public.kadernictvi_vydelky (kadernictvi_id, month_key, earned, planned, total, updated_at)
  VALUES (p_kadernictvi_id, p_month_key, v_earned, v_planned, v_earned + v_planned, now())
  ON CONFLICT (kadernictvi_id, month_key) DO UPDATE SET earned = EXCLUDED.earned, planned = EXCLUDED.planned, total = EXCLUDED.total, updated_at = now();
  DELETE FROM public.kadernictvi_vydelky_sluzby WHERE kadernictvi_id = p_kadernictvi_id AND month_key = p_month_key;
  INSERT INTO public.kadernictvi_vydelky_sluzby (kadernictvi_id, service_id, service_name, month_key, price, count_earned, count_planned, count_total, amount_earned, amount_planned, amount_total, updated_at)
  SELECT p_kadernictvi_id, t.service_id, t.service_name, p_month_key, COALESCE(s.price, AVG(t.amount), 0),
    COUNT(*) FILTER (WHERE t.revenue_kind = 'earned')::INT, COUNT(*) FILTER (WHERE t.revenue_kind = 'planned')::INT, COUNT(*)::INT,
    COALESCE(SUM(t.amount) FILTER (WHERE t.revenue_kind = 'earned'),0), COALESCE(SUM(t.amount) FILTER (WHERE t.revenue_kind = 'planned'),0),
    COALESCE(SUM(t.amount) FILTER (WHERE t.revenue_kind IN ('earned','planned')),0), now()
  FROM public.kadernictvi_trzby t LEFT JOIN public.kadernictvi_sluzby s ON s.id = t.service_id
  WHERE t.kadernictvi_id = p_kadernictvi_id AND to_char(t.booking_date,'YYYY-MM') = p_month_key AND t.revenue_kind <> 'canceled'
  GROUP BY t.service_id, t.service_name, s.price;
END; $$;
