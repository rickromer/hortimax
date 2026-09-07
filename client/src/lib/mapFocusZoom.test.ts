import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("zoom de cliente solicitado desde ficha", () => {
  it("solicita zoom de detalle al consumir un foco de ficha y lo propaga a ambos mapas", () => {
    const fieldMap = readFileSync(resolve(process.cwd(), "client/src/pages/FieldMap.tsx"), "utf8");
    const clientMap = readFileSync(resolve(process.cwd(), "client/src/components/ClientMap.tsx"), "utf8");
    const offlineMap = readFileSync(resolve(process.cwd(), "client/src/components/OfflineVectorMap.tsx"), "utf8");

    expect(fieldMap).toContain("setFocusZoom(17)");
    expect(fieldMap).toContain("focusZoom={focusZoom}");
    expect(clientMap).toContain("zoom: focus ? (focusZoom ?? initialZoom) : initialZoom");
    expect(offlineMap).toContain("zoom: focusZoom ?? 14");
  });
});
