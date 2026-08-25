import { describe, expect, it } from "vitest";
import { shouldApplyInitialPickerPosition } from "./locationPickerFocus";

describe("shouldApplyInitialPickerPosition", () => {
  it("centra al abrir por primera vez, pero no con actualizaciones GPS posteriores", () => {
    expect(shouldApplyInitialPickerPosition(true, false)).toBe(true);
    expect(shouldApplyInitialPickerPosition(true, true)).toBe(false);
  });

  it("permite inicializar otra vez después de cerrar el selector", () => {
    expect(shouldApplyInitialPickerPosition(false, true)).toBe(false);
    expect(shouldApplyInitialPickerPosition(true, false)).toBe(true);
  });
});
