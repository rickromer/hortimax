import { describe, expect, it } from "vitest";
import packageJson from "../../../package.json";

describe("compilación Android con Google Maps directo", () => {
  it("inyecta la clave Android solo en el bundle de Capacitor", () => {
    const script = packageJson.scripts["cap:sync"];

    expect(script).toContain("VITE_GOOGLE_MAPS_API_KEY=\"$VITE_CAPACITOR_GOOGLE_MAPS_API_KEY\"");
    expect(script).toContain("VITE_CAPACITOR_BUILD=true");
    expect(script).toContain("pnpm build");
  });
});
