import { endOfMonth, format, startOfMonth, subMonths } from "date-fns";
import { cs } from "date-fns/locale";

export type TrzbyRow = {
  id: number;
  rezervace_id: string;
  amount: number;
  revenue_kind: "earned" | "planned" | "canceled";
  booking_date: string;
  booking_time: string;
  service_name: string;
};

export function formatCurrency(amount: number): string {
  return `${amount.toLocaleString("cs-CZ", { maximumFractionDigits: 0 })} Kč`;
}

export function isInMonth(r: TrzbyRow, month: Date): boolean {
  const start = format(startOfMonth(month), "yyyy-MM-dd");
  const end = format(endOfMonth(month), "yyyy-MM-dd");
  return r.booking_date >= start && r.booking_date <= end;
}

export function sumEarnedInMonth(rows: TrzbyRow[], month: Date): number {
  return rows
    .filter((r) => isInMonth(r, month) && r.revenue_kind === "earned")
    .reduce((s, r) => s + Number(r.amount), 0);
}

export function sumPlannedInMonth(rows: TrzbyRow[], month: Date): number {
  return rows
    .filter((r) => isInMonth(r, month) && r.revenue_kind === "planned")
    .reduce((s, r) => s + Number(r.amount), 0);
}

export function monthlyHistory(rows: TrzbyRow[], monthsBack = 6, now = new Date()) {
  const items: { key: string; label: string; total: number }[] = [];
  for (let i = 1; i <= monthsBack; i++) {
    const m = subMonths(startOfMonth(now), i);
    const total = sumEarnedInMonth(rows, m);
    items.push({
      key: format(m, "yyyy-MM"),
      label: format(m, "LLLL yyyy", { locale: cs }),
      total,
    });
  }
  return items;
}
