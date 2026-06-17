-- Přihlášení přes Supabase Auth: administrátor může číst a mazat rezervace.
CREATE POLICY "Authenticated users can read all reservations"
  ON public.reservations FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete reservations"
  ON public.reservations FOR DELETE
  TO authenticated
  USING (true);
