import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const store = vi.hoisted(() => ({
  listSites: vi.fn(),
  getAssignedSiteIds: vi.fn(),
  lastCheckinBySite: vi.fn(),
  getSiteById: vi.fn(),
  isUserAssignedToSite: vi.fn(),
  listSiteAssignees: vi.fn(),
  replaceSiteAssignments: vi.fn(),
  createSite: vi.fn(),
  updateSite: vi.fn(),
  listCheckins: vi.fn(),
  createCheckin: vi.fn(),
  listNotes: vi.fn(),
  listFollowups: vi.fn(),
  createNote: vi.fn(),
  getNoteById: vi.fn(),
  updateNote: vi.fn(),
  deleteNote: vi.fn(),
}));

vi.mock("./db", () => store);

import { notesRouter } from "./routers/notes";
import { sitesRouter } from "./routers/sites";

const ownSite = {
  id: 31,
  name: "Estancia San Rafael",
  latitude: -25.2637,
  longitude: -57.5759,
  createdBy: 10,
  clientType: "Productor",
  zone: "Central",
};

function contextFor(userId: number, role: "user" | "admin" = "user") {
  return {
    user: { id: userId, role },
    req: {} as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  } as TrpcContext;
}

beforeEach(() => {
  vi.clearAllMocks();
  store.listSites.mockResolvedValue([]);
  store.getAssignedSiteIds.mockResolvedValue([ownSite.id]);
  store.lastCheckinBySite.mockResolvedValue(new Map());
  store.getSiteById.mockResolvedValue(ownSite);
  store.isUserAssignedToSite.mockResolvedValue(true);
  store.listSiteAssignees.mockResolvedValue([]);
  store.replaceSiteAssignments.mockResolvedValue([]);
  store.createSite.mockImplementation(async (values: Record<string, unknown>) => ({ id: 77, ...values }));
  store.createCheckin.mockResolvedValue({ id: 91, siteId: ownSite.id, userId: 10 });
  store.createNote.mockImplementation(async (values: Record<string, unknown>) => ({ id: 92, ...values }));
  store.listCheckins.mockResolvedValue([]);
  store.listNotes.mockResolvedValue([]);
  store.listFollowups.mockResolvedValue([]);
});

describe("flujos de sitio del vendedor", () => {
  it("permite consulta pública de puntos sin sesión, sin aplicar un filtro de cartera", async () => {
    store.listSites.mockResolvedValue([ownSite]);
    store.lastCheckinBySite.mockResolvedValue(new Map());
    const caller = sitesRouter.createCaller({
      user: null,
      req: {} as TrpcContext["req"],
      res: {} as TrpcContext["res"],
    } as TrpcContext);

    const result = await caller.list({ search: " Rafael " });

    expect(store.listSites).toHaveBeenCalledWith({ search: "Rafael" });
    expect(result).toEqual([{ ...ownSite, lastCheckinAt: null }]);
  });

  it("permite ver detalle, notas y agenda del cliente sin sesión", async () => {
    const caller = sitesRouter.createCaller({
      user: null,
      req: {} as TrpcContext["req"],
      res: {} as TrpcContext["res"],
    } as TrpcContext);

    const detail = await caller.detail({ id: ownSite.id });

    expect(detail).toMatchObject({ site: ownSite, notes: [], followups: [] });
    expect(store.isUserAssignedToSite).not.toHaveBeenCalled();
  });

  it("permite crear puntos públicos y los identifica para limpieza posterior", async () => {
    const caller = sitesRouter.createCaller({
      user: null,
      req: {} as TrpcContext["req"],
      res: {} as TrpcContext["res"],
    } as TrpcContext);

    await caller.create({ name: "Punto público", latitude: -25.3, longitude: -57.6 });

    expect(store.createSite).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Punto público",
        createdBy: 0,
        publicSubmission: true,
      })
    );
    expect(store.replaceSiteAssignments).not.toHaveBeenCalled();
  });

  it("limita el listado a los sitios del vendedor y adjunta la última visita", async () => {
    const site = { ...ownSite, id: 44 };
    const lastVisit = new Date("2026-08-22T13:00:00Z");
    store.listSites.mockResolvedValue([site]);
    store.getAssignedSiteIds.mockResolvedValue([site.id]);
    store.lastCheckinBySite.mockResolvedValue(new Map([[44, lastVisit]]));

    const caller = sitesRouter.createCaller(contextFor(10));
    const result = await caller.list({ search: "  Rafael  " });

    expect(store.listSites).toHaveBeenCalledWith({ search: "Rafael", siteIds: [site.id] });
    expect(result).toEqual([{ ...site, lastCheckinAt: lastVisit }]);
  });

  it("registra un sitio con coordenadas GPS redondeadas y datos normalizados", async () => {
    const caller = sitesRouter.createCaller(contextFor(10));

    const created = await caller.create({
      name: "  Estancia San Rafael  ",
      clientType: "  Productor  ",
      zone: "  Central ",
      description: "  Soja y maíz  ",
      latitude: -25.263712345,
      longitude: -57.575912345,
      accuracy: 8,
    });

    expect(store.createSite).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Estancia San Rafael",
        clientType: "Productor",
        zone: "Central",
        description: "Soja y maíz",
        latitude: "-25.2637123",
        longitude: "-57.5759123",
        accuracy: 8,
        createdBy: 10,
      })
    );
    expect(created).toMatchObject({ id: 77, name: "Estancia San Rafael" });
    expect(store.replaceSiteAssignments).toHaveBeenCalledWith(77, [10], 10);
  });

  it("crea un check-in con GPS y genera la nota opcional vinculada", async () => {
    const caller = sitesRouter.createCaller(contextFor(10));

    const result = await caller.checkin({
      siteId: ownSite.id,
      latitude: -25.2641,
      longitude: -57.5762,
      comment: "  Visita técnica  ",
      note: "  Aplicación de fertilizante foliar 10 AM  ",
      noteCategory: "  Aplicación  ",
    });

    expect(store.createCheckin).toHaveBeenCalledWith(
      expect.objectContaining({
        siteId: ownSite.id,
        userId: 10,
        latitude: "-25.2641000",
        longitude: "-57.5762000",
        comment: "Visita técnica",
      })
    );
    expect(store.createNote).toHaveBeenCalledWith({
      siteId: ownSite.id,
      userId: 10,
      checkinId: 91,
      category: "Aplicación",
      content: "Aplicación de fertilizante foliar 10 AM",
    });
    expect(result.note).toMatchObject({ checkinId: 91, category: "Aplicación" });
  });

  it("bloquea el check-in de un vendedor en sitios que no le pertenecen", async () => {
    store.isUserAssignedToSite.mockResolvedValue(false);
    const caller = sitesRouter.createCaller(contextFor(10));

    await expect(caller.checkin({ siteId: ownSite.id })).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    expect(store.createCheckin).not.toHaveBeenCalled();
  });
});

describe("planilla de notas", () => {
  it("permite registrar una nota pública con autor de carga temporal", async () => {
    const caller = notesRouter.createCaller({
      user: null,
      req: {} as TrpcContext["req"],
      res: {} as TrpcContext["res"],
    } as TrpcContext);

    await caller.create({
      siteId: ownSite.id,
      content: "Aplicación de fertilizante foliar 10:00",
    });

    expect(store.createNote).toHaveBeenCalledWith({
      siteId: ownSite.id,
      userId: 0,
      checkinId: null,
      category: null,
      content: "Aplicación de fertilizante foliar 10:00",
    });
  });

  it("exporta el historial de notas del cliente en CSV compatible con Sheets", async () => {
    store.listNotes.mockResolvedValue([
      {
        id: 18,
        createdAt: new Date("2026-08-25T13:00:00Z"),
        siteName: ownSite.name,
        siteZone: ownSite.zone,
        category: "Aplicación",
        content: "Aplicación de foliar",
        userName: null,
        username: null,
      },
    ]);
    const caller = notesRouter.createCaller({
      user: null,
      req: {} as TrpcContext["req"],
      res: {} as TrpcContext["res"],
    } as TrpcContext);

    const result = await caller.exportCsv({ siteId: ownSite.id });

    expect(result.filename).toMatch(/^notas-estancia-san-rafael\.csv$/);
    expect(result.csv).toContain("Fecha y hora");
    expect(result.csv).toContain("Aplicación de foliar");
    expect(result.csv).toContain("Carga pública");
  });

  it("guarda una nota manual con categoría y contenido limpio", async () => {
    const caller = notesRouter.createCaller(contextFor(10));

    const note = await caller.create({
      siteId: ownSite.id,
      category: "  Visita comercial ",
      content: "  Cliente solicitó cotización de foliar.  ",
    });

    expect(store.createNote).toHaveBeenCalledWith({
      siteId: ownSite.id,
      userId: 10,
      checkinId: null,
      category: "Visita comercial",
      content: "Cliente solicitó cotización de foliar.",
    });
    expect(note).toMatchObject({ siteId: ownSite.id, userId: 10 });
  });

  it("permite a un administrador consultar la planilla global", async () => {
    store.listNotes.mockResolvedValue([]);
    const caller = notesRouter.createCaller(contextFor(1, "admin"));

    await caller.list({ scope: "all", search: " foliar " });

    expect(store.listNotes).toHaveBeenCalledWith({
      siteId: undefined,
      userId: undefined,
      search: "foliar",
      limit: undefined,
    });
  });
});
