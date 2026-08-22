import { describe, expect, it } from "vitest";
import {
  DEFAULT_CLIENT_TYPES,
  DEFAULT_ZONES,
  NEARBY_RADIUS_METERS,
  PARAGUAY_CENTER,
  distanceMeters,
  formatDateTimePy,
} from "@shared/domain";

describe("geografía de Paraguay", () => {
  it("centra el mapa dentro del territorio paraguayo", () => {
    expect(PARAGUAY_CENTER.lat).toBeLessThan(-19);
    expect(PARAGUAY_CENTER.lat).toBeGreaterThan(-28);
    expect(PARAGUAY_CENTER.lng).toBeLessThan(-54);
    expect(PARAGUAY_CENTER.lng).toBeGreaterThan(-63);
  });

  it("incluye Asunción y los tipos productor y revendedor", () => {
    expect(DEFAULT_ZONES).toContain("Asunción");
    expect(DEFAULT_ZONES).toContain("Itapúa");
    expect(DEFAULT_CLIENT_TYPES).toContain("Productor");
    expect(DEFAULT_CLIENT_TYPES).toContain("Revendedor");
  });
});

describe("distancia entre coordenadas", () => {
  it("devuelve cero para el mismo punto", () => {
    const p = { lat: -25.2637, lng: -57.5759 };
    expect(distanceMeters(p, p)).toBe(0);
  });

  it("calcula la distancia Asunción–Ciudad del Este con margen razonable", () => {
    const asuncion = { lat: -25.2637, lng: -57.5759 };
    const cde = { lat: -25.5163, lng: -54.6114 };
    const d = distanceMeters(asuncion, cde) / 1000;
    expect(d).toBeGreaterThan(290);
    expect(d).toBeLessThan(310);
  });

  it("detecta puntos dentro del radio de cercanía", () => {
    const base = { lat: -25.2637, lng: -57.5759 };
    // ~100 m al norte
    const cerca = { lat: -25.26280, lng: -57.5759 };
    expect(distanceMeters(base, cerca)).toBeLessThan(NEARBY_RADIUS_METERS);
  });
});

describe("cabecera de nota", () => {
  it("incluye fecha y hora en horario paraguayo", () => {
    const texto = formatDateTimePy(new Date("2026-03-10T13:00:00Z"));
    expect(texto).toContain("10");
    expect(texto).toMatch(/\d{1,2}\/\d{1,2}\/\d{2,4}/);
  });
});

