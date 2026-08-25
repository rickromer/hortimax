import { describe, expect, it } from "vitest";
import { territoryFromGeocode, zoneFromGeocode } from "./zoneFromGeocode";

describe("territoryFromGeocode", () => {
  it("separa departamento político de distrito o municipio", () => {
    expect(
      territoryFromGeocode([
        { long_name: "Central", types: ["administrative_area_level_1"] },
        { long_name: "Capiatá", types: ["administrative_area_level_2"] },
        { long_name: "Posta Ybycuá", types: ["administrative_area_level_3"] },
      ])
    ).toEqual({ department: "Central", locality: "Posta Ybycuá" });
  });

  it("usa municipio como localidad cuando no recibe distrito", () => {
    expect(
      territoryFromGeocode([
        { long_name: "Alto Paraná", types: ["administrative_area_level_1"] },
        { long_name: "Minga Guazú", types: ["locality"] },
      ])
    ).toEqual({ department: "Alto Paraná", locality: "Minga Guazú" });
  });

  it("conserva el departamento aunque no haya localidad", () => {
    expect(
      territoryFromGeocode([{ long_name: "Itapúa", types: ["administrative_area_level_1"] }])
    ).toEqual({ department: "Itapúa", locality: null });
  });

  it("mantiene una referencia local compatible para consumidores existentes", () => {
    expect(
      zoneFromGeocode([
        { long_name: "Caaguazú", types: ["administrative_area_level_1"] },
        { long_name: "R. I. Tres Corrales", types: ["locality"] },
      ])
    ).toBe("R. I. Tres Corrales");
    expect(zoneFromGeocode([{ long_name: "Ruta PY02", types: ["route"] }])).toBeNull();
  });
});
