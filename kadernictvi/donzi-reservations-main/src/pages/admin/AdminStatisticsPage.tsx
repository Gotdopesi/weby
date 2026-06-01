import { useCallback, useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { cs } from "date-fns/locale";
import {
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Loader2,
  LogOut,
  MessageSquare,
  RefreshCw,
  Scissors,
  TrendingUp,
  XCircle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { REZERVACE_TABLE } from "@/lib/rezervace";
import { SHOWCASE_TABLES } from "@/lib/showcase-tables";
import { displayAmounts } from "@/lib/admin-revenue-display";
import {
  aggregateRevenueFromReservations,
  buildPriceResolver,
  buildRevenueChartFromReservations,
  formatRevenueAxisTick,
  mergeRevenueChartSeries,
  mergeRevenueTotals,
} from "@/lib/admin-revenue-from-reservations";
import {
  aggregateVydelkyInScope,
  buildPerformanceSeries,
  buildRevenueChartSeries,
  monthKeysInScope,
  periodScopeLabel,
  primaryMonthKey,
  reservationsInScope,
  shiftPeriodAnchor,
  type StatsPeriod,
} from "@/lib/admin-statistics-period";
import { useAdminBarbershop } from "@/lib/use-admin-barbershop";
import { useAdminSession } from "@/lib/use-admin-session";
import { AdminNav } from "@/components/admin/AdminNav";
import { AdminPeriodToggle } from "@/components/admin/AdminPeriodToggle";
import { AdminRevenueDetailDialog } from "@/components/admin/AdminRevenueDetailDialog";
import { AdminViewToggle } from "@/components/admin/AdminViewToggle";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, Legend, XAxis, YAxis } from "recharts";
import { CHART_BAR_FILL } from "@/lib/chart-colors";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/trzby-metrics";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { Reservation } from "@/lib/reservations-by-day";

type VydelkyRow = {
  month_key: string;
  earned: number;
  planned: number;
  total: number;
};

type ServiceStatsRow = {
  service_id: number | null;
  service_name: string;
  price: number;
  count_total: number;
  amount_total: number;
};

type CatalogService = {
  id: number;
  name: string;
  price: number;
  duration_minutes: number;
  is_active: boolean;
};

function aggregateServicesFromReservations(rows: Reservation[]): ServiceStatsRow[] {
  const map = new Map<string, ServiceStatsRow>();
  for (const r of rows) {
    if (r.status === "canceled") continue;
    const name = r.service?.trim() || "Neznámá služba";
    const prev = map.get(name);
    if (prev) {
      prev.count_total += 1;
      map.set(name, prev);
    } else {
      map.set(name, {
        service_id: null,
        service_name: name,
        price: 0,
        count_total: 1,
        amount_total: 0,
      });
    }
  }
  return [...map.values()].sort((a, b) => b.count_total - a.count_total);
}

export default function AdminStatisticsPage() {
  const { ready, authed, signOut } = useAdminSession();
  const { barbershopId, shopName } = useAdminBarbershop();

  const [statsPeriod, setStatsPeriod] = useState<StatsPeriod>("month");
  const [periodAnchor, setPeriodAnchor] = useState(() => new Date());
  const [vydelkyRows, setVydelkyRows] = useState<VydelkyRow[]>([]);
  const [serviceStats, setServiceStats] = useState<ServiceStatsRow[]>([]);
  const [catalog, setCatalog] = useState<CatalogService[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(false);
  const [detailMonth, setDetailMonth] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"table" | "chart">("table");

  const scopeLabel = periodScopeLabel(statsPeriod, periodAnchor);
  const monthKey = primaryMonthKey(statsPeriod, periodAnchor);
  const showPlanned = statsPeriod !== "week";

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const keys = monthKeysInScope(statsPeriod, periodAnchor);
      const svcQuery =
        statsPeriod === "week"
          ? Promise.resolve({ data: [], error: null })
          : supabase
              .from(SHOWCASE_TABLES.vydelkySluzby)
              .select("service_id, service_name, price, count_total, amount_total")
              .eq("barbershop_id", barbershopId)
              .in("month_key", keys)
              .order("count_total", { ascending: false });

      const [vyd, svc, cat, rez] = await Promise.all([
        supabase
          .from(SHOWCASE_TABLES.vydelky)
          .select("month_key, earned, planned, total")
          .eq("barbershop_id", barbershopId)
          .order("month_key", { ascending: false }),
        svcQuery,
        supabase
          .from(SHOWCASE_TABLES.services)
          .select("id, name, price, duration_minutes, is_active")
          .eq("barbershop_id", barbershopId)
          .eq("is_active", true)
          .order("name"),
        supabase
          .from(REZERVACE_TABLE)
          .select(
            "id, booking_date, booking_time, status, sms_sent, email, service, total_price, service_id",
          )
          .eq("barbershop_id", barbershopId),
      ]);

      if (vyd.error) toast.error("Tržby se nepodařilo načíst.", { description: vyd.error.message });
      else
        setVydelkyRows(
          (vyd.data ?? []).map((r) => ({
            month_key: r.month_key,
            earned: Number(r.earned),
            planned: Number(r.planned),
            total: Number(r.total),
          })),
        );

      if (!cat.error) {
        setCatalog(
          (cat.data ?? []).map((s) => ({
            id: s.id,
            name: s.name,
            price: Number(s.price),
            duration_minutes: Number(s.duration_minutes),
            is_active: Boolean(s.is_active),
          })),
        );
      }

      const allReservations = (rez.data ?? []) as Reservation[];
      if (!rez.error) setReservations(allReservations);

      if (statsPeriod === "week") {
        setServiceStats(
          aggregateServicesFromReservations(
            reservationsInScope(allReservations, statsPeriod, periodAnchor),
          ),
        );
      } else if (!svc.error) {
        const raw = (svc.data ?? []) as ServiceStatsRow[];
        const merged = new Map<string, ServiceStatsRow>();
        for (const r of raw) {
          const key = r.service_name;
          const prev = merged.get(key);
          if (prev) {
            prev.count_total += r.count_total;
            prev.amount_total += r.amount_total;
          } else {
            merged.set(key, { ...r });
          }
        }
        setServiceStats([...merged.values()].sort((a, b) => b.count_total - a.count_total));
      }
    } finally {
      setLoading(false);
    }
  }, [barbershopId, statsPeriod, periodAnchor]);

  useEffect(() => {
    if (ready && authed) void load();
  }, [ready, authed, load]);

  const scopedReservations = useMemo(
    () => reservationsInScope(reservations, statsPeriod, periodAnchor),
    [reservations, statsPeriod, periodAnchor],
  );

  const priceOf = useMemo(() => buildPriceResolver(catalog), [catalog]);

  const current = useMemo(() => {
    const fromDb = displayAmounts(
      aggregateVydelkyInScope(vydelkyRows, statsPeriod, periodAnchor),
    );
    const fromRez = aggregateRevenueFromReservations(
      reservations,
      statsPeriod,
      periodAnchor,
      priceOf,
    );
    return mergeRevenueTotals(fromDb, fromRez);
  }, [vydelkyRows, reservations, statsPeriod, periodAnchor, priceOf]);

  const canceledCount = useMemo(
    () => scopedReservations.filter((r) => r.status === "canceled").length,
    [scopedReservations],
  );

  const smsSentCount = useMemo(
    () => scopedReservations.filter((r) => r.sms_sent === true).length,
    [scopedReservations],
  );

  const performance = useMemo(
    () => buildPerformanceSeries(reservations, statsPeriod, periodAnchor),
    [reservations, statsPeriod, periodAnchor],
  );

  const maxPerformance = Math.max(...performance.map((p) => p.count), 1);

  const revenueChartData = useMemo(() => {
    if (statsPeriod === "week") return [];
    const fromRez = buildRevenueChartFromReservations(
      reservations,
      statsPeriod,
      periodAnchor,
      priceOf,
    );
    if (statsPeriod === "month") return fromRez;
    const fromDb = buildRevenueChartSeries(vydelkyRows, statsPeriod, periodAnchor);
    return mergeRevenueChartSeries(fromDb, fromRez);
  }, [reservations, vydelkyRows, statsPeriod, periodAnchor, priceOf]);

  const revenueChartSum = useMemo(
    () => revenueChartData.reduce((s, p) => s + p.earned + p.planned, 0),
    [revenueChartData],
  );

  const performanceTitle =
    statsPeriod === "week"
      ? "Výkonost týdne"
      : statsPeriod === "year"
        ? "Výkonost roku"
        : "Výkonost měsíce";

  const revenueChartTitle =
    statsPeriod === "year"
      ? "Tržby v roce"
      : statsPeriod === "month"
        ? "Tržby po dnech v měsíci"
        : "Tržby";

  const weekChartConfig = {
    count: { label: "Rezervace", color: CHART_BAR_FILL },
    planned: { label: "Počet", color: CHART_BAR_FILL },
  } as const;

  const serviceChartData = useMemo(
    () =>
      serviceStats.map((r) => ({
        name: r.service_name.length > 18 ? `${r.service_name.slice(0, 16)}…` : r.service_name,
        count: r.count_total,
      })),
    [serviceStats],
  );

  const serviceChartConfig = {
    count: { label: "Počet", color: CHART_BAR_FILL },
  } as const;

  const revenueChartConfig = {
    earned: { label: "Vyděláno", color: CHART_BAR_FILL },
    planned: { label: "V plánu", color: CHART_BAR_FILL },
  } as const;

  if (!ready || !authed) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-gold" />
        <p className="text-sm">Ověřuji přístup…</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between mb-6">
        <div>
          <p className="text-gold tracking-[0.25em] text-xs uppercase mb-2">Administrace</p>
          <h1 className="font-display text-4xl md:text-5xl flex items-center gap-3">
            <BarChart3 className="h-9 w-9 text-gold shrink-0" />
            Statistiky
          </h1>
          <div className="hairline w-20 mt-4 mb-2" />
          <p className="text-muted-foreground text-sm">{shopName ?? "Salón"}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => void load()} disabled={loading}>
            <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} />
            Obnovit
          </Button>
          <Button variant="outline" onClick={() => void signOut()}>
            <LogOut className="mr-2 h-4 w-4" />
            Odhlásit se
          </Button>
        </div>
      </div>

      <AdminNav />

      <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
        <AdminPeriodToggle
          value={statsPeriod}
          onChange={(p) => {
            setStatsPeriod(p);
            setPeriodAnchor(new Date());
          }}
        />
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => setPeriodAnchor((a) => shiftPeriodAnchor(statsPeriod, a, -1))}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <span className="font-display text-lg capitalize min-w-[200px] text-center">{scopeLabel}</span>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => setPeriodAnchor((a) => shiftPeriodAnchor(statsPeriod, a, 1))}
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
        <AdminViewToggle value={viewMode} onChange={setViewMode} />
      </div>

      <section className="mb-10">
        <h2 className="font-display text-2xl mb-4 flex items-center gap-2">
          <TrendingUp className="h-6 w-6 text-gold" />
          Tržby
          <span className="text-sm font-normal text-muted-foreground capitalize">— {scopeLabel}</span>
        </h2>
        {statsPeriod === "week" ? (
          <Card className="border-gold/30 bg-gradient-to-br from-gold/10 to-transparent mb-6">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-normal text-muted-foreground">
                Rezervace v období
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-display text-3xl">
                {scopedReservations.filter((r) => r.status !== "canceled").length}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Měsíční tržby zobrazte v režimu Měsíc nebo Rok.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className={cn("grid gap-4 mb-6", showPlanned ? "md:grid-cols-3" : "md:grid-cols-2")}>
            <Card className="border-gold/30 bg-gradient-to-br from-gold/10 to-transparent">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-normal text-muted-foreground">Už vyděláno</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-display text-3xl">{formatCurrency(current.earned)}</p>
              </CardContent>
            </Card>
            {showPlanned && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-normal text-muted-foreground">V plánu</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-display text-3xl">{formatCurrency(current.planned)}</p>
                </CardContent>
              </Card>
            )}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-normal text-muted-foreground">Celkem</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-display text-3xl">{formatCurrency(current.total)}</p>
              </CardContent>
            </Card>
          </div>
        )}
        {statsPeriod === "month" && (
          <Button type="button" variant="secondary" size="sm" onClick={() => setDetailMonth(monthKey)}>
            Detail měsíce — služby
          </Button>
        )}
      </section>

      <section className="mb-10">
        <h2 className="font-display text-2xl mb-4">{performanceTitle}</h2>
        {viewMode === "chart" ? (
          <ChartContainer config={weekChartConfig} className="h-[280px] w-full">
            <BarChart data={performance} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={28} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="count" fill={CHART_BAR_FILL} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        ) : (
          <div
            className={cn(
              "grid gap-3",
              statsPeriod === "week" ? "sm:grid-cols-7" : statsPeriod === "year" ? "sm:grid-cols-6 lg:grid-cols-12" : "sm:grid-cols-7",
            )}
          >
            {performance.map((w) => (
              <Card key={w.key} className="border-border/60">
                <CardHeader className="pb-1 pt-3 px-3">
                  <CardTitle className="text-xs font-normal capitalize text-muted-foreground">
                    {w.label}
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-3 pb-3">
                  <p className="font-display text-2xl">{w.count}</p>
                  <div className="mt-2 h-1.5 rounded-full bg-muted/50 overflow-hidden">
                    <div
                      className="h-full bg-gold/70 rounded-full"
                      style={{ width: `${Math.max(8, (w.count / maxPerformance) * 100)}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">rezervací</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <div className="grid gap-4 md:grid-cols-2 mb-10">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-normal text-muted-foreground flex items-center gap-2">
              <XCircle className="h-4 w-4" />
              Zrušené rezervace
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-display text-3xl">{canceledCount}</p>
            <p className="text-xs text-muted-foreground mt-1 capitalize">za {scopeLabel}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-normal text-muted-foreground flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Odeslané SMS
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-display text-3xl">{smsSentCount}</p>
            <p className="text-xs text-muted-foreground mt-1 capitalize">za {scopeLabel}</p>
          </CardContent>
        </Card>
      </div>

      <section id="sluzby" className="mb-10">
        <h2 className="font-display text-2xl mb-4 flex items-center gap-2">
          <Scissors className="h-6 w-6 text-gold" />
          Služby
        </h2>
        <div className="rounded-xl border border-border bg-card/50 overflow-hidden mb-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Služba</TableHead>
                <TableHead className="text-right">Cena</TableHead>
                <TableHead className="text-right">Délka</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {catalog.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell className="text-right">{s.price.toLocaleString("cs-CZ")} Kč</TableCell>
                  <TableCell className="text-right">{s.duration_minutes} min</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {serviceStats.length > 0 &&
          (viewMode === "chart" ? (
            <ChartContainer config={serviceChartConfig} className="h-[300px] w-full">
              <BarChart
                data={serviceChartData}
                layout="vertical"
                margin={{ top: 8, right: 16, left: 8, bottom: 0 }}
              >
                <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={100}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={4}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" fill={CHART_BAR_FILL} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ChartContainer>
          ) : (
            <div className="rounded-xl border border-border bg-card/50 overflow-hidden">
              <div className="px-5 py-3 border-b border-border/60">
                <p className="text-sm text-muted-foreground capitalize">
                  Objednávky služeb — {scopeLabel}
                </p>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Služba</TableHead>
                    <TableHead className="text-right">Počet</TableHead>
                    {statsPeriod !== "week" && <TableHead className="text-right">Tržby</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {serviceStats.map((r) => (
                    <TableRow key={r.service_name}>
                      <TableCell>{r.service_name}</TableCell>
                      <TableCell className="text-right">{r.count_total}×</TableCell>
                      {statsPeriod !== "week" && (
                        <TableCell className="text-right font-medium">
                          {formatCurrency(r.amount_total)}
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ))}
      </section>

      {viewMode === "chart" && statsPeriod !== "week" && (
        <section className="mb-10">
          <h2 className="font-display text-2xl mb-4">{revenueChartTitle}</h2>
          {revenueChartSum === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              V tomto období zatím nejsou žádné tržby k zobrazení.
            </p>
          ) : (
            <ChartContainer config={revenueChartConfig} className="h-[300px] w-full">
              <BarChart
                data={revenueChartData}
                margin={{ top: 8, right: 8, left: 4, bottom: 0 }}
                barCategoryGap={statsPeriod === "month" ? "8%" : "18%"}
                barGap={4}
              >
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  interval={statsPeriod === "month" ? 1 : 0}
                  angle={statsPeriod === "month" ? -45 : 0}
                  textAnchor={statsPeriod === "month" ? "end" : "middle"}
                  height={statsPeriod === "month" ? 48 : 30}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  width={52}
                  tickFormatter={formatRevenueAxisTick}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value) => formatCurrency(Number(value))}
                    />
                  }
                />
                <Bar dataKey="earned" fill={CHART_BAR_FILL} radius={[4, 4, 0, 0]} />
                <Bar
                  dataKey="planned"
                  fill={CHART_BAR_FILL}
                  fillOpacity={0.45}
                  radius={[4, 4, 0, 0]}
                />
                <Legend />
              </BarChart>
            </ChartContainer>
          )}
        </section>
      )}

      {detailMonth && (
        <AdminRevenueDetailDialog
          open={Boolean(detailMonth)}
          onOpenChange={(o) => !o && setDetailMonth(null)}
          barbershopId={barbershopId}
          monthKey={detailMonth}
        />
      )}
    </>
  );
}
