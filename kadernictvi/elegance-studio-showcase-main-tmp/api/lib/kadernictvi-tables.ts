/** Server-side mapování tabulek (API routes). */
export const KADERNICTVI_TABULKY = {
  kadernictvi: "kadernictvi",
  admini: "kadernictvi_admini",
  pracovnici: "kadernictvi_pracovnici",
  rezervace: "kadernictvi_rezervace",
  sluzby: "kadernictvi_sluzby",
  pracovnikSluzby: "kadernictvi_pracovnik_sluzby",
  pracovnikBlokace: "kadernictvi_pracovnik_blokace",
  zakaznici: "kadernictvi_zakaznici",
  sms: "kadernictvi_sms",
  trzby: "kadernictvi_trzby",
  vydelky: "kadernictvi_vydelky",
  vydelkySluzby: "kadernictvi_vydelky_sluzby",
} as const;

export type KadernictviTableName = (typeof KADERNICTVI_TABULKY)[keyof typeof KADERNICTVI_TABULKY];

const LEGACY_TABLE_ALIASES: Record<string, KadernictviTableName> = {
  showcase_barbershops: KADERNICTVI_TABULKY.kadernictvi,
  showcase_barbershop_admins: KADERNICTVI_TABULKY.admini,
  showcase_staff: KADERNICTVI_TABULKY.pracovnici,
  showcase_rezervace: KADERNICTVI_TABULKY.rezervace,
  showcase_services: KADERNICTVI_TABULKY.sluzby,
  showcase_staff_services: KADERNICTVI_TABULKY.pracovnikSluzby,
  showcase_staff_blocks: KADERNICTVI_TABULKY.pracovnikBlokace,
  showcase_zakaznici: KADERNICTVI_TABULKY.zakaznici,
  showcase_sms_vyuctovani: KADERNICTVI_TABULKY.sms,
  showcase_trzby: KADERNICTVI_TABULKY.trzby,
  showcase_vydelky: KADERNICTVI_TABULKY.vydelky,
  showcase_vydelky_sluzby: KADERNICTVI_TABULKY.vydelkySluzby,
  rezervace: KADERNICTVI_TABULKY.rezervace,
  barbershops: KADERNICTVI_TABULKY.kadernictvi,
};

export function resolveKadernictviTable(
  envOverride: string | undefined | null,
  fallback: KadernictviTableName,
): KadernictviTableName {
  const raw = (envOverride ?? "").trim();
  if (!raw) return fallback;
  return LEGACY_TABLE_ALIASES[raw] ?? (raw as KadernictviTableName);
}

export function rezervaceTableFromEnv(): typeof KADERNICTVI_TABULKY.rezervace {
  return resolveKadernictviTable(
    process.env.SUPABASE_REZERVACE_TABLE ?? process.env.VITE_SUPABASE_REZERVACE_TABLE,
    KADERNICTVI_TABULKY.rezervace,
  ) as typeof KADERNICTVI_TABULKY.rezervace;
}

export function kadernictviTableFromEnv(): typeof KADERNICTVI_TABULKY.kadernictvi {
  return resolveKadernictviTable(
    process.env.SUPABASE_KADERNICTVI_TABLE ?? process.env.VITE_SUPABASE_KADERNICTVI_TABLE,
    KADERNICTVI_TABULKY.kadernictvi,
  ) as typeof KADERNICTVI_TABULKY.kadernictvi;
}

export function smsTableFromEnv(): typeof KADERNICTVI_TABULKY.sms {
  return resolveKadernictviTable(
    process.env.SUPABASE_SMS_VYUCTOVANI_TABLE ?? process.env.SUPABASE_SMS_TABLE,
    KADERNICTVI_TABULKY.sms,
  ) as typeof KADERNICTVI_TABULKY.sms;
}
