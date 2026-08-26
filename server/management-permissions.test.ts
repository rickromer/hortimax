import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const store = vi.hoisted(() => ({
  countSites: vi.fn(), countCheckins: vi.fn(), countNotes: vi.fn(), listUsers: vi.fn(), listSites: vi.fn(),
  getSiteById: vi.fn(), archiveSite: vi.fn(),
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
  store.getSiteById.mockResolvedValue({ id: 1, name: "Cliente de prueba", active: true });
  store.archiveSite.mockResolvedValue({ id: 1, name: "Cliente de prueba", active: false });
});

describe("gestión comercial", () => {
  it("permite a gerente comercial ver las métricas globales", async () => {
    const stats = await adminRouter.createCaller(contextFor("manager")).stats();
    expect(stats).toMatchObject({ totalSites: 2, totalCheckins: 4, totalNotes: 3, totalSellers: 1 });
  });

  it("no expone la gestión global a un representante de campo", async () => {
    await expect(adminRouter.createCaller(contextFor("field")).stats()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("reserva el archivo recuperable de cliente exclusivamente para Administrador", async () => {
    await expect(adminRouter.createCaller(contextFor("manager")).archiveClient({ id: 1 })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(adminRouter.createCaller(contextFor("admin")).archiveClient({ id: 1 })).resolves.toMatchObject({ success: true });
    expect(store.archiveSite).toHaveBeenCalledWith(1, 10, undefined);
  });
});
