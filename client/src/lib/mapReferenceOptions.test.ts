import { describe, expect, it } from "vitest";
import { READ_ONLY_MAP_REFERENCE_OPTIONS } from "./mapReferenceOptions";

describe("referencias de mapa de solo lectura", () => {
  it("mantiene desactivada la interacción de iconos de lugares de Google", () => {
    expect(READ_ONLY_MAP_REFERENCE_OPTIONS.clickableIcons).toBe(false);
  });
});
