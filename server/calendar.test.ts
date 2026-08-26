import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const store = vi.hoisted(() => ({
  listSites: vi.fn(),
  listCheckins: vi.fn(),
  listFollowups: vi.fn(),
  listNotes: vi.fn(),
}));

vi.mock("./db", () => store);

import { calendarRouter } from "./routers/calendar";

describe("calendar.timeline", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    store.listSites.mockResolvedValue([{ id: 2 }]);
    store.listCheckins.mockResolvedValue([
      {
        id: 7,
        siteId: 2,
        siteName: "Cooperativa RI3",
        siteDepartment: "Caaguazú",
        siteZone: "R. I. Tres Corrales",
        userName: "Ricardo Romero",
        username: "rr",
        comment: "Visita técnica",
        distanceMeters: 8,
        createdAt: new Date("2026-08-25T10:00:00Z"),
      },
    ]);
    store.listFollowups.mockResolvedValue([
      {
        id: 8,
        siteId: 2,
        siteName: "Cooperativa RI3",
        siteDepartment: "Caaguazú",
        siteZone: "R. I. Tres Corrales",
        userName: "Ricardo Romero",
        username: "rr",
        description: "Próximo relevamiento",
        type: "visit",
        scheduledFor: new Date("2026-08-27T09:00:00Z"),
      },
    ]);
    store.listNotes.mockResolvedValue([
      {
        id: 9,
        siteId: 2,
        siteName: "Cooperativa RI3",
        siteDepartment: "Caaguazú",
        siteZone: "R. I. Tres Corrales",
        userName: "Ricardo Romero",
        username: "rr",
        content: "Se revisó el cultivo",
        category: "Visita técnica",
        checkinId: null,
        createdAt: new Date("2026-08-26T10:00:00Z"),
      },
    ]);
  });

  it("expone al representante solo la actividad de sus propios clientes en orden cronológico", async () => {
    const caller = calendarRouter.createCaller({
      user: { id: 10, role: "field" },
      req: {} as TrpcContext["req"],
      res: {} as TrpcContext["res"],
    } as TrpcContext);

    const result = await caller.timeline();

    expect(store.listSites).toHaveBeenCalledWith({ createdBy: 10 });
    expect(store.listCheckins).toHaveBeenCalledWith({ siteIds: [2], limit: 1000 });
    expect(store.listFollowups).toHaveBeenCalledWith({ siteIds: [2], status: "pending", limit: 1000 });
    expect(store.listNotes).toHaveBeenCalledWith({ siteIds: [2], limit: 1000 });
    expect(result.entries.map(entry => entry.kind)).toEqual(["upcoming", "note", "visit"]);
    expect(result.entries[0]).toMatchObject({ siteName: "Cooperativa RI3", department: "Caaguazú" });
    expect(result.entries[0].author).toBe("Ricardo Romero");
  });

  it("marca explícitamente la actividad histórica que no conserva responsable", async () => {
    store.listNotes.mockResolvedValue([{ id: 10, siteId: 2, siteName: "Histórico", userName: null, username: null, content: "Carga anterior", createdAt: new Date("2026-08-26T10:00:00Z") }]);
    const caller = calendarRouter.createCaller({ user: { id: 10, role: "field" }, req: {} as TrpcContext["req"], res: {} as TrpcContext["res"] } as TrpcContext);
    const result = await caller.timeline();
    expect(result.entries.find(entry => entry.kind === "note")?.author).toBeNull();
  });

  it("conserva el historial global para gerente comercial", async () => {
    const caller = calendarRouter.createCaller({ user: { id: 40, role: "manager" }, req: {} as TrpcContext["req"], res: {} as TrpcContext["res"] } as TrpcContext);
    await caller.timeline();
    expect(store.listSites).not.toHaveBeenCalled();
    expect(store.listCheckins).toHaveBeenCalledWith({ siteIds: undefined, limit: 1000 });
  });
});
