import { useCallback, useEffect, useMemo, useState } from "react";
import { addMonths, format, isAfter, isBefore, startOfMonth } from "date-fns";
import { cs } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Loader2, LogOut, RefreshCw, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  buildRevenueTimeline,
  displayAmounts,
  maxRevenueMonth,
  minRevenueMonth,
  showPlannedColumn,
} from "@/admin/templates/owner/lib/admin-revenue-display";
import { KADERNICTVI_TABULKY } from "@/lib/kadernictvi-tables";
import { formatCurrency } from "@/lib/trzby-metrics";
import { useAdminBarbershop } from "@/admin/core/lib/use-admin-barbershop";
import { useAdminSession } from "@/admin/core/lib/use-admin-session";
import { AdminNav } from "@/admin/core/components/AdminNav";
import { AdminRevenueDetailDialog } from "@/admin/core/components/AdminRevenueDetailDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { withTimeout } from "@/lib/promise-timeout";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type VydelkyRow = {
  month_key: string;
  earned: number;
  planned: number;
  total: number;
};

const LIST_BOOT_MS = 25_000;

export default function AdminRevenuePage() {
  const { ready, authed, signOut } = useAdminSession();
  const { barbershopId, loading: shopLoading } = useAdminBarbershop();
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [rows, setRows] = useState<VydelkyRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [detailMonth, setDetailMonth] = useState<string | null>(null);

  const monthKey = format(month, "yyyy-MM");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await withTimeout(
        supabase
          .from(KADERNICTVI_TABULKY.vydelky)
          .select("month_key, earned, planned, total")
          .eq("kadernictvi_id", barbershopId)
          .order("month_key", { ascending: false }),
        LIST_BOOT_MS,
        "Načítání tržeb",
      );
      if (error) {
        toast.error("Nepodařilo se načíst tržby.", { description: error.message });
        return;
      }
      setRows(
        (data ?? []).map((r) => ({
          month_key: r.month_key,
          earned: Number(r.earned),
          planned: Number(r.planned),
          total: Number(r.total),
        })),
      );
    } catch (e) {
      console.error(e);
      toast.error("Načítání tržeb selhalo.");
    } finally {
      setLoading(false);
    }
  }, [barbershopId]);

  useEffect(() => {
    if (ready && authed && !shopLoading) void load();
  }, [ready, authed, shopLoading, load]);

  const current = useMemo(() => {
    const raw = rows.find((r) => r.month_key === monthKey) ?? {
      month_key: monthKey,
      earned: 0,
      planned: 0,
      total: 0,
    };
    return displayAmounts(raw);
  }, [rows, monthKey]);

  const { past: historyPast, upcoming: historyUpcoming } = useMemo(
    () => buildRevenueTimeline(rows),
    [rows],
  );

  const maxPastBar = useMemo(
    () => Math.max(...historyPast.map((h) => h.barValue), 1),
    [historyPast],
  );
  const maxUpcomingBar = useMemo(
    () => Math.max(...historyUpcoming.map((h) => h.barValue), 1),
    [historyUpcoming],
  );

  const canGoPrev = !isBefore(startOfMonth(month), minRevenueMonth());
  const canGoNext = !isAfter(startOfMonth(month), maxRevenueMonth());

  if (!ready || !authed) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-gold" aria-hidden />
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
            <TrendingUp className="h-9 w-9 text-gold shrink-0" />
            Tržby
          </h1>
          <div className="hairline w-20 mt-4 mb-2" />
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          <Button variant="outline" className="border-border" onClick={() => void load()} disabled={loading}>
            <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} />
            Obnovit
          </Button>
          <Button variant="outline" className="border-border" onClick={() => void signOut()}>
            <LogOut className="mr-2 h-4 w-4" />
            Odhlásit se
          </Button>
        </div>
      </div>

      <AdminNav />

      <div className="flex items-center justify-center gap-4 mb-8">
        <Button
          type="button"
          variant="outline"
          size="icon"
          disabled={!canGoPrev}
          onClick={() => setMonth((m) => addMonths(m, -1))}
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <span className="font-display text-xl capitalize min-w-[180px] text-center">
          {format(month, "LLLL yyyy", { locale: cs })}
        </span>
        <Button
          type="button"
          variant="outline"
          size="icon"
          disabled={!canGoNext}
          onClick={() => setMonth((m) => addMonths(m, 1))}
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
        <Button type="button" variant="secondary" onClick={() => setDetailMonth(monthKey)}>
          Detail měsíce
        </Button>
      </div>

      {loading && rows.length === 0 ? (
        <div className="flex justify-center py-24">
          <Loader2 className="h-10 w-10 animate-spin text-gold" />
        </div>
      ) : (
        <>
          <div className={cn("grid gap-4 mb-10", showPlannedColumn(monthKey) ? "md:grid-cols-3" : "md:grid-cols-2")}>
            <Card className="border-gold/30 bg-gradient-to-br from-gold/10 to-transparent">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-normal text-muted-foreground">Už vyděláno</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-display text-3xl">{formatCurrency(current.earned)}</p>
              </CardContent>
            </Card>
            {showPlannedColumn(monthKey) && (
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
                <CardTitle className="text-sm font-normal text-muted-foreground">
                  {showPlannedColumn(monthKey) ? "Celkem v měsíci" : "Celkem vyděláno"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-display text-3xl">{formatCurrency(current.total)}</p>
              </CardContent>
            </Card>
          </div>

          <div className="rounded-xl border border-border bg-card/50 p-6 shadow-sm space-y-10">
            <section>
              <h2 className="font-display text-2xl mb-2">Nadcházející měsíce</h2>
              <p className="text-sm text-muted-foreground mb-6">
                Rezervace lze zakládat 3 měsíce dopředu — přehled plánovaných výdělků.
              </p>
              <div className="space-y-4">
                {historyUpcoming.map((h) => (
                  <div key={h.key} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                    <span className="w-40 shrink-0 text-sm capitalize text-muted-foreground">{h.label}</span>
                    <div className="flex-1 h-8 rounded-md bg-muted/40 overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-md transition-all",
                          h.kind === "current" ? "bg-gold/80" : "bg-gold/50",
                        )}
                        style={{ width: `${Math.max(4, (h.barValue / maxUpcomingBar) * 100)}%` }}
                      />
                    </div>
                    <span className="w-36 text-right text-sm shrink-0">
                      {h.kind === "current" ? (
                        <>
                          <span className="block font-medium">{formatCurrency(h.planned)}</span>
                          <span className="text-muted-foreground">v plánu</span>
                        </>
                      ) : (
                        <>
                          <span className="block font-medium">{formatCurrency(h.planned)}</span>
                          <span className="text-muted-foreground">plán</span>
                        </>
                      )}
                    </span>
                    <Button type="button" variant="outline" size="sm" onClick={() => setDetailMonth(h.key)}>
                      Detail
                    </Button>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2 className="font-display text-2xl mb-2">Minulé měsíce</h2>
              <p className="text-sm text-muted-foreground mb-6">Jen skutečně vydělané částky (bez plánu).</p>
              <div className="space-y-4">
                {historyPast.map((h) => (
                  <div key={h.key} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                    <span className="w-40 shrink-0 text-sm capitalize text-muted-foreground">{h.label}</span>
                    <div className="flex-1 h-8 rounded-md bg-muted/40 overflow-hidden">
                      <div
                        className="h-full rounded-md bg-gold/60 transition-all"
                        style={{ width: `${Math.max(4, (h.barValue / maxPastBar) * 100)}%` }}
                      />
                    </div>
                    <span className="w-28 text-right font-medium shrink-0">{formatCurrency(h.earned)}</span>
                    <Button type="button" variant="outline" size="sm" onClick={() => setDetailMonth(h.key)}>
                      Detail
                    </Button>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </>
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
