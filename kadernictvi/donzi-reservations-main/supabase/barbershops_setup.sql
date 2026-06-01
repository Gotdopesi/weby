-- Spusť v Supabase → SQL Editor (celý skript najednou).
-- Projekt používá tabulku public.rezervace (ne reservations).

-- Viz také: supabase/migrations/20260520100000_barbershops_and_sms.sql

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
  ADD COLUMN IF NOT EXISTS barbershop_id BIGINT REFERENCES public.barbershops (id),
  ADD COLUMN IF NOT EXISTS sms_sent BOOLEAN NOT NULL DEFAULT FALSE;

INSERT INTO public.barbershops (name, slug, email, sms_price, credit_balance)
VALUES ('Studio Elegance', 'studio-elegance', 'info@studioelegance.cz', 1.30, 500.00)
ON CONFLICT (slug) DO NOTHING;

UPDATE public.rezervace
SET barbershop_id = (SELECT id FROM public.barbershops WHERE slug = 'studio-elegance' LIMIT 1)
WHERE barbershop_id IS NULL;

ALTER TABLE public.barbershops ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated_select_barbershops" ON public.barbershops;
CREATE POLICY "authenticated_select_barbershops"
  ON public.barbershops FOR SELECT TO authenticated USING (true);

-- Realtime pro kredit v adminu: Database → Replication → zapni barbershops
