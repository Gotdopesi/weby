import {
  CATEGORY_LABELS,
  SERVICES,
  type ServiceCategory,
} from "@/lib/reservation-data";

export type BookingServiceCategory = ServiceCategory;

export const BOOKING_CATEGORY_ORDER: BookingServiceCategory[] = [
  "package",
  "hair",
  "beard",
  "extras",
];

export function getServiceCategoryByName(name: string): ServiceCategory {
  const exact = SERVICES.find((s) => s.name === name);
  if (exact) return exact.category;

  const lower = name.toLowerCase();
  if (lower.includes("gentleman") || lower.includes("vip")) {
    return "package";
  }
  if (
    lower.includes("vous") ||
    lower.includes("holení") ||
    lower.includes("shave") ||
    lower.includes("břitv") ||
    lower.includes("modelace")
  ) {
    return "beard";
  }
  if (lower.includes("masáž") || lower.includes("chloup")) {
    return "extras";
  }
  if (lower.includes("kontur") || lower.includes("umytí")) {
    return "hair";
  }
  return "hair";
}

export function getCategoryLabel(cat: ServiceCategory): string {
  return CATEGORY_LABELS[cat];
}
