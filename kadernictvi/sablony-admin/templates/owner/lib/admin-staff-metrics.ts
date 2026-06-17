import type { StatsPeriod } from "@/admin/templates/owner/lib/admin-statistics-period";
import { daysInScope, reservationsInScope } from "@/admin/templates/owner/lib/admin-statistics-period";
import type { Reservation } from "@/lib/reservations-by-day";
import {
  formatMinutesHuman,
  parseStaffWorkSchedule,
  scheduledMinutesInDays,
  utilizationPercent,
  type StaffWeeklySchedule,
} from "@/lib/staff-schedule";
import { staffDisplayName, type StaffMember } from "@/lib/staff";
import { formatCurrency } from "@/lib/trzby-metrics";

export type StaffServiceCount = { name: string; count: number };

export type StaffMetricsRow = {
  staffId: number;
  name: string;
  roleTitle: string;
  photoUrl: string;
  reservationCount: number;
  completedCount: number;
  canceledCount: number;
  smsCount: number;
  earned: number;
  planned: number;
  bookedMinutes: number;
  scheduledMinutes: number;
  utilizationPct: number;
  avgMinutesPerBooking: number;
  topService: StaffServiceCount | null;
  serviceBreakdown: StaffServiceCount[];
};

type StaffSource = Pick<
  StaffMember,
  "id" | "first_name" | "last_name" | "role_title" | "photo_url"
> & {
  work_schedule?: unknown;
};

type PriceResolver = (r: Reservation) => number;

function reservationRevenue(r: Reservation, priceOf: PriceResolver): number {
  if (r.status === "canceled") return 0;
  const stored = r.total_price != null ? Number(r.total_price) : 0;
  if (stored > 0) return stored;
  return priceOf(r);
}

function bookingMinutes(r: Reservation): number {
  return Number(r.duration_minutes) || 60;
}

export function buildStaffMetrics(
  staff: StaffSource[],
  reservations: Reservation[],
  period: StatsPeriod,
  anchor: Date,
  priceOf: PriceResolver,
  now = new Date(),
): StaffMetricsRow[] {
  const scoped = reservationsInScope(reservations, period, anchor);
  const scopeDays = daysInScope(period, anchor);
  const todayKey = now.toISOString().slice(0, 10);

  const byStaff = new Map<number, StaffMetricsRow>();

  for (const s of staff) {
    const schedule = parseStaffWorkSchedule(s.work_schedule);
    byStaff.set(s.id, {
      staffId: s.id,
      name: staffDisplayName(s),
      roleTitle: s.role_title,
      photoUrl: s.photo_url,
      reservationCount: 0,
      completedCount: 0,
      canceledCount: 0,
      smsCount: 0,
      earned: 0,
      planned: 0,
      bookedMinutes: 0,
      scheduledMinutes: scheduledMinutesForScope(scopeDays, schedule, todayKey, period),
      utilizationPct: 0,
      avgMinutesPerBooking: 0,
      topService: null,
      serviceBreakdown: [],
    });
  }

  const serviceCountsByStaff = new Map<number, Map<string, number>>();

  let unassigned: StaffMetricsRow | null = null;

  for (const r of scoped) {
    const sid = (r as Reservation & { pracovnik_id?: number | null }).pracovnik_id;
    const minutes = bookingMinutes(r);
    const amount = reservationRevenue(r, priceOf);
    const isCanceled = r.status === "canceled";
    const isPast = r.booking_date < todayKey;
    const isFuture = r.booking_date > todayKey;

    if (sid == null) {
      if (!unassigned) {
        unassigned = {
          staffId: 0,
          name: "Nepřiřazeno (je mi to jedno)",
          roleTitle: "Bez výběru kadeřníka",
          photoUrl: "",
          reservationCount: 0,
          completedCount: 0,
          canceledCount: 0,
          smsCount: 0,
          earned: 0,
          planned: 0,
          bookedMinutes: 0,
          scheduledMinutes: 0,
          utilizationPct: 0,
          avgMinutesPerBooking: 0,
          topService: null,
          serviceBreakdown: [],
        };
      }
      const row = unassigned;
      row.reservationCount += 1;
      if (isCanceled) row.canceledCount += 1;
      else if (isPast) {
        row.completedCount += 1;
        row.earned += amount;
        row.bookedMinutes += minutes;
      } else if (!isFuture || r.booking_date === todayKey) {
        row.planned += amount;
        row.bookedMinutes += minutes;
      }
      continue;
    }

    const row = byStaff.get(Number(sid));
    if (!row) continue;

    row.reservationCount += 1;
    if (r.sms_sent === true) row.smsCount += 1;
    if (isCanceled) {
      row.canceledCount += 1;
      continue;
    }

    const serviceName = r.service?.trim() || "Neznámá služba";
    let svcMap = serviceCountsByStaff.get(Number(sid));
    if (!svcMap) {
      svcMap = new Map();
      serviceCountsByStaff.set(Number(sid), svcMap);
    }
    svcMap.set(serviceName, (svcMap.get(serviceName) ?? 0) + 1);

    if (isPast) {
      row.completedCount += 1;
      row.earned += amount;
      row.bookedMinutes += minutes;
    } else {
      row.planned += amount;
      row.bookedMinutes += minutes;
    }
  }

  const rows = [...byStaff.values()];
  if (unassigned && unassigned.reservationCount > 0) rows.push(unassigned);

  for (const row of rows) {
    row.utilizationPct = utilizationPercent(row.bookedMinutes, row.scheduledMinutes);
    const active = row.completedCount + (row.reservationCount - row.completedCount - row.canceledCount);
    row.avgMinutesPerBooking =
      active > 0 ? Math.round(row.bookedMinutes / Math.max(1, row.reservationCount - row.canceledCount)) : 0;

    const svcMap = serviceCountsByStaff.get(row.staffId);
    if (svcMap) {
      row.serviceBreakdown = [...svcMap.entries()]
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);
      row.topService = row.serviceBreakdown[0] ?? null;
    }
  }

  return rows.sort((a, b) => b.earned + b.planned - (a.earned + a.planned));
}

function scheduledMinutesForScope(
  days: Date[],
  schedule: StaffWeeklySchedule | null,
  todayKey: string,
  period: StatsPeriod,
): number {
  if (period === "week") {
    return scheduledMinutesInDays(days, schedule);
  }
  if (period === "month") {
    return scheduledMinutesInDays(days, schedule);
  }
  // Rok: součet týdenních směn × počet týdnů v roce není přesné — počítáme dny v roce
  return scheduledMinutesInDays(days, schedule);
}

export function staffMetricsSummary(rows: StaffMetricsRow[]) {
  return rows.reduce(
    (acc, r) => ({
      earned: acc.earned + r.earned,
      planned: acc.planned + r.planned,
      bookedMinutes: acc.bookedMinutes + r.bookedMinutes,
      scheduledMinutes: acc.scheduledMinutes + r.scheduledMinutes,
      reservations: acc.reservations + r.reservationCount,
    }),
    { earned: 0, planned: 0, bookedMinutes: 0, scheduledMinutes: 0, reservations: 0 },
  );
}

export { formatMinutesHuman, formatCurrency };
