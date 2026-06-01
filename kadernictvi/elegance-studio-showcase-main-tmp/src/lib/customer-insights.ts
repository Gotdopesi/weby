import { format, parse, startOfMonth, startOfYear } from "date-fns";
import type { Reservation } from "@/lib/reservations-by-day";

export type CustomerRecord = {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  note: string | null;
};

export type NextAppointment = {
  booking_date: string;
  booking_time: string;
  service: string;
};

export type CustomerInsight = {
  email: string;
  completedVisits: number;
  canceledCount: number;
  note: string | null;
  nextAppointment: NextAppointment | null;
  isFirstVisit: boolean;
  lastCompletedDate: string | null;
};

export type CustomerListPeriod = "month" | "year";

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function reservationStart(r: Reservation): Date {
  const d = parse(r.booking_date, "yyyy-MM-dd", new Date());
  const [h, m] = r.booking_time.split(":").map(Number);
  d.setHours(h, m ?? 0, 0, 0);
  return d;
}

/** Návštěva proběhla — termín + délka služby už uplynuly. */
export function isCompletedVisit(r: Reservation, now = new Date()): boolean {
  if (r.status === "canceled") return false;
  const endMs =
    reservationStart(r).getTime() + (Number(r.duration_minutes) || 60) * 60_000;
  return endMs <= now.getTime();
}

export function isUpcomingReservation(r: Reservation, now = new Date()): boolean {
  if (r.status === "canceled") return false;
  return !isCompletedVisit(r, now);
}

export function buildCustomerInsights(
  reservations: Reservation[],
  customers: CustomerRecord[],
  now = new Date(),
): Map<string, CustomerInsight> {
  const notes = new Map(customers.map((c) => [normalizeEmail(c.email), c.note]));
  const byEmail = new Map<string, Reservation[]>();

  for (const r of reservations) {
    const email = normalizeEmail(r.email ?? "");
    if (!email) continue;
    const list = byEmail.get(email) ?? [];
    list.push(r);
    byEmail.set(email, list);
  }

  const result = new Map<string, CustomerInsight>();

  for (const [email, rows] of byEmail) {
    const completed = rows.filter((r) => isCompletedVisit(r, now));
    const canceled = rows.filter((r) => r.status === "canceled");
    const upcoming = rows
      .filter((r) => isUpcomingReservation(r, now))
      .sort((a, b) => {
        const cmp = a.booking_date.localeCompare(b.booking_date);
        return cmp !== 0 ? cmp : a.booking_time.localeCompare(b.booking_time);
      });

    const lastCompleted = completed
      .map((r) => r.booking_date)
      .sort()
      .at(-1) ?? null;

    const next = upcoming[0];
    result.set(email, {
      email,
      completedVisits: completed.length,
      canceledCount: canceled.length,
      note: notes.get(email) ?? null,
      nextAppointment: next
        ? {
            booking_date: next.booking_date,
            booking_time: next.booking_time,
            service: next.service,
          }
        : null,
      isFirstVisit: completed.length === 0,
      lastCompletedDate: lastCompleted,
    });
  }

  for (const c of customers) {
    const email = normalizeEmail(c.email);
    if (!result.has(email)) {
      result.set(email, {
        email,
        completedVisits: 0,
        canceledCount: 0,
        note: c.note,
        nextAppointment: null,
        isFirstVisit: true,
        lastCompletedDate: null,
      });
    }
  }

  return result;
}

export function completedVisitsInPeriod(
  reservations: Reservation[],
  email: string,
  period: CustomerListPeriod,
  anchor: Date,
  now = new Date(),
): number {
  const normalized = normalizeEmail(email);
  const prefix =
    period === "year"
      ? format(startOfYear(anchor), "yyyy")
      : format(startOfMonth(anchor), "yyyy-MM");

  return reservations.filter(
    (r) =>
      normalizeEmail(r.email ?? "") === normalized &&
      isCompletedVisit(r, now) &&
      r.booking_date.startsWith(prefix),
  ).length;
}

/** Zákazníci s proběhlou návštěvou ve zvoleném měsíci/roce. */
export function filterCustomersForPeriod(
  customers: CustomerRecord[],
  reservations: Reservation[],
  period: CustomerListPeriod,
  anchor: Date,
  now = new Date(),
): CustomerRecord[] {
  const prefix =
    period === "year"
      ? format(startOfYear(anchor), "yyyy")
      : format(startOfMonth(anchor), "yyyy-MM");

  const emailsWithCompleted = new Set(
    reservations
      .filter(
        (r) =>
          isCompletedVisit(r, now) &&
          r.booking_date.startsWith(prefix) &&
          normalizeEmail(r.email ?? ""),
      )
      .map((r) => normalizeEmail(r.email ?? "")),
  );

  return customers.filter((c) => emailsWithCompleted.has(normalizeEmail(c.email)));
}

export function getInsightForReservation(
  insights: Map<string, CustomerInsight>,
  r: Reservation,
): CustomerInsight | null {
  const email = normalizeEmail(r.email ?? "");
  if (!email) return null;
  return insights.get(email) ?? null;
}
