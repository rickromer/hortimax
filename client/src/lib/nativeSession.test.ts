import { describe, expect, it } from "vitest";

describe("sesión móvil", () => {
  it("reserva una clave independiente para la credencial del APK", () => {
    expect("hortimax-native-session-token-v1").toContain("native-session-token");
  });
});
