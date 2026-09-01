import { describe, expect, it } from "vitest";
import { createClientRequestId, isOffline } from "./offlineQueue";

describe("offlineQueue", () => {
  it("genera identificadores válidos y distintos para operaciones reintentables", () => {
    const first = createClientRequestId();
    const second = createClientRequestId();
    expect(first).toMatch(/^offline_[a-zA-Z0-9_-]+$/);
    expect(second).toMatch(/^offline_[a-zA-Z0-9_-]+$/);
    expect(first).not.toBe(second);
  });

  it("no declara falta de señal cuando navigator no está disponible", () => {
    expect(isOffline()).toBe(false);
  });
});
