import { TRPCError } from "@trpc/server";
import { canManageAll } from "@shared/permissions";
import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import * as db from "../db";

async function assertFollowupAccess(siteId: number, user: { id: number; role: string }) {
  const site = await db.getSiteById(siteId);
  if (!site) throw new TRPCError({ code: "NOT_FOUND", message: "Cliente no encontrado" });
  if (!canManageAll(user.role) && site.createdBy !== user.id) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Solo podés gestionar tus propios puntos" });
  }
  return site;
}

const scheduleInput = z.object({
  description: z.string().trim().min(2).max(2000),
  scheduledFor: z.coerce.date(),
  type: z.enum(["reminder", "visit", "attention"]).default("reminder"),
});

export const followupsRouter = router({
  /** Agenda temporalmente abierta junto con la ficha de cada cliente. */
  list: publicProcedure
    .input(z.object({ siteId: z.number().int().positive().optional(), limit: z.number().int().min(1).max(300).optional() }).optional())
    .query(async ({ ctx, input }) => {
      if (input?.siteId) {
        const site = await db.getSiteById(input.siteId);
        if (!site) throw new TRPCError({ code: "NOT_FOUND", message: "Cliente no encontrado" });
      }
      return db.listFollowups({
        siteId: input?.siteId,
        siteIds: undefined,
        status: "pending",
        limit: input?.limit,
      });
    }),

  create: publicProcedure
    .input(scheduleInput.extend({ siteId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user) {
        await assertFollowupAccess(input.siteId, ctx.user);
      } else {
        const site = await db.getSiteById(input.siteId);
        if (!site) throw new TRPCError({ code: "NOT_FOUND", message: "Cliente no encontrado" });
      }
      return db.createFollowup({
        siteId: input.siteId,
        createdBy: ctx.user?.id ?? 0,
        type: input.type,
        description: input.description,
        scheduledFor: input.scheduledFor,
        status: "pending",
      });
    }),

  update: protectedProcedure
    .input(
      scheduleInput.partial().extend({
        id: z.number().int().positive(),
        status: z.enum(["pending", "completed", "cancelled"]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const followup = await db.getFollowupById(input.id);
      if (!followup) throw new TRPCError({ code: "NOT_FOUND", message: "Relevamiento no encontrado" });
      await assertFollowupAccess(followup.siteId, ctx.user);
      const values: Record<string, unknown> = {};
      if (input.description !== undefined) values.description = input.description;
      if (input.scheduledFor !== undefined) values.scheduledFor = input.scheduledFor;
      if (input.type !== undefined) values.type = input.type;
      if (input.status !== undefined) {
        values.status = input.status;
        values.completedAt = input.status === "completed" ? new Date() : null;
      }
      return db.updateFollowup(input.id, values);
    }),

  remove: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const followup = await db.getFollowupById(input.id);
      if (!followup) throw new TRPCError({ code: "NOT_FOUND", message: "Relevamiento no encontrado" });
      await assertFollowupAccess(followup.siteId, ctx.user);
      await db.deleteFollowup(input.id);
      return { success: true } as const;
    }),
});
