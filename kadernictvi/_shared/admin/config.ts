/**
 * Šablona admin rozhraní — nastavuje se při buildu (sites.config.json → buildEnv).
 *
 * | Hodnota     | Kdo přihlášen      | Co vidí |
 * |-------------|--------------------|---------|
 * | `split`     | majitel / kadeřník | role-based (výchozí produkce) |
 * | `combined`  | majitel            | kalendář + zákazníci + statistiky (jako Donzi) |
 * | `legacy`    | e-maily v LEGACY   | stejné jako combined, jen pro vybrané účty |
 */
export type AdminTemplate = "split" | "combined" | "legacy";

export function getAdminTemplate(): AdminTemplate {
  const raw = (import.meta.env.VITE_ADMIN_TEMPLATE as string | undefined)?.trim().toLowerCase();
  if (raw === "combined" || raw === "legacy" || raw === "split") return raw;
  return "split";
}

/** split + legacy e-maily → staré UI jen pro vybrané účty */
export function usesLegacyEmailOverride(): boolean {
  return getAdminTemplate() === "legacy";
}
