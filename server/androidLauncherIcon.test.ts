import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const projectRoot = path.resolve(import.meta.dirname, "..");
const androidRes = path.join(projectRoot, "android", "app", "src", "main", "res");

describe("ícono launcher Android HORTIMAX", () => {
  it("declara los íconos launcher y redondo en el manifiesto", () => {
    const manifest = readFileSync(
      path.join(projectRoot, "android", "app", "src", "main", "AndroidManifest.xml"),
      "utf8"
    );

    expect(manifest).toContain('android:icon="@mipmap/ic_launcher"');
    expect(manifest).toContain('android:roundIcon="@mipmap/ic_launcher_round"');
  });

  it("incluye recursos PNG para cada densidad de launcher y foreground adaptativo", () => {
    for (const density of ["mdpi", "hdpi", "xhdpi", "xxhdpi", "xxxhdpi"]) {
      for (const name of ["ic_launcher.png", "ic_launcher_round.png", "ic_launcher_foreground.png"]) {
        const resource = path.join(androidRes, `mipmap-${density}`, name);
        expect(existsSync(resource), resource).toBe(true);
        expect(readFileSync(resource).subarray(1, 4).toString("ascii")).toBe("PNG");
      }
    }
  });
});
