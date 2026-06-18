-- Aktivační kódy pro první založení majitelského účtu (DWeby generuje, salón zadá při registraci)
-- Spuštění: npx supabase db query --linked -f testovani/studio-elegance/supabase/kadernictvi_aktivacni_kody.sql

CREATE TABLE IF NOT EXISTS public.kadernictvi_aktivacni_kody (
  id bigserial PRIMARY KEY,
  kadernictvi_id bigint NOT NULL REFERENCES public.kadernictvi(id) ON DELETE CASCADE,
  code text NOT NULL,
  note text,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '90 days'),
  used_at timestamptz,
  used_by_user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT kadernictvi_aktivacni_kody_code_norm UNIQUE (kadernictvi_id, code)
);

CREATE INDEX IF NOT EXISTS kadernictvi_aktivacni_kody_active_idx
  ON public.kadernictvi_aktivacni_kody (kadernictvi_id, code)
  WHERE used_at IS NULL;

COMMENT ON TABLE public.kadernictvi_aktivacni_kody IS
  'Jednorázové kódy pro aktivaci prvního admin účtu salónu. Generuje DWeby (scripts/generate-activation-code.mjs).';

ALTER TABLE public.kadernictvi_aktivacni_kody ENABLE ROW LEVEL SECURITY;

-- Žádné politiky pro anon/authenticated — validace jen přes service role API.
