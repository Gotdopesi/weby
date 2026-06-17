-- =============================================================================
-- Admin bootstrap: registrace prvního majitele + sandbox pro testování
-- Bezpečné pro opakované spuštění — NEMĚNÍ Studio Elegance (slug studio-elegance).
--
-- Spuštění z kořene Weby:
--   npx supabase db query --linked -f testovani/studio-elegance/supabase/kadernictvi_admin_bootstrap.sql
-- =============================================================================

-- §1 RPC — klient (anon) zjistí, zda lze založit majitele
CREATE OR REPLACE FUNCTION public.kadernictvi_lze_zalozit_majitele(p_kadernictvi_id bigint)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NOT EXISTS (
    SELECT 1
    FROM public.kadernictvi_admini
    WHERE kadernictvi_id = p_kadernictvi_id
  );
$$;

REVOKE ALL ON FUNCTION public.kadernictvi_lze_zalozit_majitele(bigint) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.kadernictvi_lze_zalozit_majitele(bigint) TO anon, authenticated;

COMMENT ON FUNCTION public.kadernictvi_lze_zalozit_majitele(bigint) IS
  'true = salón nemá žádného admina → na /admin/login lze založit majitelský účet.';

-- §2 Sandbox salón jen pro test registrace (oddělený od Studio Elegance)
INSERT INTO public.kadernictvi (name, slug, email, sms_price, credit_balance)
VALUES (
  'Sandbox registrace (test)',
  'sandbox-registrace',
  'sandbox@dweby.cz',
  1.30,
  500.00
)
ON CONFLICT (slug) DO NOTHING;

-- Ujisti se, že sandbox nemá adminy (maže POUZE u sandbox-registrace, ne u studio-elegance)
DELETE FROM public.kadernictvi_admini a
USING public.kadernictvi b
WHERE a.kadernictvi_id = b.id
  AND b.slug = 'sandbox-registrace';

-- §3 Kontrola po spuštění
SELECT
  b.id,
  b.slug,
  b.name,
  public.kadernictvi_lze_zalozit_majitele(b.id) AS lze_zalozit_majitele,
  (SELECT count(*)::int FROM public.kadernictvi_admini a WHERE a.kadernictvi_id = b.id) AS pocet_adminu
FROM public.kadernictvi b
WHERE b.slug IN ('studio-elegance', 'sandbox-registrace')
ORDER BY b.id;

-- Očekávaný výsledek:
--   studio-elegance     → lze_zalozit_majitele = false, pocet_adminu > 0
--   sandbox-registrace  → lze_zalozit_majitele = true,  pocet_adminu = 0
--
-- Jak otestovat registraci lokálně:
--   1) Spusť tento SQL
--   2) V .env.local nastav VITE_KADERNICTVI_ID na id sandboxu (viz SELECT výše, typicky 6+)
--   3) npm run dev:kadernictvi → /admin/login → „Založit majitelský přístup“
--   4) Po testu vrať VITE_KADERNICTVI_ID=1
--
-- Opakovaný test registrace: spusť kadernictvi_admin_bootstrap_reset.sql
