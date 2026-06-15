-- Blokované časové úseky kadeřníka (po hromadném zrušení nebo ruční blokaci)
-- Spusť po showcase_staff.sql a showcase_admin_roles.sql

CREATE TABLE IF NOT EXISTS public.showcase_staff_blocks (
  id BIGSERIAL PRIMARY KEY,
  barbershop_id BIGINT NOT NULL REFERENCES public.showcase_barbershops (id) ON DELETE CASCADE,
  staff_id BIGINT NOT NULL REFERENCES public.showcase_staff (id) ON DELETE CASCADE,
  block_date DATE NOT NULL,
  start_minutes INT NOT NULL CHECK (start_minutes >= 0 AND start_minutes < 24 * 60),
  end_minutes INT NOT NULL CHECK (end_minutes > start_minutes AND end_minutes <= 24 * 60),
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS showcase_staff_blocks_lookup_idx
  ON public.showcase_staff_blocks (barbershop_id, staff_id, block_date);

COMMENT ON TABLE public.showcase_staff_blocks IS
  'Zablokované sloty — web je neukáže jako volné. Kadeřník může odblokovat.';

ALTER TABLE public.showcase_staff_blocks ENABLE ROW LEVEL SECURITY;

-- Veřejné čtení pro výpočet volných termínů (jako u rezervací)
DROP POLICY IF EXISTS "anon_select_staff_blocks" ON public.showcase_staff_blocks;
CREATE POLICY "anon_select_staff_blocks"
  ON public.showcase_staff_blocks FOR SELECT TO anon
  USING (block_date >= (CURRENT_DATE - INTERVAL '1 day'));

DROP POLICY IF EXISTS "authenticated_select_staff_blocks" ON public.showcase_staff_blocks;
CREATE POLICY "authenticated_select_staff_blocks"
  ON public.showcase_staff_blocks FOR SELECT TO authenticated
  USING (
    barbershop_id = public.showcase_current_barbershop_id()
    AND (
      public.showcase_current_admin_role() = 'owner'
      OR staff_id = public.showcase_current_staff_id()
    )
  );

DROP POLICY IF EXISTS "authenticated_insert_staff_blocks" ON public.showcase_staff_blocks;
CREATE POLICY "authenticated_insert_staff_blocks"
  ON public.showcase_staff_blocks FOR INSERT TO authenticated
  WITH CHECK (
    barbershop_id = public.showcase_current_barbershop_id()
    AND (
      public.showcase_current_admin_role() = 'owner'
      OR staff_id = public.showcase_current_staff_id()
    )
  );

DROP POLICY IF EXISTS "authenticated_delete_staff_blocks" ON public.showcase_staff_blocks;
CREATE POLICY "authenticated_delete_staff_blocks"
  ON public.showcase_staff_blocks FOR DELETE TO authenticated
  USING (
    barbershop_id = public.showcase_current_barbershop_id()
    AND (
      public.showcase_current_admin_role() = 'owner'
      OR staff_id = public.showcase_current_staff_id()
    )
  );

-- Kadeřník může upravit jen vlastní řádek (work_schedule)
DROP POLICY IF EXISTS "staff_update_own_row" ON public.showcase_staff;
CREATE POLICY "staff_update_own_row"
  ON public.showcase_staff FOR UPDATE TO authenticated
  USING (
    barbershop_id = public.showcase_current_barbershop_id()
    AND (
      public.showcase_current_admin_role() = 'owner'
      OR id = public.showcase_current_staff_id()
    )
  )
  WITH CHECK (
    barbershop_id = public.showcase_current_barbershop_id()
    AND (
      public.showcase_current_admin_role() = 'owner'
      OR id = public.showcase_current_staff_id()
    )
  );
