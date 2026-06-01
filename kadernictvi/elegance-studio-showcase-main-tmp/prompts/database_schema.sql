-- =============================================================================
-- Studio Elegance — schéma pro Supabase SQL Editor
-- Aplikace používá tabulku public.rezervace (= rezervace / reservations).
-- Spusť celý skript najednou (nebo po sekcích).
-- =============================================================================

-- 1) Služby salónu
CREATE TABLE IF NOT EXISTS public.services (
  id BIGSERIAL PRIMARY KEY,
  barbershop_id BIGINT NOT NULL REFERENCES public.barbershops (id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
  duration_minutes INT NOT NULL DEFAULT 60 CHECK (duration_minutes > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (barbershop_id, name)
);

-- 2) Rozšíření rezervací (v aplikaci: public.rezervace)
ALTER TABLE public.rezervace
  ADD COLUMN IF NOT EXISTS service_id BIGINT REFERENCES public.services (id),
  ADD COLUMN IF NOT EXISTS total_price NUMERIC(10, 2);

-- Status: completed | confirmed | canceled (+ legacy pending → migrujeme na confirmed)
ALTER TABLE public.rezervace
  ALTER COLUMN status SET DEFAULT 'confirmed';

UPDATE public.rezervace SET status = 'confirmed' WHERE status IS NULL OR status = 'pending';

-- Volitelný pohled pro nástroje, které očekávají název "reservations"
CREATE OR REPLACE VIEW public.reservations AS
SELECT
  id,
  barbershop_id,
  service_id,
  first_name,
  last_name,
  email,
  phone,
  service,
  booking_date AS reservation_date,
  booking_time AS reservation_time,
  total_price,
  status,
  sms_sent,
  created_at
FROM public.rezervace;

-- Výchozí služby pro Studio Elegance (barbershop_id = 1)
INSERT INTO public.services (barbershop_id, name, price, duration_minutes)
SELECT 1, v.name, v.price, v.duration_minutes
FROM (
  VALUES
    ('Dámský střih', 890::numeric, 60),
    ('Pánský střih', 590::numeric, 45),
    ('Barvení vlasů', 1490::numeric, 120),
    ('Balayage', 2890::numeric, 180),
    ('Melír', 1790::numeric, 150),
    ('Společenský účes', 1290::numeric, 90)
) AS v(name, price, duration_minutes)
WHERE EXISTS (SELECT 1 FROM public.barbershops WHERE id = 1)
ON CONFLICT (barbershop_id, name) DO NOTHING;

-- Doplň total_price u starých řádků podle služby (shoda podle textu service)
UPDATE public.rezervace r
SET total_price = s.price
FROM public.services s
WHERE r.service_id IS NULL
  AND r.total_price IS NULL
  AND r.barbershop_id = s.barbershop_id
  AND r.service = s.name;

-- 3) Předgenerované sloty (90 dní dopředu) — samostatná tabulka, ne zákaznické rezervace
CREATE TABLE IF NOT EXISTS public.booking_slots (
  id BIGSERIAL PRIMARY KEY,
  barbershop_id BIGINT NOT NULL REFERENCES public.barbershops (id) ON DELETE CASCADE,
  slot_date DATE NOT NULL,
  slot_time TEXT NOT NULL,
  is_available BOOLEAN NOT NULL DEFAULT TRUE,
  rezervace_id UUID REFERENCES public.rezervace (id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (barbershop_id, slot_date, slot_time)
);

CREATE INDEX IF NOT EXISTS booking_slots_date_idx ON public.booking_slots (barbershop_id, slot_date);

-- Časy salónu (shodné s aplikací src/lib/booking-slots.ts)
-- Neděle se negenerují (den v týdnu 0 = neděle v PostgreSQL extract(dow))

CREATE OR REPLACE FUNCTION public.generate_booking_slots(
  p_barbershop_id BIGINT,
  p_days INT DEFAULT 90
)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_times TEXT[] := ARRAY['09:00','10:00','11:00','12:00','13:30','14:30','15:30','16:30','17:30'];
  v_day DATE;
  v_time TEXT;
  v_inserted INT := 0;
BEGIN
  FOR v_day IN
    SELECT d::date
    FROM generate_series(CURRENT_DATE, CURRENT_DATE + (p_days || ' days')::interval, '1 day') AS d
    WHERE EXTRACT(DOW FROM d::date) <> 0
  LOOP
    FOREACH v_time IN ARRAY v_times
    LOOP
      INSERT INTO public.booking_slots (barbershop_id, slot_date, slot_time, is_available)
      VALUES (p_barbershop_id, v_day, v_time, TRUE)
      ON CONFLICT (barbershop_id, slot_date, slot_time) DO NOTHING;
      IF FOUND THEN
        v_inserted := v_inserted + 1;
      END IF;
    END LOOP;
  END LOOP;
  RETURN v_inserted;
END;
$$;

-- Vygeneruj sloty pro první salón (spusť po vytvoření barbershops)
SELECT public.generate_booking_slots(
  (SELECT id FROM public.barbershops ORDER BY id LIMIT 1),
  90
);

-- RLS
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_slots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_services" ON public.services;
CREATE POLICY "anon_select_services"
  ON public.services FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_select_booking_slots" ON public.booking_slots;
CREATE POLICY "anon_select_booking_slots"
  ON public.booking_slots FOR SELECT TO anon, authenticated
  USING (slot_date >= (CURRENT_DATE - INTERVAL '1 day') AND slot_date <= (CURRENT_DATE + INTERVAL '90 days'));

DROP POLICY IF EXISTS "authenticated_select_services" ON public.services;
CREATE POLICY "authenticated_select_services"
  ON public.services FOR SELECT TO authenticated USING (true);

-- Po rezervaci: API / aplikace může slot označit obsazený (service role nebo trigger)
CREATE OR REPLACE FUNCTION public.mark_slot_booked_on_rezervace()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.booking_slots
  SET is_available = FALSE, rezervace_id = NEW.id
  WHERE barbershop_id = NEW.barbershop_id
    AND slot_date = NEW.booking_date
    AND slot_time = NEW.booking_time;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_mark_slot_booked ON public.rezervace;
CREATE TRIGGER trg_mark_slot_booked
  AFTER INSERT ON public.rezervace
  FOR EACH ROW
  EXECUTE FUNCTION public.mark_slot_booked_on_rezervace();
