import { describe, expect, it } from "vitest";
import {
  formatMapBytes,
  isCompleteOfflineMap,
  OFFLINE_MAP_EXPECTED_BYTES,
} from "./offlineMapStorage";

describe("paquete cartográfico offline para PWA", () => {
  it("muestra el tamaño esperado del mapa completo de Paraguay", () => {
    expect(formatMapBytes(OFFLINE_MAP_EXPECTED_BYTES)).toBe("167 MB");
  });

  it("rechaza una descarga incompleta antes de activar el visor vectorial", () => {
    expect(isCompleteOfflineMap(OFFLINE_MAP_EXPECTED_BYTES * 0.89)).toBe(false);
    expect(isCompleteOfflineMap(OFFLINE_MAP_EXPECTED_BYTES * 0.9)).toBe(true);
  });
});
