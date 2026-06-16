-- Blokované časové úseky kadeřníka (po hromadném zrušení nebo ruční blokaci)
-- Spusť po kadernictvi_pracovnici.sql a showcase_admin_roles.sql

CREATE TABLE IF NOT EXISTS public.kadernictvi_pracovnik_blokace (
  id BIGSERIAL PRIMARY KEY,
  kadernictvi_id BIGINT NOT NULL REFERENCES public.kadernictvi (id) ON DELETE CASCADE,
  pracovnik_id BIGINT NOT NULL REFERENCES public.kadernictvi_pracovnici (id) ON DELETE CASCADE,
  block_date DATE NOT NULL,
  start_minutes INT NOT NULL CHECK (start_minutes >= 0 AND start_minutes < 24 * 60),
  end_minutes INT NOT NULL CHECK (end_minutes > start_minutes AND end_minutes <= 24 * 60),
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS kadernictvi_pracovnik_blokace_lookup_idx
  ON public.kadernictvi_pracovnik_blokace (kadernictvi_id, pracovnik_id, block_date);

COMMENT ON TABLE public.kadernictvi_pracovnik_blokace IS
  'Zablokované sloty — web je neukáže jako volné. Kadeřník může odblokovat.';

ALTER TABLE public.kadernictvi_pracovnik_blokace ENABLE ROW LEVEL SECURITY;

-- Veřejné čtení pro výpočet volných termínů (jako u rezervací)
DROP POLICY IF EXISTS "anon_select_staff_blocks" ON public.kadernictvi_pracovnik_blokace;
CREATE POLICY "anon_select_staff_blocks"
  ON public.kadernictvi_pracovnik_blokace FOR SELECT TO anon
  USING (block_date >= (CURRENT_DATE - INTERVAL '1 day'));

DROP POLICY IF EXISTS "authenticated_select_staff_blocks" ON public.kadernictvi_pracovnik_blokace;
CREATE POLICY "authenticated_select_staff_blocks"
  ON public.kadernictvi_pracovnik_blokace FOR SELECT TO authenticated
  USING (
    kadernictvi_id = public.kadernictvi_aktualni_id()
    AND (
      public.kadernictvi_admin_role() = 'owner'
      OR pracovnik_id = public.kadernictvi_aktualni_pracovnik_id()
    )
  );

DROP POLICY IF EXISTS "authenticated_insert_staff_blocks" ON public.kadernictvi_pracovnik_blokace;
CREATE POLICY "authenticated_insert_staff_blocks"
  ON public.kadernictvi_pracovnik_blokace FOR INSERT TO authenticated
  WITH CHECK (
    kadernictvi_id = public.kadernictvi_aktualni_id()
    AND (
      public.kadernictvi_admin_role() = 'owner'
      OR pracovnik_id = public.kadernictvi_aktualni_pracovnik_id()
    )
  );

DROP POLICY IF EXISTS "authenticated_delete_staff_blocks" ON public.kadernictvi_pracovnik_blokace;
CREATE POLICY "authenticated_delete_staff_blocks"
  ON public.kadernictvi_pracovnik_blokace FOR DELETE TO authenticated
  USING (
    kadernictvi_id = public.kadernictvi_aktualni_id()
    AND (
      public.kadernictvi_admin_role() = 'owner'
      OR pracovnik_id = public.kadernictvi_aktualni_pracovnik_id()
    )
  );

-- Kadeřník může upravit jen vlastní řádek (work_schedule)
DROP POLICY IF EXISTS "staff_update_own_row" ON public.kadernictvi_pracovnici;
CREATE POLICY "staff_update_own_row"
  ON public.kadernictvi_pracovnici FOR UPDATE TO authenticated
  USING (
    kadernictvi_id = public.kadernictvi_aktualni_id()
    AND (
      public.kadernictvi_admin_role() = 'owner'
      OR id = public.kadernictvi_aktualni_pracovnik_id()
    )
  )
  WITH CHECK (
    kadernictvi_id = public.kadernictvi_aktualni_id()
    AND (
      public.kadernictvi_admin_role() = 'owner'
      OR id = public.kadernictvi_aktualni_pracovnik_id()
    )
  );
