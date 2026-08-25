import { distanceMeters, NEARBY_RADIUS_METERS } from "@shared/domain";
import { canManageAll } from "@shared/permissions";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import * as db from "../db";

const coord = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

const siteInput = z.object({
  name: z.string().min(2).max(200),
  clientType: z.string().max(80).optional().nullable(),
  department: z.string().max(120).optional().nullable(),
  zone: z.string().max(120).optional().nullable(),
  description: z.string().max(2000).optional().nullable(),
  contactName: z.string().max(160).optional().nullable(),
  phone: z.string().max(40).optional().nullable(),
  address: z.string().max(500).optional().nullable(),
  accuracy: z.number().int().min(0).max(100000).optional().nullable(),
});

async function assertSiteViewAccess(siteId: number, user: { id: number; role: string }) {
  const site = await db.getSiteById(siteId);
  if (!site) throw new TRPCError({ code: "NOT_FOUND", message: "Sitio no encontrado" });
  return site;
}

async function assertSiteEditAccess(siteId: number, user: { id: number; role: string }) {
  const site = await assertSiteViewAccess(siteId, user);
  if (!canManageAll(user.role) && site.createdBy !== user.id) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Solo podés editar los puntos que registraste" });
  }
  return site;
}

export const sitesRouter = router({
  /** Todos los usuarios autenticados ven el mapa completo; gerencia puede filtrar por comercial. */
  list: protectedProcedure
    .input(
      z
        .object({
          search: z.string().max(200).optional(),
          department: z.string().max(120).optional(),
          zone: z.string().max(120).optional(),
          clientType: z.string().max(80).optional(),
          sellerId: z.number().int().positive().optional(),
          scope: z.enum(["mine", "all"]).optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const filters: db.SiteFilters = {
        search: input?.search?.trim() || undefined,
        department: input?.department || undefined,
        zone: input?.zone || undefined,
        clientType: input?.clientType || undefined,
      };
      if (input?.scope === "mine") {
        filters.createdBy = ctx.user.id;
      } else if (canManageAll(ctx.user.role) && input?.sellerId) {
        filters.siteIds = await db.getAssignedSiteIds(input.sellerId);
      }
      const sites = await db.listSites(filters);
      const lastMap = await db.lastCheckinBySite(sites.map(site => site.id));
      return sites.map(site => ({ ...site, lastCheckinAt: lastMap.get(site.id) ?? null }));
    }),

  /** Todos ven la ficha; propietario, gerencia o administración pueden modificarla. */
  detail: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const site = await assertSiteViewAccess(input.id, ctx.user);
      const [checkins, notes, assignees, followups] = await Promise.all([
        db.listCheckins({ siteId: site.id, limit: 100 }),
        db.listNotes({ siteId: site.id, limit: 200 }),
        db.listSiteAssignees(site.id),
        db.listFollowups({ siteId: site.id, status: "pending", limit: 100 }),
      ]);
      return {
        site,
        checkins,
        notes,
        assignees,
        followups,
        canEditSite: canManageAll(ctx.user.role) || site.createdBy === ctx.user.id,
      };
    }),

  nearby: protectedProcedure
    .input(coord.extend({ radius: z.number().int().min(50).max(5000).optional() }))
    .query(async ({ input }) => {
      const sites = await db.listSites({});
      const radius = input.radius ?? NEARBY_RADIUS_METERS;
      return sites
        .map(site => ({
          ...site,
          distance: distanceMeters({ lat: input.latitude, lng: input.longitude }, { lat: site.latitude, lng: site.longitude }),
        }))
        .filter(site => site.distance <= radius)
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 10);
    }),

  /** Cada usuario autenticado crea y administra los puntos que registra. */
  create: protectedProcedure
    .input(siteInput.merge(coord))
    .mutation(async ({ ctx, input }) => {
      const created = await db.createSite({
        name: input.name.trim(),
        clientType: input.clientType?.trim() || null,
        department: input.department?.trim() || null,
        zone: input.zone?.trim() || null,
        description: input.description?.trim() || null,
        contactName: input.contactName?.trim() || null,
        phone: input.phone?.trim() || null,
        address: input.address?.trim() || null,
        accuracy: input.accuracy ?? null,
        latitude: input.latitude.toFixed(7),
        longitude: input.longitude.toFixed(7),
        createdBy: ctx.user.id,
        publicSubmission: false,
      });
      if (!created) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "No se pudo crear el sitio" });
      await db.replaceSiteAssignments(created.id, [ctx.user.id], ctx.user.id);
      return created;
    }),

  update: protectedProcedure
    .input(siteInput.partial().extend({ id: z.number().int().positive(), latitude: z.number().min(-90).max(90).optional(), longitude: z.number().min(-180).max(180).optional() }))
    .mutation(async ({ ctx, input }) => {
      await assertSiteEditAccess(input.id, ctx.user);
      const { id, latitude, longitude, ...rest } = input;
      const values: Record<string, unknown> = {};
      Object.entries(rest).forEach(([key, value]) => {
        if (value !== undefined) values[key] = typeof value === "string" ? value.trim() || null : value;
      });
      if (latitude !== undefined) values.latitude = latitude.toFixed(7);
      if (longitude !== undefined) values.longitude = longitude.toFixed(7);
      return db.updateSite(id, values as any);
    }),

  archive: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      await assertSiteEditAccess(input.id, ctx.user);
      await db.updateSite(input.id, { active: false });
      return { success: true } as const;
    }),

  checkin: protectedProcedure
    .input(z.object({ siteId: z.number().int().positive(), latitude: z.number().min(-90).max(90).optional(), longitude: z.number().min(-180).max(180).optional(), comment: z.string().max(1000).optional(), note: z.string().max(4000).optional(), noteCategory: z.string().max(80).optional() }))
    .mutation(async ({ ctx, input }) => {
      const site = await assertSiteEditAccess(input.siteId, ctx.user);
      const distance = input.latitude !== undefined && input.longitude !== undefined
        ? distanceMeters({ lat: input.latitude, lng: input.longitude }, { lat: site.latitude, lng: site.longitude })
        : null;
      const checkin = await db.createCheckin({
        siteId: site.id,
        userId: ctx.user.id,
        latitude: input.latitude !== undefined ? input.latitude.toFixed(7) : null,
        longitude: input.longitude !== undefined ? input.longitude.toFixed(7) : null,
        distanceMeters: distance,
        comment: input.comment?.trim() || null,
      });
      let note = null;
      if (input.note?.trim()) {
        note = await db.createNote({
          siteId: site.id,
          userId: ctx.user.id,
          checkinId: checkin.id,
          category: input.noteCategory?.trim() || null,
          content: input.note.trim(),
        });
      }
      return { checkin, note };
    }),
});
