import { Loader2 } from "lucide-react";
import { AdminLayout } from "@admin/core/pages/AdminLayout";
import AdminLoginPage from "@admin/core/pages/AdminLoginPage";
import AdminReservationsPage from "@admin/core/pages/AdminReservationsPage";
import { AdminRoleHome } from "@admin/core/components/AdminRoleHome";
import { AdminOwnerGuard } from "@admin/templates/owner/components/AdminOwnerGuard";
import { AdminStaffGuard } from "@admin/templates/staff/components/AdminStaffGuard";
import AdminStatisticsPage from "@admin/templates/owner/pages/AdminStatisticsPage";
import AdminCustomersPage from "@admin/templates/owner/pages/AdminCustomersPage";
import AdminStaffCustomersPage from "@admin/templates/staff/pages/AdminStaffCustomersPage";
import AdminStaffOverviewPage from "@admin/templates/staff/pages/AdminStaffOverviewPage";
import AdminStaffServicesPage from "@admin/templates/staff/pages/AdminStaffServicesPage";
import AdminStaffSettingsPage from "@admin/templates/staff/pages/AdminStaffSettingsPage";
import { isLegacyAdminSession } from "@admin/core/lib/admin-legacy-ui";
import { useAdminSession } from "@admin/core/lib/use-admin-session";
import { getAdminTemplate } from "@admin/config";
import { useRouter } from "@/lib/router";

function AdminSessionGate({ children }: { children: React.ReactNode }) {
  const { ready, authed } = useAdminSession();
  if (!ready || !authed) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-gold" />
        <p className="text-sm">Ověřuji přístup…</p>
      </div>
    );
  }
  return <>{children}</>;
}

function AdminHomeRoute() {
  const { userEmail } = useAdminSession();
  const template = getAdminTemplate();

  if (template === "combined" || isLegacyAdminSession(userEmail)) {
    return <AdminReservationsPage />;
  }
  return <AdminRoleHome />;
}

function AdminCustomersRoute() {
  const { userEmail } = useAdminSession();
  const template = getAdminTemplate();

  if (template === "combined" || isLegacyAdminSession(userEmail)) {
    return <AdminCustomersPage />;
  }
  return (
    <AdminStaffGuard>
      <AdminStaffCustomersPage />
    </AdminStaffGuard>
  );
}

/** Všechny /admin/* cesty — importuj do salon App.tsx */
export function AdminApp() {
  const { pathname } = useRouter();

  if (pathname === "/admin/login") {
    return <AdminLoginPage />;
  }

  if (pathname === "/admin/statistiky" || pathname === "/admin/trzby") {
    return (
      <AdminLayout>
        <AdminSessionGate>
          <AdminOwnerGuard>
            <AdminStatisticsPage />
          </AdminOwnerGuard>
        </AdminSessionGate>
      </AdminLayout>
    );
  }

  if (pathname === "/admin/zakaznici") {
    return (
      <AdminLayout>
        <AdminSessionGate>
          <AdminCustomersRoute />
        </AdminSessionGate>
      </AdminLayout>
    );
  }

  if (pathname === "/admin/prehled") {
    return (
      <AdminLayout>
        <AdminStaffGuard>
          <AdminStaffOverviewPage />
        </AdminStaffGuard>
      </AdminLayout>
    );
  }

  if (pathname === "/admin/sluzby") {
    return (
      <AdminLayout>
        <AdminStaffGuard>
          <AdminStaffServicesPage />
        </AdminStaffGuard>
      </AdminLayout>
    );
  }

  if (pathname === "/admin/nastaveni") {
    return (
      <AdminLayout>
        <AdminStaffGuard>
          <AdminStaffSettingsPage />
        </AdminStaffGuard>
      </AdminLayout>
    );
  }

  if (pathname === "/admin") {
    return (
      <AdminLayout>
        <AdminSessionGate>
          <AdminHomeRoute />
        </AdminSessionGate>
      </AdminLayout>
    );
  }

  return null;
}

export function isAdminPath(pathname: string): boolean {
  return pathname === "/admin/login" || pathname.startsWith("/admin");
}
