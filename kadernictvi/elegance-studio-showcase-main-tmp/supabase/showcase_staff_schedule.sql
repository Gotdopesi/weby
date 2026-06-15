-- Pracovní rozvrh kadeřníků — sloupec work_schedule na showcase_staff
-- Přehledný seed včetně hodin: studio_elegance_team.sql §2

ALTER TABLE public.showcase_staff
  ADD COLUMN IF NOT EXISTS work_schedule JSONB NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.showcase_staff.work_schedule IS
  'Rozvrh po dnech (0=ne … 6=so): {"1":{"open":540,"close":1140}}. Prázdné {} = výchozí doba salónu.';
