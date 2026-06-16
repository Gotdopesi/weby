import { KADERNICTVI_TABULKY, resolveKadernictviTable } from "@/lib/kadernictvi-tables";

/** Název tabulky rezervací — vždy kadernictvi_rezervace (i když env má staré showcase_*). */
export const REZERVACE_TABLE = resolveKadernictviTable(
  import.meta.env.VITE_SUPABASE_REZERVACE_TABLE,
  KADERNICTVI_TABULKY.rezervace,
) as typeof KADERNICTVI_TABULKY.rezervace;
