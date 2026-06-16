/** Názvy tabulek v Supabase (kadernictvi_*). */
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
