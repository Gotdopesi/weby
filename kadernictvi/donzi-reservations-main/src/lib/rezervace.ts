import { SHOWCASE_TABLES } from "@/lib/showcase-tables";

/** Název tabulky rezervací v Supabase (výchozí showcase_rezervace). */
export const REZERVACE_TABLE = (
  ((import.meta.env.VITE_SUPABASE_REZERVACE_TABLE as string | undefined) ?? "").trim() ||
  SHOWCASE_TABLES.rezervace
) as typeof SHOWCASE_TABLES.rezervace;
