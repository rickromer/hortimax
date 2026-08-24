import { and, asc, desc, eq, gte, inArray, like, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  catalogs,
  checkins,
  InsertCatalog,
  InsertCheckin,
  InsertNote,
  InsertSite,
  InsertUser,
  notes,
  siteAssignments,
  sites,
  users,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

async function requireDb() {
  const db = await getDb();
  if (!db) throw new Error("Base de datos no disponible");
  return db;
}

/* ------------------------------- Usuarios ------------------------------- */

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserByUsername(username: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(users)
    .where(eq(users.username, username))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function listUsers() {
  const db = await requireDb();
  return db.select().from(users).orderBy(asc(users.name));
}

export async function createAppUser(values: InsertUser) {
  const db = await requireDb();
  await db.insert(users).values(values);
  if (!values.username) throw new Error("username requerido");
  return getUserByUsername(values.username);
}

export async function updateUser(id: number, values: Partial<InsertUser>) {
  const db = await requireDb();
  await db.update(users).set(values).where(eq(users.id, id));
  return getUserById(id);
}

export async function countUsers() {
  const db = await getDb();
  if (!db) return 0;
  const rows = await db.select({ total: sql<number>`count(*)` }).from(users);
  return Number(rows[0]?.total ?? 0);
}

/* -------------------------------- Sitios -------------------------------- */

export type SiteFilters = {
  search?: string;
  zone?: string;
  clientType?: string;
  createdBy?: number;
  siteIds?: number[];
  onlyActive?: boolean;
};

function siteConditions(filters: SiteFilters) {
  const conditions = [] as any[];
  if (filters.onlyActive !== false) conditions.push(eq(sites.active, true));
  if (filters.createdBy) conditions.push(eq(sites.createdBy, filters.createdBy));
  if (filters.siteIds) {
    conditions.push(
      filters.siteIds.length ? inArray(sites.id, filters.siteIds) : eq(sites.id, -1)
    );
  }
  if (filters.zone) conditions.push(eq(sites.zone, filters.zone));
  if (filters.clientType) conditions.push(eq(sites.clientType, filters.clientType));
  if (filters.search) {
    const term = `%${filters.search}%`;
    conditions.push(
      or(
        like(sites.name, term),
        like(sites.description, term),
        like(sites.contactName, term),
        like(sites.clientType, term),
        like(sites.zone, term)
      )
    );
  }
  return conditions.length ? and(...conditions) : undefined;
}

export async function listSites(filters: SiteFilters = {}) {
  const db = await requireDb();
  const rows = await db
    .select({
      site: sites,
      ownerName: users.name,
      ownerUsername: users.username,
    })
    .from(sites)
    .leftJoin(users, eq(users.id, sites.createdBy))
    .where(siteConditions(filters))
    .orderBy(desc(sites.updatedAt));

  return rows.map(row => ({
    ...row.site,
    latitude: Number(row.site.latitude),
    longitude: Number(row.site.longitude),
    ownerName: row.ownerName,
    ownerUsername: row.ownerUsername,
  }));
}

export async function getSiteById(id: number) {
  const db = await requireDb();
  const rows = await db
    .select({ site: sites, ownerName: users.name, ownerUsername: users.username })
    .from(sites)
    .leftJoin(users, eq(users.id, sites.createdBy))
    .where(eq(sites.id, id))
    .limit(1);
  if (!rows.length) return undefined;
  return {
    ...rows[0].site,
    latitude: Number(rows[0].site.latitude),
    longitude: Number(rows[0].site.longitude),
    ownerName: rows[0].ownerName,
    ownerUsername: rows[0].ownerUsername,
  };
}

export async function createSite(values: InsertSite) {
  const db = await requireDb();
  const result = await db.insert(sites).values(values);
  const insertId = Number((result as any).insertId ?? (result as any)[0]?.insertId);
  return getSiteById(insertId);
}

export async function updateSite(id: number, values: Partial<InsertSite>) {
  const db = await requireDb();
  await db.update(sites).set(values).where(eq(sites.id, id));
  return getSiteById(id);
}

export async function countSites(filters: SiteFilters = {}) {
  const db = await getDb();
  if (!db) return 0;
  const rows = await db
    .select({ total: sql<number>`count(*)` })
    .from(sites)
    .where(siteConditions(filters));
  return Number(rows[0]?.total ?? 0);
}

/* -------------------------- Asignación de cartera ------------------------- */

export async function listSiteAssignments(options: { siteId?: number; userId?: number } = {}) {
  const database = await requireDb();
  const conditions = [] as any[];
  if (options.siteId) conditions.push(eq(siteAssignments.siteId, options.siteId));
  if (options.userId) conditions.push(eq(siteAssignments.userId, options.userId));
  return database
    .select()
    .from(siteAssignments)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(siteAssignments.assignedAt));
}

export async function getAssignedSiteIds(userId: number) {
  const assignments = await listSiteAssignments({ userId });
  return assignments.map(assignment => assignment.siteId);
}

export async function isUserAssignedToSite(siteId: number, userId: number) {
  const database = await requireDb();
  const rows = await database
    .select({ siteId: siteAssignments.siteId })
    .from(siteAssignments)
    .where(and(eq(siteAssignments.siteId, siteId), eq(siteAssignments.userId, userId)))
    .limit(1);
  return rows.length > 0;
}

export async function listSiteAssignees(siteId: number) {
  const database = await requireDb();
  return database
    .select({
      id: users.id,
      name: users.name,
      username: users.username,
      zone: users.zone,
      active: users.active,
      assignedAt: siteAssignments.assignedAt,
    })
    .from(siteAssignments)
    .innerJoin(users, eq(users.id, siteAssignments.userId))
    .where(eq(siteAssignments.siteId, siteId))
    .orderBy(asc(users.name));
}

export async function replaceSiteAssignments(siteId: number, userIds: number[], assignedBy: number) {
  const database = await requireDb();
  const uniqueUserIds = Array.from(new Set(userIds));
  await database.transaction(async tx => {
    await tx.delete(siteAssignments).where(eq(siteAssignments.siteId, siteId));
    if (uniqueUserIds.length) {
      await tx.insert(siteAssignments).values(
        uniqueUserIds.map(userId => ({ siteId, userId, assignedBy }))
      );
    }
  });
  return listSiteAssignees(siteId);
}

/* ------------------------------- Check-ins ------------------------------ */

export async function createCheckin(values: InsertCheckin) {
  const db = await requireDb();
  const result = await db.insert(checkins).values(values);
  const insertId = Number((result as any).insertId ?? (result as any)[0]?.insertId);
  const rows = await db.select().from(checkins).where(eq(checkins.id, insertId)).limit(1);
  return rows[0];
}

export async function listCheckins(options: {
  siteId?: number;
  siteIds?: number[];
  userId?: number;
  since?: Date;
  limit?: number;
} = {}) {
  const db = await requireDb();
  const conditions = [] as any[];
  if (options.siteId) conditions.push(eq(checkins.siteId, options.siteId));
  if (options.siteIds) {
    conditions.push(
      options.siteIds.length ? inArray(checkins.siteId, options.siteIds) : eq(checkins.siteId, -1)
    );
  }
  if (options.userId) conditions.push(eq(checkins.userId, options.userId));
  if (options.since) conditions.push(gte(checkins.createdAt, options.since));

  const rows = await db
    .select({
      checkin: checkins,
      siteName: sites.name,
      siteZone: sites.zone,
      userName: users.name,
      username: users.username,
    })
    .from(checkins)
    .leftJoin(sites, eq(sites.id, checkins.siteId))
    .leftJoin(users, eq(users.id, checkins.userId))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(checkins.createdAt))
    .limit(options.limit ?? 200);

  return rows.map(row => ({
    ...row.checkin,
    latitude: row.checkin.latitude === null ? null : Number(row.checkin.latitude),
    longitude: row.checkin.longitude === null ? null : Number(row.checkin.longitude),
    siteName: row.siteName,
    siteZone: row.siteZone,
    userName: row.userName,
    username: row.username,
  }));
}

export async function countCheckins(options: { since?: Date; userId?: number } = {}) {
  const db = await getDb();
  if (!db) return 0;
  const conditions = [] as any[];
  if (options.since) conditions.push(gte(checkins.createdAt, options.since));
  if (options.userId) conditions.push(eq(checkins.userId, options.userId));
  const rows = await db
    .select({ total: sql<number>`count(*)` })
    .from(checkins)
    .where(conditions.length ? and(...conditions) : undefined);
  return Number(rows[0]?.total ?? 0);
}

export async function lastCheckinBySite(siteIds: number[]) {
  const db = await getDb();
  if (!db || siteIds.length === 0) return new Map<number, Date>();
  const rows = await db
    .select({ siteId: checkins.siteId, last: sql<string>`max(${checkins.createdAt})` })
    .from(checkins)
    .where(inArray(checkins.siteId, siteIds))
    .groupBy(checkins.siteId);
  const map = new Map<number, Date>();
  rows.forEach(row => {
    if (row.last) map.set(row.siteId, new Date(row.last));
  });
  return map;
}

/* --------------------------------- Notas -------------------------------- */

export async function createNote(values: InsertNote) {
  const db = await requireDb();
  const result = await db.insert(notes).values(values);
  const insertId = Number((result as any).insertId ?? (result as any)[0]?.insertId);
  const rows = await db.select().from(notes).where(eq(notes.id, insertId)).limit(1);
  return rows[0];
}

export async function updateNote(id: number, values: Partial<InsertNote>) {
  const db = await requireDb();
  await db.update(notes).set(values).where(eq(notes.id, id));
  const rows = await db.select().from(notes).where(eq(notes.id, id)).limit(1);
  return rows[0];
}

export async function deleteNote(id: number) {
  const db = await requireDb();
  await db.delete(notes).where(eq(notes.id, id));
}

export async function getNoteById(id: number) {
  const db = await requireDb();
  const rows = await db.select().from(notes).where(eq(notes.id, id)).limit(1);
  return rows[0];
}

export async function listNotes(options: {
  siteId?: number;
  siteIds?: number[];
  userId?: number;
  search?: string;
  limit?: number;
} = {}) {
  const db = await requireDb();
  const conditions = [] as any[];
  if (options.siteId) conditions.push(eq(notes.siteId, options.siteId));
  if (options.siteIds) {
    conditions.push(options.siteIds.length ? inArray(notes.siteId, options.siteIds) : eq(notes.siteId, -1));
  }
  if (options.userId) conditions.push(eq(notes.userId, options.userId));
  if (options.search) conditions.push(like(notes.content, `%${options.search}%`));

  const rows = await db
    .select({
      note: notes,
      siteName: sites.name,
      siteZone: sites.zone,
      userName: users.name,
      username: users.username,
    })
    .from(notes)
    .leftJoin(sites, eq(sites.id, notes.siteId))
    .leftJoin(users, eq(users.id, notes.userId))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(notes.createdAt))
    .limit(options.limit ?? 300);

  return rows.map(row => ({
    ...row.note,
    siteName: row.siteName,
    siteZone: row.siteZone,
    userName: row.userName,
    username: row.username,
  }));
}

export async function countNotes(options: { since?: Date; userId?: number } = {}) {
  const db = await getDb();
  if (!db) return 0;
  const conditions = [] as any[];
  if (options.since) conditions.push(gte(notes.createdAt, options.since));
  if (options.userId) conditions.push(eq(notes.userId, options.userId));
  const rows = await db
    .select({ total: sql<number>`count(*)` })
    .from(notes)
    .where(conditions.length ? and(...conditions) : undefined);
  return Number(rows[0]?.total ?? 0);
}

/* ------------------------------- Catálogos ------------------------------ */

export async function listCatalog(kind: "zone" | "clientType" | "noteCategory") {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(catalogs)
    .where(eq(catalogs.kind, kind))
    .orderBy(asc(catalogs.sortOrder), asc(catalogs.value));
}

export async function addCatalogValues(values: InsertCatalog[]) {
  if (!values.length) return;
  const db = await requireDb();
  await db.insert(catalogs).values(values);
}

export async function deleteCatalogValue(id: number) {
  const db = await requireDb();
  await db.delete(catalogs).where(eq(catalogs.id, id));
}

export async function countCatalog() {
  const db = await getDb();
  if (!db) return 0;
  const rows = await db.select({ total: sql<number>`count(*)` }).from(catalogs);
  return Number(rows[0]?.total ?? 0);
}
