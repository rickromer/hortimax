import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const store = vi.hoisted(() => ({
  listCheckins: vi.fn(),
  listFollowups: vi.fn(),
  listNotes: vi.fn(),
}));

vi.mock("./db", () => store);

import { calendarRouter } from "./routers/calendar";

describe("calendar.timeline", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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

  it("expone a un usuario autenticado las visitas, próximos y notas de todo el equipo en orden cronológico", async () => {
    const caller = calendarRouter.createCaller({
      user: { id: 10, role: "field" },
      req: {} as TrpcContext["req"],
      res: {} as TrpcContext["res"],
    } as TrpcContext);

    const result = await caller.timeline();

    expect(store.listCheckins).toHaveBeenCalledWith({ limit: 1000 });
    expect(store.listFollowups).toHaveBeenCalledWith({ status: "pending", limit: 1000 });
    expect(store.listNotes).toHaveBeenCalledWith({ limit: 1000 });
    expect(result.entries.map(entry => entry.kind)).toEqual(["upcoming", "note", "visit"]);
    expect(result.entries[0]).toMatchObject({ siteName: "Cooperativa RI3", department: "Caaguazú" });
  });

  it("rechaza el calendario del equipo sin sesión", async () => {
    const caller = calendarRouter.createCaller({
      user: null,
      req: {} as TrpcContext["req"],
      res: {} as TrpcContext["res"],
    } as TrpcContext);
    await expect(caller.timeline()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});
