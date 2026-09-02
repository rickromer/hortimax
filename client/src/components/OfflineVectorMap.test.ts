import { describe, expect, it } from "vitest";
import {
  createOfflineMapStyle,
  latitudeToTileY,
  longitudeToTileX,
} from "./OfflineVectorMap";

describe("mapa vectorial offline", () => {
  it("calcula el mosaico del centro de Paraguay", () => {
    expect(longitudeToTileX(-58.448255, 6)).toBe(21);
    expect(latitudeToTileY(-23.448435, 6)).toBe(36);
  });

  it("usa la capa real de calles para las rutas offline", () => {
    const style = createOfflineMapStyle();
    const roads = style.layers?.find(layer => layer.id === "roads");
    const casing = style.layers?.find(layer => layer.id === "road-casing");

    expect(style.sources.paraguay.type).toBe("geojson");
    expect(roads && "filter" in roads ? roads.filter : null).toEqual([
      "==",
      ["get", "_layer"],
      "streets",
    ]);
    expect(casing && "filter" in casing ? casing.filter : null).toEqual([
      "==",
      ["get", "_layer"],
      "streets",
    ]);
  });
});
