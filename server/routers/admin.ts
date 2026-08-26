import { DEFAULT_CLIENT_TYPES, DEFAULT_NOTE_CATEGORIES, DEFAULT_ZONES } from "@shared/domain";
import { TRPCError } from "@trpc/server";
import { canManageAll } from "@shared/permissions";
import { z } from "zod";
import { adminProcedure, managementProcedure, protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { formatPy, toCsv } from "../csv";
import * as db from "../db";
import { generateActivationCode, hashPassword, normalizeUsername } from "../password";

const catalogKind = z.enum(["zone", "clientType", "noteCategory"]);

export const adminRouter = router({
  /** Métricas del panel principal. */
  stats: managementProcedure.query(async () => {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const [totalSites, totalCheckins, weekCheckins, totalNotes, users] = await Promise.all([
      db.countSites(),
      db.countCheckins(),
      db.countCheckins({ since }),
      db.countNotes(),
      db.listUsers(),
    ]);
    const sites = await db.listSites();
    const byDepartment = new Map<string, number>();
    const byType = new Map<string, number>();
    sites.forEach(site => {
      const department = site.department || "Sin departamento";
      const type = site.clientType || "Sin clasificar";
      byDepartment.set(department, (byDepartment.get(department) ?? 0) + 1);
      byType.set(type, (byType.get(type) ?? 0) + 1);
    });
    return {
      totalSites,
      totalCheckins,
      weekCheckins,
      totalNotes,
      totalSellers: users.filter(u => u.role === "field" && u.active).length,
      byDepartment: Array.from(byDepartment, ([department, count]) => ({ department, count })).sort(
        (a, b) => b.count - a.count
      ),
      byType: Array.from(byType, ([type, count]) => ({ type, count })).sort(
        (a, b) => b.count - a.count
      ),
    };
  }),

  /** Actividad reciente de los vendedores. */
  activity: managementProcedure
    .input(z.object({ limit: z.number().int().min(1).max(200).optional() }).optional())
    .query(async ({ input }) => {
      const limit = input?.limit ?? 40;
      const checkins = await db.listCheckins({ limit });
      return { checkins };
    }),

  /** Archiva las altas públicas temporales sin borrar sus registros relacionados. */
  clearPublicSubmissions: adminProcedure.mutation(async ({ ctx }) => {
    const archived = await db.archivePublicSubmissionSites(ctx.user.id);
    return { archived };
  }),

  /** Envía un cliente a papelera de forma recuperable. */
  archiveClient: managementProcedure
    .input(z.object({ id: z.number().int().positive(), reason: z.string().max(500).optional() }))
    .mutation(async ({ ctx, input }) => {
      const site = await db.getSiteById(input.id);
      if (!site) throw new TRPCError({ code: "NOT_FOUND", message: "Cliente no encontrado" });
      if (!site.active) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "El cliente ya está en papelera" });
      }
      const archived = await db.archiveSite(input.id, ctx.user.id, input.reason);
      return { success: true as const, site: archived };
    }),

  /** Papelera administrativa: clientes archivados, aún con todo su historial preservado. */
  archivedClients: adminProcedure.query(async () => {
    return db.listArchivedSites();
  }),

  restoreClient: adminProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const site = await db.getSiteById(input.id);
      if (!site) throw new TRPCError({ code: "NOT_FOUND", message: "Cliente no encontrado" });
      if (site.active) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "El cliente ya está operativo" });
      }
      const restored = await db.restoreSite(input.id, ctx.user.id);
      return { success: true as const, site: restored };
    }),

  /* ------------------------------ Usuarios ------------------------------ */

  listUsers: managementProcedure.query(async ({ ctx }) => {
    const [users, assignments, checkins] = await Promise.all([
      db.listUsers(),
      db.listSiteAssignments(),
      db.listCheckins({ limit: 1000 }),
    ]);
    return users.map(user => ({
      id: user.id,
      name: user.name,
      username: user.username,
      role: user.role,
      zone: user.zone,
      phone: user.phone,
      active: user.active,
      mustChangePassword: user.mustChangePassword,
      activationCode: ctx.user.role === "admin" ? user.activationCode : null,
      lastSignedIn: user.lastSignedIn,
      createdAt: user.createdAt,
      sitesCount: assignments.filter(assignment => assignment.userId === user.id).length,
      checkinsCount: checkins.filter(c => c.userId === user.id).length,
    }));
  }),

  /** Asigna un cliente a uno o varios vendedores; un arreglo vacío lo deja sin cartera. */
  setSiteAssignments: managementProcedure
    .input(
      z.object({
        siteId: z.number().int().positive(),
        userIds: z.array(z.number().int().positive()).max(200),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const site = await db.getSiteById(input.siteId);
      if (!site) throw new TRPCError({ code: "NOT_FOUND", message: "Sitio no encontrado" });
      const users = await db.listUsers();
      const validSellerIds = new Set(
        users.filter(user => user.role === "field" && user.active).map(user => user.id)
      );
      if (input.userIds.some(userId => !validSellerIds.has(userId))) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Solo se pueden asignar vendedores activos",
        });
      }
      return db.replaceSiteAssignments(site.id, input.userIds, ctx.user.id);
    }),

  createUser: adminProcedure
    .input(
      z.object({
        name: z.string().min(2).max(120),
        username: z.string().min(3).max(64),
        role: z.enum(["field", "manager", "admin"]).default("field"),
        zone: z.string().max(120).optional(),
        phone: z.string().max(40).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const username = normalizeUsername(input.username);
      if (username.length < 3) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Nombre de usuario inválido" });
      }
      if (await db.getUserByUsername(username)) {
        throw new TRPCError({ code: "CONFLICT", message: "Ese nombre de usuario ya existe" });
      }
      const activationCode = generateActivationCode();
      const created = await db.createAppUser({
        openId: `local_${username}_${Date.now().toString(36)}`,
        name: input.name.trim(),
        username,
        role: input.role,
        zone: input.zone?.trim() || null,
        phone: input.phone?.trim() || null,
        loginMethod: "password",
        mustChangePassword: true,
        activationCode,
        active: true,
      });
      if (!created) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "No se pudo crear el usuario" });
      }
      return { id: created.id, username, activationCode };
    }),

  updateUser: adminProcedure
    .input(
      z.object({
        id: z.number().int().positive(),
        name: z.string().min(2).max(120).optional(),
        username: z.string().min(3).max(64).optional(),
        role: z.enum(["field", "manager", "admin"]).optional(),
        zone: z.string().max(120).optional().nullable(),
        phone: z.string().max(40).optional().nullable(),
        active: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (input.id === ctx.user.id && input.active === false) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "No podés desactivar tu propia cuenta" });
      }
      const { id, ...rest } = input;
      const values: Record<string, unknown> = {};
      Object.entries(rest).forEach(([key, value]) => {
        if (value === undefined) return;
        values[key] = typeof value === "string" ? value.trim() || null : value;
      });

      if (input.username !== undefined) {
        const username = normalizeUsername(input.username);
        if (username.length < 3) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Nombre de usuario inválido" });
        }
        const taken = await db.getUserByUsername(username);
        if (taken && taken.id !== id) {
          throw new TRPCError({ code: "CONFLICT", message: "Ese nombre de usuario ya existe" });
        }
        values.username = username;
      }

      await db.updateUser(id, values as any);
      return { success: true } as const;
    }),

  /** Genera un nuevo código de activación para que el usuario defina otra contraseña. */
  resetPassword: adminProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      const activationCode = generateActivationCode();
      await db.updateUser(input.id, {
        passwordHash: null,
        mustChangePassword: true,
        activationCode,
      });
      return { activationCode };
    }),

  /** Asigna una contraseña directamente (opción de respaldo del admin). */
  setPassword: adminProcedure
    .input(z.object({ id: z.number().int().positive(), password: z.string().min(6).max(200) }))
    .mutation(async ({ input }) => {
      await db.updateUser(input.id, {
        passwordHash: await hashPassword(input.password),
        mustChangePassword: false,
        activationCode: null,
      });
      return { success: true } as const;
    }),

  /* ------------------------------ Catálogos ----------------------------- */

  catalog: publicProcedure.query(async () => {
    const [zones, clientTypes, noteCategories] = await Promise.all([
      db.listCatalog("zone"),
      db.listCatalog("clientType"),
      db.listCatalog("noteCategory"),
    ]);
    const mergeDefaults = (existing: string[], defaults: readonly string[]) => [
      ...existing,
      ...defaults.filter(value => !existing.some(current => current.toLocaleLowerCase("es-PY") === value.toLocaleLowerCase("es-PY"))),
    ];
    return {
      zones: zones.length ? zones.map(z => z.value) : DEFAULT_ZONES,
      departments: zones.length ? zones.map(z => z.value) : DEFAULT_ZONES,
      clientTypes: clientTypes.length ? clientTypes.map(c => c.value) : DEFAULT_CLIENT_TYPES,
      noteCategories: mergeDefaults(noteCategories.map(n => n.value), DEFAULT_NOTE_CATEGORIES),
      zoneRows: zones,
      clientTypeRows: clientTypes,
      noteCategoryRows: noteCategories,
    };
  }),

  addCatalogValue: adminProcedure
    .input(z.object({ kind: catalogKind, value: z.string().min(1).max(120) }))
    .mutation(async ({ input }) => {
      const existing = await db.listCatalog(input.kind);
      const value = input.value.trim();
      if (existing.some(row => row.value.toLowerCase() === value.toLowerCase())) {
        throw new TRPCError({ code: "CONFLICT", message: "Ese valor ya existe" });
      }
      // Al personalizar por primera vez, se persisten los valores por defecto.
      if (!existing.length) {
        const defaults =
          input.kind === "zone"
            ? DEFAULT_ZONES
            : input.kind === "clientType"
              ? DEFAULT_CLIENT_TYPES
              : DEFAULT_NOTE_CATEGORIES;
        await db.addCatalogValues(
          defaults.map((v, index) => ({ kind: input.kind, value: v, sortOrder: index }))
        );
      }
      await db.addCatalogValues([
        { kind: input.kind, value, sortOrder: existing.length + 100 },
      ]);
      return { success: true } as const;
    }),

  removeCatalogValue: adminProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      await db.deleteCatalogValue(input.id);
      return { success: true } as const;
    }),

  /* ----------------------------- Exportación ---------------------------- */

  exportCsv: protectedProcedure
    .input(
      z.object({
        dataset: z.enum(["sites", "checkins", "notes"]),
        scope: z.enum(["mine", "all"]).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const mine = !canManageAll(ctx.user.role) || input.scope === "mine";
      const assignedSiteIds = mine ? await db.getAssignedSiteIds(ctx.user.id) : undefined;
      const stamp = new Date().toISOString().slice(0, 10);

      if (input.dataset === "sites") {
        const sites = await db.listSites(mine ? { siteIds: assignedSiteIds } : {});
        const csv = toCsv(
          [
            "ID",
            "Nombre",
            "Tipo de cliente",
            "Departamento",
            "Zona",
            "Descripción",
            "Contacto",
            "Teléfono",
            "Latitud",
            "Longitud",
            "Dirección/Referencia",
            "Vendedor",
            "Creado",
            "Actualizado",
            "Google Maps",
          ],
          sites.map(s => [
            s.id,
            s.name,
            s.clientType,
            s.department,
            s.zone,
            s.description,
            s.contactName,
            s.phone,
            s.latitude,
            s.longitude,
            s.address,
            s.ownerName ?? s.ownerUsername,
            formatPy(s.createdAt),
            formatPy(s.updatedAt),
            `https://www.google.com/maps?q=${s.latitude},${s.longitude}`,
          ])
        );
        return { filename: `sitios_${stamp}.csv`, csv };
      }

      if (input.dataset === "checkins") {
        const rows = await db.listCheckins({
          siteIds: assignedSiteIds,
          limit: 5000,
        });
        const csv = toCsv(
          ["ID", "Fecha y hora", "Sitio", "Departamento", "Zona", "Vendedor", "Distancia (m)", "Comentario"],
          rows.map(c => [
            c.id,
            formatPy(c.createdAt),
            c.siteName,
            c.siteDepartment,
            c.siteZone,
            c.userName ?? c.username,
            c.distanceMeters,
            c.comment,
          ])
        );
        return { filename: `checkins_${stamp}.csv`, csv };
      }

      const rows = await db.listNotes({ siteIds: assignedSiteIds, limit: 5000 });
      const csv = toCsv(
        ["ID", "Fecha y hora", "Sitio", "Departamento", "Zona", "Vendedor", "Categoría", "Nota"],
        rows.map(n => [
          n.id,
          formatPy(n.createdAt),
          n.siteName,
          n.siteDepartment,
          n.siteZone,
          n.userName ?? n.username,
          n.category,
          n.content,
        ])
      );
      return { filename: `notas_${stamp}.csv`, csv };
    }),
});
