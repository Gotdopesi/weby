import { KADERNICTVI_TABULKY } from "@/lib/kadernictvi-tables";

/** Název tabulky rezervací v Supabase (výchozí kadernictvi_rezervace). */
export const REZERVACE_TABLE = (
  ((import.meta.env.VITE_SUPABASE_REZERVACE_TABLE as string | undefined) ?? "").trim() ||
  KADERNICTVI_TABULKY.rezervace
) as typeof KADERNICTVI_TABULKY.rezervace;
