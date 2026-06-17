/**
 * Staré admin rozhraní (kalendář + statistiky v navigaci) pro vybrané účty.
 * Výchozí: chci.web@dweby.cz — lze přepsat VITE_ADMIN_LEGACY_UI_EMAILS.
 */
const DEFAULT_LEGACY_EMAILS = ["chci.web@dweby.cz"];

export function parseLegacyAdminEmails(): string[] {
  const raw = (import.meta.env.VITE_ADMIN_LEGACY_UI_EMAILS as string | undefined) ?? "";
  const fromEnv = raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  if (fromEnv.length > 0) return fromEnv;
  return DEFAULT_LEGACY_EMAILS;
}

export function isLegacyAdminSession(email: string | undefined | null): boolean {
  if (!email) return false;
  return parseLegacyAdminEmails().includes(email.trim().toLowerCase());
}
