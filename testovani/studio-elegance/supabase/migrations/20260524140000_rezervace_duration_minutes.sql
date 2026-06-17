-- Délka služby u rezervace (30min sloty)
ALTER TABLE public.kadernictvi_rezervace
  ADD COLUMN IF NOT EXISTS duration_minutes INT DEFAULT 60;

UPDATE public.kadernictvi_rezervace r
SET duration_minutes = COALESCE(
  r.duration_minutes,
  s.duration_minutes,
  60
)
FROM public.kadernictvi_sluzby s
WHERE r.service_id = s.id AND (r.duration_minutes IS NULL OR r.duration_minutes = 60);

COMMENT ON COLUMN public.kadernictvi_rezervace.duration_minutes IS
  'Délka služby v minutách — blokování slotů po 30 min.';
