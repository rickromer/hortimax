import { describe, expect, it } from "vitest";
import { placeFromMapCenter, startMapPlacement } from "./mapPlacement";

describe("map placement mode", () => {
  it("inicia Nuevo punto desde el centro visible en vez del respaldo GPS", () => {
    const visibleCenter = { latitude: -25.43, longitude: -56.44 };
    const gps = { latitude: -25.28, longitude: -57.64, accuracy: 12 };

    expect(startMapPlacement(visibleCenter, gps)).toEqual(visibleCenter);
  });

  it("confirma una ubicación manual sin conservar la precisión del GPS", () => {
    expect(placeFromMapCenter({ latitude: -25.43, longitude: -56.44, accuracy: 9 })).toEqual({
      latitude: -25.43,
      longitude: -56.44,
      accuracy: undefined,
    });
  });
});
