-- =============================================================================
-- Donzi Dobruška — propojení admin účtu + kontrola dat
-- Spusť v Supabase → SQL Editor
-- =============================================================================

-- 1) Ověř barbershop Donzi (slug donzi-dobruska, typicky id = 5)
SELECT id, slug, name, email FROM public.kadernictvi WHERE slug = 'donzi-dobruska';

-- 2) Počet služeb pro Donzi
SELECT COUNT(*) AS service_count
FROM public.kadernictvi_sluzby s
JOIN public.kadernictvi b ON b.id = s.kadernictvi_id
WHERE b.slug = 'donzi-dobruska';

-- 3) Propoj admina s Donzi (nahraď USER_UUID z Authentication → Users)
--    Jeden auth účet = jeden barbershop (UNIQUE na user_id).
-- INSERT INTO public.kadernictvi_admini (kadernictvi_id, user_id, login_label)
-- SELECT b.id, 'USER_UUID_HERE'::uuid, 'donzi-dobruska'
-- FROM public.kadernictvi b
-- WHERE b.slug = 'donzi-dobruska'
-- ON CONFLICT (user_id) DO UPDATE SET
--   kadernictvi_id = EXCLUDED.kadernictvi_id,
--   login_label = EXCLUDED.login_label;

-- 4) Kontrola propojení
-- SELECT a.*, b.slug, b.name
-- FROM public.kadernictvi_admini a
-- JOIN public.kadernictvi b ON b.id = a.kadernictvi_id;

-- 5) Přepočet statistik služeb pro aktuální měsíc (po prvních rezervacích)
-- SELECT public.kadernictvi_obnovit_vydelky(
--   (SELECT id FROM public.kadernictvi WHERE slug = 'donzi-dobruska' LIMIT 1),
--   to_char(CURRENT_DATE, 'YYYY-MM')
-- );
