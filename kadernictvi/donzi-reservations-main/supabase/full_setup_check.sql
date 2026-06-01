-- =============================================================================
-- GOTDOPESI / Studio Elegance — KOMPLETNÍ SETUP (spusť v Supabase SQL Editor)
-- Pořadí: 1) showcase_schema.sql  2) showcase_v2_schema.sql  3) tento soubor (volitelné kontroly)
-- =============================================================================

-- Sloupec délky u rezervace (pro 30min sloty)
ALTER TABLE public.showcase_rezervace
  ADD COLUMN IF NOT EXISTS duration_minutes INT DEFAULT 60;

UPDATE public.showcase_rezervace r
SET duration_minutes = COALESCE(
  r.duration_minutes,
  s.duration_minutes,
  60
)
FROM public.showcase_services s
WHERE r.service_id = s.id AND r.duration_minutes IS NULL;

-- Přepočet výdělků po migraci
DO $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN
    SELECT DISTINCT barbershop_id, to_char(booking_date, 'YYYY-MM') AS mk
    FROM public.showcase_trzby
    WHERE barbershop_id IS NOT NULL
  LOOP
    PERFORM public.showcase_refresh_vydelky(rec.barbershop_id, rec.mk);
  END LOOP;
END $$;

SELECT 'showcase_barbershops' AS tbl, COUNT(*) FROM public.showcase_barbershops
UNION ALL SELECT 'showcase_services', COUNT(*) FROM public.showcase_services
UNION ALL SELECT 'showcase_rezervace', COUNT(*) FROM public.showcase_rezervace
UNION ALL SELECT 'showcase_vydelky', COUNT(*) FROM public.showcase_vydelky
UNION ALL SELECT 'portfolio_poptavky', COUNT(*) FROM public.portfolio_poptavky;
