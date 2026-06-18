-- Melír v ceníku Studio Elegance (kadernictvi_id = 1)
INSERT INTO kadernictvi_sluzby (kadernictvi_id, name, price, duration_minutes, is_active)
SELECT 1, 'Melír', 1790, 150, true
WHERE NOT EXISTS (
  SELECT 1 FROM kadernictvi_sluzby WHERE kadernictvi_id = 1 AND lower(trim(name)) = lower('Melír')
);

UPDATE kadernictvi_sluzby
SET is_active = true, price = 1790, duration_minutes = 150
WHERE kadernictvi_id = 1 AND lower(trim(name)) = lower('Melír');
