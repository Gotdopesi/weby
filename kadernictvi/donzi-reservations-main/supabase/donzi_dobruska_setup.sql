-- Barbershop Donzi Dobruška — stejná Supabase DB jako Studio Elegance
-- Spusť v Supabase → SQL Editor. Pro aktualizaci ceníku použij donzi_services_v2.sql

INSERT INTO public.kadernictvi (name, slug, email, sms_price, credit_balance)
VALUES ('Barbershop Donzi', 'donzi-dobruska', 'info@donzi.cz', 1.30, 500.00)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email;

-- Viz donzi_services_v2.sql pro aktuální ceník (15 služeb)

SELECT id, slug, name FROM public.kadernictvi WHERE slug = 'donzi-dobruska';
