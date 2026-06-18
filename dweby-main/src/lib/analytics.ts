import { track } from "@vercel/analytics";

type AnalyticsProps = Record<string, string | number | boolean | null | undefined>;

const SITE_NAME =
  (import.meta.env.VITE_ANALYTICS_SITE_NAME as string | undefined)?.trim() || "DWeby";

/** Vlastní události — název vždy začíná webem (jeden Vercel projekt, více domén). */
export function trackEvent(name: string, props?: AnalyticsProps) {
  if (typeof window === "undefined") return;
  try {
    track(`${SITE_NAME} — ${name}`, {
      site: SITE_NAME,
      host: window.location.hostname,
      ...props,
    });
  } catch {
    /* blokátor / analytics vypnuté */
  }
}

export { SITE_NAME as ANALYTICS_SITE_NAME };
