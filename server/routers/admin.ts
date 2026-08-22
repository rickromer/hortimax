import { DEFAULT_CLIENT_TYPES, DEFAULT_NOTE_CATEGORIES, DEFAULT_ZONES } from "@shared/domain";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { adminProcedure, protectedProcedure, router } from "../_core/trpc";
import { formatPy, toCsv } from "../csv";
import * as db from "../db";
import { generateActivationCode, hashPassword, normalizeUsername } from "../password";

const catalogKind = z.enum(["zone", "clientType", "noteCategory"]);

export const adminRouter = router({
  /** Métricas del panel principal. */
  stats: adminProcedure.query(async () => {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const [totalSites, totalCheckins, weekCheckins, totalNotes, users] = await Promise.all([
      db.countSites(),
      db.countCheckins(),
      db.countCheckins({ since }),
      db.countNotes(),
      db.listUsers(),
    ]);
    const sites = await db.listSites();
    const byZone = new Map<string, number>();
    const byType = new Map<string, number>();
    sites.forEach(site => {
      const zone = site.zone || "Sin zona";
      const type = site.clientType || "Sin clasificar";
      byZone.set(zone, (byZone.get(zone) ?? 0) + 1);
      byType.set(type, (byType.get(type) ?? 0) + 1);
    });
    return {
      totalSites,
      totalCheckins,
      weekCheckins,
      totalNotes,
      totalSellers: users.filter(u => u.role === "user" && u.active).length,
      byZone: Array.from(byZone, ([zone, count]) => ({ zone, count })).sort(
        (a, b) => b.count - a.count
      ),
      byType: Array.from(byType, ([type, count]) => ({ type, count })).sort(
        (a, b) => b.count - a.count
      ),
    };
  }),

  /** Actividad reciente de los vendedores. */
  activity: adminProcedure
    .input(z.object({ limit: z.number().int().min(1).max(200).optional() }).optional())
    .query(async ({ input }) => {
      const limit = input?.limit ?? 40;
      const [checkins, notes] = await Promise.all([
        db.listCheckins({ limit }),
        db.listNotes({ limit }),
      ]);
      return { checkins, notes };
    }),

  /* ------------------------------ Usuarios ------------------------------ */

  listUsers: adminProcedure.query(async () => {
    const users = await db.listUsers();
    const sites = await db.listSites();
    const checkins = await db.listCheckins({ limit: 1000 });
    return users.map(user => ({
      id: user.id,
      name: user.name,
      username: user.username,
      role: user.role,
      zone: user.zone,
      phone: user.phone,
      active: user.active,
      mustChangePassword: user.mustChangePassword,
      activationCode: user.activationCode,
      lastSignedIn: user.lastSignedIn,
      createdAt: user.createdAt,
      sitesCount: sites.filter(s => s.createdBy === user.id).length,
      checkinsCount: checkins.filter(c => c.userId === user.id).length,
    }));
  }),

  createUser: adminProcedure
    .input(
      z.object({
        name: z.string().min(2).max(120),
        username: z.string().min(3).max(64),
        role: z.enum(["user", "admin"]).default("user"),
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
        role: z.enum(["user", "admin"]).optional(),
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

  catalog: protectedProcedure.query(async () => {
    const [zones, clientTypes, noteCategories] = await Promise.all([
      db.listCatalog("zone"),
      db.listCatalog("clientType"),
      db.listCatalog("noteCategory"),
    ]);
    return {
      zones: zones.length ? zones.map(z => z.value) : DEFAULT_ZONES,
      clientTypes: clientTypes.length ? clientTypes.map(c => c.value) : DEFAULT_CLIENT_TYPES,
      noteCategories: noteCategories.length
        ? noteCategories.map(n => n.value)
        : DEFAULT_NOTE_CATEGORIES,
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
      const mine = ctx.user.role !== "admin" || input.scope === "mine";
      const stamp = new Date().toISOString().slice(0, 10);

      if (input.dataset === "sites") {
        const sites = await db.listSites(mine ? { createdBy: ctx.user.id } : {});
        const csv = toCsv(
          [
            "ID",
            "Nombre",
            "Tipo de cliente",
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
          userId: mine ? ctx.user.id : undefined,
          limit: 5000,
        });
        const csv = toCsv(
          ["ID", "Fecha y hora", "Sitio", "Zona", "Vendedor", "Distancia (m)", "Comentario"],
          rows.map(c => [
            c.id,
            formatPy(c.createdAt),
            c.siteName,
            c.siteZone,
            c.userName ?? c.username,
            c.distanceMeters,
            c.comment,
          ])
        );
        return { filename: `checkins_${stamp}.csv`, csv };
      }

      const rows = await db.listNotes({ userId: mine ? ctx.user.id : undefined, limit: 5000 });
      const csv = toCsv(
        ["ID", "Fecha y hora", "Sitio", "Zona", "Vendedor", "Categoría", "Nota"],
        rows.map(n => [
          n.id,
          formatPy(n.createdAt),
          n.siteName,
          n.siteZone,
          n.userName ?? n.username,
          n.category,
          n.content,
        ])
      );
      return { filename: `notas_${stamp}.csv`, csv };
    }),
});
