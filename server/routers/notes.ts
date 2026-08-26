import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import * as db from "../db";
import { formatPy, toCsv } from "../csv";
import { distanceMeters } from "../../shared/domain";
import { canManageAll } from "@shared/permissions";

async function assertNoteAccess(noteId: number, user: { id: number; role: string }) {
  const note = await db.getNoteById(noteId);
  if (!note) throw new TRPCError({ code: "NOT_FOUND", message: "Nota no encontrada" });
  if (!canManageAll(user.role) && note.userId !== user.id) {
    throw new TRPCError({ code: "FORBIDDEN", message: "No podés modificar esta nota" });
  }
  return note;
}

export const notesRouter = router({
  /** Historial disponible únicamente dentro de una sesión válida. */
  list: protectedProcedure
    .input(
      z
        .object({
          siteId: z.number().int().positive().optional(),
          search: z.string().max(200).optional(),
          scope: z.enum(["mine", "all"]).optional(),
          limit: z.number().int().min(1).max(500).optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      if (input?.siteId) {
        const site = await db.getSiteById(input.siteId);
        if (!site) throw new TRPCError({ code: "NOT_FOUND", message: "Sitio no encontrado" });
      }
      return db.listNotes({
        siteId: input?.siteId,
        siteIds: input?.scope === "mine" ? await db.getAssignedSiteIds(ctx.user.id) : undefined,
        search: input?.search?.trim() || undefined,
        limit: input?.limit,
      });
    }),

  /** Nueva nota con cabecera automática de fecha y hora. */
  create: protectedProcedure
    .input(
      z.object({
        siteId: z.number().int().positive(),
        content: z.string().min(1).max(4000),
        category: z.string().max(80).optional(),
        checkinId: z.number().int().positive().optional(),
        registerVisit: z.boolean().optional().default(false),
        latitude: z.number().min(-90).max(90).optional(),
        longitude: z.number().min(-180).max(180).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const site = await db.getSiteById(input.siteId);
      if (!site) throw new TRPCError({ code: "NOT_FOUND", message: "Sitio no encontrado" });
      if (!canManageAll(ctx.user.role) && site.createdBy !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Solo podés registrar actividad en tus propios puntos" });
      }
      let linkedCheckinId = input.checkinId ?? null;
      if (input.registerVisit) {
        const hasLocation = input.latitude !== undefined && input.longitude !== undefined;
        const visit = await db.createCheckin({
          siteId: site.id,
          userId: ctx.user.id,
          latitude: hasLocation ? input.latitude!.toFixed(7) : null,
          longitude: hasLocation ? input.longitude!.toFixed(7) : null,
          distanceMeters: hasLocation
            ? distanceMeters(
                { lat: input.latitude!, lng: input.longitude! },
                { lat: site.latitude, lng: site.longitude }
              )
            : null,
          comment: "Visita registrada desde nota",
        });
        linkedCheckinId = visit.id;
      }

      const note = await db.createNote({
        siteId: input.siteId,
        userId: ctx.user.id,
        checkinId: linkedCheckinId,
        category: input.category?.trim() || null,
        content: input.content.trim(),
      });
      return { note, registeredVisit: Boolean(input.registerVisit), checkinId: linkedCheckinId };
    }),

  /** Descarga la planilla de notas del cliente para abrirla o importarla en Google Sheets. */
  exportCsv: protectedProcedure
    .input(z.object({ siteId: z.number().int().positive() }))
    .query(async ({ input }) => {
      const site = await db.getSiteById(input.siteId);
      if (!site) throw new TRPCError({ code: "NOT_FOUND", message: "Cliente no encontrado" });
      const rows = await db.listNotes({ siteId: site.id, limit: 1000 });
      return {
        filename: `notas-${site.name.toLowerCase().replace(/[^a-z0-9]+/gi, "-") || site.id}.csv`,
        csv: toCsv(
          ["Fecha y hora", "Cliente", "Zona", "Categoría", "Nota", "Registrado por"],
          rows.map(note => [
            formatPy(note.createdAt),
            note.siteName ?? site.name,
            note.siteZone,
            note.category,
            note.content,
            note.userName ?? note.username ?? "Sin autor",
          ])
        ),
      };
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number().int().positive(),
        content: z.string().min(1).max(4000).optional(),
        category: z.string().max(80).optional().nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await assertNoteAccess(input.id, ctx.user);
      return db.updateNote(input.id, {
        content: input.content?.trim(),
        category: input.category === undefined ? undefined : input.category?.trim() || null,
      });
    }),

  remove: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      await assertNoteAccess(input.id, ctx.user);
      await db.deleteNote(input.id);
      return { success: true } as const;
    }),
});
