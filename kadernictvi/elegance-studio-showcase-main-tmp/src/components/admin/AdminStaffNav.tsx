import { AppLink, useRouter } from "@/lib/router";
import { useAdminBarbershop } from "@/lib/use-admin-barbershop";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  CalendarDays,
  Scissors,
  Settings,
  Users,
} from "lucide-react";

const STAFF_LINKS = [
  { to: "/admin", label: "Kalendář", short: "Kal.", icon: CalendarDays, exact: true },
  { to: "/admin/zakaznici", label: "Zákazníci", short: "Klienti", icon: Users, exact: false },
  { to: "/admin/prehled", label: "Přehled", short: "Stats", icon: BarChart3, exact: false },
  { to: "/admin/sluzby", label: "Služby", short: "Ceník", icon: Scissors, exact: false },
  { to: "/admin/nastaveni", label: "Nastavení", short: "Čas", icon: Settings, exact: false },
] as const;

function linkActive(pathname: string, to: string, exact: boolean): boolean {
  return exact ? pathname === to : pathname.startsWith(to);
}

export function AdminStaffNav() {
  const { pathname } = useRouter();
  const { staffName } = useAdminBarbershop();

  return (
    <>
      <nav className="hidden md:flex flex-wrap items-center gap-2 mb-8 border-b border-border/60 pb-4">
        {staffName && (
          <span className="w-full lg:w-auto text-xs text-muted-foreground mb-1 lg:mb-0 lg:mr-2">
            Přihlášen jako <span className="text-foreground font-medium">{staffName}</span>
          </span>
        )}
        {STAFF_LINKS.map(({ to, label, icon: Icon, exact }) => {
          const active = linkActive(pathname, to, exact);
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

      <nav
        className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border/80 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80"
        aria-label="Navigace kadeřníka"
      >
        <div className="grid grid-cols-5 gap-0.5 px-1 py-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))]">
          {STAFF_LINKS.map(({ to, label, short, icon: Icon, exact }) => {
            const active = linkActive(pathname, to, exact);
            return (
              <AppLink
                key={to}
                to={to}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 rounded-lg py-2 px-1 text-[10px] font-medium transition-colors min-h-[52px]",
                  active ? "text-gold bg-gold/10" : "text-muted-foreground",
                )}
              >
                <Icon className={cn("h-5 w-5", active && "text-gold")} />
                <span className="leading-tight text-center">{short}</span>
              </AppLink>
            );
          })}
        </div>
      </nav>

      <div className="md:hidden h-[68px] shrink-0" aria-hidden />
    </>
  );
}
