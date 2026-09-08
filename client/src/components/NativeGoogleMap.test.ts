import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const source = readFileSync(resolve(process.cwd(), "client/src/components/NativeGoogleMap.tsx"), "utf8");

describe("Google Maps nativo Android", () => {
  it("crea un mapa Google nativo y conserva gestos, pines y cámara", () => {
    expect(source).toContain('from "@capacitor/google-maps"');
    expect(source).toContain("GoogleMap.create");
    expect(source).toContain("map.enableTouch()");
    expect(source).toContain("map.addMarkers(items)");
    expect(source).toContain("map.setOnMapClickListener");
  });
});
