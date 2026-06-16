import { useCallback, useEffect, useMemo, useState } from "react";
import { format, startOfMonth } from "date-fns";
import { cs } from "date-fns/locale";
import { Loader2, LogOut, RefreshCw, Scissors, Star, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { KADERNICTVI_TABULKY } from "@/lib/kadernictvi-tables";
import { useAdminBarbershop } from "@/lib/use-admin-barbershop";
import { useAdminSession } from "@/lib/use-admin-session";
import { AdminNav } from "@/components/admin/AdminNav";
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

type ServiceStatsRow = {
  service_id: number | null;
  service_name: string;
  price: number;
  count_earned: number;
  count_planned: number;
  count_total: number;
  amount_earned: number;
  amount_planned: number;
  amount_total: number;
};

type CatalogService = {
  id: number;
  name: string;
  price: number;
  duration_minutes: number;
  is_active: boolean;
};

export default function AdminServicesPage() {
  const { ready, authed, signOut } = useAdminSession();
  const { barbershopId, shopName, loading: shopLoading } = useAdminBarbershop();
  const [rows, setRows] = useState<ServiceStatsRow[]>([]);
  const [catalog, setCatalog] = useState<CatalogService[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingCatalog, setLoadingCatalog] = useState(false);

  const monthKey = format(startOfMonth(new Date()), "yyyy-MM");
  const monthLabel = format(startOfMonth(new Date()), "LLLL yyyy", { locale: cs });

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from(KADERNICTVI_TABULKY.vydelkySluzby)
      .select(
        "service_id, service_name, price, count_earned, count_planned, count_total, amount_earned, amount_planned, amount_total",
      )
      .eq("kadernictvi_id", barbershopId)
      .eq("month_key", monthKey)
      .order("count_total", { ascending: false });

    setLoading(false);
    if (error) {
      toast.error("Nepodařilo se načíst služby.", { description: error.message });
      return;
    }

    setRows(
      (data ?? []).map((r) => ({
        service_id: r.service_id,
        service_name: r.service_name,
        price: Number(r.price),
        count_earned: Number(r.count_earned),
        count_planned: Number(r.count_planned),
        count_total: Number(r.count_total),
        amount_earned: Number(r.amount_earned),
        amount_planned: Number(r.amount_planned),
        amount_total: Number(r.amount_total),
      })),
    );
  }, [barbershopId, monthKey]);

  const loadCatalog = useCallback(async () => {
    setLoadingCatalog(true);
    const { data, error } = await supabase
      .from(KADERNICTVI_TABULKY.sluzby)
      .select("id, name, price, duration_minutes, is_active")
      .eq("kadernictvi_id", barbershopId)
      .order("name");

    setLoadingCatalog(false);
    if (error) {
      toast.error("Nepodařilo se načíst ceník služeb.", { description: error.message });
      return;
    }
    setCatalog(
      (data ?? []).map((s) => ({
        id: s.id,
        name: s.name,
        price: Number(s.price),
        duration_minutes: Number(s.duration_minutes),
        is_active: Boolean(s.is_active),
      })),
    );
  }, [barbershopId]);

  useEffect(() => {
    if (ready && authed && !shopLoading) {
      void load();
      void loadCatalog();
    }
  }, [ready, authed, shopLoading, load, loadCatalog]);

  const topOrdered = useMemo(() => {
    if (rows.length === 0) return null;
    return [...rows].sort((a, b) => b.count_total - a.count_total)[0];
  }, [rows]);

  const topProfitable = useMemo(() => {
    if (rows.length === 0) return null;
    return [...rows].sort((a, b) => b.amount_total - a.amount_total)[0];
  }, [rows]);

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
            <Scissors className="h-9 w-9 text-gold shrink-0" />
            Služby
          </h1>
          <div className="hairline w-20 mt-4 mb-2" />
          <p className="text-muted-foreground text-sm max-w-xl">
            {shopName ? `${shopName} — ` : ""}statistiky objednávek a tržeb podle služeb.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          <Button variant="outline" className="border-border" onClick={() => { void load(); void loadCatalog(); }} disabled={loading || loadingCatalog}>
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

      <p className="text-sm text-muted-foreground mb-6 capitalize">Přehled za {monthLabel}</p>

      <div className="rounded-xl border border-border bg-card/50 shadow-sm overflow-hidden mb-8">
        <div className="px-6 py-4 border-b border-border/60">
          <h2 className="font-display text-xl">Ceník služeb v databázi</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Služby pro online rezervaci (barbershop ID {barbershopId})
          </p>
        </div>
        {loadingCatalog && catalog.length === 0 ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gold" />
          </div>
        ) : catalog.length === 0 ? (
          <p className="text-muted-foreground text-sm p-8 text-center">
            Žádné služby — spusťte v Supabase skript{" "}
            <code className="text-xs">supabase/donzi_dobruska_setup.sql</code> a propojte admin účet (
            <code className="text-xs">supabase/donzi_admin_access.sql</code>).
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Služba</TableHead>
                <TableHead className="text-right">Cena</TableHead>
                <TableHead className="text-right">Délka</TableHead>
                <TableHead className="text-right">Stav</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {catalog.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell className="text-right">{s.price.toLocaleString("cs-CZ")} Kč</TableCell>
                  <TableCell className="text-right">{s.duration_minutes} min</TableCell>
                  <TableCell className="text-right text-xs uppercase tracking-wider">
                    {s.is_active ? "aktivní" : "neaktivní"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 mb-8">
        <Card className="border-gold/25">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-normal text-muted-foreground flex items-center gap-2">
              <Star className="h-4 w-4 text-gold" />
              Nejoblíbenější služba
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topOrdered ? (
              <>
                <p className="font-display text-xl">{topOrdered.service_name}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {topOrdered.count_total} objednávek tento měsíc
                </p>
              </>
            ) : (
              <p className="text-muted-foreground text-sm">—</p>
            )}
          </CardContent>
        </Card>
        <Card className="border-gold/25">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-normal text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-gold" />
              Nejvýdělečnější služba
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topProfitable ? (
              <>
                <p className="font-display text-xl">{topProfitable.service_name}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {formatCurrency(topProfitable.amount_total)} celkem
                </p>
              </>
            ) : (
              <p className="text-muted-foreground text-sm">—</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="rounded-xl border border-border bg-card/50 shadow-sm overflow-hidden">
        {loading && rows.length === 0 ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-10 w-10 animate-spin text-gold" />
          </div>
        ) : rows.length === 0 ? (
          <div className="p-8 text-center space-y-3">
            <p className="text-muted-foreground text-sm">
              Statistiky tržeb (vyděláno / v plánu) se zobrazí po prvních rezervacích.
            </p>
            <p className="text-xs text-muted-foreground">
              Pokud už rezervace máte, spusťte v Supabase{" "}
              <code className="text-[10px]">donzi_rls_admin_fix.sql</code> a přepočet:{" "}
              <code className="text-[10px]">SELECT kadernictvi_obnovit_vydelky(...)</code>
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Služba</TableHead>
                <TableHead className="text-right">Cena</TableHead>
                <TableHead className="text-right">Už proběhlo</TableHead>
                <TableHead className="text-right">V plánu</TableHead>
                <TableHead className="text-right">Vyděláno</TableHead>
                <TableHead className="text-right">Očekáváno</TableHead>
                <TableHead className="text-right">Celkem</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={`${r.service_id ?? "x"}-${r.service_name}`}>
                  <TableCell className="font-medium">{r.service_name}</TableCell>
                  <TableCell className="text-right">{r.price.toLocaleString("cs-CZ")} Kč</TableCell>
                  <TableCell className="text-right">{r.count_earned}×</TableCell>
                  <TableCell className="text-right">{r.count_planned}×</TableCell>
                  <TableCell className="text-right">{formatCurrency(r.amount_earned)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(r.amount_planned)}</TableCell>
                  <TableCell className="text-right font-medium">{formatCurrency(r.amount_total)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </>
  );
}
