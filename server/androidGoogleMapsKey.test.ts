import { describe, expect, it } from "vitest";

describe("clave Google Maps para APK Android", () => {
  it("acepta el origen local del WebView para Maps JavaScript API", async () => {
    const apiKey = process.env.VITE_CAPACITOR_GOOGLE_MAPS_API_KEY;

    expect(apiKey).toBeTruthy();

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey!)}&v=weekly`,
      {
        headers: {
          Referer: "http://localhost/",
        },
      }
    );
    const script = await response.text();

    expect(response.status).toBe(200);
    expect(script).not.toContain("Google Maps JavaScript API error");
    expect(script).not.toContain("RefererNotAllowedMapError");
    expect(script).not.toContain("InvalidKeyMapError");
  }, 15_000);
});
