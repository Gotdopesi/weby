import { useMemo, useState } from "react";
import { ChevronRight, Clock, Crown, TrendingUp, UserRound, Users } from "lucide-react";
import type { StatsPeriod } from "@/admin/templates/owner/lib/admin-statistics-period";
import {
  buildStaffMetrics,
  formatCurrency,
  formatMinutesHuman,
  staffMetricsSummary,
  type StaffMetricsRow,
} from "@/admin/templates/owner/lib/admin-staff-metrics";
import { buildPriceResolver } from "@/admin/templates/owner/lib/admin-revenue-from-reservations";
import type { Reservation } from "@/lib/reservations-by-day";
import type { StaffMember } from "@/lib/staff";
import { AdminStaffDetailSheet } from "@/admin/templates/owner/components/AdminStaffDetailSheet";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

type CatalogService = {
  id: number;
  name: string;
  price: number;
};

type Props = {
  staff: StaffMember[];
  reservations: Reservation[];
  catalog: CatalogService[];
  period: StatsPeriod;
  periodAnchor: Date;
  scopeLabel: string;
};

function UtilizationBar({ pct }: { pct: number }) {
  return (
    <div className="flex items-center gap-2 min-w-[100px]">
      <div className="flex-1 h-2 rounded-full bg-muted/60 overflow-hidden">
        <div
          className="h-full bg-gold/80 rounded-full transition-all"
          style={{ width: `${Math.max(4, pct)}%` }}
        />
      </div>
      <span className="text-xs text-muted-foreground w-9 text-right tabular-nums">{pct}%</span>
    </div>
  );
}

function StaffAvatar({ row }: { row: StaffMetricsRow }) {
  if (row.photoUrl) {
    return (
      <img
        src={row.photoUrl}
        alt=""
        className="h-10 w-10 rounded-full object-cover border border-border shrink-0"
      />
    );
  }
  return (
    <div className="h-10 w-10 rounded-full border border-border bg-muted flex items-center justify-center shrink-0">
      <UserRound className="h-4 w-4 text-muted-foreground" />
    </div>
  );
}

function StaffCard({
  row,
  rank,
  isTopEarner,
  onClick,
}: {
  row: StaffMetricsRow;
  rank: number;
  isTopEarner: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full text-left rounded-xl border p-4 transition-colors hover:bg-muted/40 active:bg-muted/60",
        isTopEarner ? "border-gold/40 bg-gold/5" : "border-border/80 bg-card/60",
      )}
    >
      <div className="flex items-start gap-3">
        <StaffAvatar row={row} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-muted-foreground font-medium">#{rank}</span>
            <p className="font-medium truncate">{row.name}</p>
            {isTopEarner && (
              <Crown className="h-4 w-4 text-gold shrink-0" aria-label="Nejvíc vydělal" />
            )}
          </div>
          <p className="text-xs text-muted-foreground truncate">{row.roleTitle}</p>
        </div>
        <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0 mt-1" />
      </div>
      <div className="grid grid-cols-2 gap-2 mt-4 text-sm">
        <div>
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Vyděláno</p>
          <p className="font-display text-lg">{formatCurrency(row.earned)}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Využití</p>
          <p className="font-display text-lg">{row.utilizationPct}%</p>
        </div>
        <div className="col-span-2">
          <UtilizationBar pct={row.utilizationPct} />
        </div>
        <p className="col-span-2 text-xs text-muted-foreground">
          {formatMinutesHuman(row.bookedMinutes)} s klienty · směny{" "}
          {formatMinutesHuman(row.scheduledMinutes)}
        </p>
      </div>
    </button>
  );
}

export function AdminStaffPerformanceSection({
  staff,
  reservations,
  catalog,
  period,
  periodAnchor,
  scopeLabel,
}: Props) {
  const [detailRow, setDetailRow] = useState<StaffMetricsRow | null>(null);

  const priceOf = useMemo(() => buildPriceResolver(catalog), [catalog]);

  const rows = useMemo(
    () => buildStaffMetrics(staff, reservations, period, periodAnchor, priceOf),
    [staff, reservations, period, periodAnchor, priceOf],
  );

  const staffRows = useMemo(() => rows.filter((r) => r.staffId > 0), [rows]);

  const topEarnerId = useMemo(() => {
    const sorted = [...staffRows].sort((a, b) => b.earned - a.earned);
    return sorted[0]?.staffId ?? null;
  }, [staffRows]);

  const summary = useMemo(() => staffMetricsSummary(staffRows), [staffRows]);

  if (staff.length === 0) {
    return (
      <section className="mb-8">
        <h2 className="font-display text-xl sm:text-2xl mb-4 flex items-center gap-2">
          <Users className="h-6 w-6 text-gold" />
          Tým
        </h2>
        <p className="text-sm text-muted-foreground">
          Zatím nemáte načtený tým — spusťte v Supabase{" "}
          <code className="text-xs bg-muted px-1 rounded">kadernictvi_pracovnici.sql</code>.
        </p>
      </section>
    );
  }

  return (
    <section className="mb-8">
      <h2 className="font-display text-xl sm:text-2xl mb-1 flex items-center gap-2">
        <Users className="h-6 w-6 text-gold" />
        Pracovníci
      </h2>
      <p className="text-sm text-muted-foreground mb-4 capitalize">{scopeLabel}</p>

      <div className="grid gap-3 sm:grid-cols-3 mb-6">
        <Card className="border-gold/20">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Tržby týmu</p>
            <p className="font-display text-2xl">{formatCurrency(summary.earned + summary.planned)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Clock className="h-8 w-8 text-gold/80 shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Čas s klienty</p>
              <p className="font-display text-xl">{formatMinutesHuman(summary.bookedMinutes)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <TrendingUp className="h-8 w-8 text-gold/80 shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Plánované směny</p>
              <p className="font-display text-xl">{formatMinutesHuman(summary.scheduledMinutes)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="md:hidden space-y-3 mb-4">
        {staffRows.map((row, i) => (
          <StaffCard
            key={row.staffId}
            row={row}
            rank={i + 1}
            isTopEarner={row.staffId === topEarnerId && row.earned > 0}
            onClick={() => setDetailRow(row)}
          />
        ))}
      </div>

      <div className="hidden md:block rounded-xl border border-border bg-card/50 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Člen týmu</TableHead>
              <TableHead className="text-right">Vyděláno</TableHead>
              <TableHead className="text-right">S klienty</TableHead>
              <TableHead className="text-right">Směny</TableHead>
              <TableHead>Využití</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {staffRows.map((row, i) => (
              <TableRow
                key={row.staffId}
                className={cn(
                  "cursor-pointer hover:bg-muted/30",
                  row.staffId === topEarnerId && row.earned > 0 && "bg-gold/5",
                )}
                onClick={() => setDetailRow(row)}
              >
                <TableCell>
                  <div className="flex items-center gap-3 min-w-[180px]">
                    <span className="text-xs text-muted-foreground w-5">#{i + 1}</span>
                    <StaffAvatar row={row} />
                    <div className="min-w-0">
                      <p className="font-medium truncate flex items-center gap-1.5">
                        {row.name}
                        {row.staffId === topEarnerId && row.earned > 0 && (
                          <Crown className="h-3.5 w-3.5 text-gold" />
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{row.roleTitle}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-right font-medium tabular-nums">
                  {formatCurrency(row.earned)}
                  {row.planned > 0 && (
                    <p className="text-[10px] text-muted-foreground font-normal">
                      +{formatCurrency(row.planned)} plán
                    </p>
                  )}
                </TableCell>
                <TableCell className="text-right tabular-nums whitespace-nowrap">
                  {formatMinutesHuman(row.bookedMinutes)}
                </TableCell>
                <TableCell className="text-right tabular-nums whitespace-nowrap">
                  {formatMinutesHuman(row.scheduledMinutes)}
                </TableCell>
                <TableCell>
                  <UtilizationBar pct={row.utilizationPct} />
                </TableCell>
                <TableCell>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <p className="text-xs text-muted-foreground mt-3 md:hidden">
        Klepněte na kartu pro detail pracovníka.
      </p>

      <AdminStaffDetailSheet
        row={detailRow}
        open={detailRow != null}
        onOpenChange={(o) => !o && setDetailRow(null)}
        scopeLabel={scopeLabel}
        period={period}
        periodAnchor={periodAnchor}
        reservations={reservations}
        isTopEarner={detailRow?.staffId === topEarnerId && (detailRow?.earned ?? 0) > 0}
      />
    </section>
  );
}
