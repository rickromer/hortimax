/* @vitest-environment jsdom */
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/_core/hooks/useAuth", () => ({
  useAuth: () => ({ user: null, isAdmin: false, canManageAll: false, logout: vi.fn() }),
}));

import { FieldShell } from "./FieldShell";

describe("FieldShell público", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it("no muestra el botón Ingresar cuando la experiencia temporal está abierta", async () => {
    await act(async () => root.render(createElement(FieldShell, null, "contenido")));
    expect(container.textContent).not.toContain("Ingresar");
    expect(container.textContent).toContain("Mapa");
    expect(container.textContent).toContain("Calendario");
  });
});
