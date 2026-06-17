/**
 * E-maily s režimem „jen prohlížení“ v administraci (žádné mazání).
 * Nastav v .env / na Vercelu: VITE_ADMIN_READ_ONLY_EMAILS=admin@demo.cz,info@firma.cz
 */
export function parseReadOnlyAdminEmails(): string[] {
  const raw = (import.meta.env.VITE_ADMIN_READ_ONLY_EMAILS as string | undefined) ?? "";
  return raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isReadOnlyAdminSession(email: string | undefined | null): boolean {
  if (!email) return false;
  return parseReadOnlyAdminEmails().includes(email.trim().toLowerCase());
}
