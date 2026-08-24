import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const store = vi.hoisted(() => ({
  getSiteById: vi.fn(),
  isUserAssignedToSite: vi.fn(),
  getAssignedSiteIds: vi.fn(),
  listFollowups: vi.fn(),
  createFollowup: vi.fn(),
  getFollowupById: vi.fn(),
  updateFollowup: vi.fn(),
  deleteFollowup: vi.fn(),
}));

vi.mock("./db", () => store);

import { followupsRouter } from "./routers/followups";

const site = { id: 41, name: "Productor San José" };

function contextFor(userId: number, role: "user" | "admin" = "user") {
  return {
    user: { id: userId, role },
    req: {} as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  } as TrpcContext;
}

beforeEach(() => {
  vi.clearAllMocks();
  store.getSiteById.mockResolvedValue(site);
  store.isUserAssignedToSite.mockResolvedValue(true);
  store.getAssignedSiteIds.mockResolvedValue([site.id]);
  store.listFollowups.mockResolvedValue([]);
  store.createFollowup.mockImplementation(async (values: Record<string, unknown>) => ({ id: 8, ...values }));
  store.getFollowupById.mockResolvedValue({ id: 8, siteId: site.id, createdBy: 10 });
  store.updateFollowup.mockResolvedValue({ id: 8, siteId: site.id, status: "completed" });
});

describe("próximos relevamientos", () => {
  it("agenda un relevamiento con descripción, fecha y el usuario que lo registra", async () => {
    const caller = followupsRouter.createCaller(contextFor(10));

    const result = await caller.create({
      siteId: site.id,
      description: "  Revisar respuesta al fertilizante y preparar visita. ",
      scheduledFor: "2026-09-15",
    });

    expect(store.createFollowup).toHaveBeenCalledWith(
      expect.objectContaining({
        siteId: site.id,
        createdBy: 10,
        description: "Revisar respuesta al fertilizante y preparar visita.",
        status: "pending",
        scheduledFor: expect.any(Date),
      })
    );
    expect(result).toMatchObject({ id: 8, siteId: site.id, status: "pending" });
  });

  it("limita la agenda general del vendedor a los clientes de su cartera", async () => {
    const caller = followupsRouter.createCaller(contextFor(10));

    await caller.list({ limit: 12 });

    expect(store.listFollowups).toHaveBeenCalledWith({
      siteId: undefined,
      siteIds: [site.id],
      status: "pending",
      limit: 12,
    });
  });

  it("bloquea a un vendedor no asignado antes de agendar un relevamiento", async () => {
    store.isUserAssignedToSite.mockResolvedValue(false);
    const caller = followupsRouter.createCaller(contextFor(10));

    await expect(
      caller.create({ siteId: site.id, description: "Visita no autorizada", scheduledFor: "2026-09-15" })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(store.createFollowup).not.toHaveBeenCalled();
  });

  it("marca un relevamiento como realizado con fecha de cierre", async () => {
    const caller = followupsRouter.createCaller(contextFor(10));

    await caller.update({ id: 8, status: "completed" });

    expect(store.updateFollowup).toHaveBeenCalledWith(
      8,
      expect.objectContaining({ status: "completed", completedAt: expect.any(Date) })
    );
  });
});
