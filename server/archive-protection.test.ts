import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const store = vi.hoisted(() => ({
  getSiteById: vi.fn(),
  archiveSite: vi.fn(),
  restoreSite: vi.fn(),
  listArchivedSites: vi.fn(),
}));
vi.mock("./db", () => store);

import { adminRouter } from "./routers/admin";

function contextFor(userId: number, role: "field" | "admin") {
  return { user: { id: userId, role }, req: {} as TrpcContext["req"], res: {} as TrpcContext["res"] } as TrpcContext;
}

const activeSite = { id: 51, name: "Invernadero López", active: true };
const archivedSite = { ...activeSite, active: false, archivedAt: new Date("2026-08-26T12:00:00Z") };

describe("papelera administrativa recuperable", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    store.getSiteById.mockResolvedValue(activeSite);
    store.archiveSite.mockResolvedValue({ ...activeSite, active: false });
    store.restoreSite.mockResolvedValue(activeSite);
    store.listArchivedSites.mockResolvedValue([archivedSite]);
  });

  it("solo permite que el administrador archive un cliente y conserva un motivo opcional", async () => {
    const caller = adminRouter.createCaller(contextFor(1, "admin"));
    await expect(caller.archiveClient({ id: activeSite.id, reason: "Registro duplicado" })).resolves.toMatchObject({
      success: true,
      site: { active: false },
    });
    expect(store.archiveSite).toHaveBeenCalledWith(activeSite.id, 1, "Registro duplicado");

    await expect(
      adminRouter.createCaller(contextFor(10, "field")).archiveClient({ id: activeSite.id })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(store.archiveSite).toHaveBeenCalledTimes(1);
  });

  it("muestra los clientes archivados y permite restaurarlos solo al administrador", async () => {
    const caller = adminRouter.createCaller(contextFor(1, "admin"));
    await expect(caller.archivedClients()).resolves.toEqual([archivedSite]);
    store.getSiteById.mockResolvedValue(archivedSite);
    await expect(caller.restoreClient({ id: archivedSite.id })).resolves.toMatchObject({
      success: true,
      site: { active: true },
    });
    expect(store.restoreSite).toHaveBeenCalledWith(archivedSite.id, 1);
  });
});
