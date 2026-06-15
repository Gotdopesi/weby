import HomePage from "@/pages/HomePage";
import PortfolioPage from "@/pages/PortfolioPage";
import CancelReservationPage from "@/pages/CancelReservationPage";
import AdminLoginPage from "@/pages/admin/AdminLoginPage";
import { AdminOwnerGuard } from "@/components/admin/AdminOwnerGuard";
import { AdminLayout } from "@/pages/admin/AdminLayout";
import AdminStatisticsPage from "@/pages/admin/AdminStatisticsPage";
import AdminStaffCustomersPage from "@/pages/admin/AdminStaffCustomersPage";
import AdminStaffOverviewPage from "@/pages/admin/AdminStaffOverviewPage";
import AdminStaffServicesPage from "@/pages/admin/AdminStaffServicesPage";
import AdminStaffSettingsPage from "@/pages/admin/AdminStaffSettingsPage";
import { AdminRoleHome } from "@/components/admin/AdminRoleHome";
import { AdminStaffGuard } from "@/components/admin/AdminStaffGuard";
import { useRouter } from "@/lib/router";

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
        <AdminOwnerGuard>
          <AdminStatisticsPage />
        </AdminOwnerGuard>
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

  if (pathname === "/admin/zakaznici") {
    return (
      <AdminLayout>
        <AdminStaffGuard>
          <AdminStaffCustomersPage />
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
        <AdminRoleHome />
      </AdminLayout>
    );
  }

  return <HomePage />;
}
