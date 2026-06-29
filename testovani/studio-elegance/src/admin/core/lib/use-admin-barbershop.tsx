import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DEFAULT_ADMIN_ACCESS, type AdminAccess, type AdminRole } from "@/admin/core/lib/admin-access";
import { devAdminRoleForEmail, devStaffFirstNameForEmail } from "@/admin/core/lib/dev-admin-logins";
import { usesCombinedAdminSession } from "@/admin/config";
import { DEFAULT_KADERNICTVI_ID } from "@/lib/barbershop";
import { KADERNICTVI_TABULKY } from "@/lib/kadernictvi-tables";
import { staffDisplayName } from "@/lib/staff";

type Ctx = AdminAccess & {
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
  const [access, setAccess] = useState<AdminAccess>(DEFAULT_ADMIN_ACCESS);

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data: session } = await supabase.auth.getSession();
    const uid = session.session?.user.id;
    let resolvedId = DEFAULT_KADERNICTVI_ID;
    let nextAccess: AdminAccess = { ...DEFAULT_ADMIN_ACCESS };

    if (uid) {
      const { data: link } = await supabase
        .from(KADERNICTVI_TABULKY.admini)
        .select(
          "kadernictvi_id, role, pracovnik_id, login_label, kadernictvi_pracovnici ( first_name, last_name )",
        )
        .eq("user_id", uid)
        .maybeSingle();

      if (link?.kadernictvi_id != null) {
        resolvedId = Number(link.kadernictvi_id);
      }

      const userEmail = session.session?.user.email ?? null;
      const devRole = devAdminRoleForEmail(userEmail);

      // staff_id v DB = vždy kadeřník (i když role sloupec chybí / je špatně)
      let role = (
        link?.pracovnik_id != null ? "staff" : link?.role === "staff" ? "staff" : "owner"
      ) as AdminRole;
      if (devRole) role = devRole;

      const staffRaw = link?.kadernictvi_pracovnici as
        | { first_name: string; last_name: string }
        | { first_name: string; last_name: string }[]
        | null;
      const staffRow = Array.isArray(staffRaw) ? staffRaw[0] : staffRaw;
      let staffId = link?.pracovnik_id != null ? Number(link.pracovnik_id) : null;
      let staffNameResolved = staffRow ? staffDisplayName(staffRow) : null;

      if (!usesCombinedAdminSession(userEmail)) {
        // Dev fallback: kadeřník bez staff_id v DB — dohledat podle jména z dev účtu
        if (role === "staff" && staffId == null && import.meta.env.DEV) {
          const devFirst = devStaffFirstNameForEmail(userEmail) ?? "Monika";
          const { data: devStaff } = await supabase
            .from(KADERNICTVI_TABULKY.pracovnici)
            .select("id, first_name, last_name")
            .eq("kadernictvi_id", resolvedId)
            .eq("first_name", devFirst)
            .maybeSingle();
          if (devStaff?.id) {
            staffId = Number(devStaff.id);
            staffNameResolved = staffDisplayName(devStaff);
          }
        }
      } else {
        role = "owner";
        staffId = null;
        staffNameResolved = null;
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
      barbershopId: DEFAULT_KADERNICTVI_ID,
      shopName: null,
      loading: false,
      refresh: async () => {},
      ...DEFAULT_ADMIN_ACCESS,
    };
  }
  return ctx;
}
