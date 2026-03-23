export type UserRole = "owner" | "admin";

export type UserDeleteTarget = {
  id: string;
  role: UserRole;
};

export function canDeleteUser(viewerRole: UserRole, viewerId: string, target: UserDeleteTarget) {
  if (viewerRole === "owner") {
    return true;
  }

  return target.role === "admin" && target.id !== viewerId;
}
