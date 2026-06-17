-- =============================================================================
-- RLS: tabulka public.rezervace
-- =============================================================================
-- 1) Nahraď YOUR_OWNER_USER_UUID skutečným UUID z Authentication → Users
--    (účet majitele salónu, který smí mazat / upravovat).
-- 2) Uprav WITH CHECK u INSERT pro anon podle potřeby (validace délek apod.).
-- =============================================================================

ALTER TABLE public.rezervace ENABLE ROW LEVEL SECURITY;

-- Veřejná rezervace z webu (anon klíč v prohlížeči)
DROP POLICY IF EXISTS "anon_insert_rezervace" ON public.rezervace;
CREATE POLICY "anon_insert_rezervace"
  ON public.rezervace
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Obsazené časy pro kalendář na webu (anon SELECT; aplikace bere jen booking_time)
DROP POLICY IF EXISTS "anon_select_rezervace_slots" ON public.rezervace;
CREATE POLICY "anon_select_rezervace_slots"
  ON public.rezervace
  FOR SELECT
  TO anon
  USING (booking_date >= (CURRENT_DATE - INTERVAL '1 day'));

-- Přihlášení kdokoli: jen čtení (read-only admin i majitel)
DROP POLICY IF EXISTS "authenticated_select_rezervace" ON public.rezervace;
CREATE POLICY "authenticated_select_rezervace"
  ON public.rezervace
  FOR SELECT
  TO authenticated
  USING (true);

-- Mazání jen vlastník (UID)
DROP POLICY IF EXISTS "owner_delete_rezervace" ON public.rezervace;
CREATE POLICY "owner_delete_rezervace"
  ON public.rezervace
  FOR DELETE
  TO authenticated
  USING (auth.uid() = 'YOUR_OWNER_USER_UUID'::uuid);

-- Úpravy jen vlastník (pokud UPDATE vůbec používáš)
DROP POLICY IF EXISTS "owner_update_rezervace" ON public.rezervace;
CREATE POLICY "owner_update_rezervace"
  ON public.rezervace
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = 'YOUR_OWNER_USER_UUID'::uuid)
  WITH CHECK (auth.uid() = 'YOUR_OWNER_USER_UUID'::uuid);

-- Poznámka: e-mail „admin@demo.cz“ se v RLS standardně nepoužívá — oprávnění vázat na auth.uid().
-- Read-only účet vytvoř jako běžného Auth uživatele; dostane SELECT výše, ale neprojde DELETE/UPDATE.
