import HomePage from "@/pages/HomePage";
import CancelReservationPage from "@/pages/CancelReservationPage";
import AdminLoginPage from "@/pages/admin/AdminLoginPage";
import { AdminLayout } from "@/pages/admin/AdminLayout";
import AdminReservationsPage from "@/pages/admin/AdminReservationsPage";
import AdminCustomersPage from "@/pages/admin/AdminCustomersPage";
import AdminStatisticsPage from "@/pages/admin/AdminStatisticsPage";
import { useRouter } from "@/lib/router";

export default function App() {
  const { pathname } = useRouter();

  if (pathname === "/zrusit-rezervaci") {
    return <CancelReservationPage />;
  }

  if (pathname === "/admin/login") {
    return <AdminLoginPage />;
  }

  if (pathname === "/admin/zakaznici") {
    return (
      <AdminLayout>
        <AdminCustomersPage />
      </AdminLayout>
    );
  }

  if (pathname === "/admin/statistiky" || pathname === "/admin/trzby" || pathname === "/admin/sluzby") {
    return (
      <AdminLayout>
        <AdminStatisticsPage />
      </AdminLayout>
    );
  }

  if (pathname === "/admin") {
    return (
      <AdminLayout>
        <AdminReservationsPage />
      </AdminLayout>
    );
  }

  return <HomePage />;
}
