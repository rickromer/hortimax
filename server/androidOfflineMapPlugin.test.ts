import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const source = readFileSync(
  resolve(process.cwd(), "android/app/src/main/java/py/hortimax/portal/OfflineMapAssetPlugin.java"),
  "utf8",
);

describe("OfflineMapAssetPlugin", () => {
  it("acepta los números JSON que Capacitor entrega desde el WebView", () => {
    expect(source).toContain('call.getDouble("offset", -1D)');
    expect(source).toContain('call.getDouble("length", 0D)');
    expect(source).not.toContain('call.getLong("offset", -1L)');
  });

  it("mantiene límites enteros para no leer fuera del PMTiles empaquetado", () => {
    expect(source).toContain("offsetValue != Math.floor(offsetValue)");
    expect(source).toContain("length > MAX_RANGE_BYTES");
  });
});
