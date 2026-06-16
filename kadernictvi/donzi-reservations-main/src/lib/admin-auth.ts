import { supabase } from "@/integrations/supabase/client";
import { DEFAULT_KADERNICTVI_ID } from "@/lib/barbershop";
import { KADERNICTVI_TABULKY } from "@/lib/kadernictvi-tables";

export type AdminBarbershopCheck =
  | { ok: true; barbershopId: number }
  | { ok: false; reason: "no_link" | "wrong_shop"; linkedBarbershopId?: number };

/** Ověří, že přihlášený admin patří k barbershopu tohoto webu (VITE_BARBERSHOP_ID). */
export async function checkAdminBarbershopAccess(
  userId: string,
): Promise<AdminBarbershopCheck> {
  const { data: link, error } = await supabase
    .from(KADERNICTVI_TABULKY.admini)
    .select("kadernictvi_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("[admin-auth]", error);
    return { ok: false, reason: "no_link" };
  }

  if (!link?.kadernictvi_id) {
    return { ok: false, reason: "no_link" };
  }

  const linkedId = Number(link.kadernictvi_id);
  if (linkedId !== DEFAULT_KADERNICTVI_ID) {
    return { ok: false, reason: "wrong_shop", linkedBarbershopId: linkedId };
  }

  return { ok: true, barbershopId: linkedId };
}

export function adminAccessErrorMessage(check: AdminBarbershopCheck): string {
  if (check.ok) return "";
  if (check.reason === "no_link") {
    return "Váš účet není propojený s administrací tohoto barbershopu. Kontaktujte provozovatele webu.";
  }
  return "Tento účet patří k jinému salonu. Přihlaste se na správný web daného barbershopu.";
}
