-- Délka služby u rezervace (30min sloty)
ALTER TABLE public.showcase_rezervace
  ADD COLUMN IF NOT EXISTS duration_minutes INT DEFAULT 60;

UPDATE public.showcase_rezervace r
SET duration_minutes = COALESCE(
  r.duration_minutes,
  s.duration_minutes,
  60
)
FROM public.showcase_services s
WHERE r.service_id = s.id AND (r.duration_minutes IS NULL OR r.duration_minutes = 60);

COMMENT ON COLUMN public.showcase_rezervace.duration_minutes IS
  'Délka služby v minutách — blokování slotů po 30 min.';
