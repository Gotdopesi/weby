-- SMS vyúčtování — základ a násobitel per salón (ne sms_price × 1,6 znovu)
-- unit_cost = sms_unit_cost salónu (např. 1 Kč)
-- amount = sms_unit_cost × sms_billing_multiplier (např. 1 × 1,6 = 1,6 Kč / SMS)
-- Spusť v Supabase → SQL Editor (celý skript).

ALTER TABLE public.showcase_barbershops
  ADD COLUMN IF NOT EXISTS sms_unit_cost NUMERIC(10, 2) NOT NULL DEFAULT 1.00,
  ADD COLUMN IF NOT EXISTS sms_billing_multiplier NUMERIC(10, 4) NOT NULL DEFAULT 1.6;

COMMENT ON COLUMN public.showcase_barbershops.sms_unit_cost IS
  'Základní jednotka pro vyúčtování 1 SMS salónu (Kč), např. 1';
COMMENT ON COLUMN public.showcase_barbershops.sms_billing_multiplier IS
  'Násobitel vyúčtování SMS pro salón, např. 1.6 → částka za SMS = unit × multiplier';

-- Donzi (id 5): 4× SMS → 1 × 1,6 × 4 = 6,40 Kč celkem
UPDATE public.showcase_barbershops
SET
  sms_unit_cost = 1.00,
  sms_billing_multiplier = 1.6
WHERE id = 5;

-- Studio Elegance (id 1) — uprav podle dohody; výchozí stejný vzorec
UPDATE public.showcase_barbershops
SET
  sms_unit_cost = 1.00,
  sms_billing_multiplier = 1.6
WHERE id = 1
  AND (sms_unit_cost IS NULL OR sms_unit_cost = 1.00);

CREATE TABLE IF NOT EXISTS public.showcase_sms_vyuctovani (
  id BIGSERIAL PRIMARY KEY,
  barbershop_id BIGINT NOT NULL REFERENCES public.showcase_barbershops (id) ON DELETE CASCADE,
  rezervace_id UUID REFERENCES public.showcase_rezervace (id) ON DELETE SET NULL,
  phone TEXT,
  unit_cost NUMERIC(10, 2) NOT NULL,
  billing_multiplier NUMERIC(10, 4) NOT NULL DEFAULT 1.6,
  amount NUMERIC(10, 2) NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.showcase_sms_vyuctovani
  ADD COLUMN IF NOT EXISTS billing_multiplier NUMERIC(10, 4) NOT NULL DEFAULT 1.6;

CREATE INDEX IF NOT EXISTS showcase_sms_vyuctovani_barbershop_sent_idx
  ON public.showcase_sms_vyuctovani (barbershop_id, sent_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS showcase_sms_vyuctovani_rezervace_uidx
  ON public.showcase_sms_vyuctovani (rezervace_id)
  WHERE rezervace_id IS NOT NULL;

ALTER TABLE public.showcase_sms_vyuctovani ENABLE ROW LEVEL SECURITY;

-- Oprava existujících řádků (špatně: sms_price 1,6 × 1,6 = 2,56)
UPDATE public.showcase_sms_vyuctovani v
SET
  unit_cost = b.sms_unit_cost,
  billing_multiplier = b.sms_billing_multiplier,
  amount = ROUND((b.sms_unit_cost * b.sms_billing_multiplier)::numeric, 2)
FROM public.showcase_barbershops b
WHERE b.id = v.barbershop_id;

-- Zpětné doplnění chybějících SMS
INSERT INTO public.showcase_sms_vyuctovani (
  barbershop_id,
  rezervace_id,
  phone,
  unit_cost,
  billing_multiplier,
  amount,
  sent_at
)
SELECT
  r.barbershop_id,
  r.id,
  r.phone,
  b.sms_unit_cost,
  b.sms_billing_multiplier,
  ROUND((b.sms_unit_cost * b.sms_billing_multiplier)::numeric, 2),
  COALESCE(r.created_at, now())
FROM public.showcase_rezervace r
JOIN public.showcase_barbershops b ON b.id = r.barbershop_id
WHERE r.sms_sent = TRUE
  AND r.barbershop_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.showcase_sms_vyuctovani v WHERE v.rezervace_id = r.id
  );

-- Kontrola: SELECT barbershop_id, COUNT(*), SUM(amount) FROM showcase_sms_vyuctovani GROUP BY 1;
-- Donzi id=5, 4 SMS → sum_amount = 6.40
