import { useMemo } from "react";
import { format, parseISO } from "date-fns";
import { cs } from "date-fns/locale";
import {
  Clock,
  Crown,
  MessageSquare,
  Star,
  TrendingUp,
  XCircle,
} from "lucide-react";
import type { StatsPeriod } from "@admin/templates/owner/lib/admin-statistics-period";
import { reservationsInScope } from "@admin/templates/owner/lib/admin-statistics-period";
import {
  formatCurrency,
  formatMinutesHuman,
  type StaffMetricsRow,
} from "@admin/templates/owner/lib/admin-staff-metrics";
import { customerLabel, type Reservation } from "@/lib/reservations-by-day";
import { Card, CardContent } from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

type Props = {
  row: StaffMetricsRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scopeLabel: string;
  period: StatsPeriod;
  periodAnchor: Date;
  reservations: Reservation[];
  isTopEarner?: boolean;
};

function UtilizationRing({ pct }: { pct: number }) {
  const clamped = Math.min(100, Math.max(0, pct));
  return (
    <div className="relative mx-auto h-28 w-28">
      <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
        <circle cx="18" cy="18" r="15.5" fill="none" className="stroke-muted" strokeWidth="3" />
        <circle
          cx="18"
          cy="18"
          r="15.5"
          fill="none"
          className="stroke-gold"
          strokeWidth="3"
          strokeDasharray={`${clamped} 100`}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-2xl">{clamped}%</span>
        <span className="text-[10px] text-muted-foreground">využití</span>
      </div>
    </div>
  );
}

export function AdminStaffDetailSheet({
  row,
  open,
  onOpenChange,
  scopeLabel,
  period,
  periodAnchor,
  reservations,
  isTopEarner,
}: Props) {
  const recentRows = useMemo(() => {
    if (!row || row.staffId === 0) return [];
    return reservationsInScope(reservations, period, periodAnchor)
      .filter((r) => r.pracovnik_id === row.staffId)
      .sort((a, b) => `${b.booking_date}${b.booking_time}`.localeCompare(`${a.booking_date}${a.booking_time}`))
      .slice(0, 15);
  }, [row, reservations, period, periodAnchor]);

  if (!row) return null;

  const totalRevenue = row.earned + row.planned;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[92vh] sm:h-[88vh] rounded-t-2xl overflow-y-auto">
        <SheetHeader className="text-left pb-4 border-b border-border/60">
          <div className="flex items-start gap-4">
            {row.photoUrl ? (
              <img
                src={row.photoUrl}
                alt=""
                className="h-16 w-16 rounded-full object-cover border-2 border-gold/40 shrink-0"
              />
            ) : (
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center shrink-0">
                <span className="font-display text-xl">{row.name.charAt(0)}</span>
              </div>
            )}
            <div className="min-w-0 flex-1">
              <SheetTitle className="font-display text-2xl flex items-center gap-2 flex-wrap">
                {row.name}
                {isTopEarner && row.staffId > 0 && (
                  <span className="inline-flex items-center gap-1 text-xs font-normal bg-gold/20 text-gold px-2 py-0.5 rounded-full">
                    <Crown className="h-3.5 w-3.5" />
                    Nejvíc vydělal
                  </span>
                )}
              </SheetTitle>
              <SheetDescription>{row.roleTitle}</SheetDescription>
              <p className="text-xs text-muted-foreground mt-1 capitalize">{scopeLabel}</p>
            </div>
          </div>
        </SheetHeader>

        <div className="py-6 space-y-6">
          <div className="grid grid-cols-2 gap-3">
            <Card className="border-gold/25 bg-gold/5">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <TrendingUp className="h-3.5 w-3.5" />
                  Vyděláno
                </p>
                <p className="font-display text-xl mt-1">{formatCurrency(row.earned)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">V plánu</p>
                <p className="font-display text-xl mt-1">{formatCurrency(row.planned)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <MessageSquare className="h-3.5 w-3.5" />
                  SMS
                </p>
                <p className="font-display text-xl mt-1">{row.smsCount}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <XCircle className="h-3.5 w-3.5" />
                  Zrušeno
                </p>
                <p className="font-display text-xl mt-1">{row.canceledCount}</p>
              </CardContent>
            </Card>
          </div>

          <div className="rounded-xl border border-border bg-card/50 p-5">
            <h3 className="font-display text-lg mb-4 text-center">Vytížení v období</h3>
            <div className="flex flex-col sm:flex-row items-center gap-6 justify-center">
              <UtilizationRing pct={row.utilizationPct} />
              <div className="space-y-3 text-sm w-full max-w-xs">
                <div className="flex justify-between border-b border-border/50 pb-2">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Clock className="h-4 w-4" />
                    Čas s klienty
                  </span>
                  <span className="font-medium">{formatMinutesHuman(row.bookedMinutes)}</span>
                </div>
                <div className="flex justify-between border-b border-border/50 pb-2">
                  <span className="text-muted-foreground">Plán směn</span>
                  <span className="font-medium">{formatMinutesHuman(row.scheduledMinutes)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Rezervací</span>
                  <span className="font-medium">{row.reservationCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Celkem tržby</span>
                  <span className="font-medium text-gold">{formatCurrency(totalRevenue)}</span>
                </div>
              </div>
            </div>
          </div>

          {row.serviceBreakdown.length > 0 && (
            <div>
              <h3 className="font-display text-lg mb-3 flex items-center gap-2">
                <Star className="h-5 w-5 text-gold" />
                Služby
              </h3>
              <ul className="space-y-2">
                {row.serviceBreakdown.slice(0, 6).map((s) => (
                  <li
                    key={s.name}
                    className="flex items-center justify-between rounded-lg border border-border/70 px-3 py-2 text-sm"
                  >
                    <span className="truncate pr-2">{s.name}</span>
                    <span className="tabular-nums text-muted-foreground shrink-0">{s.count}×</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {recentRows.length > 0 && (
            <div>
              <h3 className="font-display text-lg mb-3">Termíny v období</h3>
              <div className="rounded-xl border border-border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Datum</TableHead>
                      <TableHead>Čas</TableHead>
                      <TableHead className="hidden sm:table-cell">Klient</TableHead>
                      <TableHead>Stav</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentRows.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="text-xs whitespace-nowrap">
                          {format(parseISO(r.booking_date), "d. M.", { locale: cs })}
                        </TableCell>
                        <TableCell className="text-xs">{r.booking_time}</TableCell>
                        <TableCell className="hidden sm:table-cell text-xs truncate max-w-[120px]">
                          {customerLabel(r)}
                        </TableCell>
                        <TableCell>
                          <span
                            className={cn(
                              "text-[10px] rounded-full px-2 py-0.5",
                              r.status === "canceled"
                                ? "bg-amber-500/15 text-amber-800 dark:text-amber-200"
                                : "bg-emerald-500/15 text-emerald-800 dark:text-emerald-200",
                            )}
                          >
                            {r.status === "canceled" ? "Zrušeno" : "Aktivní"}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
