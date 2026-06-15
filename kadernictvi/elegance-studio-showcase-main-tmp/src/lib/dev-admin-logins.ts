/** DOČASNÉ — smaž tento soubor a AdminDevQuickLogin před produkčním nasazením. */

export type DevQuickLogin = {
  label: string;
  role: "owner" | "staff";
  email: string;
  password: string;
};

function env(name: string): string {
  return (import.meta.env[name] as string | undefined)?.trim() ?? "";
}

/** Jen `npm run dev` — na buildu / Vercelu se nic nezobrazí. */
export function getDevQuickLogins(): DevQuickLogin[] {
  if (!import.meta.env.DEV) return [];

  const ownerEmail = env("VITE_DEV_OWNER_EMAIL");
  const ownerPassword = env("VITE_DEV_OWNER_PASSWORD");
  const staffEmail = env("VITE_DEV_STAFF_EMAIL");
  const staffPassword = env("VITE_DEV_STAFF_PASSWORD");

  const out: DevQuickLogin[] = [];

  if (ownerEmail && ownerPassword) {
    out.push({ label: "Majitel (test)", role: "owner", email: ownerEmail, password: ownerPassword });
  }
  if (staffEmail && staffPassword) {
    out.push({ label: "Kadeřník Monika (test)", role: "staff", email: staffEmail, password: staffPassword });
  }

  return out;
}

/** Lokální dev: role podle e-mailu, když DB ještě nemá sloupce role/staff_id. */
export function devAdminRoleForEmail(
  email: string | undefined | null,
): "owner" | "staff" | null {
  if (!import.meta.env.DEV || !email) return null;
  const normalized = email.trim().toLowerCase();
  const staff = env("VITE_DEV_STAFF_EMAIL").toLowerCase();
  const owner = env("VITE_DEV_OWNER_EMAIL").toLowerCase();
  if (staff && normalized === staff) return "staff";
  if (owner && normalized === owner) return "owner";
  return null;
}
