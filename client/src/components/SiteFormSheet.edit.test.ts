/* @vitest-environment jsdom */
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/components/ui/button", () => ({
  Button: ({ children, ...props }: { children: React.ReactNode }) => createElement("button", props, children),
}));
vi.mock("@/components/ui/dialog", () => ({
  Dialog: ({ children, open }: { children: React.ReactNode; open: boolean }) => open ? createElement("div", null, children) : null,
  DialogContent: ({ children }: { children: React.ReactNode }) => createElement("div", null, children),
  DialogDescription: ({ children }: { children: React.ReactNode }) => createElement("p", null, children),
  DialogFooter: ({ children }: { children: React.ReactNode }) => createElement("div", null, children),
  DialogHeader: ({ children }: { children: React.ReactNode }) => createElement("div", null, children),
  DialogTitle: ({ children }: { children: React.ReactNode }) => createElement("h2", null, children),
}));
vi.mock("@/components/ui/input", () => ({ Input: (props: React.InputHTMLAttributes<HTMLInputElement>) => createElement("input", props) }));
vi.mock("@/components/ui/label", () => ({ Label: ({ children, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) => createElement("label", props, children) }));
vi.mock("@/components/ui/textarea", () => ({ Textarea: (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => createElement("textarea", props) }));
vi.mock("@/components/ui/select", () => ({
  Select: ({ children }: { children: React.ReactNode }) => createElement("div", null, children),
  SelectContent: ({ children }: { children: React.ReactNode }) => createElement("div", null, children),
  SelectItem: ({ children }: { children: React.ReactNode }) => createElement("div", null, children),
  SelectTrigger: ({ children }: { children: React.ReactNode }) => createElement("button", { type: "button" }, children),
  SelectValue: () => null,
}));
vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({ sites: { list: { invalidate: vi.fn() }, nearby: { invalidate: vi.fn() }, detail: { invalidate: vi.fn() } } }),
    admin: { catalog: { useQuery: () => ({ data: { clientTypes: [], departments: [], zones: [] } }) } },
    sites: {
      create: { useMutation: () => ({ isPending: false, mutate: vi.fn() }) },
      update: { useMutation: () => ({ isPending: false, mutate: vi.fn() }) },
    },
  },
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import { SiteFormSheet } from "./SiteFormSheet";

describe("SiteFormSheet en edición", () => {
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

  it("permite borrar texto y conserva el cambio ante un render externo del mismo cliente", async () => {
    const initial = { id: 120001, name: "Comite de Productores RI3", clientType: "Cooperativa" };
    const props = { open: true, onOpenChange: vi.fn(), coords: null, initial, mode: "edit" as const };

    await act(async () => root.render(createElement(SiteFormSheet, props)));
    const input = container.querySelector<HTMLInputElement>("#site-name")!;
    const valueSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
    valueSetter?.call(input, "");
    await act(async () => input.dispatchEvent(new Event("input", { bubbles: true })));
    expect(input.value).toBe("");

    await act(async () => root.render(createElement(SiteFormSheet, { ...props, initial: { ...initial } })));
    expect(container.querySelector<HTMLInputElement>("#site-name")?.value).toBe("");
  });

  it("muestra Departamento y Distrito/Municipio como datos bloqueados por la ubicación", async () => {
    await act(async () => root.render(createElement(SiteFormSheet, {
      open: true,
      onOpenChange: vi.fn(),
      coords: null,
      mode: "edit",
      initial: {
        id: 120001,
        name: "Comite de Productores RI3",
        department: "Caaguazú",
        zone: "R. I. Tres Corrales",
      },
    })));

    expect(container.querySelector<HTMLInputElement>("#site-department")?.readOnly).toBe(true);
    expect(container.querySelector<HTMLInputElement>("#site-zone")?.readOnly).toBe(true);
  });
});
