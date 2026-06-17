import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { VercelRequest } from "@vercel/node";
import { KADERNICTVI_TABULKY } from "./kadernictvi-tables";
import { resolveSite } from "../tenant";

export function createServiceClient(): SupabaseClient {
  const url = process.env.SUPABASE_URL?.trim() || process.env.VITE_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
  }
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export function resolveKadernictviId(req?: VercelRequest | Request): number {
  const site = resolveSite(req);
  if (site && "kadernictviId" in site && site.kadernictviId != null) {
    return Number(site.kadernictviId);
  }
  const fromEnv =
    process.env.KADERNICTVI_ID?.trim() ||
    process.env.VITE_KADERNICTVI_ID?.trim() ||
    process.env.VITE_BARBERSHOP_ID?.trim();
  if (fromEnv) return Number(fromEnv);
  return 1;
}

export async function countAdminsForShop(
  admin: SupabaseClient,
  kadernictviId: number,
): Promise<number> {
  const { count, error } = await admin
    .from(KADERNICTVI_TABULKY.admini)
    .select("id", { count: "exact", head: true })
    .eq("kadernictvi_id", kadernictviId);
  if (error) throw error;
  return count ?? 0;
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isValidPassword(password: string): boolean {
  return password.length >= 8;
}

export async function registerOwnerAccount(
  admin: SupabaseClient,
  kadernictviId: number,
  email: string,
  password: string,
): Promise<{ userId: string }> {
  const adminCount = await countAdminsForShop(admin, kadernictviId);
  if (adminCount > 0) {
    throw new Error("BOOTSTRAP_CLOSED");
  }

  const normalizedEmail = email.trim().toLowerCase();

  const { data: listed, error: listErr } = await admin.auth.admin.listUsers({ perPage: 1000 });
  if (listErr) throw listErr;

  const existing = listed.users.find((u) => u.email?.toLowerCase() === normalizedEmail);
  let userId: string;

  if (existing) {
    const linked = await admin
      .from(KADERNICTVI_TABULKY.admini)
      .select("id")
      .eq("user_id", existing.id)
      .maybeSingle();
    if (linked?.id) throw new Error("EMAIL_IN_USE");
    userId = existing.id;
    const { error: updateErr } = await admin.auth.admin.updateUserById(userId, {
      password,
      email_confirm: true,
    });
    if (updateErr) throw updateErr;
  } else {
    const { data, error } = await admin.auth.admin.createUser({
      email: normalizedEmail,
      password,
      email_confirm: true,
    });
    if (error) throw error;
    userId = data.user.id;
  }

  const { error: linkErr } = await admin.from(KADERNICTVI_TABULKY.admini).insert({
    kadernictvi_id: kadernictviId,
    user_id: userId,
    login_label: "majitel",
    role: "owner",
    pracovnik_id: null,
  });
  if (linkErr) throw linkErr;

  return { userId };
}
