import { describe, expect, it } from "vitest";
import { shouldShowInitialSetup } from "./loginScreenMode";

describe("pantalla de acceso", () => {
  it("prioriza iniciar sesión aunque el backend reporte configuración pendiente", () => {
    expect(shouldShowInitialSetup(true, "")).toBe(false);
  });

  it("solo habilita la configuración inicial con el parámetro explícito de mantenimiento", () => {
    expect(shouldShowInitialSetup(true, "?setup=1")).toBe(true);
    expect(shouldShowInitialSetup(false, "?setup=1")).toBe(false);
  });
});
