-- Role adminů: majitel (celý salón) vs. kadeřník (jen vlastní kalendář)
-- Spusť po showcase_staff.sql a showcase_v2_schema.sql

ALTER TABLE public.showcase_barbershop_admins
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'owner'
    CHECK (role IN ('owner', 'staff')),
  ADD COLUMN IF NOT EXISTS staff_id BIGINT REFERENCES public.showcase_staff (id) ON DELETE SET NULL;

COMMENT ON COLUMN public.showcase_barbershop_admins.role IS
  'owner = statistiky, zákazníci, celý kalendář; staff = jen vlastní rezervace (staff_id).';
COMMENT ON COLUMN public.showcase_barbershop_admins.staff_id IS
  'Povinné pro role=staff — vazba na showcase_staff.';

-- Existující admin účty = majitel
UPDATE public.showcase_barbershop_admins
SET role = 'owner'
WHERE role IS NULL OR role = '';

-- Kontrola: staff musí mít staff_id
ALTER TABLE public.showcase_barbershop_admins
  DROP CONSTRAINT IF EXISTS showcase_barbershop_admins_staff_role_chk;

ALTER TABLE public.showcase_barbershop_admins
  ADD CONSTRAINT showcase_barbershop_admins_staff_role_chk
  CHECK (
    (role = 'staff' AND staff_id IS NOT NULL)
    OR (role = 'owner' AND staff_id IS NULL)
  );

CREATE OR REPLACE FUNCTION public.showcase_current_admin_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT role FROM public.showcase_barbershop_admins WHERE user_id = auth.uid() LIMIT 1),
    'owner'
  );
$$;

CREATE OR REPLACE FUNCTION public.showcase_current_staff_id()
RETURNS BIGINT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT staff_id
  FROM public.showcase_barbershop_admins
  WHERE user_id = auth.uid()
    AND role = 'staff'
  LIMIT 1;
$$;

-- === RLS: rezervace — kadeřník vidí jen své ===
DROP POLICY IF EXISTS "authenticated_select_showcase_rezervace" ON public.showcase_rezervace;
CREATE POLICY "authenticated_select_showcase_rezervace"
  ON public.showcase_rezervace FOR SELECT TO authenticated
  USING (
    barbershop_id = public.showcase_current_barbershop_id()
    AND (
      public.showcase_current_admin_role() = 'owner'
      OR staff_id = public.showcase_current_staff_id()
    )
  );

DROP POLICY IF EXISTS "authenticated_insert_showcase_rezervace" ON public.showcase_rezervace;
CREATE POLICY "authenticated_insert_showcase_rezervace"
  ON public.showcase_rezervace FOR INSERT TO authenticated
  WITH CHECK (
    barbershop_id = public.showcase_current_barbershop_id()
    AND (
      public.showcase_current_admin_role() = 'owner'
      OR staff_id = public.showcase_current_staff_id()
    )
  );

DROP POLICY IF EXISTS "authenticated_update_showcase_rezervace" ON public.showcase_rezervace;
CREATE POLICY "authenticated_update_showcase_rezervace"
  ON public.showcase_rezervace FOR UPDATE TO authenticated
  USING (
    barbershop_id = public.showcase_current_barbershop_id()
    AND (
      public.showcase_current_admin_role() = 'owner'
      OR staff_id = public.showcase_current_staff_id()
    )
  )
  WITH CHECK (
    barbershop_id = public.showcase_current_barbershop_id()
    AND (
      public.showcase_current_admin_role() = 'owner'
      OR staff_id = public.showcase_current_staff_id()
    )
  );

DROP POLICY IF EXISTS "authenticated_delete_showcase_rezervace" ON public.showcase_rezervace;
CREATE POLICY "authenticated_delete_showcase_rezervace"
  ON public.showcase_rezervace FOR DELETE TO authenticated
  USING (
    barbershop_id = public.showcase_current_barbershop_id()
    AND (
      public.showcase_current_admin_role() = 'owner'
      OR staff_id = public.showcase_current_staff_id()
    )
  );

-- Majitel only: zákazníci, výdělky
DROP POLICY IF EXISTS "admin_select_showcase_zakaznici" ON public.showcase_zakaznici;
DROP POLICY IF EXISTS "admin_select_zakaznici" ON public.showcase_zakaznici;
CREATE POLICY "admin_select_showcase_zakaznici"
  ON public.showcase_zakaznici FOR SELECT TO authenticated
  USING (
    barbershop_id = public.showcase_current_barbershop_id()
    AND public.showcase_current_admin_role() = 'owner'
  );

DROP POLICY IF EXISTS "admin_update_showcase_zakaznici" ON public.showcase_zakaznici;
DROP POLICY IF EXISTS "admin_update_zakaznici" ON public.showcase_zakaznici;
CREATE POLICY "admin_update_showcase_zakaznici"
  ON public.showcase_zakaznici FOR UPDATE TO authenticated
  USING (
    barbershop_id = public.showcase_current_barbershop_id()
    AND public.showcase_current_admin_role() = 'owner'
  )
  WITH CHECK (
    barbershop_id = public.showcase_current_barbershop_id()
    AND public.showcase_current_admin_role() = 'owner'
  );

DROP POLICY IF EXISTS "admin_select_vydelky" ON public.showcase_vydelky;
CREATE POLICY "admin_select_vydelky"
  ON public.showcase_vydelky FOR SELECT TO authenticated
  USING (
    barbershop_id = public.showcase_current_barbershop_id()
    AND public.showcase_current_admin_role() = 'owner'
  );

DROP POLICY IF EXISTS "admin_select_vydelky_sluzby" ON public.showcase_vydelky_sluzby;
CREATE POLICY "admin_select_vydelky_sluzby"
  ON public.showcase_vydelky_sluzby FOR SELECT TO authenticated
  USING (
    barbershop_id = public.showcase_current_barbershop_id()
    AND public.showcase_current_admin_role() = 'owner'
  );

-- === Příklad: propojení kadeřníka po vytvoření Auth uživatele ===
-- 1) Supabase → Authentication → Users → Add user (email + heslo)
-- 2) Nahraď UUID a staff_id:
--
-- INSERT INTO public.showcase_barbershop_admins (barbershop_id, user_id, login_label, role, staff_id)
-- SELECT
--   b.id,
--   'UUID-Z-AUTH'::uuid,
--   'monika',
--   'staff',
--   s.id
-- FROM public.showcase_barbershops b
-- JOIN public.showcase_staff s ON s.barbershop_id = b.id AND s.first_name = 'Monika'
-- WHERE b.slug = 'studio-elegance'
-- ON CONFLICT (user_id) DO UPDATE SET
--   role = EXCLUDED.role,
--   staff_id = EXCLUDED.staff_id,
--   login_label = EXCLUDED.login_label;
