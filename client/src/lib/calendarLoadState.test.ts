import { describe, expect, it } from "vitest";
import { getCalendarLoadState } from "./calendarLoadState";

describe("getCalendarLoadState", () => {
  it("prioriza un error para que el calendario no se presente falsamente como vacío", () => {
    expect(getCalendarLoadState({ isLoading: false, isError: true, entriesCount: 0 })).toBe("error");
  });

  it("distingue carga, vacío y datos disponibles", () => {
    expect(getCalendarLoadState({ isLoading: true, isError: false, entriesCount: 0 })).toBe("loading");
    expect(getCalendarLoadState({ isLoading: false, isError: false, entriesCount: 0 })).toBe("empty");
    expect(getCalendarLoadState({ isLoading: false, isError: false, entriesCount: 1 })).toBe("ready");
  });
});
