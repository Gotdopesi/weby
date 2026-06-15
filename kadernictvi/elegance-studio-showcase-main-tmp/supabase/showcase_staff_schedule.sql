-- Pracovní rozvrh kadeřníků (minuty od půlnoci; 0 = neděle … 6 = sobota)

-- Prázdný JSON = výchozí otevírací doba salónu z aplikace (Po–Pá 9–19, So 9–14)



ALTER TABLE public.showcase_staff

  ADD COLUMN IF NOT EXISTS work_schedule JSONB NOT NULL DEFAULT '{}'::jsonb;



COMMENT ON COLUMN public.showcase_staff.work_schedule IS

  'Volitelný rozvrh po dnech: {"1":{"open":540,"close":1140}, "6":{"open":540,"close":840}}. Prázdné = výchozí doba salónu.';



-- Studio Elegance: všichni na plný úvazek dle salónu

UPDATE public.showcase_staff s

SET work_schedule = '{

  "1": {"open": 540, "close": 1140},

  "2": {"open": 540, "close": 1140},

  "3": {"open": 540, "close": 1140},

  "4": {"open": 540, "close": 1140},

  "5": {"open": 540, "close": 1140},

  "6": {"open": 540, "close": 840}

}'::jsonb

FROM public.showcase_barbershops b

WHERE s.barbershop_id = b.id

  AND b.slug = 'studio-elegance'

  AND (s.work_schedule IS NULL OR s.work_schedule = '{}'::jsonb);


