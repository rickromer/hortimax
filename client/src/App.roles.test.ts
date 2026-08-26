/* @vitest-environment jsdom */
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const auth = vi.hoisted(() => ({ role: "manager" as "field" | "manager" | "admin", authenticated: true }));
const page = vi.hoisted(() => (label: string) => () => label);

vi.mock("@/_core/hooks/useAuth", () => ({
  useAuth: () => ({
    user: auth.authenticated ? { id: 10, role: auth.role, name: "Gerente", username: "gerente" } : null,
    loading: false,
    isAdmin: auth.role === "admin",
    canManageAll: auth.role === "admin" || auth.role === "manager",
    logout: vi.fn(),
  }),
}));
vi.mock("@/components/ui/sonner", () => ({ Toaster: () => null }));
vi.mock("@/components/ui/tooltip", () => ({ TooltipProvider: ({ children }: { children: unknown }) => children }));
vi.mock("./contexts/ThemeContext", () => ({ ThemeProvider: ({ children }: { children: unknown }) => children }));
vi.mock("./pages/FieldMap", () => ({ default: page("campo") }));
vi.mock("./pages/Login", () => ({ default: page("acceso") }));
vi.mock("./pages/admin/AdminOverview", () => ({ default: page("resumen") }));
vi.mock("./pages/admin/AdminMap", () => ({ default: page("mapa-admin") }));
vi.mock("./pages/admin/AdminClients", () => ({ default: page("clientes-admin") }));
vi.mock("./pages/admin/AdminClientDetail", () => ({ default: page("cliente-admin") }));
vi.mock("./pages/admin/AdminActivity", () => ({ default: page("actividad-admin") }));
vi.mock("./pages/admin/AdminUsers", () => ({ default: page("usuarios-admin") }));

import App from "./App";

describe("rutas de gestión comercial", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    auth.role = "manager";
    auth.authenticated = true;
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });
  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it("da al gerente acceso a resumen, mapa, clientes, detalle y actividad globales", async () => {
    const routes = [
      ["/admin", "resumen"], ["/admin/mapa", "mapa-admin"], ["/admin/clientes", "clientes-admin"],
      ["/admin/clientes/31", "cliente-admin"], ["/admin/actividad", "actividad-admin"],
    ];
    for (const [path, expected] of routes) {
      await act(async () => {
        window.history.replaceState({}, "", path);
        root.render(createElement(App));
      });
      expect(container.textContent).toContain(expected);
    }
  });

  it("mantiene Usuarios reservado a Administrador", async () => {
    await act(async () => {
      window.history.replaceState({}, "", "/admin/usuarios");
      root.render(createElement(App));
    });
    expect(container.textContent).not.toContain("usuarios-admin");
  });

  it("redirige mapa de campo a acceso cuando la sesión ya no existe", async () => {
    auth.authenticated = false;
    await act(async () => {
      window.history.replaceState({}, "", "/mapa");
      root.render(createElement(App));
    });
    expect(container.textContent).toContain("acceso");
    expect(container.textContent).not.toContain("campo");
  });
});
