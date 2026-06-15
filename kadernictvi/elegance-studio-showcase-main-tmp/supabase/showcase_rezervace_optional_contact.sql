-- Kadeřnice může přidat rezervaci bez e-mailu a telefonu
ALTER TABLE public.showcase_rezervace
  ALTER COLUMN email DROP NOT NULL,
  ALTER COLUMN phone DROP NOT NULL;
