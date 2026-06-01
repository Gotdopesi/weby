import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DEFAULT_BARBERSHOP_ID } from "@/lib/barbershop";
import { SHOWCASE_TABLES } from "@/lib/showcase-tables";

type Ctx = {
  barbershopId: number;
  shopName: string | null;
  loading: boolean;
  refresh: () => Promise<void>;
};

const AdminBarbershopContext = createContext<Ctx | null>(null);

export function AdminBarbershopProvider({ children }: { children: ReactNode }) {
  const [barbershopId, setBarbershopId] = useState(DEFAULT_BARBERSHOP_ID);
  const [shopName, setShopName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data: session } = await supabase.auth.getSession();
    const uid = session.session?.user.id;
    let resolvedId = DEFAULT_BARBERSHOP_ID;

    if (uid) {
      const { data: link } = await supabase
        .from(SHOWCASE_TABLES.barbershopAdmins)
        .select("barbershop_id")
        .eq("user_id", uid)
        .maybeSingle();

      if (link?.barbershop_id != null) {
        resolvedId = Number(link.barbershop_id);
      }
    }

    setBarbershopId(resolvedId);

    const { data: shop } = await supabase
      .from(SHOWCASE_TABLES.barbershops)
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
      barbershopId: DEFAULT_BARBERSHOP_ID,
      shopName: null,
      loading: false,
      refresh: async () => {},
    };
  }
  return ctx;
}
