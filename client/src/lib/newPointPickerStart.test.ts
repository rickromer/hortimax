import { describe, expect, it } from "vitest";
import { resolveNewPointPickerStart } from "./newPointPickerStart";

describe("resolveNewPointPickerStart", () => {
  it("prioriza el centro visible que el usuario dejó en el mapa por encima del GPS", () => {
    const gps = { latitude: -25.28, longitude: -57.64 };
    const movedMapCenter = { latitude: -25.43, longitude: -56.44 };

    expect(
      resolveNewPointPickerStart({ visibleMapCenter: movedMapCenter, userPosition: gps })
    ).toEqual(movedMapCenter);
  });

  it("mantiene una selección manual previa por encima del centro del mapa", () => {
    const manualCoords = { latitude: -25.39, longitude: -56.14 };
    const visibleMapCenter = { latitude: -25.43, longitude: -56.44 };

    expect(resolveNewPointPickerStart({ manualCoords, visibleMapCenter })).toEqual(manualCoords);
  });
});
