import { ONE_YEAR_MS } from "../shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { describe, expect, it } from "vitest";

describe("sesión persistente por dispositivo", () => {
  it("conserva la cookie hasta un año, igual que el token emitido tras un login válido", () => {
    const options = getSessionCookieOptions({
      protocol: "https",
      headers: {},
    } as any);

    expect(options).toMatchObject({
      maxAge: ONE_YEAR_MS,
      httpOnly: true,
      secure: true,
      sameSite: "none",
      path: "/",
    });
  });

  it("mantiene la cookie como host-only, evitando compartirla con otros subdominios", () => {
    const options = getSessionCookieOptions({
      protocol: "https",
      headers: {},
    } as any);

    expect(options.domain).toBeUndefined();
  });
});
