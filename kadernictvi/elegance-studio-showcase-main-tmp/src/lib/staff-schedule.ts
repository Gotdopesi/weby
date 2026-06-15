import { getOpeningHoursForDay } from "@/lib/opening-hours";

export type StaffDayHours = { open: number; close: number } | null;

/** 0 = neděle … 6 = sobota */
export type StaffWeeklySchedule = Partial<Record<number, StaffDayHours>>;

export function parseStaffWorkSchedule(raw: unknown): StaffWeeklySchedule | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const out: StaffWeeklySchedule = {};
  for (const [key, val] of Object.entries(raw as Record<string, unknown>)) {
    const dow = Number(key);
    if (!Number.isInteger(dow) || dow < 0 || dow > 6) continue;
    if (val === null) {
      out[dow] = null;
      continue;
    }
    if (typeof val !== "object" || val === null || Array.isArray(val)) continue;
    const open = Number((val as { open?: unknown }).open);
    const close = Number((val as { close?: unknown }).close);
    if (!Number.isFinite(open) || !Number.isFinite(close) || close <= open) continue;
    out[dow] = { open, close };
  }
  return Object.keys(out).length > 0 ? out : null;
}

export function hoursForStaffOnDay(day: Date, schedule: StaffWeeklySchedule | null): StaffDayHours {
  const dow = day.getDay();
  if (schedule && Object.prototype.hasOwnProperty.call(schedule, dow)) {
    return schedule[dow] ?? null;
  }
  return getOpeningHoursForDay(day);
}

export function scheduledMinutesOnDay(day: Date, schedule: StaffWeeklySchedule | null): number {
  const h = hoursForStaffOnDay(day, schedule);
  if (!h) return 0;
  return h.close - h.open;
}

export function scheduledMinutesInDays(days: Date[], schedule: StaffWeeklySchedule | null): number {
  return days.reduce((sum, d) => sum + scheduledMinutesOnDay(d, schedule), 0);
}

export function formatMinutesHuman(total: number): string {
  if (total <= 0) return "0 h";
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} h`;
  return `${h} h ${m} min`;
}

export function utilizationPercent(booked: number, scheduled: number): number {
  if (scheduled <= 0) return booked > 0 ? 100 : 0;
  return Math.min(100, Math.round((booked / scheduled) * 100));
}
