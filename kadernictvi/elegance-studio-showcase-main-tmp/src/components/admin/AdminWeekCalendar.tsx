import { useMemo, useState } from "react";
import { addDays, format, isSameDay, parse, startOfDay, subDays } from "date-fns";
import { cs } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { AdminReservationDetailList } from "@/components/admin/AdminReservationDetailList";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { Reservation } from "@/lib/reservations-by-day";
import { customerLabel } from "@/lib/reservations-by-day";
import { getTimeSlotsForWeek, timeToMinutes } from "@/lib/booking-slots";
import { getOpeningHoursForDay } from "@/lib/opening-hours";
import { buildWeekColumnStates } from "@/lib/week-calendar-grid";

const VISIBLE_DAYS = 7;
const ROW_HEIGHT_PX = 40;

type Props = {
  rows: Reservation[];
  barbershopId: number;
  loading?: boolean;
  readOnly?: boolean;
  onDelete?: (id: string) => void;
};

function activeReservations(rows: Reservation[]) {
  return rows.filter((r) => r.status !== "canceled");
}

export function AdminWeekCalendar({ rows, barbershopId, loading, readOnly, onDelete }: Props) {
  const [windowStart, setWindowStart] = useState(() => startOfDay(new Date()));
  const [picked, setPicked] = useState<Reservation | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const weekDays = useMemo(
    () => Array.from({ length: VISIBLE_DAYS }, (_, i) => addDays(windowStart, i)),
    [windowStart],
  );

  const todayStart = startOfDay(new Date());
  const isCurrentWindow = isSameDay(windowStart, todayStart);

  const timeSlots = useMemo(() => getTimeSlotsForWeek(weekDays), [weekDays]);

  const byDate = useMemo(() => {
    const map = new Map<string, Reservation[]>();
    for (const r of activeReservations(rows)) {
      const list = map.get(r.booking_date) ?? [];
      list.push(r);
      map.set(r.booking_date, list);
    }
    return map;
  }, [rows]);

  const columnStates = useMemo(
    () =>
      weekDays.map((d) => {
        const key = format(d, "yyyy-MM-dd");
        return buildWeekColumnStates(byDate.get(key) ?? [], timeSlots);
      }),
    [weekDays, byDate, timeSlots],
  );

  const weekLabel = `${format(weekDays[0], "d. M.", { locale: cs })} – ${format(weekDays[6], "d. M. yyyy", { locale: cs })}`;

  const openReservation = (r: Reservation) => {
    setPicked(r);
    setDialogOpen(true);
  };

  const pickedLabel = picked
    ? format(parse(picked.booking_date, "yyyy-MM-dd", new Date()), "EEEE d. MMMM yyyy", {
        locale: cs,
      })
    : "";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => setWindowStart((w) => subDays(w, VISIBLE_DAYS))}
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div className="flex flex-col items-center gap-1">
          <span className="font-display text-xl capitalize">{weekLabel}</span>
          {!isCurrentWindow && (
            <Button
              type="button"
              variant="link"
              size="sm"
              className="h-auto py-0 text-xs"
              onClick={() => setWindowStart(todayStart)}
            >
              Skočit na dnešek
            </Button>
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => setWindowStart((w) => addDays(w, VISIBLE_DAYS))}
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {loading ? (
        <p className="text-center text-muted-foreground py-12 text-sm">Načítám…</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[720px] border-collapse text-xs table-fixed">
            <thead>
              <tr className="bg-muted/40">
                <th className="p-2 w-14 text-left text-muted-foreground font-medium border-b border-border/60">
                  Čas
                </th>
                {weekDays.map((d, i) => {
                  const hours = getOpeningHoursForDay(d);
                  return (
                    <th
                      key={d.toISOString()}
                      className={cn(
                        "p-2 border-b border-border/60 text-center",
                        isSameDay(d, new Date()) && "bg-gold/10",
                        !hours && "opacity-40",
                      )}
                    >
                      <div className="font-medium capitalize">
                        {format(d, "EEE", { locale: cs })}
                      </div>
                      <div className="text-muted-foreground">{format(d, "d. M.", { locale: cs })}</div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {timeSlots.map((slot, slotIdx) => (
                <tr key={slot} style={{ height: ROW_HEIGHT_PX }}>
                  <td className="p-1.5 text-muted-foreground align-top border-b border-border/30 whitespace-nowrap">
                    {slot}
                  </td>
                  {weekDays.map((d, dayIdx) => {
                    const key = format(d, "yyyy-MM-dd");
                    const hours = getOpeningHoursForDay(d);
                    const slotMin = timeToMinutes(slot);
                    const state = columnStates[dayIdx][slotIdx];

                    if (state === "skip") return null;

                    if (!hours || slotMin < hours.open || slotMin >= hours.close) {
                      return (
                        <td
                          key={key + slot}
                          className="border-b border-border/30 bg-muted/20 p-0"
                        />
                      );
                    }

                    if (state && typeof state === "object") {
                      const r = state.reservation;
                      const endMin =
                        timeToMinutes(r.booking_time) + (Number(r.duration_minutes) || 60);
                      const endLabel = `${String(Math.floor(endMin / 60)).padStart(2, "0")}:${String(endMin % 60).padStart(2, "0")}`;

                      return (
                        <td
                          key={key + r.id}
                          rowSpan={state.rowSpan}
                          className="border-b border-border/30 p-1 align-top"
                        >
                          <button
                            type="button"
                            onClick={() => openReservation(r)}
                            className="w-full h-full min-h-[2.5rem] rounded-md px-2 py-1.5 text-left bg-gold/25 border border-gold/50 hover:bg-gold/35 hover:border-gold transition-colors"
                          >
                            <div className="font-medium text-[11px] leading-tight truncate">
                              {customerLabel(r)}
                            </div>
                            <div className="text-[10px] text-muted-foreground truncate">{r.service}</div>
                            <div className="text-[10px] text-muted-foreground mt-0.5">
                              {r.booking_time} – {endLabel}
                            </div>
                          </button>
                        </td>
                      );
                    }

                    return <td key={key + slot} className="border-b border-border/30 p-0" />;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-xl capitalize">{pickedLabel}</DialogTitle>
          </DialogHeader>
          {picked && (
            <AdminReservationDetailList
              rows={[picked]}
              barbershopId={barbershopId}
              readOnly={readOnly}
              onDelete={(id) => {
                onDelete?.(id);
                setDialogOpen(false);
                setPicked(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
