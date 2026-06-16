-- Služby přiřazené k jednotlivým kadeřníkům (rezervace / admin)
-- Ceník na homepage zůstává statický v home-content.ts

CREATE TABLE IF NOT EXISTS public.kadernictvi_pracovnik_sluzby (
  pracovnik_id BIGINT NOT NULL REFERENCES public.kadernictvi_pracovnici (id) ON DELETE CASCADE,
  service_id BIGINT NOT NULL REFERENCES public.kadernictvi_sluzby (id) ON DELETE CASCADE,
  PRIMARY KEY (pracovnik_id, service_id)
);

CREATE INDEX IF NOT EXISTS kadernictvi_pracovnik_sluzby_service_idx
  ON public.kadernictvi_pracovnik_sluzby (service_id);

COMMENT ON TABLE public.kadernictvi_pracovnik_sluzby IS
  'Které služby může kadeřník nabízet v rezervacích. Neovlivňuje statický ceník na webu.';

ALTER TABLE public.kadernictvi_pracovnik_sluzby ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_staff_services" ON public.kadernictvi_pracovnik_sluzby;
CREATE POLICY "anon_select_staff_services"
  ON public.kadernictvi_pracovnik_sluzby FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "authenticated_manage_staff_services" ON public.kadernictvi_pracovnik_sluzby;
CREATE POLICY "authenticated_manage_staff_services"
  ON public.kadernictvi_pracovnik_sluzby FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.kadernictvi_pracovnici s
      WHERE s.id = pracovnik_id
        AND s.kadernictvi_id = public.kadernictvi_aktualni_id()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.kadernictvi_pracovnici s
      WHERE s.id = pracovnik_id
        AND s.kadernictvi_id = public.kadernictvi_aktualni_id()
    )
  );

-- Propojení existujících služeb se všemi kadeřníky salónu (první seed)
INSERT INTO public.kadernictvi_pracovnik_sluzby (pracovnik_id, service_id)
SELECT s.id, svc.id
FROM public.kadernictvi_pracovnici s
JOIN public.kadernictvi b ON b.id = s.kadernictvi_id
JOIN public.kadernictvi_sluzby svc ON svc.kadernictvi_id = b.id AND svc.is_active = TRUE
WHERE b.slug = 'studio-elegance'
ON CONFLICT DO NOTHING;
