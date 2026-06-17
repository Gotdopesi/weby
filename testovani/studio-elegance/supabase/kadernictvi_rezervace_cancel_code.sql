-- Krátký kód pro odkaz zrušení rezervace v e-mailu (místo dlouhého tokenu).
ALTER TABLE public.kadernictvi_rezervace
  ADD COLUMN IF NOT EXISTS cancel_code TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS kadernictvi_rezervace_cancel_code_uidx
  ON public.kadernictvi_rezervace (cancel_code)
  WHERE cancel_code IS NOT NULL;

COMMENT ON COLUMN public.kadernictvi_rezervace.cancel_code IS
  'Krátký kód pro odkaz /zrusit-rezervaci?k=... v potvrzovacím e-mailu.';
