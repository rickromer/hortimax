import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const store = vi.hoisted(() => ({
  countSites: vi.fn(), countCheckins: vi.fn(), countNotes: vi.fn(), listUsers: vi.fn(), listSites: vi.fn(), listCheckins: vi.fn(), listNotes: vi.fn(), listFollowups: vi.fn(),
  getSiteById: vi.fn(), deleteSiteCompletely: vi.fn(),
}));
vi.mock("./db", () => store);
import { adminRouter } from "./routers/admin";

function contextFor(role: "field" | "manager" | "admin") {
  return { user: { id: 10, role }, req: {} as TrpcContext["req"], res: {} as TrpcContext["res"] } as TrpcContext;
}

beforeEach(() => {
  vi.clearAllMocks();
  store.countSites.mockResolvedValue(2);
  store.countCheckins.mockResolvedValue(4);
  store.countNotes.mockResolvedValue(3);
  store.listUsers.mockResolvedValue([{ id: 10, role: "field", active: true }]);
  store.listSites.mockResolvedValue([{ id: 1, department: "Caaguazú", clientType: "Productor" }]);
  store.getSiteById.mockResolvedValue({ id: 1, name: "Cliente de prueba" });
  store.listCheckins.mockResolvedValue([{ id: 1, siteId: 1, siteName: "Cliente de prueba", userId: 10, userName: "María López", username: "mlopez", comment: "Visita", distanceMeters: 4, createdAt: new Date("2026-08-25T12:00:00Z") }]);
  store.listNotes.mockResolvedValue([{ id: 2, siteId: 1, siteName: "Cliente de prueba", userId: 10, userName: "María López", username: "mlopez", content: "Seguimiento", createdAt: new Date("2026-08-24T12:00:00Z") }]);
  store.listFollowups.mockResolvedValue([]);
});

describe("gestión comercial", () => {
  it("permite a gerente comercial ver las métricas globales", async () => {
    const stats = await adminRouter.createCaller(contextFor("manager")).stats();
    expect(stats).toMatchObject({ totalSites: 2, totalCheckins: 4, totalNotes: 3, totalSellers: 1 });
  });

  it("no expone la gestión global a un representante de campo", async () => {
    await expect(adminRouter.createCaller(contextFor("field")).stats()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("permite a gerencia buscar el historial unificado por responsable o contenido", async () => {
    const result = await adminRouter.createCaller(contextFor("manager")).activityTimeline({ search: "María" });
    expect(result.entries).toHaveLength(2);
    expect(result.entries.every(entry => entry.authorName === "María López")).toBe(true);
  });

  it("reserva la eliminación definitiva de cliente exclusivamente para Administrador", async () => {
    await expect(adminRouter.createCaller(contextFor("manager")).deleteClient({ id: 1 })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(adminRouter.createCaller(contextFor("admin")).deleteClient({ id: 1 })).resolves.toMatchObject({ success: true });
    expect(store.deleteSiteCompletely).toHaveBeenCalledWith(1);
  });
});
