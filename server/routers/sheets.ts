import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import * as db from "../db";
import { createOrReuseProducerSpreadsheet } from "../googleDriveSheets";
import { GOOGLE_CONNECTION_KEY, getGoogleOAuthReadiness } from "../googleOAuth";
import { assertSiteViewAccess } from "./sites";

export function isProducerClient(clientType: string | null | undefined) {
  return clientType?.trim().toLocaleLowerCase("es-PY") === "productor";
}

async function getProducerSiteForUser(siteId: number, user: { id: number; role: string }) {
  const site = await assertSiteViewAccess(siteId, user);
  if (!isProducerClient(site.clientType)) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Las planillas permanentes solo están disponibles para Productores." });
  }
  return site;
}

export const sheetsRouter = router({
  status: protectedProcedure.query(async ({ ctx }) => {
    const connection = await db.getGoogleConnection(GOOGLE_CONNECTION_KEY);
    let configured = false;
    try {
      configured = getGoogleOAuthReadiness().configured;
    } catch {
      configured = false;
    }
    return {
      configured,
      connected: Boolean(connection),
      canConnect: ctx.user.role === "admin",
    };
  }),

  forSite: protectedProcedure
    .input(z.object({ siteId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const site = await getProducerSiteForUser(input.siteId, ctx.user);
      const sheet = await db.getSiteGoogleSheet(site.id);
      const connection = await db.getGoogleConnection(GOOGLE_CONNECTION_KEY);
      return {
        connected: Boolean(connection),
        sheet: sheet && sheet.status === "ready" && sheet.spreadsheetUrl
          ? { id: sheet.spreadsheetId, url: sheet.spreadsheetUrl, createdAt: sheet.createdAt }
          : null,
      };
    }),

  createForSite: protectedProcedure
    .input(z.object({ siteId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const site = await getProducerSiteForUser(input.siteId, ctx.user);
      const created = await createOrReuseProducerSpreadsheet({
        site: { id: site.id, name: site.name },
        createdBy: ctx.user.id,
      });
      if (!created.spreadsheetId || !created.spreadsheetUrl) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "La planilla no quedó disponible." });
      }
      return { id: created.spreadsheetId, url: created.spreadsheetUrl, reused: created.createdBy !== ctx.user.id };
    }),
});
