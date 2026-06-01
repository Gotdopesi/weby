CREATE OR REPLACE FUNCTION public.showcase_current_barbershop_id()
RETURNS BIGINT LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT barbershop_id FROM public.showcase_barbershop_admins WHERE user_id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.showcase_refresh_vydelky(p_barbershop_id BIGINT, p_month_key TEXT)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_earned NUMERIC(12,2); v_planned NUMERIC(12,2);
BEGIN
  SELECT COALESCE(SUM(amount) FILTER (WHERE revenue_kind = 'earned'),0),
         COALESCE(SUM(amount) FILTER (WHERE revenue_kind = 'planned'),0)
  INTO v_earned, v_planned FROM public.showcase_trzby t
  WHERE t.barbershop_id = p_barbershop_id AND to_char(t.booking_date,'YYYY-MM') = p_month_key AND t.revenue_kind <> 'canceled';
  IF p_month_key < to_char(CURRENT_DATE,'YYYY-MM') THEN v_planned := 0; END IF;
  INSERT INTO public.showcase_vydelky (barbershop_id, month_key, earned, planned, total, updated_at)
  VALUES (p_barbershop_id, p_month_key, v_earned, v_planned, v_earned + v_planned, now())
  ON CONFLICT (barbershop_id, month_key) DO UPDATE SET earned = EXCLUDED.earned, planned = EXCLUDED.planned, total = EXCLUDED.total, updated_at = now();
  DELETE FROM public.showcase_vydelky_sluzby WHERE barbershop_id = p_barbershop_id AND month_key = p_month_key;
  INSERT INTO public.showcase_vydelky_sluzby (barbershop_id, service_id, service_name, month_key, price, count_earned, count_planned, count_total, amount_earned, amount_planned, amount_total, updated_at)
  SELECT p_barbershop_id, t.service_id, t.service_name, p_month_key, COALESCE(s.price, AVG(t.amount), 0),
    COUNT(*) FILTER (WHERE t.revenue_kind = 'earned')::INT, COUNT(*) FILTER (WHERE t.revenue_kind = 'planned')::INT, COUNT(*)::INT,
    COALESCE(SUM(t.amount) FILTER (WHERE t.revenue_kind = 'earned'),0), COALESCE(SUM(t.amount) FILTER (WHERE t.revenue_kind = 'planned'),0),
    COALESCE(SUM(t.amount) FILTER (WHERE t.revenue_kind IN ('earned','planned')),0), now()
  FROM public.showcase_trzby t LEFT JOIN public.showcase_services s ON s.id = t.service_id
  WHERE t.barbershop_id = p_barbershop_id AND to_char(t.booking_date,'YYYY-MM') = p_month_key AND t.revenue_kind <> 'canceled'
  GROUP BY t.service_id, t.service_name, s.price;
END; $$;
