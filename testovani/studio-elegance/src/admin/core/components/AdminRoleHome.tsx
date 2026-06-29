import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { usesCombinedAdminSession } from "@/admin/config";
import { useAdminBarbershop } from "@/admin/core/lib/use-admin-barbershop";
import { useAdminSession } from "@/admin/core/lib/use-admin-session";
import { useRouter } from "@/lib/router";
import AdminReservationsPage from "@/admin/core/pages/AdminReservationsPage";

/** /admin — majitel jde na statistiky, kadeřník na kalendář; combined účet má kalendář. */
export function AdminRoleHome() {
  const { loading, isOwner } = useAdminBarbershop();
  const { userEmail } = useAdminSession();
  const { navigate } = useRouter();
  const combined = usesCombinedAdminSession(userEmail);

  useEffect(() => {
    if (!loading && isOwner && !combined) {
      navigate("/admin/statistiky", { replace: true });
    }
  }, [loading, isOwner, combined, navigate]);

  if (loading || (isOwner && !combined)) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-gold" />
        <p className="text-sm">Načítám…</p>
      </div>
    );
  }

  return <AdminReservationsPage />;
}
