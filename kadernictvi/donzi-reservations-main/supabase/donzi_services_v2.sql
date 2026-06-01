-- Donzi Dobruška — aktualizace ceníku (spusť v Supabase SQL Editor)
-- Deaktivuje staré služby a nahradí je novým seznamem.

DO $$
DECLARE
  v_shop_id BIGINT;
BEGIN
  SELECT id INTO v_shop_id FROM public.showcase_barbershops WHERE slug = 'donzi-dobruska' LIMIT 1;
  IF v_shop_id IS NULL THEN
    RAISE EXCEPTION 'Barbershop donzi-dobruska nenalezen — nejdřív spusť donzi_dobruska_setup.sql';
  END IF;

  UPDATE public.showcase_services
  SET is_active = FALSE
  WHERE barbershop_id = v_shop_id;

  INSERT INTO public.showcase_services (barbershop_id, name, price, duration_minutes, is_active)
  VALUES
    (v_shop_id, 'Klasický pánský střih', 400, 30, TRUE),
    (v_shop_id, 'Gentleman (střih, vousy, úprava obočí + styling)', 600, 60, TRUE),
    (v_shop_id, 'VIP péče', 1000, 80, TRUE),
    (v_shop_id, 'Modelace vousů + olejová péče', 300, 30, TRUE),
    (v_shop_id, 'Full Head Shave (holení hlavy břitvou)', 350, 30, TRUE),
    (v_shop_id, 'Holení vousů břitvou', 350, 20, TRUE),
    (v_shop_id, 'Full Head & Beard Shave', 500, 40, TRUE),
    (v_shop_id, 'Dětský střih (od 6 do 10 let)', 300, 25, TRUE),
    (v_shop_id, 'Senior střih (nad 65 let)', 300, 30, TRUE),
    (v_shop_id, 'Umytí vlasů + Styling', 100, 10, TRUE),
    (v_shop_id, 'Úprava vousů strojkem', 250, 25, TRUE),
    (v_shop_id, 'Úprava kontur + styling', 100, 15, TRUE),
    (v_shop_id, 'Odstranění chloupků (nos, obočí nebo uši)', 100, 10, TRUE),
    (v_shop_id, 'Masáž hlavy, rukou a šíje', 150, 10, TRUE),
    (v_shop_id, 'Moderní dětský střih (od 6 do 10 let)', 350, 30, TRUE)
  ON CONFLICT (barbershop_id, name) DO UPDATE SET
    price = EXCLUDED.price,
    duration_minutes = EXCLUDED.duration_minutes,
    is_active = TRUE;
END $$;

SELECT s.id, s.name, s.price, s.duration_minutes, s.is_active
FROM public.showcase_services s
JOIN public.showcase_barbershops b ON b.id = s.barbershop_id
WHERE b.slug = 'donzi-dobruska' AND s.is_active
ORDER BY s.name;
