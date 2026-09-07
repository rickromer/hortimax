import { describe, expect, it } from "vitest";
import { AndroidAssetBlobSource, createOfflineMapStyle, latitudeToTileY, longitudeToTileX, resolveOfflineInitialView } from "./OfflineVectorMap";
import { afterEach, describe, expect, it, vi } from "vitest";

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

  it("lee el PMTiles empaquetado una sola vez y entrega rangos desde el Blob local", async () => {
    const originalFetch = globalThis.fetch;
    const fetchMock = vi.fn().mockResolvedValue(new Response(new Uint8Array([0, 1, 2, 3, 4])));
    globalThis.fetch = fetchMock;

    const source = new AndroidAssetBlobSource("capacitor://localhost/offline/paraguay.pmtiles");
    const first = new Uint8Array((await source.getBytes(1, 2)).data);
    const second = new Uint8Array((await source.getBytes(3, 2)).data);

    expect([...first]).toEqual([1, 2]);
    expect([...second]).toEqual([3, 4]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    globalThis.fetch = originalFetch;
  });
});
