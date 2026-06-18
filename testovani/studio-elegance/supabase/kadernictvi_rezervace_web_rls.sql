-- Veřejný web: rezervace i když je v prohlížeči aktivní admin session (role authenticated).
-- Anon politika verejne_vlozit_rezervaci zůstává; tato doplňuje INSERT pro přihlášené.

DROP POLICY IF EXISTS "web_vlozi_rezervaci_authenticated" ON public.kadernictvi_rezervace;
CREATE POLICY "web_vlozi_rezervaci_authenticated"
  ON public.kadernictvi_rezervace FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.kadernictvi k WHERE k.id = kadernictvi_id)
  );

-- Pro .insert().select('id') z prohlížeče — recentní termíny (stejně jako anon sloty).
DROP POLICY IF EXISTS "web_cte_nove_rezervace_authenticated" ON public.kadernictvi_rezervace;
CREATE POLICY "web_cte_nove_rezervace_authenticated"
  ON public.kadernictvi_rezervace FOR SELECT TO authenticated
  USING (booking_date >= (CURRENT_DATE - INTERVAL '1 day'));
