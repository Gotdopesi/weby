import { DEFAULT_KADERNICTVI_ID } from "@/lib/barbershop";
import { supabase } from "@/integrations/supabase/client";

export async function fetchCanRegisterOwner(kadernictviId = DEFAULT_KADERNICTVI_ID): Promise<boolean> {
  try {
    const res = await fetch("/api/admin/bootstrap-status");
    if (res.ok) {
      const data = (await res.json()) as { canRegister?: boolean };
      return Boolean(data.canRegister);
    }
  } catch {
    /* lokální dev bez API */
  }

  const { data, error } = await supabase.rpc("kadernictvi_lze_zalozit_majitele", {
    p_kadernictvi_id: kadernictviId,
  });
  if (!error && data != null) return Boolean(data);
  return false;
}

export async function registerOwnerAccount(
  email: string,
  password: string,
): Promise<{ error: string | null; emailSent?: boolean }> {
  const res = await fetch("/api/admin/register-owner", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: email.trim(), password }),
  });
  const data = (await res.json().catch(() => ({}))) as { error?: string; emailSent?: boolean };
  if (!res.ok) return { error: data.error ?? "Založení účtu se nezdařilo." };
  return { error: null, emailSent: data.emailSent };
}

export async function requestAdminPasswordReset(email: string): Promise<string | null> {
  const res = await fetch("/api/admin/request-password-reset", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: email.trim() }),
  });
  const data = (await res.json().catch(() => ({}))) as { error?: string };
  if (!res.ok) return data.error ?? "Odeslání e-mailu se nezdařilo.";
  return null;
}

export function adminResetPasswordRedirectUrl(): string {
  if (typeof window !== "undefined") {
    return `${window.location.origin}/admin/reset-password`;
  }
  return "/admin/reset-password";
}
