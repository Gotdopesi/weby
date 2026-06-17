import { useEffect, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { useAdminBarbershop } from "@admin/core/lib/use-admin-barbershop";
import { useRouter } from "@/lib/router";

export function AdminStaffGuard({ children }: { children: ReactNode }) {
  const { loading, isStaff } = useAdminBarbershop();
  const { navigate } = useRouter();

  useEffect(() => {
    if (!loading && !isStaff) {
      navigate("/admin/statistiky", { replace: true });
    }
  }, [loading, isStaff, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-gold" />
        <p className="text-sm">Ověřuji oprávnění…</p>
      </div>
    );
  }

  if (!isStaff) return null;

  return children;
}
