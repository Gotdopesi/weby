-- Role adminů: majitel (celý salón) vs. kadeřník (jen vlastní kalendář)
-- Spusť po kadernictvi_pracovnici.sql a showcase_v2_schema.sql

ALTER TABLE public.kadernictvi_admini
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'owner'
    CHECK (role IN ('owner', 'staff')),
  ADD COLUMN IF NOT EXISTS pracovnik_id BIGINT REFERENCES public.kadernictvi_pracovnici (id) ON DELETE SET NULL;

COMMENT ON COLUMN public.kadernictvi_admini.role IS
  'owner = statistiky, zákazníci, celý kalendář; staff = jen vlastní rezervace (pracovnik_id).';
COMMENT ON COLUMN public.kadernictvi_admini.pracovnik_id IS
  'Povinné pro role=staff — vazba na kadernictvi_pracovnici.';

-- Existující admin účty = majitel
UPDATE public.kadernictvi_admini
SET role = 'owner'
WHERE role IS NULL OR role = '';

-- Kontrola: staff musí mít pracovnik_id
ALTER TABLE public.kadernictvi_admini
  DROP CONSTRAINT IF EXISTS kadernictvi_admini_staff_role_chk;

ALTER TABLE public.kadernictvi_admini
  ADD CONSTRAINT kadernictvi_admini_staff_role_chk
  CHECK (
    (role = 'staff' AND pracovnik_id IS NOT NULL)
    OR (role = 'owner' AND pracovnik_id IS NULL)
  );

CREATE OR REPLACE FUNCTION public.kadernictvi_admin_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT role FROM public.kadernictvi_admini WHERE user_id = auth.uid() LIMIT 1),
    'owner'
  );
$$;

CREATE OR REPLACE FUNCTION public.kadernictvi_aktualni_pracovnik_id()
RETURNS BIGINT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT pracovnik_id
  FROM public.kadernictvi_admini
  WHERE user_id = auth.uid()
    AND role = 'staff'
  LIMIT 1;
$$;

-- === RLS: rezervace — kadeřník vidí jen své ===
DROP POLICY IF EXISTS "authenticated_select_kadernictvi_rezervace" ON public.kadernictvi_rezervace;
CREATE POLICY "authenticated_select_kadernictvi_rezervace"
  ON public.kadernictvi_rezervace FOR SELECT TO authenticated
  USING (
    kadernictvi_id = public.kadernictvi_aktualni_id()
    AND (
      public.kadernictvi_admin_role() = 'owner'
      OR pracovnik_id = public.kadernictvi_aktualni_pracovnik_id()
    )
  );

DROP POLICY IF EXISTS "authenticated_insert_kadernictvi_rezervace" ON public.kadernictvi_rezervace;
CREATE POLICY "authenticated_insert_kadernictvi_rezervace"
  ON public.kadernictvi_rezervace FOR INSERT TO authenticated
  WITH CHECK (
    kadernictvi_id = public.kadernictvi_aktualni_id()
    AND (
      public.kadernictvi_admin_role() = 'owner'
      OR pracovnik_id = public.kadernictvi_aktualni_pracovnik_id()
    )
  );

DROP POLICY IF EXISTS "authenticated_update_kadernictvi_rezervace" ON public.kadernictvi_rezervace;
CREATE POLICY "authenticated_update_kadernictvi_rezervace"
  ON public.kadernictvi_rezervace FOR UPDATE TO authenticated
  USING (
    kadernictvi_id = public.kadernictvi_aktualni_id()
    AND (
      public.kadernictvi_admin_role() = 'owner'
      OR pracovnik_id = public.kadernictvi_aktualni_pracovnik_id()
    )
  )
  WITH CHECK (
    kadernictvi_id = public.kadernictvi_aktualni_id()
    AND (
      public.kadernictvi_admin_role() = 'owner'
      OR pracovnik_id = public.kadernictvi_aktualni_pracovnik_id()
    )
  );

DROP POLICY IF EXISTS "authenticated_delete_kadernictvi_rezervace" ON public.kadernictvi_rezervace;
CREATE POLICY "authenticated_delete_kadernictvi_rezervace"
  ON public.kadernictvi_rezervace FOR DELETE TO authenticated
  USING (
    kadernictvi_id = public.kadernictvi_aktualni_id()
    AND (
      public.kadernictvi_admin_role() = 'owner'
      OR pracovnik_id = public.kadernictvi_aktualni_pracovnik_id()
    )
  );

-- Majitel only: zákazníci, výdělky
DROP POLICY IF EXISTS "admin_select_kadernictvi_zakaznici" ON public.kadernictvi_zakaznici;
DROP POLICY IF EXISTS "admin_select_zakaznici" ON public.kadernictvi_zakaznici;
CREATE POLICY "admin_select_kadernictvi_zakaznici"
  ON public.kadernictvi_zakaznici FOR SELECT TO authenticated
  USING (
    kadernictvi_id = public.kadernictvi_aktualni_id()
    AND public.kadernictvi_admin_role() = 'owner'
  );

DROP POLICY IF EXISTS "admin_update_kadernictvi_zakaznici" ON public.kadernictvi_zakaznici;
DROP POLICY IF EXISTS "admin_update_zakaznici" ON public.kadernictvi_zakaznici;
CREATE POLICY "admin_update_kadernictvi_zakaznici"
  ON public.kadernictvi_zakaznici FOR UPDATE TO authenticated
  USING (
    kadernictvi_id = public.kadernictvi_aktualni_id()
    AND public.kadernictvi_admin_role() = 'owner'
  )
  WITH CHECK (
    kadernictvi_id = public.kadernictvi_aktualni_id()
    AND public.kadernictvi_admin_role() = 'owner'
  );

DROP POLICY IF EXISTS "admin_select_vydelky" ON public.kadernictvi_vydelky;
CREATE POLICY "admin_select_vydelky"
  ON public.kadernictvi_vydelky FOR SELECT TO authenticated
  USING (
    kadernictvi_id = public.kadernictvi_aktualni_id()
    AND public.kadernictvi_admin_role() = 'owner'
  );

DROP POLICY IF EXISTS "admin_select_vydelky_sluzby" ON public.kadernictvi_vydelky_sluzby;
CREATE POLICY "admin_select_vydelky_sluzby"
  ON public.kadernictvi_vydelky_sluzby FOR SELECT TO authenticated
  USING (
    kadernictvi_id = public.kadernictvi_aktualni_id()
    AND public.kadernictvi_admin_role() = 'owner'
  );

-- === Příklad: propojení kadeřníka po vytvoření Auth uživatele ===
-- 1) Supabase → Authentication → Users → Add user (email + heslo)
-- 2) Nahraď UUID a pracovnik_id:
--
-- INSERT INTO public.kadernictvi_admini (kadernictvi_id, user_id, login_label, role, pracovnik_id)
-- SELECT
--   b.id,
--   'UUID-Z-AUTH'::uuid,
--   'monika',
--   'staff',
--   s.id
-- FROM public.kadernictvi b
-- JOIN public.kadernictvi_pracovnici s ON s.kadernictvi_id = b.id AND s.first_name = 'Monika'
-- WHERE b.slug = 'studio-elegance'
-- ON CONFLICT (user_id) DO UPDATE SET
--   role = EXCLUDED.role,
--   pracovnik_id = EXCLUDED.pracovnik_id,
--   login_label = EXCLUDED.login_label;
