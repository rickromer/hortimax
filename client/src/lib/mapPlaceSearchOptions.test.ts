import { describe, expect, it } from "vitest";
import { canQueryMapPlaces, PARAGUAY_PLACE_RESTRICTION } from "./mapPlaceSearchOptions";

describe("map place search options", () => {
  it("restringe las sugerencias de lugares a Paraguay", () => {
    expect(PARAGUAY_PLACE_RESTRICTION).toEqual({ country: "py" });
  });

  it("evita búsquedas vacías, cortas o sin mapa listo", () => {
    expect(canQueryMapPlaces("a", true)).toBe(false);
    expect(canQueryMapPlaces("Caaguazú", false)).toBe(false);
    expect(canQueryMapPlaces("Caaguazú", true)).toBe(true);
  });
});
