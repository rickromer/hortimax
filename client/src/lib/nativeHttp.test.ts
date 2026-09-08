import { describe, expect, it } from "vitest";
import { awaitWithTimeout } from "./nativeHttp";

describe("transporte HTTP nativo", () => {
  it("devuelve una respuesta que llega dentro del límite", async () => {
    await expect(awaitWithTimeout(Promise.resolve("ok"), 20)).resolves.toBe("ok");
  });

  it("rechaza una solicitud detenida en lugar de bloquear el arranque", async () => {
    await expect(awaitWithTimeout(new Promise<never>(() => {}), 10)).rejects.toThrow("tardó demasiado");
  });
});
