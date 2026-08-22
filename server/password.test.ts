import { describe, expect, it } from "vitest";
import { generateActivationCode, hashPassword, normalizeUsername, verifyPassword } from "./password";

describe("hash de contraseñas", () => {
  it("genera un hash con formato scrypt y sal aleatoria", async () => {
    const hash = await hashPassword("clave-segura");
    const otro = await hashPassword("clave-segura");
    expect(hash.startsWith("scrypt:")).toBe(true);
    expect(hash.split(":")).toHaveLength(3);
    expect(hash).not.toBe(otro);
  });

  it("verifica correctamente la contraseña original", async () => {
    const hash = await hashPassword("Fertilizante2026");
    await expect(verifyPassword("Fertilizante2026", hash)).resolves.toBe(true);
    await expect(verifyPassword("otra-clave", hash)).resolves.toBe(false);
  });

  it("rechaza hashes ausentes o con formato inválido", async () => {
    await expect(verifyPassword("x", null)).resolves.toBe(false);
    await expect(verifyPassword("x", "")).resolves.toBe(false);
    await expect(verifyPassword("x", "md5:abc:def")).resolves.toBe(false);
    await expect(verifyPassword("x", "solo-texto")).resolves.toBe(false);
  });
});

describe("código de activación", () => {
  it("tiene la longitud pedida y evita caracteres ambiguos", () => {
    const code = generateActivationCode(6);
    expect(code).toHaveLength(6);
    expect(code).toMatch(/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]+$/);
    expect(code).not.toMatch(/[IO01]/);
  });
});

describe("normalización de usuarios", () => {
  it("pasa a minúsculas y quita acentos y espacios", () => {
    expect(normalizeUsername("  José Pérez ")).toBe("joseperez");
    expect(normalizeUsername("Ñandú")).toBe("nandu");
    expect(normalizeUsername("j.perez_01-ok")).toBe("j.perez_01-ok");
  });

  it("descarta caracteres no permitidos", () => {
    expect(normalizeUsername("juan@empresa.com")).toBe("juanempresa.com");
    expect(normalizeUsername("!!!")).toBe("");
  });
});
