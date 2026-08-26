import { randomUUID } from "node:crypto";
import { parse } from "cookie";
import type { Express, Request } from "express";
import { getSessionCookieOptions } from "./_core/cookies";
import { sdk } from "./_core/sdk";
import * as db from "./db";
import {
  buildGoogleAuthorizationUrl,
  encryptGoogleRefreshToken,
  exchangeGoogleAuthorizationCode,
  GOOGLE_CONNECTION_KEY,
  GOOGLE_OAUTH_CALLBACK_PATH,
} from "./googleOAuth";

const GOOGLE_OAUTH_STATE_COOKIE = "google_oauth_state";
const OAUTH_STATE_TTL_MS = 10 * 60 * 1000;

type OAuthState = { nonce: string; userId: number; returnTo: string };

function requestOrigin(req: Request) {
  const forwardedProto = req.headers["x-forwarded-proto"];
  const protocol = typeof forwardedProto === "string" ? forwardedProto.split(",")[0].trim() : req.protocol;
  const host = req.get("host");
  if (!host) throw new Error("No se pudo identificar la dirección de retorno del portal.");
  return `${protocol}://${host}`;
}

export function safeReturnPath(value: unknown) {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
    return "/admin/configuracion";
  }
  return value;
}

function encodeState(value: OAuthState) {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

function decodeState(value: string | undefined): OAuthState | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as Partial<OAuthState>;
    if (typeof parsed.nonce !== "string" || typeof parsed.userId !== "number" || typeof parsed.returnTo !== "string") {
      return null;
    }
    return { nonce: parsed.nonce, userId: parsed.userId, returnTo: safeReturnPath(parsed.returnTo) };
  } catch {
    return null;
  }
}

function withGoogleStatus(path: string, status: "connected" | "denied" | "error") {
  const url = new URL(path, "https://portal.hortimax.local");
  url.searchParams.set("google", status);
  return `${url.pathname}${url.search}`;
}

export function registerGoogleOAuthRoutes(app: Express) {
  app.get("/api/google/authorize", async (req, res) => {
    try {
      const user = await sdk.authenticateRequest(req);
      if (!user || user.role !== "admin") {
        res.status(403).send("Solo un administrador puede conectar la cuenta de Google.");
        return;
      }
      const returnTo = safeReturnPath(req.query.returnTo);
      const nonce = randomUUID();
      res.cookie(GOOGLE_OAUTH_STATE_COOKIE, encodeState({ nonce, userId: user.id, returnTo }), {
        ...getSessionCookieOptions(req),
        maxAge: OAUTH_STATE_TTL_MS,
      });
      const redirectUri = `${requestOrigin(req)}${GOOGLE_OAUTH_CALLBACK_PATH}`;
      res.redirect(buildGoogleAuthorizationUrl({ redirectUri, state: nonce }));
    } catch (error) {
      res.status(500).send(error instanceof Error ? error.message : "No se pudo iniciar la autorización de Google.");
    }
  });

  app.get(GOOGLE_OAUTH_CALLBACK_PATH, async (req, res) => {
    const stateCookie = decodeState(parse(req.headers.cookie ?? "")[GOOGLE_OAUTH_STATE_COOKIE]);
    const receivedState = typeof req.query.state === "string" ? req.query.state : "";
    res.clearCookie(GOOGLE_OAUTH_STATE_COOKIE, getSessionCookieOptions(req));
    if (!stateCookie || !receivedState || stateCookie.nonce !== receivedState) {
      res.status(403).send("La autorización de Google no coincide con la solicitud original.");
      return;
    }

    const user = await sdk.authenticateRequest(req).catch(() => null);
    if (!user || user.id !== stateCookie.userId || user.role !== "admin") {
      res.status(403).send("La sesión del administrador ya no es válida. Volvé a iniciar la conexión.");
      return;
    }

    const returnTo = stateCookie.returnTo;
    if (typeof req.query.error === "string") {
      res.redirect(withGoogleStatus(returnTo, "denied"));
      return;
    }
    const code = typeof req.query.code === "string" ? req.query.code : "";
    if (!code) {
      res.redirect(withGoogleStatus(returnTo, "error"));
      return;
    }

    try {
      const redirectUri = `${requestOrigin(req)}${GOOGLE_OAUTH_CALLBACK_PATH}`;
      const token = await exchangeGoogleAuthorizationCode({ code, redirectUri });
      await db.upsertGoogleConnection({
        connectionKey: GOOGLE_CONNECTION_KEY,
        encryptedRefreshToken: encryptGoogleRefreshToken(token.refreshToken),
        grantedScopes: token.scope,
        connectedBy: user.id,
      });
      res.redirect(withGoogleStatus(returnTo, "connected"));
    } catch (error) {
      console.error("[Google OAuth] callback failed", error);
      res.redirect(withGoogleStatus(returnTo, "error"));
    }
  });
}
