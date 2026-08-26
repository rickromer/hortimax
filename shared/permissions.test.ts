import { describe, expect, it } from "vitest";
import { canOperateSite } from "./permissions";

describe("operación de clientes por rol", () => {
  it("permite al representante operar únicamente el punto que creó", () => {
    expect(canOperateSite("field", 10, 10)).toBe(true);
    expect(canOperateSite("field", 10, 20)).toBe(false);
  });

  it("mantiene el alcance total de gerencia y administración sin habilitar visitantes", () => {
    expect(canOperateSite("manager", 40, 20)).toBe(true);
    expect(canOperateSite("admin", 1, 20)).toBe(true);
    expect(canOperateSite("field", null, 10)).toBe(false);
  });
});
