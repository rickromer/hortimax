import { describe, expect, it } from "vitest";
import {
  GOOGLE_OAUTH_CALLBACK_PATH,
  buildGoogleAuthorizationUrl,
  decryptGoogleRefreshToken,
  encryptGoogleRefreshToken,
  getGoogleOAuthConfig,
  getGoogleOAuthReadiness,
} from "./googleOAuth";

describe("configuración OAuth personal de Google", () => {
  it("acepta las credenciales seguras y prepara la solicitud de autorización sin revelar secretos", () => {
    const readiness = getGoogleOAuthReadiness();
    expect(readiness).toEqual({ configured: true, clientIdLooksValid: true });

    const url = new URL(
      buildGoogleAuthorizationUrl({
        redirectUri: `https://mapaclientes-cqpci7xz.manus.space${GOOGLE_OAUTH_CALLBACK_PATH}`,
        state: "csrf-state-de-prueba",
      })
    );

    expect(url.origin).toBe("https://accounts.google.com");
    expect(url.pathname).toBe("/o/oauth2/v2/auth");
    expect(url.searchParams.get("response_type")).toBe("code");
    expect(url.searchParams.get("scope")).toBe("https://www.googleapis.com/auth/drive.file");
    expect(url.searchParams.get("access_type")).toBe("offline");
    expect(url.searchParams.get("redirect_uri")).toBe(
      "https://mapaclientes-cqpci7xz.manus.space/api/google/callback"
    );
  });

  it("es aceptado por el extremo OAuth de Google antes de iniciar la autorización", async () => {
    const config = getGoogleOAuthConfig();
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        code: "hortimax-credential-check-not-an-authorization-code",
        grant_type: "authorization_code",
        redirect_uri: `https://mapaclientes-cqpci7xz.manus.space${GOOGLE_OAUTH_CALLBACK_PATH}`,
      }),
    });
    const payload = (await response.json()) as { error?: string };

    expect(response.status).toBe(400);
    expect(payload.error).toBe("invalid_grant");
  });

  it("cifra el refresh token antes de persistirlo y permite recuperarlo solo en el servidor", () => {
    const original = "refresh-token-de-prueba-no-persistible";
    const encrypted = encryptGoogleRefreshToken(original);

    expect(encrypted).not.toContain(original);
    expect(decryptGoogleRefreshToken(encrypted)).toBe(original);
  });
});
