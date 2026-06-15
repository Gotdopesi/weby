import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Loader2,
  LogOut,
  MessageSquare,
  RefreshCw,
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
  mergeRevenueTotals,
} from "@/lib/admin-revenue-from-reservations";
import {
  aggregateVydelkyInScope,
  periodScopeLabel,
  primaryMonthKey,
  reservationsInScope,
  shiftPeriodAnchor,
  type StatsPeriod,
} from "@/lib/admin-statistics-period";
import { fetchStaffForAdmin } from "@/lib/staff";
import { useAdminBarbershop } from "@/lib/use-admin-barbershop";
import { useAdminSession } from "@/lib/use-admin-session";
import { AdminNav } from "@/components/admin/AdminNav";
import { AdminStaffPerformanceSection } from "@/components/admin/AdminStaffPerformanceSection";
import { AdminPeriodToggle } from "@/components/admin/AdminPeriodToggle";
import { AdminRevenueDetailDialog } from "@/components/admin/AdminRevenueDetailDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/trzby-metrics";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { Reservation } from "@/lib/reservations-by-day";
import type { StaffMember } from "@/lib/staff";

type VydelkyRow = {
  month_key: string;
  earned: number;
  planned: number;
  total: number;
};

type CatalogService = {
  id: number;
  name: string;
  price: number;
  duration_minutes: number;
  is_active: boolean;
};

export default function AdminStatisticsPage() {
  const { ready, authed, signOut } = useAdminSession();
  const { barbershopId, shopName } = useAdminBarbershop();

  const [statsPeriod, setStatsPeriod] = useState<StatsPeriod>("month");
  const [periodAnchor, setPeriodAnchor] = useState(() => new Date());
  const [vydelkyRows, setVydelkyRows] = useState<VydelkyRow[]>([]);
  const [catalog, setCatalog] = useState<CatalogService[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [detailMonth, setDetailMonth] = useState<string | null>(null);

  const scopeLabel = periodScopeLabel(statsPeriod, periodAnchor);
  const monthKey = primaryMonthKey(statsPeriod, periodAnchor);
  const showPlanned = statsPeriod !== "week";

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [vyd, cat, rez, team] = await Promise.all([
        supabase
          .from(SHOWCASE_TABLES.vydelky)
          .select("month_key, earned, planned, total")
          .eq("barbershop_id", barbershopId)
          .order("month_key", { ascending: false }),
        supabase
          .from(SHOWCASE_TABLES.services)
          .select("id, name, price, duration_minutes, is_active")
          .eq("barbershop_id", barbershopId)
          .eq("is_active", true)
          .order("name"),
        supabase
          .from(REZERVACE_TABLE)
          .select(
            "id, booking_date, booking_time, status, sms_sent, email, phone, first_name, last_name, service, total_price, service_id, staff_id, duration_minutes",
          )
          .eq("barbershop_id", barbershopId),
        fetchStaffForAdmin(barbershopId),
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

      if (!rez.error) setReservations((rez.data ?? []) as Reservation[]);
      setStaff(team);
    } finally {
      setLoading(false);
    }
  }, [barbershopId]);

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

  if (!ready || !authed) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-gold" />
        <p className="text-sm">Ověřuji přístup…</p>
      </div>
    );
  }

  return (
    <div className="pb-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-6">
        <div>
          <p className="text-gold tracking-[0.25em] text-xs uppercase mb-2">Majitel</p>
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl flex items-center gap-3">
            <BarChart3 className="h-8 w-8 sm:h-9 sm:w-9 text-gold shrink-0" />
            Přehled salónu
          </h1>
          <div className="hairline w-20 mt-4 mb-2" />
          <p className="text-muted-foreground text-sm max-w-lg">
            {shopName ?? "Salón"} — tržby, SMS a výkon týmu
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
            className="h-9 w-9"
            onClick={() => setPeriodAnchor((a) => shiftPeriodAnchor(statsPeriod, a, -1))}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <span className="font-display text-base sm:text-lg capitalize min-w-[140px] sm:min-w-[200px] text-center">
            {scopeLabel}
          </span>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-9 w-9"
            onClick={() => setPeriodAnchor((a) => shiftPeriodAnchor(statsPeriod, a, 1))}
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <section className="mb-8">
        <h2 className="sr-only">Souhrn salónu</h2>
        <div
          className={cn(
            "grid gap-3",
            showPlanned ? "grid-cols-2 lg:grid-cols-4" : "grid-cols-2 lg:grid-cols-3",
          )}
        >
          <Card className="border-gold/30 bg-gradient-to-br from-gold/10 to-transparent col-span-1">
            <CardHeader className="pb-1 pt-4 px-4">
              <CardTitle className="text-xs font-normal text-muted-foreground flex items-center gap-1.5">
                <TrendingUp className="h-3.5 w-3.5" />
                Vyděláno
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <p className="font-display text-2xl sm:text-3xl">{formatCurrency(current.earned)}</p>
            </CardContent>
          </Card>
          {showPlanned && (
            <Card className="col-span-1">
              <CardHeader className="pb-1 pt-4 px-4">
                <CardTitle className="text-xs font-normal text-muted-foreground">V plánu</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <p className="font-display text-2xl sm:text-3xl">{formatCurrency(current.planned)}</p>
              </CardContent>
            </Card>
          )}
          <Card className="col-span-1">
            <CardHeader className="pb-1 pt-4 px-4">
              <CardTitle className="text-xs font-normal text-muted-foreground flex items-center gap-1.5">
                <MessageSquare className="h-3.5 w-3.5" />
                Odeslané SMS
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <p className="font-display text-2xl sm:text-3xl">{smsSentCount}</p>
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
              <p className="font-display text-2xl sm:text-3xl">{canceledCount}</p>
            </CardContent>
          </Card>
        </div>
        {showPlanned && (
          <p className="text-center text-sm text-muted-foreground mt-3">
            Celkem v období:{" "}
            <span className="text-foreground font-medium">{formatCurrency(current.total)}</span>
          </p>
        )}
        {statsPeriod === "month" && (
          <div className="text-center mt-3">
            <Button type="button" variant="link" size="sm" onClick={() => setDetailMonth(monthKey)}>
              Detail tržeb podle služeb →
            </Button>
          </div>
        )}
      </section>

      <AdminStaffPerformanceSection
        staff={staff}
        reservations={reservations}
        catalog={catalog}
        period={statsPeriod}
        periodAnchor={periodAnchor}
        scopeLabel={scopeLabel}
      />

      {detailMonth && (
        <AdminRevenueDetailDialog
          open={Boolean(detailMonth)}
          onOpenChange={(o) => !o && setDetailMonth(null)}
          barbershopId={barbershopId}
          monthKey={detailMonth}
        />
      )}
    </div>
  );
}
