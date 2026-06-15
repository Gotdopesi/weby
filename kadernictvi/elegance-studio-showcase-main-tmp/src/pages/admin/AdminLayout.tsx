import { AppLink } from "@/lib/router";
import { AdminBarbershopProvider, useAdminBarbershop } from "@/lib/use-admin-barbershop";
import { Scissors } from "lucide-react";

export function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminBarbershopProvider>
      <AdminShellInner>{children}</AdminShellInner>
    </AdminBarbershopProvider>
  );
}

function AdminShellInner({ children }: { children: React.ReactNode }) {
  const { isOwner, isStaff, staffName } = useAdminBarbershop();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b border-border/60 bg-background/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 min-w-0">
            <Scissors className="h-5 w-5 text-gold shrink-0" />
            <span className="font-display text-xl tracking-wide truncate">Studio Elegance</span>
            <span className="text-muted-foreground text-sm hidden sm:inline shrink-0">
              · {isStaff && staffName ? staffName : isOwner ? "Majitel" : "Administrace"}
            </span>
          </div>
          <AppLink to="/" className="text-sm text-muted-foreground hover:text-gold transition-colors">
            Zpět na web
          </AppLink>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-6 py-10">{children}</main>
    </div>
  );
}
