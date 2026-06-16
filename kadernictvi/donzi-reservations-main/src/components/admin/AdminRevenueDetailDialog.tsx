import { useCallback, useEffect, useState } from "react";
import { format, parse } from "date-fns";
import { cs } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { displayAmounts, showPlannedColumn } from "@/lib/admin-revenue-display";
import { KADERNICTVI_TABULKY } from "@/lib/kadernictvi-tables";
import { formatCurrency } from "@/lib/trzby-metrics";
import { cn } from "@/lib/utils";

type MonthSummary = {
  month_key: string;
  earned: number;
  planned: number;
  total: number;
};

type ServiceDetail = {
  service_name: string;
  price: number;
  count_earned: number;
  count_planned: number;
  count_total: number;
  amount_earned: number;
  amount_planned: number;
  amount_total: number;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  barbershopId: number;
  monthKey: string;
};

export function AdminRevenueDetailDialog({ open, onOpenChange, barbershopId, monthKey }: Props) {
  const [summary, setSummary] = useState<MonthSummary | null>(null);
  const [services, setServices] = useState<ServiceDetail[]>([]);
  const [loading, setLoading] = useState(false);

  const monthLabel = format(parse(monthKey, "yyyy-MM", new Date()), "LLLL yyyy", { locale: cs });

  const load = useCallback(async () => {
    if (!open) return;
    setLoading(true);
    const [sumRes, svcRes] = await Promise.all([
      supabase
        .from(KADERNICTVI_TABULKY.vydelky)
        .select("month_key, earned, planned, total")
        .eq("kadernictvi_id", barbershopId)
        .eq("month_key", monthKey)
        .maybeSingle(),
      supabase
        .from(KADERNICTVI_TABULKY.vydelkySluzby)
        .select(
          "service_name, price, count_earned, count_planned, count_total, amount_earned, amount_planned, amount_total",
        )
        .eq("kadernictvi_id", barbershopId)
        .eq("month_key", monthKey)
        .order("amount_total", { ascending: false }),
    ]);
    setLoading(false);

    const rawSummary = sumRes.data
      ? {
          month_key: sumRes.data.month_key,
          earned: Number(sumRes.data.earned),
          planned: Number(sumRes.data.planned),
          total: Number(sumRes.data.total),
        }
      : { month_key: monthKey, earned: 0, planned: 0, total: 0 };
    setSummary(displayAmounts(rawSummary));

    setServices(
      (svcRes.data ?? []).map((r) => ({
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
  }, [open, barbershopId, monthKey]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl capitalize">Detail — {monthLabel}</DialogTitle>
        </DialogHeader>

        {loading ? (
          <p className="text-sm text-muted-foreground py-8 text-center">Načítám…</p>
        ) : (
          <div className="space-y-6">
            {summary && (
              <div
                className={cn(
                  "grid gap-3 text-center",
                  showPlannedColumn(monthKey) ? "grid-cols-3" : "grid-cols-2",
                )}
              >
                <div className="rounded-lg border border-border p-3">
                  <p className="text-xs text-muted-foreground">Vyděláno</p>
                  <p className="font-display text-lg">{formatCurrency(summary.earned)}</p>
                </div>
                {showPlannedColumn(monthKey) && (
                  <div className="rounded-lg border border-border p-3">
                    <p className="text-xs text-muted-foreground">V plánu</p>
                    <p className="font-display text-lg">{formatCurrency(summary.planned)}</p>
                  </div>
                )}
                <div className="rounded-lg border border-border p-3 bg-gold/5">
                  <p className="text-xs text-muted-foreground">Celkem</p>
                  <p className="font-display text-lg">{formatCurrency(summary.total)}</p>
                </div>
              </div>
            )}

            {services.length === 0 ? (
              <p className="text-sm text-muted-foreground">Žádné služby v tomto měsíci.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Služba</TableHead>
                    <TableHead className="text-right">Počet</TableHead>
                    <TableHead className="text-right">Vyděláno</TableHead>
                    {showPlannedColumn(monthKey) && (
                      <TableHead className="text-right">V plánu</TableHead>
                    )}
                    <TableHead className="text-right">Celkem</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {services.map((s) => {
                    const plannedAmt = showPlannedColumn(monthKey) ? s.amount_planned : 0;
                    const totalAmt = showPlannedColumn(monthKey)
                      ? s.amount_total
                      : s.amount_earned;
                    return (
                    <TableRow key={s.service_name}>
                      <TableCell>{s.service_name}</TableCell>
                      <TableCell className="text-right">{s.count_total}×</TableCell>
                      <TableCell className="text-right">{formatCurrency(s.amount_earned)}</TableCell>
                      {showPlannedColumn(monthKey) && (
                        <TableCell className="text-right">{formatCurrency(plannedAmt)}</TableCell>
                      )}
                      <TableCell className="text-right font-medium">{formatCurrency(totalAmt)}</TableCell>
                    </TableRow>
                  );
                  })}
                </TableBody>
              </Table>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
