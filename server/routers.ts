import { systemRouter } from "./_core/systemRouter";
import { router } from "./_core/trpc";
import { adminRouter } from "./routers/admin";
import { authRouter } from "./routers/auth";
import { calendarRouter } from "./routers/calendar";
import { followupsRouter } from "./routers/followups";
import { notesRouter } from "./routers/notes";
import { sitesRouter } from "./routers/sites";

export const appRouter = router({
  system: systemRouter,
  auth: authRouter,
  sites: sitesRouter,
  notes: notesRouter,
  followups: followupsRouter,
  calendar: calendarRouter,
  admin: adminRouter,
});

export type AppRouter = typeof appRouter;
