import { isSupabaseConfigured, supabase } from "@/integrations/supabase/client";
import { DEFAULT_BARBERSHOP_ID } from "@/lib/barbershop";
import { SHOWCASE_TABLES } from "@/lib/showcase-tables";

export const STAFF_ANY = "any" as const;
export type StaffSelection = typeof STAFF_ANY | number;

export type StaffMember = {
  id: number;
  first_name: string;
  last_name: string;
  role_title: string;
  bio: string | null;
  photo_url: string;
  specializations: string[];
  sort_order: number;
  work_schedule?: unknown;
};

export function staffDisplayName(m: Pick<StaffMember, "first_name" | "last_name">): string {
  return `${m.first_name} ${m.last_name}`.trim();
}

export function staffShortLabel(m: Pick<StaffMember, "first_name" | "last_name" | "role_title">): string {
  return `${m.first_name} — ${m.role_title}`;
}

/** Jen pro náhled bez Supabase — reálné ID jsou vždy z DB. */
export const FALLBACK_STAFF: StaffMember[] = [
  {
    id: 1,
    first_name: "Klára",
    last_name: "Černá",
    role_title: "Zakladatelka & Master Stylist",
    bio: "Více než 15 let tvořím účesy, které podtrhnou osobnost klientky.",
    photo_url: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=800&q=85",
    specializations: ["Dámský střih", "Společenský účes", "Konzultace"],
    sort_order: 1,
  },
  {
    id: 2,
    first_name: "Monika",
    last_name: "Svobodová",
    role_title: "Senior Stylist",
    bio: "Od klasických střihů po trendy účesy.",
    photo_url: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=800&q=85&auto=format",
    specializations: ["Dámský střih", "Foukaná", "Regenerační péče"],
    sort_order: 2,
  },
  {
    id: 3,
    first_name: "Eliška",
    last_name: "Mráčková",
    role_title: "Color Specialist",
    bio: "Specializuji se na barvení, melír a balayage.",
    photo_url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&q=85&auto=format",
    specializations: ["Balayage", "Melír", "Barvení vlasů"],
    sort_order: 3,
  },
];

function mapRow(row: Record<string, unknown>): StaffMember {
  const specs = row.specializations;
  return {
    id: Number(row.id),
    first_name: String(row.first_name),
    last_name: String(row.last_name),
    role_title: String(row.role_title),
    bio: row.bio != null ? String(row.bio) : null,
    photo_url: String(row.photo_url),
    specializations: Array.isArray(specs) ? specs.map(String) : [],
    sort_order: Number(row.sort_order) || 0,
    work_schedule: row.work_schedule,
  };
}

export async function fetchActiveStaff(
  barbershopId = DEFAULT_BARBERSHOP_ID,
): Promise<StaffMember[]> {
  if (!isSupabaseConfigured()) return FALLBACK_STAFF;

  const { data, error } = await supabase
    .from(SHOWCASE_TABLES.staff)
    .select(
      "id, first_name, last_name, role_title, bio, photo_url, specializations, sort_order, work_schedule",
    )
    .eq("barbershop_id", barbershopId)
    .eq("is_active", true)
    .order("sort_order")
    .order("last_name");

  if (error) {
    console.warn("[fetchActiveStaff]", error.message);
    return [];
  }

  if (!data?.length) return [];

  return data.map((r) => mapRow(r as Record<string, unknown>));
}

export async function fetchStaffForAdmin(
  barbershopId = DEFAULT_BARBERSHOP_ID,
): Promise<StaffMember[]> {
  if (!isSupabaseConfigured()) return [];

  const { data, error } = await supabase
    .from(SHOWCASE_TABLES.staff)
    .select(
      "id, first_name, last_name, role_title, bio, photo_url, specializations, sort_order, work_schedule",
    )
    .eq("barbershop_id", barbershopId)
    .eq("is_active", true)
    .order("sort_order")
    .order("last_name");

  if (error || !data?.length) return [];
  return data.map((r) => mapRow(r as Record<string, unknown>));
}
