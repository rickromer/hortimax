import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const store = vi.hoisted(() => ({
  getSiteById: vi.fn(), listFollowups: vi.fn(), createFollowup: vi.fn(), getFollowupById: vi.fn(), updateFollowup: vi.fn(), deleteFollowup: vi.fn(),
}));
vi.mock("./db", () => store);
import { followupsRouter } from "./routers/followups";

const site = { id: 41, name: "Productor San José", createdBy: 10 };
const foreignSite = { ...site, id: 42, createdBy: 20 };
function contextFor(id: number, role: "field" | "manager" | "admin" = "field") {
  return { user: { id, role }, req: {} as TrpcContext["req"], res: {} as TrpcContext["res"] } as TrpcContext;
}

beforeEach(() => {
  vi.clearAllMocks();
  store.getSiteById.mockResolvedValue(site);
  store.listFollowups.mockResolvedValue([]);
  store.createFollowup.mockImplementation(async (values: Record<string, unknown>) => ({ id: 8, ...values }));
  store.getFollowupById.mockResolvedValue({ id: 8, siteId: site.id, createdBy: 10 });
  store.updateFollowup.mockResolvedValue({ id: 8, siteId: site.id, status: "completed" });
});

describe("próximos relevamientos", () => {
  it("permite agendar temporalmente sin sesión y lo identifica como carga pública", async () => {
    const caller = followupsRouter.createCaller({ user: null, req: {} as TrpcContext["req"], res: {} as TrpcContext["res"] } as TrpcContext);
    await caller.create({ siteId: site.id, description: "Seguimiento", scheduledFor: "2026-09-16" });
    expect(store.createFollowup).toHaveBeenCalledWith(expect.objectContaining({ siteId: site.id, createdBy: 0 }));
  });

  it("permite al propietario agendar y ver la agenda de todo el equipo", async () => {
    const caller = followupsRouter.createCaller(contextFor(10));
    await caller.create({ siteId: site.id, description: " Revisar cultivo ", scheduledFor: "2026-09-15", type: "visit" });
    await caller.list({ limit: 12 });
    expect(store.createFollowup).toHaveBeenCalledWith(expect.objectContaining({ siteId: site.id, createdBy: 10, type: "visit", description: "Revisar cultivo" }));
    expect(store.listFollowups).toHaveBeenCalledWith({ siteId: undefined, siteIds: undefined, status: "pending", limit: 12 });
  });

  it("bloquea al representante en un punto ajeno y permite a gerencia operar sobre él", async () => {
    store.getSiteById.mockResolvedValue(foreignSite);
    await expect(followupsRouter.createCaller(contextFor(10)).create({ siteId: foreignSite.id, description: "No autorizado", scheduledFor: "2026-09-15" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await followupsRouter.createCaller(contextFor(40, "manager")).create({ siteId: foreignSite.id, description: "Visita de gerencia", scheduledFor: "2026-09-15" });
    expect(store.createFollowup).toHaveBeenCalledWith(expect.objectContaining({ siteId: foreignSite.id, createdBy: 40 }));
  });
});
