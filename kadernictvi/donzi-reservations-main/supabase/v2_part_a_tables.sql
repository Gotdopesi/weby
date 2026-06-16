CREATE TABLE IF NOT EXISTS public.kadernictvi_admini (
  id BIGSERIAL PRIMARY KEY,
  kadernictvi_id BIGINT NOT NULL REFERENCES public.kadernictvi (id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  login_label TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id),
  UNIQUE (kadernictvi_id, user_id)
);

ALTER TABLE public.kadernictvi ADD COLUMN IF NOT EXISTS admin_email TEXT;

CREATE TABLE IF NOT EXISTS public.kadernictvi_vydelky (
  id BIGSERIAL PRIMARY KEY,
  kadernictvi_id BIGINT NOT NULL REFERENCES public.kadernictvi (id) ON DELETE CASCADE,
  month_key TEXT NOT NULL CHECK (month_key ~ '^\d{4}-\d{2}$'),
  earned NUMERIC(12, 2) NOT NULL DEFAULT 0,
  planned NUMERIC(12, 2) NOT NULL DEFAULT 0,
  total NUMERIC(12, 2) NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (kadernictvi_id, month_key)
);

CREATE TABLE IF NOT EXISTS public.kadernictvi_vydelky_sluzby (
  id BIGSERIAL PRIMARY KEY,
  kadernictvi_id BIGINT NOT NULL REFERENCES public.kadernictvi (id) ON DELETE CASCADE,
  service_id BIGINT REFERENCES public.kadernictvi_sluzby (id) ON DELETE SET NULL,
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
  UNIQUE (kadernictvi_id, service_id, month_key)
);

CREATE INDEX IF NOT EXISTS kadernictvi_vydelky_sluzby_month_idx
  ON public.kadernictvi_vydelky_sluzby (kadernictvi_id, month_key);
