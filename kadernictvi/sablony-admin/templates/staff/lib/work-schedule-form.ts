import { minutesToTime, timeToMinutes } from "@/lib/booking-slots";
import {
  parseStaffWorkSchedule,
  type StaffWeeklySchedule,
} from "@/lib/staff-schedule";

export type DayScheduleField = {
  dow: number;
  label: string;
  fullLabel: string;
  enabled: boolean;
  open: string;
  close: string;
};

export const WEEKDAY_FIELDS: Omit<DayScheduleField, "enabled" | "open" | "close">[] = [
  { dow: 1, label: "Po", fullLabel: "Pondělí" },
  { dow: 2, label: "Út", fullLabel: "Úterý" },
  { dow: 3, label: "St", fullLabel: "Středa" },
  { dow: 4, label: "Čt", fullLabel: "Čtvrtek" },
  { dow: 5, label: "Pá", fullLabel: "Pátek" },
  { dow: 6, label: "So", fullLabel: "Sobota" },
  { dow: 0, label: "Ne", fullLabel: "Neděle" },
];

const DEFAULT_OPEN = "09:00";
const DEFAULT_WEEKDAY_CLOSE = "19:00";
const DEFAULT_SAT_CLOSE = "14:00";

export function scheduleToFormFields(raw: unknown): DayScheduleField[] {
  const schedule = parseStaffWorkSchedule(raw);

  return WEEKDAY_FIELDS.map((d) => {
    const hours = schedule?.[d.dow];
    const enabled = hours != null;
    const closeDefault = d.dow === 6 ? DEFAULT_SAT_CLOSE : DEFAULT_WEEKDAY_CLOSE;
    return {
      ...d,
      enabled,
      open: hours ? minutesToTime(hours.open) : DEFAULT_OPEN,
      close: hours ? minutesToTime(hours.close) : closeDefault,
    };
  });
}

export function formFieldsToSchedule(fields: DayScheduleField[]): StaffWeeklySchedule {
  const out: StaffWeeklySchedule = {};
  for (const f of fields) {
    if (!f.enabled) {
      out[f.dow] = null;
      continue;
    }
    const open = timeToMinutes(f.open);
    const close = timeToMinutes(f.close);
    if (close > open) {
      out[f.dow] = { open, close };
    }
  }
  return out;
}
