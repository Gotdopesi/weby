-- Veřejné čtení obsazených slotů (jen pro kontrolu dostupnosti při rezervaci).
-- Klient stahuje pouze booking_time; RLS povolí SELECT řádků od včerejška dál.

DROP POLICY IF EXISTS "anon_select_rezervace_slots" ON public.rezervace;
CREATE POLICY "anon_select_rezervace_slots"
  ON public.rezervace
  FOR SELECT
  TO anon
  USING (booking_date >= (CURRENT_DATE - INTERVAL '1 day'));
