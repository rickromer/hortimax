import { describe, expect, it } from "vitest";
import {
  googleMapsPointUrl,
  parsePointCoordinates,
  pointShareText,
  whatsappPointUrl,
  wazePointUrl,
} from "./locationLinks";

const punto = { latitude: -25.2637, longitude: -57.5759 };

describe("enlaces de ubicación de puntos", () => {
  it("acepta coordenadas manuales con coma decimal y rechaza rangos inválidos", () => {
    expect(parsePointCoordinates("-25,2637", "-57,5759")).toEqual(punto);
    expect(parsePointCoordinates("-91", "-57.5759")).toBeNull();
    expect(parsePointCoordinates("-25.2637", "181")).toBeNull();
  });

  it("crea un enlace de Google Maps con las coordenadas del punto", () => {
    expect(googleMapsPointUrl(punto)).toBe(
      "https://www.google.com/maps/search/?api=1&query=-25.2637%2C-57.5759"
    );
  });

  it("crea un enlace navegable a Waze", () => {
    expect(wazePointUrl(punto)).toBe("https://waze.com/ul?ll=-25.2637%2C-57.5759&navigate=yes");
  });

  it("incluye nombre y enlace de mapas en el texto para compartir", () => {
    expect(pointShareText("Estancia San Rafael", punto)).toContain("Punto: Estancia San Rafael");
    expect(whatsappPointUrl("Estancia San Rafael", punto)).toContain("https://wa.me/?text=");
  });
});
