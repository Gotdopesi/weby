import { track } from "@vercel/analytics";
import { DEFAULT_KADERNICTVI_ID } from "@/lib/barbershop";

type AnalyticsProps = Record<string, string | number | boolean | null | undefined>;

const SITE_NAME =
  (import.meta.env.VITE_ANALYTICS_SITE_NAME as string | undefined)?.trim() || "Studio Elegance";

/** Vlastní události — název vždy začíná salónem (jeden Vercel projekt, více webů). */
export function trackEvent(name: string, props?: AnalyticsProps) {
  if (typeof window === "undefined") return;
  try {
    track(`${SITE_NAME} — ${name}`, {
      site: SITE_NAME,
      site_id: DEFAULT_KADERNICTVI_ID,
      host: window.location.hostname,
      ...props,
    });
  } catch {
    /* blokátor / analytics vypnuté */
  }
}

export { SITE_NAME as ANALYTICS_SITE_NAME };
