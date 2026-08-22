import { describe, expect, it } from "vitest";
import { formatPy, toCsv } from "./csv";

describe("exportación CSV", () => {
  it("incluye BOM y la fila de encabezados", () => {
    const csv = toCsv(["Cliente", "Zona"], [["Estancia San Rafael", "Itapúa"]]);
    expect(csv.startsWith("\uFEFF")).toBe(true);
    expect(csv).toContain("Cliente,Zona");
    expect(csv).toContain("Estancia San Rafael,Itapúa");
  });

  it("escapa comas, comillas y saltos de línea", () => {
    const csv = toCsv(
      ["Nota"],
      [['Aplicación foliar, 40 ha']],
    );
    expect(csv).toContain('"Aplicación foliar, 40 ha"');

    const conComillas = toCsv(["Nota"], [['Dijo "volvemos el lunes"']]);
    expect(conComillas).toContain('"Dijo ""volvemos el lunes"""');

    const conSalto = toCsv(["Nota"], [["línea 1\nlínea 2"]]);
    expect(conSalto).toContain('"línea 1\nlínea 2"');
  });

  it("convierte valores nulos en celdas vacías", () => {
    const csv = toCsv(["A", "B", "C"], [[null, undefined, 0]]);
    expect(csv.split("\n")[1]).toBe(",,0");
  });
});

describe("formato de fecha para planillas", () => {
  it("devuelve cadena vacía cuando no hay fecha", () => {
    expect(formatPy(null)).toBe("");
    expect(formatPy(undefined)).toBe("");
  });

  it("usa el huso horario de Asunción", () => {
    // 2026-03-10T13:00:00Z equivale a las 10:00 en Paraguay (UTC-3).
    const texto = formatPy(new Date("2026-03-10T13:00:00Z"));
    expect(texto).toContain("10:00");
  });
});
