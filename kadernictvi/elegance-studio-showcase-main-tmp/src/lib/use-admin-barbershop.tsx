import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DEFAULT_ADMIN_ACCESS, type AdminAccess, type AdminRole } from "@/lib/admin-access";
import { devAdminRoleForEmail } from "@/lib/dev-admin-logins";
import { DEFAULT_BARBERSHOP_ID } from "@/lib/barbershop";
import { SHOWCASE_TABLES } from "@/lib/showcase-tables";
import { staffDisplayName } from "@/lib/staff";

type Ctx = AdminAccess & {
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
  const [access, setAccess] = useState<AdminAccess>(DEFAULT_ADMIN_ACCESS);

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data: session } = await supabase.auth.getSession();
    const uid = session.session?.user.id;
    let resolvedId = DEFAULT_BARBERSHOP_ID;
    let nextAccess: AdminAccess = { ...DEFAULT_ADMIN_ACCESS };

    if (uid) {
      const { data: link } = await supabase
        .from(SHOWCASE_TABLES.barbershopAdmins)
        .select(
          "barbershop_id, role, staff_id, login_label, staff:showcase_staff ( first_name, last_name )",
        )
        .eq("user_id", uid)
        .maybeSingle();

      if (link?.barbershop_id != null) {
        resolvedId = Number(link.barbershop_id);
      }

      const userEmail = session.session?.user.email ?? null;
      const devRole = devAdminRoleForEmail(userEmail);

      // staff_id v DB = vždy kadeřník (i když role sloupec chybí / je špatně)
      let role = (
        link?.staff_id != null ? "staff" : link?.role === "staff" ? "staff" : "owner"
      ) as AdminRole;
      if (devRole) role = devRole;

      const staffRaw = link?.staff as
        | { first_name: string; last_name: string }
        | { first_name: string; last_name: string }[]
        | null;
      const staffRow = Array.isArray(staffRaw) ? staffRaw[0] : staffRaw;
      let staffId = link?.staff_id != null ? Number(link.staff_id) : null;

      let staffNameResolved = staffRow ? staffDisplayName(staffRow) : null;

      // Dev fallback: Monika bez staff_id v DB — dohledat podle jména
      if (role === "staff" && staffId == null && import.meta.env.DEV) {
        const { data: monika } = await supabase
          .from(SHOWCASE_TABLES.staff)
          .select("id, first_name, last_name")
          .eq("barbershop_id", resolvedId)
          .eq("first_name", "Monika")
          .maybeSingle();
        if (monika?.id) {
          staffId = Number(monika.id);
          staffNameResolved = staffDisplayName(monika);
        }
      }

      nextAccess = {
        role,
        staffId,
        staffName: staffNameResolved,
        loginLabel: link?.login_label ?? null,
        isOwner: role === "owner",
        isStaff: role === "staff",
      };
    }

    setBarbershopId(resolvedId);
    setAccess(nextAccess);

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
    <AdminBarbershopContext.Provider
      value={{
        barbershopId,
        shopName,
        loading,
        refresh,
        ...access,
      }}
    >
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
      ...DEFAULT_ADMIN_ACCESS,
    };
  }
  return ctx;
}
