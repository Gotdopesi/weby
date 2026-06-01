ALTER TABLE public.showcase_barbershop_admins ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admin_select_own_barbershop_link" ON public.showcase_barbershop_admins;
CREATE POLICY "admin_select_own_barbershop_link" ON public.showcase_barbershop_admins FOR SELECT TO authenticated USING (user_id = auth.uid());

ALTER TABLE public.showcase_vydelky ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.showcase_vydelky_sluzby ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admin_select_vydelky" ON public.showcase_vydelky;
CREATE POLICY "admin_select_vydelky" ON public.showcase_vydelky FOR SELECT TO authenticated USING (barbershop_id = public.showcase_current_barbershop_id());
DROP POLICY IF EXISTS "admin_select_vydelky_sluzby" ON public.showcase_vydelky_sluzby;
CREATE POLICY "admin_select_vydelky_sluzby" ON public.showcase_vydelky_sluzby FOR SELECT TO authenticated USING (barbershop_id = public.showcase_current_barbershop_id());

ALTER TABLE public.showcase_rezervace ADD COLUMN IF NOT EXISTS duration_minutes INT DEFAULT 60;
