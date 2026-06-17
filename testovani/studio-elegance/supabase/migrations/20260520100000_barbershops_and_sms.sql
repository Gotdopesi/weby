-- Multi-tenant příprava + SMS kredit. Tabulka rezervací = public.rezervace

CREATE TABLE IF NOT EXISTS public.barbershops (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  email TEXT,
  sms_price NUMERIC(4, 2) DEFAULT 1.30,
  credit_balance NUMERIC(10, 2) DEFAULT 500.00,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.rezervace
  ADD COLUMN IF NOT EXISTS kadernictvi_id BIGINT REFERENCES public.barbershops (id),
  ADD COLUMN IF NOT EXISTS sms_sent BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS rezervace_kadernictvi_id_idx ON public.rezervace (kadernictvi_id);
CREATE INDEX IF NOT EXISTS rezervace_sms_pending_idx ON public.rezervace (sms_sent, booking_date)
  WHERE sms_sent = FALSE;

-- Výchozí salón (upravte e-mail podle potřeby)
INSERT INTO public.barbershops (name, slug, email, sms_price, credit_balance)
VALUES ('Studio Elegance', 'studio-elegance', 'info@studioelegance.cz', 1.30, 500.00)
ON CONFLICT (slug) DO NOTHING;

UPDATE public.rezervace
SET kadernictvi_id = (SELECT id FROM public.barbershops WHERE slug = 'studio-elegance' LIMIT 1)
WHERE kadernictvi_id IS NULL;

ALTER TABLE public.barbershops ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated_select_barbershops" ON public.barbershops;
CREATE POLICY "authenticated_select_barbershops"
  ON public.barbershops
  FOR SELECT
  TO authenticated
  USING (true);

-- Service role (cron API) obchází RLS; anon nemá přístup ke kreditu
