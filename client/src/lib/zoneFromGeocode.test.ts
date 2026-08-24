import { describe, expect, it } from "vitest";
import { zoneFromGeocode } from "./zoneFromGeocode";

describe("zoneFromGeocode", () => {
  it("prioriza distrito por encima de municipio y departamento", () => {
    expect(
      zoneFromGeocode([
        { long_name: "Central", types: ["administrative_area_level_1"] },
        { long_name: "Capiatá", types: ["administrative_area_level_2"] },
        { long_name: "Posta Ybycuá", types: ["administrative_area_level_3"] },
      ])
    ).toBe("Posta Ybycuá");
  });

  it("usa municipio cuando no recibe distrito", () => {
    expect(
      zoneFromGeocode([
        { long_name: "Alto Paraná", types: ["administrative_area_level_1"] },
        { long_name: "Minga Guazú", types: ["locality"] },
      ])
    ).toBe("Minga Guazú");
  });

  it("usa departamento solo como respaldo", () => {
    expect(zoneFromGeocode([{ long_name: "Itapúa", types: ["administrative_area_level_1"] }])).toBe(
      "Itapúa"
    );
  });

  it("devuelve nulo cuando no hay datos territoriales", () => {
    expect(zoneFromGeocode([{ long_name: "Ruta PY02", types: ["route"] }])).toBeNull();
  });
});
