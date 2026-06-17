import HomePage from "@/pages/HomePage";
import PortfolioPage from "@/pages/PortfolioPage";
import CancelReservationPage from "@/pages/CancelReservationPage";
import AdminLoginPage from "@/pages/admin/AdminLoginPage";
import { AdminOwnerGuard } from "@/components/admin/AdminOwnerGuard";
import { AdminLayout } from "@/pages/admin/AdminLayout";
import AdminStatisticsPage from "@/pages/admin/AdminStatisticsPage";
import AdminCustomersPage from "@/pages/admin/AdminCustomersPage";
import AdminReservationsPage from "@/pages/admin/AdminReservationsPage";
import AdminStaffCustomersPage from "@/pages/admin/AdminStaffCustomersPage";
import AdminStaffOverviewPage from "@/pages/admin/AdminStaffOverviewPage";
import AdminStaffServicesPage from "@/pages/admin/AdminStaffServicesPage";
import AdminStaffSettingsPage from "@/pages/admin/AdminStaffSettingsPage";
import { AdminRoleHome } from "@/components/admin/AdminRoleHome";
import { AdminStaffGuard } from "@/components/admin/AdminStaffGuard";
import { isLegacyAdminSession } from "@/lib/admin-legacy-ui";
import { useAdminSession } from "@/lib/use-admin-session";
import { useRouter } from "@/lib/router";
import { Loader2 } from "lucide-react";

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
  if (isLegacyAdminSession(userEmail)) return <AdminReservationsPage />;
  return <AdminRoleHome />;
}

function AdminCustomersRoute() {
  const { userEmail } = useAdminSession();
  if (isLegacyAdminSession(userEmail)) return <AdminCustomersPage />;
  return (
    <AdminStaffGuard>
      <AdminStaffCustomersPage />
    </AdminStaffGuard>
  );
}

export default function App() {
  const { pathname } = useRouter();

  if (pathname === "/portfolio") {
    return <PortfolioPage />;
  }

  if (pathname === "/zrusit-rezervaci") {
    return <CancelReservationPage />;
  }

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

  return <HomePage />;
}
