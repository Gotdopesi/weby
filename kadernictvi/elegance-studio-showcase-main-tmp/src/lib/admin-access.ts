export type AdminRole = "owner" | "staff";

export type AdminAccess = {
  role: AdminRole;
  staffId: number | null;
  staffName: string | null;
  loginLabel: string | null;
  isOwner: boolean;
  isStaff: boolean;
};

export const DEFAULT_ADMIN_ACCESS: AdminAccess = {
  role: "owner",
  staffId: null,
  staffName: null,
  loginLabel: null,
  isOwner: true,
  isStaff: false,
};
