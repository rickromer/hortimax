/* @vitest-environment jsdom */
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const query = vi.hoisted(() => ({ refetch: vi.fn() }));

vi.mock("@/components/FieldShell", () => ({
  FieldShell: ({ children }: { children: React.ReactNode }) => createElement("main", null, children),
}));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    calendar: {
      timeline: {
        useQuery: () => ({
          data: undefined,
          isLoading: false,
          isError: true,
          refetch: query.refetch,
        }),
      },
    },
  },
}));

import TeamCalendar from "./TeamCalendar";

describe("TeamCalendar cuando falla la consulta pública", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    query.refetch.mockClear();
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it("muestra el error y ejecuta Reintentar en lugar de la agenda vacía", async () => {
    await act(async () => root.render(createElement(TeamCalendar)));
    const retryButton = Array.from(container.querySelectorAll("button")).find(button =>
      button.textContent?.includes("Reintentar")
    );

    expect(container.textContent).toContain("No se pudo cargar el calendario");
    expect(container.textContent).toContain("Verificá la conexión e intentá nuevamente.");
    expect(container.textContent).not.toContain("Todavía no hay registros");
    expect(retryButton).toBeDefined();

    await act(async () => retryButton?.dispatchEvent(new MouseEvent("click", { bubbles: true })));
    expect(query.refetch).toHaveBeenCalledTimes(1);
  });
});
