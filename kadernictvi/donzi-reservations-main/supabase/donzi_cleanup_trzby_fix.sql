-- Donzi: smazat neaktivní služby, přemapovat staré rezervace, zapnout přepočet tržeb

-- 1) Přemapovat rezervace ze zastaralých neaktivních služeb na aktuální ceník
UPDATE public.kadernictvi_rezervace r
SET
  service_id = 46,
  service = 'Gentleman (střih, vousy, úprava obočí + styling)'
FROM public.kadernictvi b
WHERE b.id = r.kadernictvi_id
  AND b.slug = 'donzi-dobruska'
  AND r.service_id IN (16, 17);

UPDATE public.kadernictvi_rezervace r
SET
  service_id = 47,
  service = 'VIP péče'
FROM public.kadernictvi b
WHERE b.id = r.kadernictvi_id
  AND b.slug = 'donzi-dobruska'
  AND r.service_id = 18;

-- 2) Trigger: přepočet kadernictvi_vydelky při změně kadernictvi_trzby (chyběl v DB)
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

-- 3) Přepočet tržeb Donzi (kadernictvi_id = 5) ze stávajících řádků kadernictvi_trzby
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT DISTINCT kadernictvi_id, to_char(booking_date, 'YYYY-MM') AS mk
    FROM public.kadernictvi_trzby
    WHERE kadernictvi_id = (SELECT id FROM public.kadernictvi WHERE slug = 'donzi-dobruska' LIMIT 1)
  LOOP
    PERFORM public.kadernictvi_obnovit_vydelky(r.kadernictvi_id, r.mk);
  END LOOP;
END $$;

-- 4) Smazat neaktivní služby Donzi (už bez vazeb)
DELETE FROM public.kadernictvi_vydelky_sluzby v
USING public.kadernictvi_sluzby s
JOIN public.kadernictvi b ON b.id = s.kadernictvi_id
WHERE v.service_id = s.id
  AND b.slug = 'donzi-dobruska'
  AND NOT s.is_active;

DELETE FROM public.kadernictvi_sluzby s
USING public.kadernictvi b
WHERE s.kadernictvi_id = b.id
  AND b.slug = 'donzi-dobruska'
  AND NOT s.is_active
  AND NOT EXISTS (SELECT 1 FROM public.kadernictvi_rezervace r WHERE r.service_id = s.id)
  AND NOT EXISTS (SELECT 1 FROM public.kadernictvi_trzby t WHERE t.service_id = s.id);

-- Kontrola
SELECT 'inactive_left' AS check, COUNT(*)::int AS cnt
FROM public.kadernictvi_sluzby s
JOIN public.kadernictvi b ON b.id = s.kadernictvi_id
WHERE b.slug = 'donzi-dobruska' AND NOT s.is_active;

SELECT month_key, earned, planned, total
FROM public.kadernictvi_vydelky
WHERE kadernictvi_id = (SELECT id FROM public.kadernictvi WHERE slug = 'donzi-dobruska')
ORDER BY month_key;
