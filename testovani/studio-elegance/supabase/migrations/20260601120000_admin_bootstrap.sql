-- Admin bootstrap: RPC + sandbox salón pro test registrace majitele
-- Studio Elegance se nemění.

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

INSERT INTO public.kadernictvi (name, slug, email, sms_price, credit_balance)
VALUES (
  'Sandbox registrace (test)',
  'sandbox-registrace',
  'sandbox@dweby.cz',
  1.30,
  500.00
)
ON CONFLICT (slug) DO NOTHING;

DELETE FROM public.kadernictvi_admini a
USING public.kadernictvi b
WHERE a.kadernictvi_id = b.id
  AND b.slug = 'sandbox-registrace';
