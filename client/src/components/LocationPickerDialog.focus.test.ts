/* @vitest-environment jsdom */
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const focusValues = vi.hoisted(() => [] as Array<{ latitude: number; longitude: number } | null | undefined>);

vi.mock("@/components/ClientMap", () => ({
  ClientMap: ({ focus }: { focus?: { latitude: number; longitude: number } | null }) => {
    focusValues.push(focus);
    return createElement("div", { "data-testid": "mock-map" });
  },
}));

vi.mock("@/components/ui/button", () => ({
  Button: ({ children, ...props }: { children: React.ReactNode }) => createElement("button", props, children),
}));

import { LocationPickerDialog } from "./LocationPickerDialog";

describe("LocationPickerDialog ante actualizaciones GPS", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    focusValues.length = 0;
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    document.body.innerHTML = "";
  });

  it("mantiene el centro manual cuando cambia la posición GPS mientras el selector sigue abierto", async () => {
    const initial = { latitude: -25.3963, longitude: -56.1422 };
    const gpsUpdate = { latitude: -25.4079, longitude: -56.1558 };
    const props = {
      open: true,
      initialCoords: initial,
      onOpenChange: vi.fn(),
      onConfirm: vi.fn(),
    };

    await act(async () => root.render(createElement(LocationPickerDialog, props)));
    expect(focusValues.at(-1)).toEqual(initial);

    await act(async () => root.render(createElement(LocationPickerDialog, { ...props, initialCoords: gpsUpdate })));
    expect(focusValues.at(-1)).toEqual(initial);
  });
});
