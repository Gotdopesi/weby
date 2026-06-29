import { useCallback, useEffect, useState } from "react";
import { Loader2, LogOut, Plus, RefreshCw, Save, Scissors } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { KADERNICTVI_TABULKY } from "@/lib/kadernictvi-tables";
import {
  fetchStaffServicesForEditor,
  linkServiceToStaff,
  setStaffServiceOffered,
  type StaffServiceEditorRow,
} from "@/admin/templates/staff/lib/staff-services";
import { useAdminBarbershop } from "@/admin/core/lib/use-admin-barbershop";
import { useAdminSession } from "@/admin/core/lib/use-admin-session";
import { AdminNav } from "@/admin/core/components/AdminNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function AdminStaffServicesPage() {
  const { ready, authed, signOut } = useAdminSession();
  const { barbershopId, staffId, staffName, staffToolsId, staffToolsName } = useAdminBarbershop();
  const activeStaffId = staffToolsId ?? staffId;
  const activeStaffName = staffToolsName ?? staffName;
  const [rows, setRows] = useState<StaffServiceEditorRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    if (!activeStaffId) return;
    setLoading(true);
    try {
      setRows(await fetchStaffServicesForEditor(activeStaffId, barbershopId));
    } catch (e) {
      toast.error("Služby se nepodařilo načíst.", {
        description: e instanceof Error ? e.message : String(e),
      });
    } finally {
      setLoading(false);
    }
  }, [barbershopId, activeStaffId]);

  useEffect(() => {
    if (ready && authed && activeStaffId) void load();
  }, [ready, authed, activeStaffId, load]);

  const patchRow = (id: number, patch: Partial<StaffServiceEditorRow>) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  const save = async (row: StaffServiceEditorRow) => {
    if (!activeStaffId) return;
    if (!row.name.trim()) {
      toast.error("Název služby nesmí být prázdný.");
      return;
    }
    if (row.price < 0 || row.duration_minutes < 15) {
      toast.error("Zkontrolujte cenu a délku (min. 15 min).");
      return;
    }
    setSavingId(row.id);

    if (row.id < 0) {
      const { data, error } = await supabase
        .from(KADERNICTVI_TABULKY.sluzby)
        .insert({
          kadernictvi_id: barbershopId,
          name: row.name.trim(),
          price: row.price,
          duration_minutes: row.duration_minutes,
          is_active: true,
        })
        .select("id")
        .single();
      if (error) {
        setSavingId(null);
        toast.error("Přidání služby se nezdařilo.", { description: error.message });
        return;
      }
      const newId = Number(data.id);
      try {
        await linkServiceToStaff(activeStaffId, newId);
      } catch (linkErr) {
        setSavingId(null);
        toast.error("Služba vytvořena, ale nepodařilo se ji přiřadit k vám.", {
          description: linkErr instanceof Error ? linkErr.message : String(linkErr),
        });
        return;
      }
      setSavingId(null);
      toast.success(`Přidáno: ${row.name}`);
      setRows((prev) =>
        prev.map((r) => (r.id === row.id ? { ...r, id: newId, offered: true } : r)),
      );
      return;
    }

    const { error } = await supabase
      .from(KADERNICTVI_TABULKY.sluzby)
      .update({
        name: row.name.trim(),
        price: row.price,
        duration_minutes: row.duration_minutes,
      })
      .eq("id", row.id)
      .eq("kadernictvi_id", barbershopId);
    if (error) {
      setSavingId(null);
      toast.error("Uložení se nezdařilo.", { description: error.message });
      return;
    }

    try {
      await setStaffServiceOffered(activeStaffId, row.id, row.offered, barbershopId);
    } catch (linkErr) {
      setSavingId(null);
      toast.error("Ceník uložen, ale nepodařilo se upravit nabídku služby.", {
        description: linkErr instanceof Error ? linkErr.message : String(linkErr),
      });
      return;
    }

    setSavingId(null);
    toast.success(`Uloženo: ${row.name}`);
  };

  const toggleOffered = async (row: StaffServiceEditorRow, offered: boolean) => {
    if (!activeStaffId || row.id < 0) {
      patchRow(row.id, { offered });
      return;
    }
    patchRow(row.id, { offered });
    try {
      await setStaffServiceOffered(activeStaffId, row.id, offered, barbershopId);
    } catch (e) {
      patchRow(row.id, { offered: !offered });
      toast.error("Nepodařilo se upravit nabídku služby.", {
        description: e instanceof Error ? e.message : String(e),
      });
    }
  };

  const addService = () => {
    setRows((prev) => [
      ...prev,
      {
        id: -(Date.now() % 1_000_000),
        name: "Nová služba",
        price: 500,
        duration_minutes: 60,
        is_active: true,
        offered: true,
      },
    ]);
  };

  if (!ready || !authed) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-gold" />
        <p className="text-sm">Ověřuji přístup…</p>
      </div>
    );
  }

  if (!activeStaffId) {
    return (
      <div className="pb-4 md:pb-0">
        <AdminNav />
        <p className="text-center text-muted-foreground py-12">Účet není propojen s kadeřníkem.</p>
      </div>
    );
  }

  return (
    <div className="pb-4 md:pb-0">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-6">
        <div>
          <p className="text-gold tracking-[0.25em] text-xs uppercase mb-2">Ceník</p>
          <h1 className="font-display text-4xl md:text-5xl flex items-center gap-3">
            <Scissors className="h-9 w-9 text-gold shrink-0" />
            Služby
          </h1>
          <div className="hairline w-20 mt-4 mb-2" />
          <p className="text-muted-foreground text-sm max-w-xl">
            {activeStaffName ? `${activeStaffName} — ` : ""}
            vypnutí služby skryje jen vaši nabídku v rezervacích. Stávající rezervace zůstanou beze
            změny. Služba zmizí z webu, až ji vypnou všichni kadeřníci.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={addService} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Nová služba
          </Button>
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

      {loading && rows.length === 0 ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-gold" />
        </div>
      ) : rows.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">
          Zatím nemáte služby v ceníku salónu. Přidejte první nebo spusťte SQL seed.
        </p>
      ) : (
        <div className="space-y-4 max-w-3xl">
          {rows.map((row) => (
            <div
              key={row.id}
              className="rounded-xl border border-border bg-card/60 p-5 space-y-4"
            >
              <div className="flex items-center justify-between gap-3">
                <Input
                  value={row.name}
                  onChange={(e) => patchRow(row.id, { name: e.target.value })}
                  className="font-medium text-base"
                  aria-label="Název služby"
                />
                <div className="flex items-center gap-2 shrink-0">
                  <Switch
                    checked={row.offered}
                    onCheckedChange={(v) => void toggleOffered(row, v === true)}
                    aria-label="Nabízím v rezervacích"
                  />
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {row.offered ? "Nabízím" : "Nenabízím"}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor={`price-${row.id}`}>Cena (Kč)</Label>
                  <Input
                    id={`price-${row.id}`}
                    type="number"
                    min={0}
                    step={10}
                    value={row.price}
                    onChange={(e) => patchRow(row.id, { price: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor={`dur-${row.id}`}>Délka (min)</Label>
                  <Input
                    id={`dur-${row.id}`}
                    type="number"
                    min={15}
                    step={5}
                    value={row.duration_minutes}
                    onChange={(e) =>
                      patchRow(row.id, { duration_minutes: Number(e.target.value) })
                    }
                  />
                </div>
              </div>
              <Button
                type="button"
                size="sm"
                className="bg-gold text-primary hover:bg-gold/90"
                disabled={savingId === row.id}
                onClick={() => void save(row)}
              >
                {savingId === row.id ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Uložit
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
