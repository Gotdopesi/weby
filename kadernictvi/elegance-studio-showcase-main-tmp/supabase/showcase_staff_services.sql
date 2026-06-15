-- Služby přiřazené k jednotlivým kadeřníkům (rezervace / admin)
-- Ceník na homepage zůstává statický v home-content.ts

CREATE TABLE IF NOT EXISTS public.showcase_staff_services (
  staff_id BIGINT NOT NULL REFERENCES public.showcase_staff (id) ON DELETE CASCADE,
  service_id BIGINT NOT NULL REFERENCES public.showcase_services (id) ON DELETE CASCADE,
  PRIMARY KEY (staff_id, service_id)
);

CREATE INDEX IF NOT EXISTS showcase_staff_services_service_idx
  ON public.showcase_staff_services (service_id);

COMMENT ON TABLE public.showcase_staff_services IS
  'Které služby může kadeřník nabízet v rezervacích. Neovlivňuje statický ceník na webu.';

ALTER TABLE public.showcase_staff_services ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_staff_services" ON public.showcase_staff_services;
CREATE POLICY "anon_select_staff_services"
  ON public.showcase_staff_services FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "authenticated_manage_staff_services" ON public.showcase_staff_services;
CREATE POLICY "authenticated_manage_staff_services"
  ON public.showcase_staff_services FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.showcase_staff s
      WHERE s.id = staff_id
        AND s.barbershop_id = public.showcase_current_barbershop_id()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.showcase_staff s
      WHERE s.id = staff_id
        AND s.barbershop_id = public.showcase_current_barbershop_id()
    )
  );

-- Propojení existujících služeb se všemi kadeřníky salónu (první seed)
INSERT INTO public.showcase_staff_services (staff_id, service_id)
SELECT s.id, svc.id
FROM public.showcase_staff s
JOIN public.showcase_barbershops b ON b.id = s.barbershop_id
JOIN public.showcase_services svc ON svc.barbershop_id = b.id AND svc.is_active = TRUE
WHERE b.slug = 'studio-elegance'
ON CONFLICT DO NOTHING;
