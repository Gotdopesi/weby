-- Donzi: smazat neaktivní služby, přemapovat staré rezervace, zapnout přepočet tržeb

-- 1) Přemapovat rezervace ze zastaralých neaktivních služeb na aktuální ceník
UPDATE public.showcase_rezervace r
SET
  service_id = 46,
  service = 'Gentleman (střih, vousy, úprava obočí + styling)'
FROM public.showcase_barbershops b
WHERE b.id = r.barbershop_id
  AND b.slug = 'donzi-dobruska'
  AND r.service_id IN (16, 17);

UPDATE public.showcase_rezervace r
SET
  service_id = 47,
  service = 'VIP péče'
FROM public.showcase_barbershops b
WHERE b.id = r.barbershop_id
  AND b.slug = 'donzi-dobruska'
  AND r.service_id = 18;

-- 2) Trigger: přepočet showcase_vydelky při změně showcase_trzby (chyběl v DB)
CREATE OR REPLACE FUNCTION public.showcase_refresh_vydelky_for_trzby_row()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_shop BIGINT;
  v_month TEXT;
BEGIN
  v_shop := COALESCE(NEW.barbershop_id, OLD.barbershop_id);
  v_month := to_char(COALESCE(NEW.booking_date, OLD.booking_date), 'YYYY-MM');
  IF v_shop IS NOT NULL AND v_month IS NOT NULL THEN
    PERFORM public.showcase_refresh_vydelky(v_shop, v_month);
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_refresh_vydelky ON public.showcase_trzby;
CREATE TRIGGER trg_refresh_vydelky
  AFTER INSERT OR UPDATE OR DELETE ON public.showcase_trzby
  FOR EACH ROW
  EXECUTE FUNCTION public.showcase_refresh_vydelky_for_trzby_row();

-- 3) Přepočet tržeb Donzi (barbershop_id = 5) ze stávajících řádků showcase_trzby
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT DISTINCT barbershop_id, to_char(booking_date, 'YYYY-MM') AS mk
    FROM public.showcase_trzby
    WHERE barbershop_id = (SELECT id FROM public.showcase_barbershops WHERE slug = 'donzi-dobruska' LIMIT 1)
  LOOP
    PERFORM public.showcase_refresh_vydelky(r.barbershop_id, r.mk);
  END LOOP;
END $$;

-- 4) Smazat neaktivní služby Donzi (už bez vazeb)
DELETE FROM public.showcase_vydelky_sluzby v
USING public.showcase_services s
JOIN public.showcase_barbershops b ON b.id = s.barbershop_id
WHERE v.service_id = s.id
  AND b.slug = 'donzi-dobruska'
  AND NOT s.is_active;

DELETE FROM public.showcase_services s
USING public.showcase_barbershops b
WHERE s.barbershop_id = b.id
  AND b.slug = 'donzi-dobruska'
  AND NOT s.is_active
  AND NOT EXISTS (SELECT 1 FROM public.showcase_rezervace r WHERE r.service_id = s.id)
  AND NOT EXISTS (SELECT 1 FROM public.showcase_trzby t WHERE t.service_id = s.id);

-- Kontrola
SELECT 'inactive_left' AS check, COUNT(*)::int AS cnt
FROM public.showcase_services s
JOIN public.showcase_barbershops b ON b.id = s.barbershop_id
WHERE b.slug = 'donzi-dobruska' AND NOT s.is_active;

SELECT month_key, earned, planned, total
FROM public.showcase_vydelky
WHERE barbershop_id = (SELECT id FROM public.showcase_barbershops WHERE slug = 'donzi-dobruska')
ORDER BY month_key;
