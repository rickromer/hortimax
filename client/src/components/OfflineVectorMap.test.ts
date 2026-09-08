import { describe, expect, it } from "vitest";
import { AndroidAssetBlobSource, BrowserRangeSource, createOfflineMapStyle, latitudeToTileY, longitudeToTileX, parseOfflineTileUrl, resolveOfflineInitialView } from "./OfflineVectorMap";
import { afterEach, describe, expect, it, vi } from "vitest";

describe("mapa vectorial offline", () => {
  it("calcula el mosaico del centro de Paraguay", () => {
    expect(longitudeToTileX(-58.448255, 6)).toBe(21);
    expect(latitudeToTileY(-23.448435, 6)).toBe(36);
  });

  it("incluye la capa vial de las rutas locales", () => {
    const style = createOfflineMapStyle();
    const roads = style.layers?.find(layer => layer.id === "roads");
    const source = style.sources.paraguay;
    expect(style.sources.paraguay.type).toBe("vector");
    expect("tiles" in source ? source.tiles : null).toEqual([
      "pmtiles://hortimax-native-asset:paraguay-shortbread-1.0.pmtiles/{z}/{x}/{y}",
    ]);
    expect(roads && "source-layer" in roads ? roads["source-layer"] : null).toBe("streets");
  });

  it("interpreta las solicitudes del protocolo PMTiles compatible con MapLibre", () => {
    expect(parseOfflineTileUrl("pmtiles://hortimax-native-asset:paraguay-shortbread-1.0.pmtiles/14/5683/9407")).toEqual({ archiveKey: "hortimax-native-asset:paraguay-shortbread-1.0.pmtiles", z: 14, x: 5683, y: 9407 });
    expect(parseOfflineTileUrl("https://otro-mapa/14/5683/9407.pbf")).toBeNull();
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

  it("solicita solo el rango requerido cuando se usa el visor de diagnóstico", async () => {
    const originalFetch = globalThis.fetch;
    const fetchMock = vi.fn().mockResolvedValue(new Response(new Uint8Array([1, 2]), { status: 206 }));
    globalThis.fetch = fetchMock;

    const source = new BrowserRangeSource("https://local/offline/paraguay.pmtiles");
    expect([...new Uint8Array((await source.getBytes(10, 2)).data)]).toEqual([1, 2]);
    expect(fetchMock).toHaveBeenCalledWith("https://local/offline/paraguay.pmtiles", {
      headers: { Range: "bytes=10-11" },
    });
    globalThis.fetch = originalFetch;
  });

  it("vincula el estilo a una URL local HTTP compatible con workers MapLibre", () => {
    const style = createOfflineMapStyle("http://127.0.0.1:43121/paraguay-shortbread-1.0.pmtiles");
    const source = style.sources.paraguay;
    expect("tiles" in source ? source.tiles : null).toEqual([
      "pmtiles://http://127.0.0.1:43121/paraguay-shortbread-1.0.pmtiles/{z}/{x}/{y}",
    ]);
  });
});
