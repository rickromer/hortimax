import { describe, expect, it } from "vitest";

const mobileOrigins = new Set(["http://localhost", "https://localhost", "capacitor://localhost"]);

describe("orígenes móviles permitidos", () => {
  it("admite solo los orígenes locales de Capacitor", () => {
    expect(mobileOrigins.has("http://localhost")).toBe(true);
    expect(mobileOrigins.has("https://localhost")).toBe(true);
    expect(mobileOrigins.has("capacitor://localhost")).toBe(true);
    expect(mobileOrigins.has("https://ejemplo.invalido")).toBe(false);
  });
});
