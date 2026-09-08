import { describe, expect, it } from "vitest";
import { offlinePreloadKey } from "./OfflineDataPreloader";

describe("precarga offline por cartera", () => {
  it("distingue usuarios y vuelve a precargar cuando la cartera cambia", () => {
    expect(offlinePreloadKey(12, [{ id: 3 }, { id: 1 }])).toBe("12:1,3");
    expect(offlinePreloadKey(13, [{ id: 1 }, { id: 3 }])).toBe("13:1,3");
    expect(offlinePreloadKey(12, [{ id: 1 }, { id: 3 }, { id: 7 }])).toBe("12:1,3,7");
  });
});
