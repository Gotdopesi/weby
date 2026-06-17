import HomePage from "@/pages/HomePage";
import PortfolioPage from "@/pages/PortfolioPage";
import CancelReservationPage from "@/pages/CancelReservationPage";
import { AdminApp, isAdminPath } from "@/admin/router/AdminApp";
import { useRouter } from "@/lib/router";

export default function App() {
  const { pathname } = useRouter();

  if (pathname === "/portfolio") {
    return <PortfolioPage />;
  }

  if (pathname === "/zrusit-rezervaci") {
    return <CancelReservationPage />;
  }

  if (isAdminPath(pathname)) {
    return <AdminApp />;
  }

  return <HomePage />;
}
