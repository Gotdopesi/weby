CREATE OR REPLACE FUNCTION public.kadernictvi_obnovit_vydelky_for_trzby_row()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_shop BIGINT; v_month TEXT;
BEGIN
  v_shop := COALESCE(NEW.kadernictvi_id, OLD.kadernictvi_id);
  v_month := to_char(COALESCE(NEW.booking_date, OLD.booking_date), 'YYYY-MM');
  IF v_shop IS NOT NULL AND v_month IS NOT NULL THEN PERFORM public.kadernictvi_obnovit_vydelky(v_shop, v_month); END IF;
  RETURN COALESCE(NEW, OLD);
END; $$;
DROP TRIGGER IF EXISTS trg_refresh_vydelky ON public.kadernictvi_trzby;
CREATE TRIGGER trg_refresh_vydelky AFTER INSERT OR UPDATE OR DELETE ON public.kadernictvi_trzby
  FOR EACH ROW EXECUTE FUNCTION public.kadernictvi_obnovit_vydelky_for_trzby_row();
DO $$ DECLARE r RECORD; BEGIN
  FOR r IN SELECT DISTINCT kadernictvi_id, to_char(booking_date,'YYYY-MM') AS mk FROM public.kadernictvi_trzby WHERE kadernictvi_id IS NOT NULL LOOP
    PERFORM public.kadernictvi_obnovit_vydelky(r.kadernictvi_id, r.mk);
  END LOOP;
END $$;
