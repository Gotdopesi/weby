import { isSupabaseConfigured, supabase } from "@/integrations/supabase/client";
import { DEFAULT_BARBERSHOP_ID } from "@/lib/barbershop";
import { SHOWCASE_TABLES } from "@/lib/showcase-tables";

export type BookingService = {
  id: number;
  name: string;
  price: number;
  duration_minutes: number;
  is_active: boolean;
};

function mapServiceRow(row: {
  id: number;
  name: string;
  price: number | string;
  duration_minutes: number | string;
  is_active: boolean;
}): BookingService {
  return {
    id: row.id,
    name: row.name,
    price: Number(row.price),
    duration_minutes: Number(row.duration_minutes),
    is_active: Boolean(row.is_active),
  };
}

async function serviceIdsForStaff(staffId: number): Promise<number[]> {
  const { data, error } = await supabase
    .from(SHOWCASE_TABLES.staffServices)
    .select("service_id")
    .eq("staff_id", staffId);

  if (error) {
    console.warn("[serviceIdsForStaff]", error.message);
    return [];
  }
  return (data ?? []).map((r) => Number(r.service_id)).filter((id) => id > 0);
}

async function loadServicesByIds(
  barbershopId: number,
  ids: number[],
  activeOnly: boolean,
): Promise<BookingService[]> {
  if (ids.length === 0) return [];

  let query = supabase
    .from(SHOWCASE_TABLES.services)
    .select("id, name, price, duration_minutes, is_active")
    .eq("barbershop_id", barbershopId)
    .in("id", ids)
    .order("name");

  if (activeOnly) query = query.eq("is_active", true);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map(mapServiceRow);
}

async function loadAllShopServices(
  barbershopId: number,
  activeOnly: boolean,
): Promise<BookingService[]> {
  let query = supabase
    .from(SHOWCASE_TABLES.services)
    .select("id, name, price, duration_minutes, is_active")
    .eq("barbershop_id", barbershopId)
    .order("name");

  if (activeOnly) query = query.eq("is_active", true);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map(mapServiceRow);
}

/** Služby jednoho kadeřníka (rezervace / admin). */
export async function fetchServicesForStaff(
  staffId: number,
  barbershopId = DEFAULT_BARBERSHOP_ID,
  activeOnly = true,
): Promise<BookingService[]> {
  if (!isSupabaseConfigured()) return [];

  const ids = await serviceIdsForStaff(staffId);
  if (ids.length === 0) {
    return loadAllShopServices(barbershopId, activeOnly);
  }
  return loadServicesByIds(barbershopId, ids, activeOnly);
}

/** Veřejná rezervace — podle vybraného kadeřníka, jinak sjednocení služeb celého týmu. */
export async function fetchServicesForBooking(
  barbershopId = DEFAULT_BARBERSHOP_ID,
  staffId?: number | null,
): Promise<BookingService[]> {
  if (!isSupabaseConfigured()) return [];

  if (staffId != null && staffId > 0) {
    return fetchServicesForStaff(staffId, barbershopId, true);
  }

  const { data: staffRows, error: staffErr } = await supabase
    .from(SHOWCASE_TABLES.staff)
    .select("id")
    .eq("barbershop_id", barbershopId)
    .eq("is_active", true);

  if (staffErr) throw staffErr;

  const staffIds = (staffRows ?? []).map((s) => Number(s.id)).filter((id) => id > 0);
  if (staffIds.length === 0) {
    return loadAllShopServices(barbershopId, true);
  }

  const { data: links, error: linkErr } = await supabase
    .from(SHOWCASE_TABLES.staffServices)
    .select("service_id")
    .in("staff_id", staffIds);

  if (linkErr) {
    console.warn("[fetchServicesForBooking]", linkErr.message);
    return loadAllShopServices(barbershopId, true);
  }

  const unionIds = [...new Set((links ?? []).map((r) => Number(r.service_id)).filter((id) => id > 0))];
  if (unionIds.length === 0) {
    return loadAllShopServices(barbershopId, true);
  }

  return loadServicesByIds(barbershopId, unionIds, true);
}

export async function linkServiceToStaff(staffId: number, serviceId: number): Promise<void> {
  const { error } = await supabase
    .from(SHOWCASE_TABLES.staffServices)
    .upsert({ staff_id: staffId, service_id: serviceId }, { onConflict: "staff_id,service_id" });
  if (error) throw error;
}
