import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("entrada de acceso publicada", () => {
  it("monta el campo autenticado en /acceso sin solicitar /mapa al borde", () => {
    const source = readFileSync(resolve(process.cwd(), "client/src/App.tsx"), "utf8");

    expect(source).toContain("function AccessEntry()");
    expect(source).toContain("return user ? <FieldMap /> : <Login />;");
    expect(source).toContain('<Route path="/acceso" component={AccessEntry} />');
  });
});
