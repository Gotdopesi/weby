-- Demo data pro Studio Elegance (kadernictvi_id = 1) — prezentace adminu kadeřnicím
-- Spusť v Supabase SQL Editoru. Triggery doplní tržby, zákazníky a výdělky.

-- Klára=3, Monika=2, Eliška=1
-- Služby: 1=střih, 3=barvení, 4=balayage, 5=melír, 6=účes

INSERT INTO public.kadernictvi_rezervace (
  first_name, last_name, email, phone, service, service_id, total_price, duration_minutes,
  booking_date, booking_time, status, kadernictvi_id, pracovnik_id, sms_sent
) VALUES
  -- minulé termíny (vyděláno / historie)
  ('Petra', 'Nováková', 'petra.novakova@email.cz', '+420601234567', 'Dámský střih', 1, 890, 60, '2026-05-28', '09:30', 'confirmed', 1, 3, true),
  ('Jana', 'Dvořáková', 'jana.dvorakova@email.cz', '+420602345678', 'Barvení vlasů', 3, 1490, 120, '2026-05-29', '13:00', 'confirmed', 1, 1, true),
  ('Lucie', 'Horáková', 'lucie.horakova@email.cz', '+420603456789', 'Melír', 5, 1790, 150, '2026-05-30', '10:00', 'confirmed', 1, 1, true),
  ('Markéta', 'Procházková', 'marketa.proch@email.cz', '+420604567890', 'Společenský účes', 6, 1290, 90, '2026-05-31', '11:00', 'confirmed', 1, 2, false),
  ('Tereza', 'Černá', 'tereza.cerna@email.cz', '+420605678901', 'Dámský střih', 1, 890, 60, '2026-06-01', '09:00', 'confirmed', 1, 3, false),

  -- tento týden (červen 2026)
  ('Veronika', 'Kučerová', 'veronika.kuc@email.cz', '+420606789012', 'Balayage', 4, 2890, 180, '2026-06-02', '09:00', 'confirmed', 1, 1, false),
  ('Simona', 'Veselá', 'simona.vesela@email.cz', '+420607890123', 'Dámský střih', 1, 890, 60, '2026-06-03', '14:00', 'confirmed', 1, 2, false),
  ('Alena', 'Machová', 'alena.mach@email.cz', '+420608901234', 'Barvení vlasů', 3, 1490, 120, '2026-06-04', '10:30', 'confirmed', 1, 3, false),
  ('Kristýna', 'Benešová', 'kristyna.benes@email.cz', '+420609012345', 'Melír', 5, 1790, 150, '2026-06-05', '09:30', 'confirmed', 1, 1, false),
  ('Barbora', 'Pokorná', 'barbora.pokorna@email.cz', '+420600123456', 'Společenský účes', 6, 1290, 90, '2026-06-06', '10:00', 'confirmed', 1, 2, false),
  ('Nikola', 'Růžičková', 'nikola.ruz@email.cz', '+420601987654', 'Dámský střih', 1, 890, 60, '2026-06-07', '11:30', 'confirmed', 1, 3, false),

  -- příští týden
  ('Eva', 'Fialová', 'eva.fialova@email.cz', '+420602876543', 'Balayage', 4, 2890, 180, '2026-06-09', '09:00', 'confirmed', 1, 1, false),
  ('Hana', 'Králová', 'hana.kralova@email.cz', '+420603765432', 'Dámský střih', 1, 890, 60, '2026-06-10', '15:00', 'confirmed', 1, 2, false),
  ('Michaela', 'Urbanová', 'michaela.urban@email.cz', '+420604654321', 'Barvení vlasů', 3, 1490, 120, '2026-06-11', '13:30', 'confirmed', 1, 3, false),
  ('Lenka', 'Sedláčková', 'lenka.sedl@email.cz', '+420605543210', 'Pánský střih', 2, 590, 45, '2026-06-12', '16:00', 'confirmed', 1, 2, false),
  ('Denisa', 'Vlčková', 'denisa.vlckova@email.cz', '+420606432109', 'Melír', 5, 1790, 150, '2026-06-13', '09:00', 'confirmed', 1, 1, false),
  ('Karolína', 'Němcová', 'karolina.nemcova@email.cz', '+420607321098', 'Společenský účes', 6, 1290, 90, '2026-06-14', '14:30', 'confirmed', 1, 3, false),

  -- jedna zrušená (ukázka ve statistikách)
  ('Olga', 'Šimková', 'olga.simkova@email.cz', '+420608210987', 'Balayage', 4, 2890, 180, '2026-06-08', '09:00', 'canceled', 1, 1, false);

-- Přepočet výdělků za květen a červen
SELECT public.kadernictvi_obnovit_vydelky(1, '2026-05');
SELECT public.kadernictvi_obnovit_vydelky(1, '2026-06');
