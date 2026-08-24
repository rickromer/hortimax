import { describe, expect, it } from "vitest";
import { mapClickToCoordinates } from "./mapClick";

describe("selección manual en el mapa", () => {
  it("convierte un toque de Google Maps a coordenadas del nuevo punto", () => {
    expect(
      mapClickToCoordinates({ latLng: { lat: () => -25.2637, lng: () => -57.5759 } })
    ).toEqual({ latitude: -25.2637, longitude: -57.5759 });
  });

  it("ignora clics sin coordenadas", () => {
    expect(mapClickToCoordinates({ latLng: null })).toBeNull();
    expect(mapClickToCoordinates(undefined)).toBeNull();
  });
});
