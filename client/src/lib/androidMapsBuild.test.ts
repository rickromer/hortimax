import { describe, expect, it } from "vitest";
import packageJson from "../../../package.json";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("compilación Android con Google Maps directo", () => {
  it("inyecta la clave Android en el manifiesto nativo sin escribir su valor en el repositorio", () => {
    const script = packageJson.scripts["cap:sync"];
    const gradle = readFileSync(resolve(process.cwd(), "android/app/build.gradle"), "utf8");
    const manifest = readFileSync(resolve(process.cwd(), "android/app/src/main/AndroidManifest.xml"), "utf8");

    expect(script).toContain("VITE_GOOGLE_MAPS_API_KEY=\"$VITE_CAPACITOR_GOOGLE_MAPS_API_KEY\"");
    expect(script).toContain("VITE_CAPACITOR_BUILD=true");
    expect(script).toContain("pnpm build");
    expect(gradle).toContain("System.getenv(\"VITE_CAPACITOR_GOOGLE_MAPS_API_KEY\")");
    expect(manifest).toContain("com.google.android.geo.API_KEY");
    expect(manifest).toContain("${googleMapsApiKey}");
  });
});
