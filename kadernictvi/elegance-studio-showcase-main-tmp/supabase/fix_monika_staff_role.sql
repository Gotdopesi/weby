-- Monika = jen kadeřník (staff), ne majitel
-- Spusť v Supabase SQL Editoru po showcase_admin_roles.sql

UPDATE public.showcase_barbershop_admins a
SET
  role = 'staff',
  staff_id = s.id
FROM public.showcase_barbershops b
JOIN public.showcase_staff s ON s.barbershop_id = b.id AND s.first_name = 'Monika'
JOIN auth.users u ON u.id = a.user_id
WHERE a.barbershop_id = b.id
  AND b.slug = 'studio-elegance'
  AND lower(u.email) = 'dev.monika@studio-elegance.test';

-- Kontrola
-- SELECT u.email, a.role, a.staff_id, s.first_name
-- FROM showcase_barbershop_admins a
-- JOIN auth.users u ON u.id = a.user_id
-- LEFT JOIN showcase_staff s ON s.id = a.staff_id;
