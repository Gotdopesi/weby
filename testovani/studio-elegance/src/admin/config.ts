import { isLegacyAdminSession } from "@/admin/core/lib/admin-legacy-ui";

/**
 * Šablona admin rozhraní — nastavuje se při buildu (sites.config.json → buildEnv).
 *
 * | Hodnota     | Kdo přihlášen      | Co vidí |
 * |-------------|--------------------|---------|
 * | `split`     | majitel / kadeřník | role-based (výchozí produkce) |
 * | `combined`  | všichni            | kalendář + zákazníci + statistiky |
 * | `legacy`    | e-maily v LEGACY   | split + vybrané účty mají combined UI |
 */
export type AdminTemplate = "split" | "combined" | "legacy";

export function getAdminTemplate(): AdminTemplate {
  const raw = (import.meta.env.VITE_ADMIN_TEMPLATE as string | undefined)?.trim().toLowerCase();
  if (raw === "combined" || raw === "legacy" || raw === "split") return raw;
  return "split";
}

/** Celý web v combined režimu (všichni stejné UI). */
export function usesCombinedAdminUI(): boolean {
  return getAdminTemplate() === "combined";
}

/** Spojené UI pro konkrétní přihlášený účet (combined šablona nebo legacy e-mail). */
export function usesCombinedAdminSession(email: string | undefined | null): boolean {
  if (usesCombinedAdminUI()) return true;
  return isLegacyAdminSession(email);
}

/** split + legacy e-maily → combined UI jen pro vybrané účty */
export function usesLegacyEmailOverride(): boolean {
  return getAdminTemplate() === "legacy";
}
