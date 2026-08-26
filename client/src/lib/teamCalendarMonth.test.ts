import { describe, expect, it } from "vitest";
import { buildCalendarMonth, calendarDayKey, shiftCalendarMonth } from "./teamCalendarMonth";

describe("calendario mensual del equipo", () => {
  it("crea una grilla semanal completa que comienza en lunes", () => {
    const cells = buildCalendarMonth(new Date(2026, 7, 1, 12));
    expect(cells).toHaveLength(42);
    expect(cells[0].key).toBe("2026-07-27");
    expect(cells.some(cell => cell.key === "2026-08-01" && cell.inMonth)).toBe(true);
  });

  it("desplaza el cursor de mes sin conservar el día anterior", () => {
    const next = shiftCalendarMonth(new Date(2026, 0, 31, 12), 1);
    expect(next.getFullYear()).toBe(2026);
    expect(next.getMonth()).toBe(1);
    expect(next.getDate()).toBe(1);
    expect(calendarDayKey(new Date(2026, 7, 25, 12))).toBe("2026-08-25");
  });
});
