import { beforeEach, describe, expect, it, vi } from "vitest";

const { dbMock, driveMock } = vi.hoisted(() => ({
  dbMock: {
    getSiteById: vi.fn(),
    getSiteGoogleSheet: vi.fn(),
    getGoogleConnection: vi.fn(),
  },
  driveMock: { createOrReuseProducerSpreadsheet: vi.fn() },
}));

vi.mock("./db", () => dbMock);
vi.mock("./googleDriveSheets", () => driveMock);

import { sheetsRouter } from "./routers/sheets";

const owner = {
  id: 17,
  openId: "field-owner",
  name: "Representante propietario",
  email: null,
  loginMethod: "password",
  role: "field" as const,
  username: "owner",
  passwordHash: "hash",
  mustChangePassword: false,
  activationCode: null,
  phone: null,
  zone: null,
  active: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignedIn: new Date(),
};

function callerFor(user = owner) {
  return sheetsRouter.createCaller({
    user,
    req: {} as any,
    res: {} as any,
  });
}

describe("sheets.forSite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dbMock.getGoogleConnection.mockResolvedValue({ id: 1 });
    dbMock.getSiteGoogleSheet.mockResolvedValue(null);
  });

  it("permite consultar la planilla de un Productor propio", async () => {
    dbMock.getSiteById.mockResolvedValue({ id: 30001, name: "Fermín", clientType: "Productor", createdBy: owner.id });

    await expect(callerFor().forSite({ siteId: 30001 })).resolves.toEqual({ connected: true, sheet: null });
  });

  it("bloquea a un Representante que intenta ver la planilla de otra cartera", async () => {
    dbMock.getSiteById.mockResolvedValue({ id: 30002, name: "Ajeno", clientType: "Productor", createdBy: 99 });

    await expect(callerFor().forSite({ siteId: 30002 })).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(dbMock.getSiteGoogleSheet).not.toHaveBeenCalled();
  });

  it("no permite crear planillas para tipos de cliente distintos de Productor", async () => {
    dbMock.getSiteById.mockResolvedValue({ id: 30003, name: "Revendedor", clientType: "Revendedor", createdBy: owner.id });

    await expect(callerFor().createForSite({ siteId: 30003 })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(driveMock.createOrReuseProducerSpreadsheet).not.toHaveBeenCalled();
  });
});
