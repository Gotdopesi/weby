ALTER TABLE public.kadernictvi_admini ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admin_select_own_barbershop_link" ON public.kadernictvi_admini;
CREATE POLICY "admin_select_own_barbershop_link" ON public.kadernictvi_admini FOR SELECT TO authenticated USING (user_id = auth.uid());

ALTER TABLE public.kadernictvi_vydelky ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kadernictvi_vydelky_sluzby ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admin_select_vydelky" ON public.kadernictvi_vydelky;
CREATE POLICY "admin_select_vydelky" ON public.kadernictvi_vydelky FOR SELECT TO authenticated USING (kadernictvi_id = public.kadernictvi_aktualni_id());
DROP POLICY IF EXISTS "admin_select_vydelky_sluzby" ON public.kadernictvi_vydelky_sluzby;
CREATE POLICY "admin_select_vydelky_sluzby" ON public.kadernictvi_vydelky_sluzby FOR SELECT TO authenticated USING (kadernictvi_id = public.kadernictvi_aktualni_id());

ALTER TABLE public.kadernictvi_rezervace ADD COLUMN IF NOT EXISTS duration_minutes INT DEFAULT 60;
