export const APP_ROLES = ["field", "manager", "admin"] as const;
export type AppRole = (typeof APP_ROLES)[number];

export function canManageAll(role: string | null | undefined) {
  return role === "admin" || role === "manager";
}

/** Operación sobre puntos: gerencia y administración tienen alcance global; campo, solo lo propio. */
export function canOperateSite(
  role: string | null | undefined,
  userId: number | null | undefined,
  createdBy: number
) {
  return Boolean(userId) && (canManageAll(role) || userId === createdBy);
}

export function roleLabel(role: string | null | undefined) {
  if (role === "admin") return "Administrador";
  if (role === "manager") return "Gerente comercial";
  return "Representante de campo";
}
