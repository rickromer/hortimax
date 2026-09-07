import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getSessionCookieOptions } from "../_core/cookies";
import { sdk } from "../_core/sdk";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import type { AppRole } from "@shared/permissions";
import * as db from "../db";
import { hashPassword, normalizeUsername, verifyPassword } from "../password";

const MIN_PASSWORD = 6;

function publicUser(user: {
  id: number;
  name: string | null;
  username: string | null;
  role: AppRole;
  zone: string | null;
  phone: string | null;
  mustChangePassword: boolean;
  active: boolean;
}) {
  return {
    id: user.id,
    name: user.name,
    username: user.username,
    role: user.role,
    zone: user.zone,
    phone: user.phone,
    mustChangePassword: user.mustChangePassword,
    active: user.active,
  };
}

async function issueSession(ctx: any, openId: string, name: string) {
  const token = await sdk.createSessionToken(openId, {
    name: name || openId,
    expiresInMs: ONE_YEAR_MS,
  });
  const options = getSessionCookieOptions(ctx.req);
  ctx.res.cookie(COOKIE_NAME, token, { ...options, maxAge: ONE_YEAR_MS });
  return token;
}

function isTrustedAndroidApp(ctx: any) {
  const origin = ctx.req.get("origin");
  return (
    ctx.req.get("x-hortimax-client") === "android" &&
    (!origin || origin === "http://localhost" || origin === "https://localhost" || origin === "capacitor://localhost")
  );
}

async function issueClientSession(ctx: any, user: any) {
  const token = await issueSession(ctx, user.openId, user.name ?? user.username ?? "");
  return {
    ...publicUser(user),
    // El token solo se entrega a la aplicación Android identificada para que el
    // WebView pueda autenticar requests cross-origin. Nunca se devuelve a la web.
    ...(isTrustedAndroidApp(ctx) ? { mobileSessionToken: token } : {}),
  };
}

export const authRouter = router({
  /** Usuario actual de la sesión (o null). */
  me: publicProcedure.query(({ ctx }) => (ctx.user ? publicUser(ctx.user as any) : null)),

  /** Indica si todavía no existe ninguna cuenta administradora. */
  needsSetup: publicProcedure.query(async () => {
    const users = await db.listUsers();
    const hasAdmin = users.some(u => u.role === "admin" && u.username && u.passwordHash);
    return { needsSetup: !hasAdmin };
  }),

  /** Crea la primera cuenta administradora del sistema. */
  setupAdmin: publicProcedure
    .input(
      z.object({
        name: z.string().min(2).max(120),
        username: z.string().min(3).max(64),
        password: z.string().min(MIN_PASSWORD).max(200),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await db.listUsers();
      if (existing.some(u => u.role === "admin" && u.username && u.passwordHash)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "El sistema ya tiene un administrador configurado",
        });
      }

      const username = normalizeUsername(input.username);
      if (username.length < 3) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Nombre de usuario inválido" });
      }
      if (await db.getUserByUsername(username)) {
        throw new TRPCError({ code: "CONFLICT", message: "Ese usuario ya existe" });
      }

      const bootstrapAdmin = existing.find(user => user.role === "admin" && !user.username);
      const created = bootstrapAdmin
        ? await db.updateUser(bootstrapAdmin.id, {
            name: input.name.trim(),
            username,
            loginMethod: "password",
            passwordHash: await hashPassword(input.password),
            mustChangePassword: false,
            activationCode: null,
            active: true,
            lastSignedIn: new Date(),
          })
        : await db.createAppUser({
            openId: `local_${username}_${Date.now().toString(36)}`,
            name: input.name.trim(),
            username,
            role: "admin",
            loginMethod: "password",
            passwordHash: await hashPassword(input.password),
            mustChangePassword: false,
            active: true,
            lastSignedIn: new Date(),
          });

      if (!created) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "No se pudo crear la cuenta" });
      }

      return issueClientSession(ctx, created);
    }),

  /** Verifica si un usuario debe definir contraseña en su primer ingreso. */
  checkUsername: publicProcedure
    .input(z.object({ username: z.string().min(1).max(64) }))
    .mutation(async ({ input }) => {
      const user = await db.getUserByUsername(normalizeUsername(input.username));
      if (!user || !user.active) {
        return { exists: false, needsPassword: false, name: null as string | null };
      }
      return {
        exists: true,
        needsPassword: !user.passwordHash || user.mustChangePassword,
        name: user.name,
      };
    }),

  /** Inicio de sesión con usuario y contraseña. */
  login: publicProcedure
    .input(
      z.object({
        username: z.string().min(1).max(64),
        password: z.string().min(1).max(200),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = await db.getUserByUsername(normalizeUsername(input.username));
      if (!user || !user.active) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Usuario o contraseña incorrectos" });
      }
      if (!user.passwordHash) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Este usuario todavía no definió su contraseña",
        });
      }
      const ok = await verifyPassword(input.password, user.passwordHash);
      if (!ok) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Usuario o contraseña incorrectos" });
      }

      await db.updateUser(user.id, { lastSignedIn: new Date() });
      return issueClientSession(ctx, { ...user, mustChangePassword: user.mustChangePassword });
    }),

  /** Primer ingreso: el usuario define su propia contraseña con el código de activación. */
  activate: publicProcedure
    .input(
      z.object({
        username: z.string().min(1).max(64),
        activationCode: z.string().min(4).max(32),
        password: z.string().min(MIN_PASSWORD).max(200),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = await db.getUserByUsername(normalizeUsername(input.username));
      if (!user || !user.active) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Usuario no encontrado o inactivo" });
      }
      if (user.passwordHash && !user.mustChangePassword) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Este usuario ya definió su contraseña",
        });
      }
      const expected = (user.activationCode ?? "").toUpperCase();
      if (!expected || expected !== input.activationCode.trim().toUpperCase()) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Código de activación incorrecto" });
      }

      const updated = await db.updateUser(user.id, {
        passwordHash: await hashPassword(input.password),
        mustChangePassword: false,
        activationCode: null,
        loginMethod: "password",
        lastSignedIn: new Date(),
      });
      if (!updated) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "No se pudo activar la cuenta" });
      }

      return issueClientSession(ctx, updated);
    }),

  /** Cambio de contraseña del usuario autenticado. */
  changePassword: protectedProcedure
    .input(
      z.object({
        currentPassword: z.string().min(1).max(200),
        newPassword: z.string().min(MIN_PASSWORD).max(200),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = await db.getUserById(ctx.user.id);
      if (!user) throw new TRPCError({ code: "NOT_FOUND", message: "Usuario no encontrado" });
      const ok = await verifyPassword(input.currentPassword, user.passwordHash);
      if (!ok) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "La contraseña actual no coincide" });
      }
      await db.updateUser(user.id, {
        passwordHash: await hashPassword(input.newPassword),
        mustChangePassword: false,
      });
      return { success: true } as const;
    }),

  /** Actualiza los datos básicos del propio perfil. */
  updateProfile: protectedProcedure
    .input(z.object({ name: z.string().min(2).max(120), phone: z.string().max(40).optional() }))
    .mutation(async ({ ctx, input }) => {
      const updated = await db.updateUser(ctx.user.id, {
        name: input.name.trim(),
        phone: input.phone?.trim() || null,
      });
      return updated ? publicUser(updated as any) : null;
    }),

  logout: publicProcedure.mutation(({ ctx }) => {
    const cookieOptions = getSessionCookieOptions(ctx.req);
    ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
    return { success: true } as const;
  }),
});
