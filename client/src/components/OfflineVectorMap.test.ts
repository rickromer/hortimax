import { describe, expect, it } from "vitest";
import { createOfflineMapStyle, latitudeToTileY, longitudeToTileX, resolveOfflineInitialView } from "./OfflineVectorMap";

describe("mapa vectorial offline", () => {
  it("calcula el mosaico del centro de Paraguay", () => {
    expect(longitudeToTileX(-58.448255, 6)).toBe(21);
    expect(latitudeToTileY(-23.448435, 6)).toBe(36);
  });

  it("incluye la capa vial de las rutas locales", () => {
    const style = createOfflineMapStyle();
    const roads = style.layers?.find(layer => layer.id === "roads");
    expect(style.sources.paraguay.type).toBe("geojson");
    expect(roads && "filter" in roads ? roads.filter : null).toEqual(["==", ["get", "_layer"], "streets"]);
  });

  it("prioriza el cliente o GPS para que el mapa offline abra a zoom vial", () => {
    expect(resolveOfflineInitialView({ latitude: -25.44, longitude: -56.44 })).toEqual({ center: [-56.44, -25.44], zoom: 14 });
  });
});
