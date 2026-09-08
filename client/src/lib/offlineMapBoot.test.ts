import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("arranque del mapa local Android", () => {
  it("abre el servidor loopback solo cuando MapLibre solicita el mapa", () => {
    const source = readFileSync(
      resolve(process.cwd(), "android/app/src/main/java/py/hortimax/portal/OfflineMapAssetPlugin.java"),
      "utf8"
    );

    expect(source).not.toContain("void load()");
    expect(source).toContain("void getMapUrl(PluginCall call)");
    expect(source).toContain("new OfflineMapHttpServer(getContext())");
    expect(source).toContain("localServer.getUrl()");
  });
});
