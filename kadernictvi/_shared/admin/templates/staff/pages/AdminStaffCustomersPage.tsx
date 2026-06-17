import { useCallback, useEffect, useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { cs } from "date-fns/locale";
import { Loader2, LogOut, Mail, Phone, RefreshCw, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { REZERVACE_TABLE } from "@/lib/rezervace";
import { customerLabel, type Reservation } from "@/lib/reservations-by-day";
import { useAdminBarbershop } from "@admin/core/lib/use-admin-barbershop";
import { useAdminSession } from "@admin/core/lib/use-admin-session";
import { AdminNav } from "@admin/core/components/AdminNav";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type ClientRow = {
  key: string;
  name: string;
  email: string | null;
  phone: string | null;
  visits: number;
  lastDate: string;
  lastService: string;
};

function buildClientRows(rows: Reservation[]): ClientRow[] {
  const map = new Map<string, ClientRow>();

  for (const r of rows) {
    if (r.status === "canceled") continue;
    const key = r.email?.trim().toLowerCase() || r.phone?.trim() || r.id;
    const prev = map.get(key);
    if (!prev) {
      map.set(key, {
        key,
        name: customerLabel(r),
        email: r.email?.trim() || null,
        phone: r.phone?.trim() || null,
        visits: 1,
        lastDate: r.booking_date,
        lastService: r.service?.trim() || "—",
      });
      continue;
    }
    prev.visits += 1;
    if (r.booking_date >= prev.lastDate) {
      prev.lastDate = r.booking_date;
      prev.lastService = r.service?.trim() || prev.lastService;
    }
  }

  return [...map.values()].sort((a, b) => b.lastDate.localeCompare(a.lastDate));
}

export default function AdminStaffCustomersPage() {
  const { ready, authed, signOut } = useAdminSession();
  const { barbershopId, staffId, staffName } = useAdminBarbershop();
  const [rows, setRows] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");

  const load = useCallback(async () => {
    if (!staffId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from(REZERVACE_TABLE)
      .select("*")
      .eq("kadernictvi_id", barbershopId)
      .eq("pracovnik_id", staffId)
      .order("booking_date", { ascending: false });
    setLoading(false);
    if (error) {
      toast.error("Zákazníky se nepodařilo načíst.", { description: error.message });
      return;
    }
    setRows((data ?? []) as Reservation[]);
  }, [barbershopId, staffId]);

  useEffect(() => {
    if (ready && authed && staffId) void load();
  }, [ready, authed, staffId, load]);

  const clients = useMemo(() => buildClientRows(rows), [rows]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.phone?.includes(q),
    );
  }, [clients, query]);

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
          <p className="text-gold tracking-[0.25em] text-xs uppercase mb-2">Klienti</p>
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl">Zákazníci</h1>
          <div className="hairline w-20 mt-4 mb-2" />
          <p className="text-muted-foreground text-sm">
            {staffName ? `${staffName} — ` : ""}
            lidé, kteří u vás měli termín
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

      <Input
        placeholder="Hledat jméno, e-mail nebo telefon…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="mb-4 max-w-md"
      />

      {loading && filtered.length === 0 ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-10 w-10 animate-spin text-gold" />
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">Zatím žádní zákazníci.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => (
            <Card key={c.key} className="border-border/80 bg-card/60">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold/15 text-gold">
                    <User className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium truncate">{c.name}</p>
                    <p className="text-xs text-muted-foreground">{c.visits}× návštěva</p>
                  </div>
                </div>
                {c.email && (
                  <p className="text-sm flex items-center gap-2 text-muted-foreground truncate">
                    <Mail className="h-3.5 w-3.5 shrink-0" />
                    {c.email}
                  </p>
                )}
                {c.phone && (
                  <p className="text-sm flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-3.5 w-3.5 shrink-0" />
                    {c.phone}
                  </p>
                )}
                <div className="pt-2 border-t border-border/60 text-xs text-muted-foreground">
                  <p>
                    Poslední:{" "}
                    <span className="text-foreground">
                      {format(parseISO(c.lastDate), "d. MMM yyyy", { locale: cs })}
                    </span>
                  </p>
                  <p className="truncate mt-0.5">{c.lastService}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
