import { AppLink, useRouter } from "@/lib/router";
import { AdminLegacyNav } from "@/admin/templates/combined/components/AdminLegacyNav";
import { AdminStaffNav } from "@/admin/templates/staff/components/AdminStaffNav";
import { isLegacyAdminSession } from "@/admin/core/lib/admin-legacy-ui";
import { useAdminBarbershop } from "@/admin/core/lib/use-admin-barbershop";
import { useAdminSession } from "@/admin/core/lib/use-admin-session";
import { getAdminTemplate } from "@/admin/config";
import { cn } from "@/lib/utils";
import { BarChart3 } from "lucide-react";

const OWNER_LINKS = [
  { to: "/admin/statistiky", label: "Přehled salónu", icon: BarChart3, exact: false },
] as const;

export function AdminNav() {
  const { pathname } = useRouter();
  const { userEmail } = useAdminSession();
  const { isOwner, isStaff } = useAdminBarbershop();
  const template = getAdminTemplate();

  if (template === "combined" || isLegacyAdminSession(userEmail)) return <AdminLegacyNav />;
  if (isStaff) return <AdminStaffNav />;
  return (
    <nav className="flex flex-wrap items-center gap-2 mb-8 border-b border-border/60 pb-4">
      {isOwner && (
        <span className="w-full sm:w-auto text-xs text-muted-foreground mb-1 sm:mb-0 sm:mr-2">
          Přihlášen jako <span className="text-foreground font-medium">majitel</span>
        </span>
      )}
      {OWNER_LINKS.map(({ to, label, icon: Icon, exact }) => {
        const active = exact ? pathname === to : pathname.startsWith(to);
        return (
          <AppLink
            key={to}
            to={to}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </AppLink>
        );
      })}
    </nav>
  );
}

