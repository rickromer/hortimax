import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import * as db from "../db";

async function assertNoteAccess(noteId: number, user: { id: number; role: string }) {
  const note = await db.getNoteById(noteId);
  if (!note) throw new TRPCError({ code: "NOT_FOUND", message: "Nota no encontrada" });
  if (user.role !== "admin" && note.userId !== user.id) {
    throw new TRPCError({ code: "FORBIDDEN", message: "No podés modificar esta nota" });
  }
  return note;
}

export const notesRouter = router({
  /** Planilla de notas: por sitio, por vendedor o global (admin). */
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
      const scopeMine = ctx.user.role !== "admin" || input?.scope === "mine";
      if (input?.siteId) {
        const site = await db.getSiteById(input.siteId);
        if (!site) throw new TRPCError({ code: "NOT_FOUND", message: "Sitio no encontrado" });
        if (ctx.user.role !== "admin" && site.createdBy !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "No tenés acceso a este sitio" });
        }
      }
      return db.listNotes({
        siteId: input?.siteId,
        userId: scopeMine ? ctx.user.id : undefined,
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
      })
    )
    .mutation(async ({ ctx, input }) => {
      const site = await db.getSiteById(input.siteId);
      if (!site) throw new TRPCError({ code: "NOT_FOUND", message: "Sitio no encontrado" });
      if (ctx.user.role !== "admin" && site.createdBy !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "No tenés acceso a este sitio" });
      }
      return db.createNote({
        siteId: input.siteId,
        userId: ctx.user.id,
        checkinId: input.checkinId ?? null,
        category: input.category?.trim() || null,
        content: input.content.trim(),
      });
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

