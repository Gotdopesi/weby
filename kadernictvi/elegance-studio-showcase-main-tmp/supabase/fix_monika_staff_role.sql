-- Monika = jen kadeřník (staff), ne majitel
-- Spusť v Supabase SQL Editoru po showcase_admin_roles.sql

UPDATE public.kadernictvi_admini a
SET
  role = 'staff',
  pracovnik_id = s.id
FROM public.kadernictvi b
JOIN public.kadernictvi_pracovnici s ON s.kadernictvi_id = b.id AND s.first_name = 'Monika'
JOIN auth.users u ON u.id = a.user_id
WHERE a.kadernictvi_id = b.id
  AND b.slug = 'studio-elegance'
  AND lower(u.email) = 'dev.monika@studio-elegance.test';

-- Kontrola
-- SELECT u.email, a.role, a.pracovnik_id, s.first_name
-- FROM kadernictvi_admini a
-- JOIN auth.users u ON u.id = a.user_id
-- LEFT JOIN kadernictvi_pracovnici s ON s.id = a.pracovnik_id;
