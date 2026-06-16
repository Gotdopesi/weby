import type { VercelRequest } from "@vercel/node";
import sites from "../sites.config.json";

export type SiteConfig = (typeof sites.sites)[number];

function hostFromRequest(req?: VercelRequest | Request): string {
  if (!req) return "";
  const h =
    "headers" in req && typeof req.headers.get === "function"
      ? req.headers.get("host")
      : (req as VercelRequest).headers?.host;
  return (h ?? "").split(":")[0].toLowerCase();
}

export function resolveSite(req?: VercelRequest | Request): SiteConfig | null {
  const host = hostFromRequest(req);
  const active = sites.sites.filter((s) => s.deploy !== false);
  if (!host) return null;
  return (
    active.find((s) => s.hosts.some((h) => h.toLowerCase() === host)) ??
    active.find((s) => s.hasApi) ??
    null
  );
}

export function getPublicSiteUrl(req?: VercelRequest | Request): string {
  const site = resolveSite(req);
  const raw =
    (site?.siteUrlEnv && process.env[site.siteUrlEnv]?.trim()) ||
    process.env.SITE_URL?.trim() ||
    site?.siteUrl?.trim();

  if (raw) {
    try {
      const origin = new URL(raw.startsWith("http") ? raw : `https://${raw}`).origin;
      if (!origin.includes("vercel.app")) return origin;
    } catch {
      /* fallback */
    }
  }

  return site?.siteUrl ?? "https://donzi.dweby.cz";
}

export function getResendFrom(req?: VercelRequest | Request): string {
  if (process.env.RESEND_USE_SANDBOX?.trim() === "true") {
    return "Studio Elegance <onboarding@resend.dev>";
  }
  const site = resolveSite(req);
  return (
    (site?.resendFromEnv && process.env[site.resendFromEnv]?.trim()) ||
    process.env.RESEND_FROM?.trim() ||
    site?.resendFrom ||
    "Studio Elegance <onboarding@resend.dev>"
  );
}

export function getDefaultBarbershopName(req?: VercelRequest | Request): string {
  const site = resolveSite(req);
  return site?.defaultBarbershopName ?? "Salón";
}
