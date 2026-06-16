import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  LogOut,
  MessageSquare,
  RefreshCw,
  Star,
  TrendingUp,
  Users,
  XCircle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { buildPriceResolver } from "@/lib/admin-revenue-from-reservations";
import {
  buildStaffPersonalOverview,
  formatCurrency,
} from "@/lib/admin-staff-personal";
import {
  periodScopeLabel,
  reservationsInScope,
  shiftPeriodAnchor,
  type StatsPeriod,
} from "@/lib/admin-statistics-period";
import { REZERVACE_TABLE } from "@/lib/rezervace";
import { customerLabel, type Reservation } from "@/lib/reservations-by-day";
import { useAdminBarbershop } from "@/lib/use-admin-barbershop";
import { useAdminSession } from "@/lib/use-admin-session";
import { AdminNav } from "@/components/admin/AdminNav";
import { AdminPeriodToggle } from "@/components/admin/AdminPeriodToggle";
import { KADERNICTVI_TABULKY } from "@/lib/kadernictvi-tables";
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
import { cn } from "@/lib/utils";

export default function AdminStaffOverviewPage() {
  const { ready, authed, signOut } = useAdminSession();
  const { barbershopId, staffId, staffName } = useAdminBarbershop();
  const [statsPeriod, setStatsPeriod] = useState<StatsPeriod>("month");
  const [periodAnchor, setPeriodAnchor] = useState(() => new Date());
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [catalog, setCatalog] = useState<{ id: number; name: string; price: number }[]>([]);
  const [loading, setLoading] = useState(false);

  const scopeLabel = periodScopeLabel(statsPeriod, periodAnchor);

  const load = useCallback(async () => {
    if (!staffId) return;
    setLoading(true);
    try {
      const [rez, cat] = await Promise.all([
        supabase
          .from(REZERVACE_TABLE)
          .select(
            "id, booking_date, booking_time, status, sms_sent, email, phone, first_name, last_name, service, total_price, service_id, pracovnik_id, duration_minutes",
          )
          .eq("kadernictvi_id", barbershopId)
          .eq("pracovnik_id", staffId),
        supabase
          .from(KADERNICTVI_TABULKY.sluzby)
          .select("id, name, price")
          .eq("kadernictvi_id", barbershopId)
          .eq("is_active", true),
      ]);
      if (!rez.error) setReservations((rez.data ?? []) as Reservation[]);
      if (!cat.error) {
        setCatalog(
          (cat.data ?? []).map((s) => ({
            id: s.id,
            name: s.name,
            price: Number(s.price),
          })),
        );
      }
    } finally {
      setLoading(false);
    }
  }, [barbershopId, staffId]);

  useEffect(() => {
    if (ready && authed && staffId) void load();
  }, [ready, authed, staffId, load]);

  const priceOf = useMemo(() => buildPriceResolver(catalog), [catalog]);

  const overview = useMemo(() => {
    if (!staffId) return null;
    return buildStaffPersonalOverview(
      staffId,
      reservations,
      statsPeriod,
      periodAnchor,
      priceOf,
    );
  }, [staffId, reservations, statsPeriod, periodAnchor, priceOf]);

  const scopedRows = useMemo(() => {
    if (!staffId) return [];
    return reservationsInScope(reservations, statsPeriod, periodAnchor)
      .filter((r) => r.pracovnik_id === staffId)
      .sort((a, b) => `${b.booking_date}${b.booking_time}`.localeCompare(`${a.booking_date}${a.booking_time}`))
      .slice(0, 12);
  }, [staffId, reservations, statsPeriod, periodAnchor]);

  const chartData = useMemo(
    () =>
      (overview?.serviceBreakdown ?? []).slice(0, 5).map((s) => ({
        name: s.name.length > 18 ? `${s.name.slice(0, 16)}…` : s.name,
        fullName: s.name,
        count: s.count,
      })),
    [overview?.serviceBreakdown],
  );

  if (!ready || !authed) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-gold" />
        <p className="text-sm">Ověřuji přístup…</p>
      </div>
    );
  }

  return (
    <div className="pb-4 md:pb-0">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-6">
        <div>
          <p className="text-gold tracking-[0.25em] text-xs uppercase mb-2">Statistiky</p>
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl">Můj přehled</h1>
          <div className="hairline w-20 mt-4 mb-2" />
          <p className="text-muted-foreground text-sm">
            {staffName ? `${staffName} — ` : ""}
            {scopeLabel}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
            <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} />
            Obnovit
          </Button>
          <Button variant="outline" size="sm" onClick={() => void signOut()}>
            <LogOut className="mr-2 h-4 w-4" />
            Odhlásit
          </Button>
        </div>
      </div>

      <AdminNav />

      <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-3 mb-6">
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
          <span className="font-display text-base sm:text-lg capitalize min-w-[160px] text-center">
            {scopeLabel}
          </span>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => setPeriodAnchor((a) => shiftPeriodAnchor(statsPeriod, a, 1))}
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4 mb-6">
        <Card className="border-gold/25 bg-gradient-to-br from-gold/10 to-transparent col-span-1">
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-xs font-normal text-muted-foreground flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" />
              Klientů
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="font-display text-2xl sm:text-3xl">{overview?.clientCount ?? "—"}</p>
          </CardContent>
        </Card>
        <Card className="col-span-1">
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-xs font-normal text-muted-foreground flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5 text-gold" />
              Vyděláno
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="font-display text-2xl sm:text-3xl">{formatCurrency(overview?.earned ?? 0)}</p>
          </CardContent>
        </Card>
        <Card className="col-span-1">
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-xs font-normal text-muted-foreground flex items-center gap-1.5">
              <XCircle className="h-3.5 w-3.5" />
              Zrušené
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="font-display text-2xl sm:text-3xl">{overview?.canceledCount ?? 0}</p>
          </CardContent>
        </Card>
        <Card className="col-span-1">
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-xs font-normal text-muted-foreground flex items-center gap-1.5">
              <MessageSquare className="h-3.5 w-3.5" />
              SMS
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="font-display text-2xl sm:text-3xl">{overview?.smsCount ?? 0}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-display flex items-center gap-2">
              <Star className="h-4 w-4 text-gold" />
              Nejoblíbenější služby
            </CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Zatím bez dat</p>
            ) : (
              <div className="h-[220px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} layout="vertical" margin={{ left: 4, right: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={72}
                      tick={{ fontSize: 10 }}
                    />
                    <Tooltip
                      formatter={(v: number) => [`${v}×`, "Počet"]}
                      labelFormatter={(_, payload) =>
                        payload?.[0]?.payload?.fullName ?? ""
                      }
                    />
                    <Bar dataKey="count" fill="hsl(var(--gold))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
            {overview?.topService && (
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Top: <span className="text-foreground">{overview.topService.name}</span> (
                {overview.topService.count}×)
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-display">Souhrn období</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between border-b border-border/60 pb-2">
              <span className="text-muted-foreground">Proběhlo termínů</span>
              <span className="font-medium">{overview?.completedCount ?? 0}</span>
            </div>
            <div className="flex justify-between border-b border-border/60 pb-2">
              <span className="text-muted-foreground">Čeká</span>
              <span className="font-medium">{overview?.upcomingCount ?? 0}</span>
            </div>
            <div className="flex justify-between border-b border-border/60 pb-2">
              <span className="text-muted-foreground">V plánu (Kč)</span>
              <span className="font-medium">{formatCurrency(overview?.planned ?? 0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Zrušené rezervace</span>
              <span className="font-medium text-amber-700 dark:text-amber-400">
                {overview?.canceledCount ?? 0}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-display">Poslední termíny v období</CardTitle>
        </CardHeader>
        <CardContent className="p-0 sm:p-6 sm:pt-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Datum</TableHead>
                <TableHead>Čas</TableHead>
                <TableHead className="hidden sm:table-cell">Klient</TableHead>
                <TableHead>Služba</TableHead>
                <TableHead>Stav</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {scopedRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    Žádné záznamy
                  </TableCell>
                </TableRow>
              ) : (
                scopedRows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="whitespace-nowrap text-sm">{r.booking_date}</TableCell>
                    <TableCell className="whitespace-nowrap text-sm">{r.booking_time}</TableCell>
                    <TableCell className="hidden sm:table-cell text-sm">{customerLabel(r)}</TableCell>
                    <TableCell className="text-sm max-w-[120px] truncate">{r.service}</TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "text-xs rounded-full px-2 py-0.5",
                          r.status === "canceled"
                            ? "bg-amber-500/15 text-amber-800 dark:text-amber-200"
                            : "bg-emerald-500/15 text-emerald-800 dark:text-emerald-200",
                        )}
                      >
                        {r.status === "canceled" ? "Zrušeno" : "Aktivní"}
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
