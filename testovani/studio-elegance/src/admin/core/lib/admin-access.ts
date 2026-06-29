export type AdminRole = "owner" | "staff";

export type AdminAccess = {
  role: AdminRole;
  staffId: number | null;
  staffName: string | null;
  /** Pro nastavení a služby (kadeřník nebo combined majitel). */
  staffToolsId: number | null;
  staffToolsName: string | null;
  loginLabel: string | null;
  isOwner: boolean;
  isStaff: boolean;
};

export const DEFAULT_ADMIN_ACCESS: AdminAccess = {
  role: "owner",
  staffId: null,
  staffName: null,
  staffToolsId: null,
  staffToolsName: null,
  loginLabel: null,
  isOwner: true,
  isStaff: false,
};
