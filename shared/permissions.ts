export const APP_ROLES = ["field", "manager", "admin"] as const;
export type AppRole = (typeof APP_ROLES)[number];

export function canManageAll(role: string | null | undefined) {
  return role === "admin" || role === "manager";
}

export function roleLabel(role: string | null | undefined) {
  if (role === "admin") return "Administrador";
  if (role === "manager") return "Gerente comercial";
  return "Representante de campo";
}
