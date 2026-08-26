import { protectedProcedure, router } from "../_core/trpc";
import { canManageAll } from "@shared/permissions";
import * as db from "../db";

const TEAM_TIMELINE_LIMIT = 1000;

/** Gerencia ve actividad global; el representante, solo la de su propia cartera. */
export const calendarRouter = router({
  timeline: protectedProcedure.query(async ({ ctx }) => {
    const siteIds = canManageAll(ctx.user.role)
      ? undefined
      : (await db.listSites({ createdBy: ctx.user.id })).map(site => site.id);
    const [visits, upcoming, notes] = await Promise.all([
      db.listCheckins({ siteIds, limit: TEAM_TIMELINE_LIMIT }),
      db.listFollowups({ siteIds, status: "pending", limit: TEAM_TIMELINE_LIMIT }),
      db.listNotes({ siteIds, limit: TEAM_TIMELINE_LIMIT }),
    ]);

    const entries = [
      ...visits.map(visit => ({
        id: `visit-${visit.id}`,
        kind: "visit" as const,
        occurredAt: visit.createdAt,
        siteId: visit.siteId,
        siteName: visit.siteName,
        department: visit.siteDepartment,
        locality: visit.siteZone,
        author: visit.userName?.trim() || visit.username?.trim() || null,
        description: visit.comment,
        distanceMeters: visit.distanceMeters,
      })),
      ...upcoming.map(followup => ({
        id: `upcoming-${followup.id}`,
        kind: "upcoming" as const,
        occurredAt: followup.scheduledFor,
        siteId: followup.siteId,
        siteName: followup.siteName,
        department: followup.siteDepartment,
        locality: followup.siteZone,
        author: followup.userName?.trim() || followup.username?.trim() || null,
        description: followup.description,
        followupType: followup.type,
      })),
      ...notes.map(note => ({
        id: `note-${note.id}`,
        kind: "note" as const,
        occurredAt: note.createdAt,
        siteId: note.siteId,
        siteName: note.siteName,
        department: note.siteDepartment,
        locality: note.siteZone,
        author: note.userName?.trim() || note.username?.trim() || null,
        description: note.content,
        category: note.category,
        checkinId: note.checkinId,
      })),
    ].sort((left, right) => right.occurredAt.getTime() - left.occurredAt.getTime());

    return { entries };
  }),
});
