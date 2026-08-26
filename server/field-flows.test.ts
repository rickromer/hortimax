import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const store = vi.hoisted(() => ({
  listSites: vi.fn(), lastCheckinBySite: vi.fn(), getSiteById: vi.fn(), listSiteAssignees: vi.fn(),
  replaceSiteAssignments: vi.fn(), createSite: vi.fn(), updateSite: vi.fn(), listCheckins: vi.fn(),
  createCheckin: vi.fn(), listNotes: vi.fn(), listFollowups: vi.fn(), createNote: vi.fn(),
  getNoteById: vi.fn(), updateNote: vi.fn(), deleteNote: vi.fn(), getAssignedSiteIds: vi.fn(),
}));
vi.mock("./db", () => store);
vi.mock("./territory", () => ({
  territoryFromCoordinates: vi.fn().mockResolvedValue({ department: "Caaguazú", zone: "R. I. Tres Corrales" }),
}));

import { notesRouter } from "./routers/notes";
import { sitesRouter } from "./routers/sites";

const ownSite = { id: 31, name: "Estancia San Rafael", latitude: -25.2637, longitude: -57.5759, createdBy: 10, clientType: "Productor", department: "Central", zone: "Central" };
const foreignSite = { ...ownSite, id: 32, createdBy: 20 };

function contextFor(userId: number, role: "field" | "manager" | "admin" = "field") {
  return { user: { id: userId, role }, req: {} as TrpcContext["req"], res: {} as TrpcContext["res"] } as TrpcContext;
}
function anonymousContext() { return { user: null, req: {} as TrpcContext["req"], res: {} as TrpcContext["res"] } as TrpcContext; }

beforeEach(() => {
  vi.clearAllMocks();
  store.listSites.mockResolvedValue([]);
  store.lastCheckinBySite.mockResolvedValue(new Map());
  store.getSiteById.mockResolvedValue(ownSite);
  store.listSiteAssignees.mockResolvedValue([]);
  store.replaceSiteAssignments.mockResolvedValue([]);
  store.createSite.mockImplementation(async (values: Record<string, unknown>) => ({ id: 77, ...values }));
  store.updateSite.mockResolvedValue(ownSite);
  store.createCheckin.mockResolvedValue({ id: 91, siteId: ownSite.id, userId: 10 });
  store.createNote.mockImplementation(async (values: Record<string, unknown>) => ({ id: 92, ...values }));
  store.listCheckins.mockResolvedValue([]);
  store.listNotes.mockResolvedValue([]);
  store.listFollowups.mockResolvedValue([]);
});

describe("permisos de clientes", () => {
  it("rechaza consultar puntos sin sesión", async () => {
    await expect(sitesRouter.createCaller(anonymousContext()).list()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("devuelve al representante únicamente su propia cartera y bloquea la ficha ajena", async () => {
    store.listSites.mockResolvedValue([ownSite]);
    store.lastCheckinBySite.mockResolvedValue(new Map([[ownSite.id, null]]));
    const caller = sitesRouter.createCaller(contextFor(10));
    const list = await caller.list({ search: " Rafael " });
    const detail = await caller.detail({ id: ownSite.id });

    expect(store.listSites).toHaveBeenCalledWith(expect.objectContaining({ search: "Rafael", createdBy: 10 }));
    expect(list).toHaveLength(1);
    expect(detail.canEditSite).toBe(true);

    store.getSiteById.mockResolvedValue(foreignSite);
    await expect(caller.detail({ id: foreignSite.id })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("asigna al creador como propietario de un punto nuevo", async () => {
    const caller = sitesRouter.createCaller(contextFor(10));
    await caller.create({ name: " Nuevo cliente ", latitude: -25.263712345, longitude: -57.575912345 });

    expect(store.createSite).toHaveBeenCalledWith(expect.objectContaining({ name: "Nuevo cliente", createdBy: 10, publicSubmission: false }));
    expect(store.replaceSiteAssignments).toHaveBeenCalledWith(77, [10], 10);
  });

  it("rechaza altas anónimas para que todo punto tenga responsable", async () => {
    await expect(
      sitesRouter.createCaller(anonymousContext()).create({ name: " Punto público ", latitude: -25.2, longitude: -57.5 })
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    expect(store.createSite).not.toHaveBeenCalled();
    expect(store.replaceSiteAssignments).not.toHaveBeenCalled();
  });

  it("bloquea al representante al editar o registrar visita en un punto ajeno", async () => {
    store.getSiteById.mockResolvedValue(foreignSite);
    const caller = sitesRouter.createCaller(contextFor(10));

    await expect(caller.update({ id: foreignSite.id, name: "Cambio" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.checkin({ siteId: foreignSite.id })).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(store.updateSite).not.toHaveBeenCalled();
    expect(store.createCheckin).not.toHaveBeenCalled();
  });

  it("permite al representante archivar únicamente el punto que él registró", async () => {
    store.getSiteById.mockResolvedValue(ownSite);
    await expect(sitesRouter.createCaller(contextFor(10)).archive({ id: ownSite.id })).resolves.toMatchObject({ success: true });
    expect(store.updateSite).toHaveBeenCalledWith(ownSite.id, { active: false });

    store.getSiteById.mockResolvedValue(foreignSite);
    await expect(sitesRouter.createCaller(contextFor(10)).archive({ id: foreignSite.id })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("rechaza editar datos básicos sin sesión", async () => {
    store.getSiteById.mockResolvedValue(foreignSite);
    await expect(
      sitesRouter.createCaller(anonymousContext()).update({ id: foreignSite.id, name: "Cliente actualizado" })
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    expect(store.updateSite).not.toHaveBeenCalled();
  });

  it("permite a gerente comercial editar cualquier cliente", async () => {
    store.getSiteById.mockResolvedValue(foreignSite);
    await sitesRouter.createCaller(contextFor(40, "manager")).update({ id: foreignSite.id, name: "Cliente corregido" });
    expect(store.updateSite).toHaveBeenCalledWith(foreignSite.id, expect.objectContaining({
      name: "Cliente corregido", department: "Caaguazú", zone: "R. I. Tres Corrales",
    }));
  });

  it("mantiene la cartera completa disponible para gerente comercial", async () => {
    store.listSites.mockResolvedValue([ownSite, foreignSite]);
    const list = await sitesRouter.createCaller(contextFor(40, "manager")).list();
    expect(store.listSites).toHaveBeenCalledWith({
      search: undefined,
      department: undefined,
      zone: undefined,
      clientType: undefined,
    });
    expect(list).toHaveLength(2);
  });
});

describe("notas por cliente", () => {
  it("rechaza notas sin sesión y conserva la actividad autenticada", async () => {
    const anonymous = notesRouter.createCaller(anonymousContext());
    await expect(anonymous.create({ siteId: ownSite.id, content: "Nota pública" })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    expect(store.createNote).not.toHaveBeenCalled();

    const result = await notesRouter.createCaller(contextFor(10)).create({
      siteId: ownSite.id, category: " Visita técnica ", content: " Cliente solicitó seguimiento. ", registerVisit: true,
    });
    expect(store.createCheckin).toHaveBeenCalledWith(expect.objectContaining({ siteId: ownSite.id, userId: 10 }));
    expect(store.createNote).toHaveBeenCalledWith(expect.objectContaining({ siteId: ownSite.id, userId: 10, category: "Visita técnica" }));
    expect(result.registeredVisit).toBe(true);
  });

  it("permite al gerente registrar actividad en cualquier cliente", async () => {
    store.getSiteById.mockResolvedValue(foreignSite);
    await notesRouter.createCaller(contextFor(40, "manager")).create({ siteId: foreignSite.id, content: "Visita de gerencia" });
    expect(store.createNote).toHaveBeenCalledWith(expect.objectContaining({ siteId: foreignSite.id, userId: 40 }));
  });
});
