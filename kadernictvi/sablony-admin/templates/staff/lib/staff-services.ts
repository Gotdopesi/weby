import { isSupabaseConfigured, supabase } from "@/integrations/supabase/client";
import { DEFAULT_KADERNICTVI_ID } from "@/lib/barbershop";
import { KADERNICTVI_TABULKY } from "@/lib/kadernictvi-tables";

export type BookingService = {
  id: number;
  name: string;
  price: number;
  duration_minutes: number;
  is_active: boolean;
};

export type StaffServiceEditorRow = BookingService & { offered: boolean };

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
    .from(KADERNICTVI_TABULKY.pracovnikSluzby)
    .select("service_id")
    .eq("pracovnik_id", staffId);

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
    .from(KADERNICTVI_TABULKY.sluzby)
    .select("id, name, price, duration_minutes, is_active")
    .eq("kadernictvi_id", barbershopId)
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
    .from(KADERNICTVI_TABULKY.sluzby)
    .select("id, name, price, duration_minutes, is_active")
    .eq("kadernictvi_id", barbershopId)
    .order("name");

  if (activeOnly) query = query.eq("is_active", true);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map(mapServiceRow);
}

async function activeStaffIds(barbershopId: number): Promise<number[]> {
  const { data, error } = await supabase
    .from(KADERNICTVI_TABULKY.pracovnici)
    .select("id")
    .eq("kadernictvi_id", barbershopId)
    .eq("is_active", true);

  if (error) throw error;
  return (data ?? []).map((s) => Number(s.id)).filter((id) => id > 0);
}

/** Služby jednoho kadeřníka (rezervace / admin). Jen služby, které má v ceníku zapnuté. */
export async function fetchServicesForStaff(
  staffId: number,
  barbershopId = DEFAULT_KADERNICTVI_ID,
  activeOnly = true,
): Promise<BookingService[]> {
  if (!isSupabaseConfigured()) return [];

  const ids = await serviceIdsForStaff(staffId);
  if (ids.length === 0) {
    return loadAllShopServices(barbershopId, activeOnly);
  }
  return loadServicesByIds(barbershopId, ids, activeOnly);
}

/** Admin — ceník kadeřníka: co nabízí v rezervacích (přepínač = vazba, ne globální vypnutí). */
export async function fetchStaffServicesForEditor(
  staffId: number,
  barbershopId = DEFAULT_KADERNICTVI_ID,
): Promise<StaffServiceEditorRow[]> {
  if (!isSupabaseConfigured()) return [];

  const [all, linkedIds] = await Promise.all([
    loadAllShopServices(barbershopId, true),
    serviceIdsForStaff(staffId),
  ]);
  const linked = new Set(linkedIds);
  const implicitAll = linkedIds.length === 0 && all.length > 0;

  return all.map((s) => ({
    ...s,
    offered: implicitAll || linked.has(s.id),
  }));
}

/** Veřejná rezervace — služba je vidět, pokud ji nabízí alespoň jeden aktivní kadeřník. */
export async function fetchServicesForBooking(
  barbershopId = DEFAULT_KADERNICTVI_ID,
  staffId?: number | null,
): Promise<BookingService[]> {
  if (!isSupabaseConfigured()) return [];

  if (staffId != null && staffId > 0) {
    return fetchServicesForStaff(staffId, barbershopId, true);
  }

  const staffIds = await activeStaffIds(barbershopId);
  if (staffIds.length === 0) {
    return loadAllShopServices(barbershopId, true);
  }

  const allServices = await loadAllShopServices(barbershopId, true);
  const allIds = allServices.map((s) => s.id);

  const { data: links, error: linkErr } = await supabase
    .from(KADERNICTVI_TABULKY.pracovnikSluzby)
    .select("pracovnik_id, service_id")
    .in("pracovnik_id", staffIds);

  if (linkErr) {
    console.warn("[fetchServicesForBooking]", linkErr.message);
    return allServices;
  }

  const linksByStaff = new Map<number, Set<number>>();
  for (const row of links ?? []) {
    const sid = Number(row.pracovnik_id);
    const serviceId = Number(row.service_id);
    if (sid <= 0 || serviceId <= 0) continue;
    if (!linksByStaff.has(sid)) linksByStaff.set(sid, new Set());
    linksByStaff.get(sid)!.add(serviceId);
  }

  const unionIds = new Set<number>();
  for (const sid of staffIds) {
    const linked = linksByStaff.get(sid);
    if (!linked || linked.size === 0) {
      for (const id of allIds) unionIds.add(id);
    } else {
      for (const id of linked) unionIds.add(id);
    }
  }

  if (unionIds.size === 0) return [];

  return loadServicesByIds(barbershopId, [...unionIds], true);
}

export async function linkServiceToStaff(staffId: number, serviceId: number): Promise<void> {
  const { error } = await supabase
    .from(KADERNICTVI_TABULKY.pracovnikSluzby)
    .upsert({ pracovnik_id: staffId, service_id: serviceId }, { onConflict: "pracovnik_id,service_id" });
  if (error) throw error;
}

export async function unlinkServiceFromStaff(staffId: number, serviceId: number): Promise<void> {
  const { error } = await supabase
    .from(KADERNICTVI_TABULKY.pracovnikSluzby)
    .delete()
    .eq("pracovnik_id", staffId)
    .eq("service_id", serviceId);
  if (error) throw error;
}

/** Zapne/vypne službu jen u tohoto kadeřníka (ne celý salón). */
export async function setStaffServiceOffered(
  staffId: number,
  serviceId: number,
  offered: boolean,
  barbershopId = DEFAULT_KADERNICTVI_ID,
): Promise<void> {
  const linkedIds = await serviceIdsForStaff(staffId);
  const all = await loadAllShopServices(barbershopId, true);
  const allIds = all.map((s) => s.id);

  if (!offered && linkedIds.length === 0 && allIds.length > 0) {
    for (const id of allIds) {
      if (id !== serviceId) await linkServiceToStaff(staffId, id);
    }
    return;
  }

  if (offered) {
    await linkServiceToStaff(staffId, serviceId);
  } else {
    await unlinkServiceFromStaff(staffId, serviceId);
  }
}

/** Kadeřníci, kteří nabízejí danou službu (pro výběr po zvolení služby). */
export async function fetchStaffIdsOfferingService(
  serviceId: number,
  barbershopId = DEFAULT_KADERNICTVI_ID,
): Promise<number[]> {
  if (!isSupabaseConfigured() || serviceId <= 0) return [];

  const staffIds = await activeStaffIds(barbershopId);
  if (staffIds.length === 0) return [];

  const allIds = (await loadAllShopServices(barbershopId, true)).map((s) => s.id);
  if (!allIds.includes(serviceId)) return [];

  const { data: links, error } = await supabase
    .from(KADERNICTVI_TABULKY.pracovnikSluzby)
    .select("pracovnik_id, service_id")
    .in("pracovnik_id", staffIds);

  if (error) {
    console.warn("[fetchStaffIdsOfferingService]", error.message);
    return staffIds;
  }

  const linksByStaff = new Map<number, Set<number>>();
  for (const row of links ?? []) {
    const sid = Number(row.pracovnik_id);
    const sidService = Number(row.service_id);
    if (sid <= 0 || sidService <= 0) continue;
    if (!linksByStaff.has(sid)) linksByStaff.set(sid, new Set());
    linksByStaff.get(sid)!.add(sidService);
  }

  return staffIds.filter((sid) => {
    const linked = linksByStaff.get(sid);
    if (!linked || linked.size === 0) return true;
    return linked.has(serviceId);
  });
}
