import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const replacements = [
  // pages
  [/@\/pages\/admin\/AdminLoginPage/g, "@admin/core/pages/AdminLoginPage"],
  [/@\/pages\/admin\/AdminLayout/g, "@admin/core/pages/AdminLayout"],
  [/@\/pages\/admin\/AdminReservationsPage/g, "@admin/core/pages/AdminReservationsPage"],
  [/@\/pages\/admin\/AdminStatisticsPage/g, "@admin/templates/owner/pages/AdminStatisticsPage"],
  [/@\/pages\/admin\/AdminCustomersPage/g, "@admin/templates/owner/pages/AdminCustomersPage"],
  [/@\/pages\/admin\/AdminRevenuePage/g, "@admin/templates/owner/pages/AdminRevenuePage"],
  [/@\/pages\/admin\/AdminServicesPage/g, "@admin/templates/owner/pages/AdminServicesPage"],
  [/@\/pages\/admin\/AdminStaffOverviewPage/g, "@admin/templates/staff/pages/AdminStaffOverviewPage"],
  [/@\/pages\/admin\/AdminStaffServicesPage/g, "@admin/templates/staff/pages/AdminStaffServicesPage"],
  [/@\/pages\/admin\/AdminStaffSettingsPage/g, "@admin/templates/staff/pages/AdminStaffSettingsPage"],
  [/@\/pages\/admin\/AdminStaffCustomersPage/g, "@admin/templates/staff/pages/AdminStaffCustomersPage"],
  // components
  [/@\/components\/admin\/AdminLegacyNav/g, "@admin/templates/combined/components/AdminLegacyNav"],
  [/@\/components\/admin\/AdminStaffNav/g, "@admin/templates/staff/components/AdminStaffNav"],
  [/@\/components\/admin\/AdminStaffGuard/g, "@admin/templates/staff/components/AdminStaffGuard"],
  [/@\/components\/admin\/AdminOwnerGuard/g, "@admin/templates/owner/components/AdminOwnerGuard"],
  [/@\/components\/admin\/AdminStaffDetailSheet/g, "@admin/templates/owner/components/AdminStaffDetailSheet"],
  [/@\/components\/admin\/AdminStaffPerformanceSection/g, "@admin/templates/owner/components/AdminStaffPerformanceSection"],
  [/@\/components\/admin\/AdminNav/g, "@admin/core/components/AdminNav"],
  [/@\/components\/admin\/AdminRoleHome/g, "@admin/core/components/AdminRoleHome"],
  [/@\/components\/admin\/AdminDevQuickLogin/g, "@admin/core/components/AdminDevQuickLogin"],
  [/@\/components\/admin\/AdminAddReservationDialog/g, "@admin/core/components/AdminAddReservationDialog"],
  [/@\/components\/admin\/AdminMonthCalendar/g, "@admin/core/components/AdminMonthCalendar"],
  [/@\/components\/admin\/AdminWeekCalendar/g, "@admin/core/components/AdminWeekCalendar"],
  [/@\/components\/admin\/AdminReservationDetailList/g, "@admin/core/components/AdminReservationDetailList"],
  [/@\/components\/admin\/AdminRevenueDetailDialog/g, "@admin/core/components/AdminRevenueDetailDialog"],
  [/@\/components\/admin\/AdminPeriodToggle/g, "@admin/core/components/AdminPeriodToggle"],
  [/@\/components\/admin\/AdminViewToggle/g, "@admin/core/components/AdminViewToggle"],
  // lib — core
  [/@\/lib\/admin-legacy-ui/g, "@admin/core/lib/admin-legacy-ui"],
  [/@\/lib\/admin-readonly/g, "@admin/core/lib/admin-readonly"],
  [/@\/lib\/admin-access/g, "@admin/core/lib/admin-access"],
  [/@\/lib\/use-admin-barbershop/g, "@admin/core/lib/use-admin-barbershop"],
  [/@\/lib\/use-admin-session/g, "@admin/core/lib/use-admin-session"],
  [/@\/lib\/dev-admin-logins/g, "@admin/core/lib/dev-admin-logins"],
  // lib — owner template
  [/@\/lib\/admin-statistics-period/g, "@admin/templates/owner/lib/admin-statistics-period"],
  [/@\/lib\/admin-staff-metrics/g, "@admin/templates/owner/lib/admin-staff-metrics"],
  [/@\/lib\/admin-revenue-from-reservations/g, "@admin/templates/owner/lib/admin-revenue-from-reservations"],
  [/@\/lib\/admin-revenue-display/g, "@admin/templates/owner/lib/admin-revenue-display"],
  // lib — staff template
  [/@\/lib\/admin-staff-personal/g, "@admin/templates/staff/lib/admin-staff-personal"],
  [/@\/lib\/staff-services/g, "@admin/templates/staff/lib/staff-services"],
  [/@\/lib\/staff-blocks/g, "@admin/templates/staff/lib/staff-blocks"],
  [/@\/lib\/staff-block-hours/g, "@admin/templates/staff/lib/staff-block-hours"],
  [/@\/lib\/work-schedule-form/g, "@admin/templates/staff/lib/work-schedule-form"],
];

function walk(dir, files = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, files);
    else if (/\.(tsx?|jsx?)$/.test(name)) files.push(p);
  }
  return files;
}

const dirs = [
  join(root, "kadernictvi/_shared/admin"),
  join(root, "kadernictvi/studio-elegance/src"),
];

let changed = 0;
for (const dir of dirs) {
  for (const file of walk(dir)) {
    let src = readFileSync(file, "utf8");
    let next = src;
    for (const [from, to] of replacements) {
      next = next.replace(from, to);
    }
    if (next !== src) {
      writeFileSync(file, next, "utf8");
      changed++;
    }
  }
}
console.log(`Updated ${changed} files`);
