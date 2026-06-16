-- =============================================================================
-- GOTDOPESI / Studio Elegance — KOMPLETNÍ SETUP (spusť v Supabase SQL Editor)
-- Pořadí: 1) showcase_schema.sql  2) showcase_v2_schema.sql  3) tento soubor (volitelné kontroly)
-- =============================================================================

-- Sloupec délky u rezervace (pro 30min sloty)
ALTER TABLE public.kadernictvi_rezervace
  ADD COLUMN IF NOT EXISTS duration_minutes INT DEFAULT 60;

UPDATE public.kadernictvi_rezervace r
SET duration_minutes = COALESCE(
  r.duration_minutes,
  s.duration_minutes,
  60
)
FROM public.kadernictvi_sluzby s
WHERE r.service_id = s.id AND r.duration_minutes IS NULL;

-- Přepočet výdělků po migraci
DO $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN
    SELECT DISTINCT kadernictvi_id, to_char(booking_date, 'YYYY-MM') AS mk
    FROM public.kadernictvi_trzby
    WHERE kadernictvi_id IS NOT NULL
  LOOP
    PERFORM public.kadernictvi_obnovit_vydelky(rec.kadernictvi_id, rec.mk);
  END LOOP;
END $$;

SELECT 'kadernictvi' AS tbl, COUNT(*) FROM public.kadernictvi
UNION ALL SELECT 'kadernictvi_sluzby', COUNT(*) FROM public.kadernictvi_sluzby
UNION ALL SELECT 'kadernictvi_rezervace', COUNT(*) FROM public.kadernictvi_rezervace
UNION ALL SELECT 'kadernictvi_vydelky', COUNT(*) FROM public.kadernictvi_vydelky
UNION ALL SELECT 'portfolio_poptavky', COUNT(*) FROM public.portfolio_poptavky;
