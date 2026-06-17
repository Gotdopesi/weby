import { useMemo, useState } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  parse,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { cs } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { AdminReservationDetailList } from "@admin/core/components/AdminReservationDetailList";
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

const WEEKDAYS = ["Po", "Út", "St", "Čt", "Pá", "So", "Ne"];

type Props = {
  rows: Reservation[];
  barbershopId: number;
  loading?: boolean;
  readOnly?: boolean;
  onDelete?: (id: string) => void;
};

function countByDate(rows: Reservation[]) {
  const map = new Map<string, Reservation[]>();
  for (const r of rows) {
    if (r.status === "canceled") continue;
    const list = map.get(r.booking_date) ?? [];
    list.push(r);
    map.set(r.booking_date, list);
  }
  for (const [, list] of map) {
    list.sort((a, b) => a.booking_time.localeCompare(b.booking_time));
  }
  return map;
}

export function AdminMonthCalendar({ rows, barbershopId, loading, readOnly, onDelete }: Props) {
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const byDate = useMemo(() => countByDate(rows), [rows]);

  const gridDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(month), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [month]);

  const selectedRows = selectedKey ? (byDate.get(selectedKey) ?? []) : [];
  const selectedLabel = selectedKey
    ? format(parse(selectedKey, "yyyy-MM-dd", new Date()), "EEEE d. MMMM yyyy", { locale: cs })
    : "";

  const openDay = (key: string, count: number) => {
    if (count === 0) return;
    setSelectedKey(key);
    setModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Button type="button" variant="outline" size="icon" onClick={() => setMonth((m) => subMonths(m, 1))}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h2 className="font-display text-2xl md:text-3xl capitalize text-center min-w-[200px]">
          {format(month, "LLLL yyyy", { locale: cs })}
        </h2>
        <Button type="button" variant="outline" size="icon" onClick={() => setMonth((m) => addMonths(m, 1))}>
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {WEEKDAYS.map((d) => (
          <div key={d} className="py-2">
            {d}
          </div>
        ))}
      </div>

      <div
        className={cn(
          "grid grid-cols-7 gap-1 sm:gap-2",
          loading && "opacity-50 pointer-events-none",
        )}
      >
        {gridDays.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const inMonth = isSameMonth(day, month);
          const count = byDate.get(key)?.length ?? 0;
          const isToday = isSameDay(day, new Date());
          const isSelected = selectedKey === key;

          return (
            <button
              key={key}
              type="button"
              disabled={!inMonth || count === 0}
              onClick={() => openDay(key, count)}
              className={cn(
                "relative min-h-[72px] sm:min-h-[88px] rounded-lg border p-1.5 sm:p-2 text-left transition-all",
                !inMonth && "opacity-30 border-transparent bg-transparent",
                inMonth && count === 0 && "border-border/40 bg-muted/20 cursor-default",
                inMonth &&
                  count > 0 &&
                  "border-gold/40 bg-card hover:border-gold hover:shadow-md cursor-pointer",
                isSelected && inMonth && "ring-2 ring-gold border-gold",
                isToday && inMonth && "bg-gold/5",
              )}
            >
              <span
                className={cn(
                  "text-sm font-medium",
                  isToday ? "text-gold" : inMonth ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {format(day, "d")}
              </span>
              {inMonth && count > 0 && (
                <div className="mt-1 flex flex-wrap gap-0.5 items-center">
                  {Array.from({ length: Math.min(count, 4) }).map((_, i) => (
                    <span key={i} className="h-1.5 w-1.5 rounded-full bg-gold" />
                  ))}
                  <span className="text-[10px] sm:text-xs text-muted-foreground ml-0.5 w-full">
                    {count} {count === 1 ? "termín" : count < 5 ? "termíny" : "termínů"}
                  </span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      <Dialog
        open={modalOpen}
        onOpenChange={(open) => {
          setModalOpen(open);
          if (!open) setSelectedKey(null);
        }}
      >
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-xl capitalize">{selectedLabel}</DialogTitle>
          </DialogHeader>
          <AdminReservationDetailList
            rows={selectedRows}
            barbershopId={barbershopId}
            readOnly={readOnly}
            onDelete={onDelete}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

