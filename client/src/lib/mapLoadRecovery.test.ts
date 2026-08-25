import { describe, expect, it } from "vitest";
import { canRetryMapLoadAutomatically } from "./mapLoadRecovery";

describe("recuperación de carga del mapa", () => {
  it("realiza un único reintento automático ante un fallo transitorio", () => {
    expect(canRetryMapLoadAutomatically(0)).toBe(true);
    expect(canRetryMapLoadAutomatically(1)).toBe(false);
  });
});
