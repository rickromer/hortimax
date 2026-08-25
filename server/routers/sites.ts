import { distanceMeters, NEARBY_RADIUS_METERS } from "@shared/domain";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
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

function canSeeAll(role: string) {
  return role === "admin";
}

async function assertSiteAccess(siteId: number, user?: { id: number; role: string } | null) {
  const site = await db.getSiteById(siteId);
  if (!site) throw new TRPCError({ code: "NOT_FOUND", message: "Sitio no encontrado" });
  if (!user) return site;
  if (!canSeeAll(user.role) && !(await db.isUserAssignedToSite(siteId, user.id))) {
    throw new TRPCError({ code: "FORBIDDEN", message: "No tenés acceso a este sitio" });
  }
  return site;
}

export const sitesRouter = router({
  /** Lista de sitios: el vendedor ve los suyos, el admin ve todos (o filtra por vendedor). */
  list: publicProcedure
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

      if (ctx.user && !canSeeAll(ctx.user.role)) {
        filters.siteIds = await db.getAssignedSiteIds(ctx.user.id);
      } else if (ctx.user && input?.scope === "mine") {
        filters.createdBy = ctx.user.id;
      } else if (input?.sellerId) {
        filters.siteIds = await db.getAssignedSiteIds(input.sellerId);
      }

      const sites = await db.listSites(filters);
      const lastMap = await db.lastCheckinBySite(sites.map(s => s.id));
      return sites.map(site => ({
        ...site,
        lastCheckinAt: lastMap.get(site.id) ?? null,
      }));
    }),

  /** Detalle de un cliente con check-ins, notas y agenda de relevamientos. */
  detail: publicProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const site = await assertSiteAccess(input.id, ctx.user);
      const [checkins, notes, assignees, followups] = await Promise.all([
        db.listCheckins({ siteId: site.id, limit: 100 }),
        db.listNotes({ siteId: site.id, limit: 200 }),
        db.listSiteAssignees(site.id),
        db.listFollowups({ siteId: site.id, status: "pending", limit: 100 }),
      ]);
      return { site, checkins, notes, assignees, followups };
    }),

  /** Sitios cercanos a una coordenada, para evitar duplicados y ofrecer check-in. */
  nearby: protectedProcedure
    .input(coord.extend({ radius: z.number().int().min(50).max(5000).optional() }))
    .query(async ({ ctx, input }) => {
      const filters: db.SiteFilters = {};
      if (!canSeeAll(ctx.user.role)) filters.siteIds = await db.getAssignedSiteIds(ctx.user.id);
      const sites = await db.listSites(filters);
      const radius = input.radius ?? NEARBY_RADIUS_METERS;
      return sites
        .map(site => ({
          ...site,
          distance: distanceMeters(
            { lat: input.latitude, lng: input.longitude },
            { lat: site.latitude, lng: site.longitude }
          ),
        }))
        .filter(site => site.distance <= radius)
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 10);
    }),

  /** Crea un punto. Durante el modo temporal, también admite envíos sin sesión. */
  create: publicProcedure
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
        createdBy: ctx.user?.id ?? 0,
        publicSubmission: !ctx.user,
      });
      if (!created) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "No se pudo crear el sitio" });
      }
      if (ctx.user && !canSeeAll(ctx.user.role)) {
        await db.replaceSiteAssignments(created.id, [ctx.user.id], ctx.user.id);
      }
      return created;
    }),

  /** Actualiza los datos de un sitio existente. */
  update: protectedProcedure
    .input(
      siteInput
        .partial()
        .extend({
          id: z.number().int().positive(),
          latitude: z.number().min(-90).max(90).optional(),
          longitude: z.number().min(-180).max(180).optional(),
        })
    )
    .mutation(async ({ ctx, input }) => {
      await assertSiteAccess(input.id, ctx.user);
      const { id, latitude, longitude, ...rest } = input;
      const values: Record<string, unknown> = {};
      Object.entries(rest).forEach(([key, value]) => {
        if (value === undefined) return;
        values[key] = typeof value === "string" ? value.trim() || null : value;
      });
      if (latitude !== undefined) values.latitude = latitude.toFixed(7);
      if (longitude !== undefined) values.longitude = longitude.toFixed(7);
      return db.updateSite(id, values as any);
    }),

  /** Archiva un sitio (no lo borra físicamente). */
  archive: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      await assertSiteAccess(input.id, ctx.user);
      await db.updateSite(input.id, { active: false });
      return { success: true } as const;
    }),

  /** Registra un check-in en un sitio con fecha y hora automáticas. */
  checkin: protectedProcedure
    .input(
      z.object({
        siteId: z.number().int().positive(),
        latitude: z.number().min(-90).max(90).optional(),
        longitude: z.number().min(-180).max(180).optional(),
        comment: z.string().max(1000).optional(),
        note: z.string().max(4000).optional(),
        noteCategory: z.string().max(80).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const site = await assertSiteAccess(input.siteId, ctx.user);
      const distance =
        input.latitude !== undefined && input.longitude !== undefined
          ? distanceMeters(
              { lat: input.latitude, lng: input.longitude },
              { lat: site.latitude, lng: site.longitude }
            )
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
      if (input.note && input.note.trim().length > 0) {
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
