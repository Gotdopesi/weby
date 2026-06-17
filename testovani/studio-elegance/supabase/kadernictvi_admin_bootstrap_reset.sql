-- =============================================================================
-- Reset sandboxu pro opakované testování registrace majitele
-- Bezpečné — maže jen admin vazbu u slug sandbox-registrace, NE Studio Elegance.
--
--   npx supabase db query --linked -f testovani/studio-elegance/supabase/kadernictvi_admin_bootstrap_reset.sql
-- =============================================================================

DELETE FROM public.kadernictvi_admini a
USING public.kadernictvi b
WHERE a.kadernictvi_id = b.id
  AND b.slug = 'sandbox-registrace';

SELECT
  b.id,
  b.slug,
  public.kadernictvi_lze_zalozit_majitele(b.id) AS lze_zalozit_majitele
FROM public.kadernictvi b
WHERE b.slug = 'sandbox-registrace';
