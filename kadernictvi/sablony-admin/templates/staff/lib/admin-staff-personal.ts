import type { StatsPeriod } from "@/admin/templates/owner/lib/admin-statistics-period";
import { reservationsInScope } from "@/admin/templates/owner/lib/admin-statistics-period";
import type { Reservation } from "@/lib/reservations-by-day";
import { formatCurrency } from "@/lib/trzby-metrics";

type PriceResolver = (r: Reservation) => number;

export type ServiceBreakdownRow = {
  name: string;
  count: number;
};

export type StaffPersonalOverview = {
  clientCount: number;
  completedCount: number;
  upcomingCount: number;
  canceledCount: number;
  smsCount: number;
  earned: number;
  planned: number;
  topService: { name: string; count: number } | null;
  serviceBreakdown: ServiceBreakdownRow[];
};

function revenue(r: Reservation, priceOf: PriceResolver): number {
  if (r.status === "canceled") return 0;
  const stored = r.total_price != null ? Number(r.total_price) : 0;
  if (stored > 0) return stored;
  return priceOf(r);
}

export function buildStaffPersonalOverview(
  staffId: number,
  reservations: Reservation[],
  period: StatsPeriod,
  anchor: Date,
  priceOf: PriceResolver,
  now = new Date(),
): StaffPersonalOverview {
  const todayKey = now.toISOString().slice(0, 10);
  const scoped = reservationsInScope(reservations, period, anchor).filter(
    (r) => (r as Reservation & { pracovnik_id?: number | null }).pracovnik_id === staffId,
  );

  let earned = 0;
  let planned = 0;
  let completedCount = 0;
  let upcomingCount = 0;
  let canceledCount = 0;
  let smsCount = 0;
  const serviceCounts = new Map<string, number>();

  for (const r of scoped) {
    if (r.status === "canceled") {
      canceledCount += 1;
      continue;
    }

    if (r.sms_sent === true) smsCount += 1;

    const name = r.service?.trim() || "Neznámá služba";
    serviceCounts.set(name, (serviceCounts.get(name) ?? 0) + 1);

    const amount = revenue(r, priceOf);
    if (r.booking_date < todayKey) {
      earned += amount;
      completedCount += 1;
    } else {
      planned += amount;
      upcomingCount += 1;
    }
  }

  const topService =
    [...serviceCounts.entries()].sort((a, b) => b[1] - a[1])[0] ?? null;

  const serviceBreakdown = [...serviceCounts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  const uniqueClients = new Set(
    scoped
      .filter((r) => r.status !== "canceled")
      .map((r) => {
        const email = r.email?.trim().toLowerCase();
        const phone = r.phone?.trim();
        if (email) return `e:${email}`;
        if (phone) return `p:${phone}`;
        const name = [r.first_name, r.last_name].filter(Boolean).join(" ").trim().toLowerCase();
        return name ? `n:${name}` : `r:${r.id}`;
      }),
  );

  return {
    clientCount: uniqueClients.size,
    completedCount,
    upcomingCount,
    canceledCount,
    smsCount,
    earned,
    planned,
    topService: topService ? { name: topService[0], count: topService[1] } : null,
    serviceBreakdown,
  };
}

export { formatCurrency };
