-- Zapnutí/vypnutí SMS připomínek per salón (cron /api/cron/send-sms)
ALTER TABLE public.kadernictvi
  ADD COLUMN IF NOT EXISTS sms_enabled BOOLEAN NOT NULL DEFAULT TRUE;

COMMENT ON COLUMN public.kadernictvi.sms_enabled IS
  'FALSE = cron neposílá SMS pro tento salón (rezervace zůstávají, jen bez připomínky).';

-- Studio Elegance (id 1) — SMS vypnuto
UPDATE public.kadernictvi
SET sms_enabled = FALSE
WHERE id = 1;
