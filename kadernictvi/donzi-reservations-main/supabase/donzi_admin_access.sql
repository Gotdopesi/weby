-- =============================================================================
-- Donzi Dobruška — propojení admin účtu + kontrola dat
-- Spusť v Supabase → SQL Editor
-- =============================================================================

-- 1) Ověř barbershop Donzi (slug donzi-dobruska, typicky id = 5)
SELECT id, slug, name, email FROM public.showcase_barbershops WHERE slug = 'donzi-dobruska';

-- 2) Počet služeb pro Donzi
SELECT COUNT(*) AS service_count
FROM public.showcase_services s
JOIN public.showcase_barbershops b ON b.id = s.barbershop_id
WHERE b.slug = 'donzi-dobruska';

-- 3) Propoj admina s Donzi (nahraď USER_UUID z Authentication → Users)
--    Jeden auth účet = jeden barbershop (UNIQUE na user_id).
-- INSERT INTO public.showcase_barbershop_admins (barbershop_id, user_id, login_label)
-- SELECT b.id, 'USER_UUID_HERE'::uuid, 'donzi-dobruska'
-- FROM public.showcase_barbershops b
-- WHERE b.slug = 'donzi-dobruska'
-- ON CONFLICT (user_id) DO UPDATE SET
--   barbershop_id = EXCLUDED.barbershop_id,
--   login_label = EXCLUDED.login_label;

-- 4) Kontrola propojení
-- SELECT a.*, b.slug, b.name
-- FROM public.showcase_barbershop_admins a
-- JOIN public.showcase_barbershops b ON b.id = a.barbershop_id;

-- 5) Přepočet statistik služeb pro aktuální měsíc (po prvních rezervacích)
-- SELECT public.showcase_refresh_vydelky(
--   (SELECT id FROM public.showcase_barbershops WHERE slug = 'donzi-dobruska' LIMIT 1),
--   to_char(CURRENT_DATE, 'YYYY-MM')
-- );
