import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

const GOOGLE_AUTHORIZATION_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const GOOGLE_DRIVE_FILE_SCOPE = "https://www.googleapis.com/auth/drive.file";

export const GOOGLE_OAUTH_CALLBACK_PATH = "/api/google/callback";
export const GOOGLE_CONNECTION_KEY = "primary";

export type GoogleOAuthConfig = {
  clientId: string;
  clientSecret: string;
};

export function getGoogleOAuthConfig(): GoogleOAuthConfig {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET?.trim();

  if (!clientId || !clientSecret) {
    throw new Error("La autorización personal de Google todavía no está configurada.");
  }

  return { clientId, clientSecret };
}

export function getGoogleOAuthReadiness() {
  const { clientId, clientSecret } = getGoogleOAuthConfig();

  return {
    configured: Boolean(clientId && clientSecret),
    clientIdLooksValid: clientId.endsWith(".apps.googleusercontent.com"),
  } as const;
}

export function buildGoogleAuthorizationUrl(input: { redirectUri: string; state: string }) {
  const { clientId } = getGoogleOAuthConfig();
  const url = new URL(GOOGLE_AUTHORIZATION_ENDPOINT);
  url.search = new URLSearchParams({
    client_id: clientId,
    redirect_uri: input.redirectUri,
    response_type: "code",
    scope: GOOGLE_DRIVE_FILE_SCOPE,
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: "true",
    state: input.state,
  }).toString();

  return url.toString();
}

function getEncryptionKey() {
  const secret = process.env.JWT_SECRET?.trim();
  if (!secret) throw new Error("No se puede proteger la autorización de Google sin la clave de sesión.");
  return createHash("sha256").update(`hortimax-google-oauth-v1:${secret}`).digest();
}

/** Cifra el refresh token antes de conservarlo en la base de datos. */
export function encryptGoogleRefreshToken(refreshToken: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getEncryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(refreshToken, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return ["v1", iv.toString("base64url"), authTag.toString("base64url"), ciphertext.toString("base64url")].join(".");
}

export function decryptGoogleRefreshToken(encryptedValue: string) {
  const [version, ivValue, authTagValue, ciphertextValue] = encryptedValue.split(".");
  if (version !== "v1" || !ivValue || !authTagValue || !ciphertextValue) {
    throw new Error("La autorización de Google almacenada tiene un formato inválido.");
  }
  const decipher = createDecipheriv("aes-256-gcm", getEncryptionKey(), Buffer.from(ivValue, "base64url"));
  decipher.setAuthTag(Buffer.from(authTagValue, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(ciphertextValue, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}

type TokenResponse = {
  access_token?: string;
  refresh_token?: string;
  scope?: string;
  error?: string;
  error_description?: string;
};

async function requestGoogleToken(params: URLSearchParams) {
  const response = await fetch(GOOGLE_TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params,
  });
  const payload = (await response.json()) as TokenResponse;
  if (!response.ok) {
    throw new Error(payload.error_description || payload.error || "Google no pudo completar la autorización.");
  }
  return payload;
}

export async function exchangeGoogleAuthorizationCode(input: { code: string; redirectUri: string }) {
  const config = getGoogleOAuthConfig();
  const payload = await requestGoogleToken(
    new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code: input.code,
      grant_type: "authorization_code",
      redirect_uri: input.redirectUri,
    })
  );
  if (!payload.refresh_token) {
    throw new Error("Google no devolvió una autorización renovable. Volvé a conectar la cuenta y aceptá los permisos.");
  }
  return { refreshToken: payload.refresh_token, scope: payload.scope ?? GOOGLE_DRIVE_FILE_SCOPE };
}

export async function refreshGoogleAccessToken(encryptedRefreshToken: string) {
  const config = getGoogleOAuthConfig();
  const payload = await requestGoogleToken(
    new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      refresh_token: decryptGoogleRefreshToken(encryptedRefreshToken),
      grant_type: "refresh_token",
    })
  );
  if (!payload.access_token) throw new Error("Google no devolvió un token de acceso válido.");
  return payload.access_token;
}
