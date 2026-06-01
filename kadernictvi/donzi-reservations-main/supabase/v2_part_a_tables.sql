CREATE TABLE IF NOT EXISTS public.showcase_barbershop_admins (
  id BIGSERIAL PRIMARY KEY,
  barbershop_id BIGINT NOT NULL REFERENCES public.showcase_barbershops (id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  login_label TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id),
  UNIQUE (barbershop_id, user_id)
);

ALTER TABLE public.showcase_barbershops ADD COLUMN IF NOT EXISTS admin_email TEXT;

CREATE TABLE IF NOT EXISTS public.showcase_vydelky (
  id BIGSERIAL PRIMARY KEY,
  barbershop_id BIGINT NOT NULL REFERENCES public.showcase_barbershops (id) ON DELETE CASCADE,
  month_key TEXT NOT NULL CHECK (month_key ~ '^\d{4}-\d{2}$'),
  earned NUMERIC(12, 2) NOT NULL DEFAULT 0,
  planned NUMERIC(12, 2) NOT NULL DEFAULT 0,
  total NUMERIC(12, 2) NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (barbershop_id, month_key)
);

CREATE TABLE IF NOT EXISTS public.showcase_vydelky_sluzby (
  id BIGSERIAL PRIMARY KEY,
  barbershop_id BIGINT NOT NULL REFERENCES public.showcase_barbershops (id) ON DELETE CASCADE,
  service_id BIGINT REFERENCES public.showcase_services (id) ON DELETE SET NULL,
  service_name TEXT NOT NULL,
  month_key TEXT NOT NULL CHECK (month_key ~ '^\d{4}-\d{2}$'),
  price NUMERIC(10, 2) NOT NULL DEFAULT 0,
  count_earned INT NOT NULL DEFAULT 0,
  count_planned INT NOT NULL DEFAULT 0,
  count_total INT NOT NULL DEFAULT 0,
  amount_earned NUMERIC(12, 2) NOT NULL DEFAULT 0,
  amount_planned NUMERIC(12, 2) NOT NULL DEFAULT 0,
  amount_total NUMERIC(12, 2) NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (barbershop_id, service_id, month_key)
);

CREATE INDEX IF NOT EXISTS showcase_vydelky_sluzby_month_idx
  ON public.showcase_vydelky_sluzby (barbershop_id, month_key);
