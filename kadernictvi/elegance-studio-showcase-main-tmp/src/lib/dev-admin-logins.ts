/** DOČASNÉ — smaž tento soubor a AdminDevQuickLogin před produkčním nasazením. */

export type DevQuickLogin = {
  label: string;
  role: "owner" | "staff";
  email: string;
  password: string;
  staffFirstName?: string;
};

function env(name: string): string {
  return (import.meta.env[name] as string | undefined)?.trim() ?? "";
}

function staffAccount(
  label: string,
  firstName: string,
  emailKey: string,
  passwordKey: string,
  fallbackEmail: string,
  fallbackPassword: string,
): DevQuickLogin | null {
  const email = env(emailKey) || fallbackEmail;
  const password = env(passwordKey) || fallbackPassword;
  if (!email || !password) return null;
  return { label, role: "staff", email, password, staffFirstName: firstName };
}

/** Jen `npm run dev` — na buildu / Vercelu se nic nezobrazí. */
export function getDevQuickLogins(): DevQuickLogin[] {
  if (!import.meta.env.DEV) return [];

  const out: DevQuickLogin[] = [];

  const ownerEmail = env("VITE_DEV_OWNER_EMAIL");
  const ownerPassword = env("VITE_DEV_OWNER_PASSWORD");
  if (ownerEmail && ownerPassword) {
    out.push({ label: "Majitel (test)", role: "owner", email: ownerEmail, password: ownerPassword });
  }

  const staffAccounts = [
    staffAccount(
      "Klára (test)",
      "Klára",
      "VITE_DEV_KLARA_EMAIL",
      "VITE_DEV_KLARA_PASSWORD",
      "dev.klara@studio-elegance.test",
      "DevKlara26!",
    ),
    staffAccount(
      "Monika (test)",
      "Monika",
      "VITE_DEV_MONIKA_EMAIL",
      "VITE_DEV_MONIKA_PASSWORD",
      env("VITE_DEV_STAFF_EMAIL") || "dev.monika@studio-elegance.test",
      env("VITE_DEV_STAFF_PASSWORD") || "DevMonika26!",
    ),
    staffAccount(
      "Eliška (test)",
      "Eliška",
      "VITE_DEV_ELISKA_EMAIL",
      "VITE_DEV_ELISKA_PASSWORD",
      "dev.eliska@studio-elegance.test",
      "DevEliska26!",
    ),
  ];

  for (const acc of staffAccounts) {
    if (acc) out.push(acc);
  }

  return out;
}

/** Lokální dev: role podle e-mailu, když DB ještě nemá sloupce role/staff_id. */
export function devAdminRoleForEmail(email: string | undefined | null): "owner" | "staff" | null {
  if (!import.meta.env.DEV || !email) return null;
  const normalized = email.trim().toLowerCase();
  const owner = env("VITE_DEV_OWNER_EMAIL").toLowerCase();
  if (owner && normalized === owner) return "owner";

  for (const acc of getDevQuickLogins()) {
    if (acc.role === "staff" && acc.email.toLowerCase() === normalized) return "staff";
  }
  return null;
}

/** Dev fallback: jméno kadeřníka podle testovacího e-mailu. */
export function devStaffFirstNameForEmail(email: string | undefined | null): string | null {
  if (!import.meta.env.DEV || !email) return null;
  const normalized = email.trim().toLowerCase();
  for (const acc of getDevQuickLogins()) {
    if (acc.role === "staff" && acc.email.toLowerCase() === normalized) {
      return acc.staffFirstName ?? null;
    }
  }
  return null;
}
