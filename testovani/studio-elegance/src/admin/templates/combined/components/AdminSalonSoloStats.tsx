import { useMemo } from "react";
import { CalendarCheck, Scissors, Users } from "lucide-react";
import {
  reservationsInScope,
  type StatsPeriod,
} from "@/admin/templates/owner/lib/admin-statistics-period";
import { buildPriceResolver } from "@/admin/templates/owner/lib/admin-revenue-from-reservations";
import { isCompletedVisit } from "@/lib/customer-insights";
import { formatCurrency } from "@/lib/trzby-metrics";
import type { Reservation } from "@/lib/reservations-by-day";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type CatalogService = {
  id: number;
  name: string;
  price: number;
};

type Props = {
  reservations: Reservation[];
  catalog: CatalogService[];
  period: StatsPeriod;
  periodAnchor: Date;
  scopeLabel: string;
};

export function AdminSalonSoloStats({
  reservations,
  catalog,
  period,
  periodAnchor,
  scopeLabel,
}: Props) {
  const scoped = useMemo(
    () => reservationsInScope(reservations, period, periodAnchor),
    [reservations, period, periodAnchor],
  );
  const priceOf = useMemo(() => buildPriceResolver(catalog), [catalog]);

  const completed = useMemo(
    () => scoped.filter((r) => isCompletedVisit(r)),
    [scoped],
  );

  const uniqueClients = useMemo(() => {
    const emails = new Set<string>();
    for (const r of completed) {
      if (r.email?.trim()) emails.add(r.email.trim().toLowerCase());
    }
    return emails.size;
  }, [completed]);

  const topServices = useMemo(() => {
    const map = new Map<string, { count: number; earned: number }>();
    for (const r of completed) {
      const name = r.service?.trim() || "Služba";
      const row = map.get(name) ?? { count: 0, earned: 0 };
      row.count += 1;
      row.earned += priceOf(r);
      map.set(name, row);
    }
    return [...map.entries()]
      .map(([name, stats]) => ({ name, ...stats }))
      .sort((a, b) => b.earned - a.earned)
      .slice(0, 6);
  }, [completed, priceOf]);

  const upcoming = useMemo(
    () => scoped.filter((r) => r.status !== "canceled" && !isCompletedVisit(r)).length,
    [scoped],
  );

  return (
    <section className="mb-8">
      <h2 className="font-display text-xl sm:text-2xl mb-1 flex items-center gap-2">
        <Scissors className="h-6 w-6 text-gold" />
        Přehled salonu
      </h2>
      <p className="text-sm text-muted-foreground mb-4 capitalize">{scopeLabel}</p>

      <div className="grid gap-3 sm:grid-cols-3 mb-6">
        <Card className="border-gold/20">
          <CardContent className="p-4 flex items-center gap-3">
            <CalendarCheck className="h-8 w-8 text-gold/80 shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Proběhlé návštěvy</p>
              <p className="font-display text-2xl">{completed.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Users className="h-8 w-8 text-gold/80 shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Unikátní klienti</p>
              <p className="font-display text-2xl">{uniqueClients}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Nadcházející termíny</p>
            <p className="font-display text-2xl">{upcoming}</p>
          </CardContent>
        </Card>
      </div>

      {topServices.length > 0 ? (
        <div className="rounded-xl border border-border bg-card/50 overflow-hidden">
          <div className="px-5 py-3 border-b border-border/60">
            <p className="text-sm font-medium">Nejvýdělečnější služby</p>
          </div>
          <ul className="divide-y divide-border/60">
            {topServices.map((svc) => (
              <li
                key={svc.name}
                className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 text-sm"
              >
                <span className="font-medium">{svc.name}</span>
                <span className="text-muted-foreground tabular-nums">
                  {svc.count}× · {formatCurrency(svc.earned)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">V tomto období zatím nejsou proběhlé návštěvy.</p>
      )}
    </section>
  );
}
