import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { checkins, followups, notes, siteArchiveEvents, siteAssignments, sites, users } from "../drizzle/schema";
import type { TrpcContext } from "./_core/context";
import * as db from "./db";
import { adminRouter } from "./routers/admin";
import { followupsRouter } from "./routers/followups";
import { notesRouter } from "./routers/notes";
import { sitesRouter } from "./routers/sites";

const runDatabaseIntegration = process.env.RUN_DB_INTEGRATION === "1";
const test = runDatabaseIntegration ? it : it.skip;

function contextFor(user: { id: number; role: "field" | "manager" | "admin" }) {
  return {
    user,
    req: {} as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  } as TrpcContext;
}

async function cleanDatabase() {
  const database = await db.getDb();
  if (!database) throw new Error("La base de pruebas no está disponible");
  await database.delete(siteAssignments);
  await database.delete(followups);
  await database.delete(notes);
  await database.delete(checkins);
  await database.delete(siteArchiveEvents);
  await database.delete(sites);
  await database.delete(users);
}

describe("integración de campo con MariaDB aislado", () => {
  beforeAll(async () => {
    if (!runDatabaseIntegration) return;
    if (!process.env.DATABASE_URL?.includes("mapa_clientes_test")) {
      throw new Error("Las pruebas reales requieren una base aislada llamada mapa_clientes_test");
    }
    await cleanDatabase();
  });

  afterEach(async () => {
    if (runDatabaseIntegration) await cleanDatabase();
  });

  test("crea sitio, check-in y nota; los lee en el detalle y aplica permisos", async () => {
    const suffix = `${Date.now()}_${Math.floor(Math.random() * 100000)}`;
    const seller = await db.createAppUser({
      openId: `seller_${suffix}`,
      username: `seller${suffix}`.slice(0, 60),
      name: "Vendedor de prueba",
      loginMethod: "password",
      role: "field",
      mustChangePassword: false,
      active: true,
    });
    const otherSeller = await db.createAppUser({
      openId: `other_${suffix}`,
      username: `other${suffix}`.slice(0, 60),
      name: "Otro vendedor",
      loginMethod: "password",
      role: "field",
      mustChangePassword: false,
      active: true,
    });
    const admin = await db.createAppUser({
      openId: `admin_${suffix}`,
      username: `admin${suffix}`.slice(0, 60),
      name: "Administrador de prueba",
      loginMethod: "password",
      role: "admin",
      mustChangePassword: false,
      active: true,
    });
    if (!seller || !otherSeller || !admin) throw new Error("No se pudieron crear usuarios de prueba");

    const sellerCaller = sitesRouter.createCaller(contextFor({ id: seller.id, role: "field" }));
    const created = await sellerCaller.create({
      name: "Estancia de integración",
      clientType: "Productor",
      zone: "Central",
      description: "Lote de prueba para flujo de campo",
      latitude: -25.2637123,
      longitude: -57.5759123,
      accuracy: 7,
    });

    expect(created).toMatchObject({
      name: "Estancia de integración",
      clientType: "Productor",
      zone: "Central",
      createdBy: seller.id,
    });
    expect(await db.isUserAssignedToSite(created!.id, seller.id)).toBe(true);

    const anonymousCaller = sitesRouter.createCaller({
      user: null,
      req: {} as TrpcContext["req"],
      res: {} as TrpcContext["res"],
    } as TrpcContext);
    await expect(
      anonymousCaller.create({ name: "Punto sin responsable", latitude: -25.27, longitude: -57.59 })
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });

    const result = await sellerCaller.checkin({
      siteId: created!.id,
      latitude: -25.2638,
      longitude: -57.576,
      comment: "Visita técnica",
      note: "Aplicación de fertilizante foliar 10 AM",
      noteCategory: "Aplicación",
    });

    expect(result.checkin.siteId).toBe(created!.id);
    expect(result.checkin.userId).toBe(seller.id);
    expect(result.note).toMatchObject({
      siteId: created!.id,
      userId: seller.id,
      category: "Aplicación",
      content: "Aplicación de fertilizante foliar 10 AM",
    });

    const detail = await sellerCaller.detail({ id: created!.id });
    expect(detail.checkins).toHaveLength(1);
    expect(detail.notes).toHaveLength(1);
    expect(detail.notes[0]?.checkinId).toBe(result.checkin.id);

    const noteCaller = notesRouter.createCaller(contextFor({ id: seller.id, role: "field" }));
    const board = await noteCaller.list({ search: "fertilizante" });
    expect(board).toHaveLength(1);
    expect(board[0]?.siteName).toBe("Estancia de integración");

    const followupCaller = followupsRouter.createCaller(contextFor({ id: seller.id, role: "field" }));
    const followup = await followupCaller.create({
      siteId: created!.id,
      description: "Revisar la respuesta al fertilizante en siete días",
      scheduledFor: "2026-09-15",
    });
    expect(followup).toMatchObject({
      siteId: created!.id,
      createdBy: seller.id,
      type: "reminder",
      status: "pending",
    });

    const detailWithAgenda = await sellerCaller.detail({ id: created!.id });
    expect(detailWithAgenda.followups).toHaveLength(1);
    expect(detailWithAgenda.followups[0]?.description).toContain("fertilizante");

    const otherCaller = sitesRouter.createCaller(contextFor({ id: otherSeller.id, role: "field" }));
    await expect(otherCaller.update({ id: created!.id, name: "No permitido" })).rejects.toMatchObject({ code: "FORBIDDEN" });

    const adminCaller = adminRouter.createCaller(contextFor({ id: admin.id, role: "admin" }));
    await adminCaller.setSiteAssignments({ siteId: created!.id, userIds: [otherSeller.id] });

    await adminCaller.archiveClient({ id: created!.id, reason: "Prueba de conservación" });
    expect(await db.getSiteById(created!.id)).toMatchObject({ id: created!.id, active: false });
    expect(await db.listCheckins({ siteId: created!.id })).toHaveLength(1);
    expect(await db.listNotes({ siteId: created!.id })).toHaveLength(1);
    expect(await db.listFollowups({ siteId: created!.id })).toHaveLength(1);

    await adminCaller.restoreClient({ id: created!.id });
    expect(await db.getSiteById(created!.id)).toMatchObject({ id: created!.id, active: true });
    await expect(otherCaller.detail({ id: created!.id })).resolves.toMatchObject({ site: { id: created!.id } });
  });
});
