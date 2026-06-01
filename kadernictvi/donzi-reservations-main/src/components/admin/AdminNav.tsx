import { AppLink, useRouter } from "@/lib/router";
import { cn } from "@/lib/utils";
import { BarChart3, CalendarDays, Users } from "lucide-react";

const LINKS = [
  { to: "/admin", label: "Kalendář", icon: CalendarDays, exact: true },
  { to: "/admin/zakaznici", label: "Zákazníci", icon: Users, exact: false },
  { to: "/admin/statistiky", label: "Statistiky", icon: BarChart3, exact: false },
] as const;

export function AdminNav() {
  const { pathname } = useRouter();

  return (
    <nav className="flex flex-wrap gap-2 mb-8 border-b border-border/60 pb-4">
      {LINKS.map(({ to, label, icon: Icon, exact }) => {
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
