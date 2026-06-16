import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DEFAULT_KADERNICTVI_ID } from "@/lib/barbershop";
import { checkAdminBarbershopAccess } from "@/lib/admin-auth";
import { KADERNICTVI_TABULKY } from "@/lib/kadernictvi-tables";

type Ctx = {
  barbershopId: number;
  shopName: string | null;
  loading: boolean;
  refresh: () => Promise<void>;
};

const AdminBarbershopContext = createContext<Ctx | null>(null);

export function AdminBarbershopProvider({ children }: { children: ReactNode }) {
  const [barbershopId, setBarbershopId] = useState(DEFAULT_KADERNICTVI_ID);
  const [shopName, setShopName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data: session } = await supabase.auth.getSession();
    const uid = session.session?.user.id;
    let resolvedId = DEFAULT_KADERNICTVI_ID;

    if (uid) {
      const check = await checkAdminBarbershopAccess(uid);
      if (check.ok) {
        resolvedId = check.barbershopId;
      }
    }

    setBarbershopId(resolvedId);

    const { data: shop } = await supabase
      .from(KADERNICTVI_TABULKY.kadernictvi)
      .select("name")
      .eq("id", resolvedId)
      .maybeSingle();

    setShopName(shop?.name ?? null);
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <AdminBarbershopContext.Provider value={{ barbershopId, shopName, loading, refresh }}>
      {children}
    </AdminBarbershopContext.Provider>
  );
}

export function useAdminBarbershop(): Ctx {
  const ctx = useContext(AdminBarbershopContext);
  if (!ctx) {
    return {
      barbershopId: DEFAULT_KADERNICTVI_ID,
      shopName: null,
      loading: false,
      refresh: async () => {},
    };
  }
  return ctx;
}
