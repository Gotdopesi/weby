import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useAdminBarbershop } from "@admin/core/lib/use-admin-barbershop";
import { useRouter } from "@/lib/router";
import AdminReservationsPage from "@admin/core/pages/AdminReservationsPage";

/** /admin — majitel jde na statistiky, kadeřník na kalendář. */
export function AdminRoleHome() {
  const { loading, isOwner } = useAdminBarbershop();
  const { navigate } = useRouter();

  useEffect(() => {
    if (!loading && isOwner) {
      navigate("/admin/statistiky", { replace: true });
    }
  }, [loading, isOwner, navigate]);

  if (loading || isOwner) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-gold" />
        <p className="text-sm">Načítám…</p>
      </div>
    );
  }

  return <AdminReservationsPage />;
}
