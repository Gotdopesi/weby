import HomePage from "@/pages/HomePage";
import PortfolioPage from "@/pages/PortfolioPage";
import CancelReservationPage from "@/pages/CancelReservationPage";
import PrivacyPlaceholderPage from "@/pages/PrivacyPlaceholderPage";
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

  if (pathname === "/ochrana-osobnich-udaju") {
    return <PrivacyPlaceholderPage />;
  }

  if (isAdminPath(pathname)) {
    return <AdminApp />;
  }

  return <HomePage />;
}
