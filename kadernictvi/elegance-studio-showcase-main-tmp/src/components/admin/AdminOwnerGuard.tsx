import { useEffect, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { useAdminBarbershop } from "@/lib/use-admin-barbershop";
import { useRouter } from "@/lib/router";

export function AdminOwnerGuard({ children }: { children: ReactNode }) {
  const { loading, isOwner } = useAdminBarbershop();
  const { navigate } = useRouter();

  useEffect(() => {
    if (!loading && !isOwner) {
      navigate("/admin", { replace: true });
    }
  }, [loading, isOwner, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-gold" />
        <p className="text-sm">Ověřuji oprávnění…</p>
      </div>
    );
  }

  if (!isOwner) return null;

  return children;
}
