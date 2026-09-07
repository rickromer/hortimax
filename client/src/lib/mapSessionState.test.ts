import {
  clearSavedMapView,
  consumeGpsCenterAfterLogin,
  consumeRequestedMapFocus,
  hasGpsCenterAfterLogin,
  MAP_FOCUS_REQUEST_KEY,
  MAP_GPS_AFTER_LOGIN_KEY,
  MAP_VIEW_KEY,
  requestMapFocus,
  readSavedMapView,
  requestGpsCenterAfterLogin,
  saveMapView,
} from "./mapSessionState";
import { describe, expect, it } from "vitest";

class MemoryStorage implements Storage {
  private values = new Map<string, string>();

  get length() {
    return this.values.size;
  }

  clear() {
    this.values.clear();
  }

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  key(index: number) {
    return [...this.values.keys()][index] ?? null;
  }

  removeItem(key: string) {
    this.values.delete(key);
  }

  setItem(key: string, value: string) {
    this.values.set(key, String(value));
  }
}

describe("estado de sesión del mapa", () => {
  it("consume el centrado GPS solicitado por login exactamente una vez", () => {
    const storage = new MemoryStorage();

    requestGpsCenterAfterLogin(storage);

    expect(storage.getItem(MAP_GPS_AFTER_LOGIN_KEY)).toBe("1");
    expect(hasGpsCenterAfterLogin(storage)).toBe(true);
    expect(consumeGpsCenterAfterLogin(storage)).toBe(true);
    expect(hasGpsCenterAfterLogin(storage)).toBe(false);
    expect(consumeGpsCenterAfterLogin(storage)).toBe(false);
  });

  it("recupera el centro y cliente seleccionado al volver de una ficha", () => {
    const storage = new MemoryStorage();
    const view = {
      center: { latitude: -25.2844, longitude: -57.6359 },
      selectedId: 42,
      zoom: 15,
    };

    saveMapView(view, storage);

    expect(readSavedMapView(storage)).toEqual(view);
  });

  it("transfiere una vez el punto elegido desde la ficha al mapa", () => {
    const storage = new MemoryStorage();
    const request = { siteId: 42, latitude: -25.2844, longitude: -57.6359 };

    requestMapFocus(request, storage);

    expect(storage.getItem(MAP_FOCUS_REQUEST_KEY)).not.toBeNull();
    expect(consumeRequestedMapFocus(storage)).toEqual(request);
    expect(consumeRequestedMapFocus(storage)).toBeNull();
  });

  it("elimina el destino de ficha una vez consumido para que no afecte futuras aperturas", () => {
    const storage = new MemoryStorage();
    requestMapFocus({ siteId: 9, latitude: -25.3, longitude: -57.6 }, storage);

    consumeRequestedMapFocus(storage);

    expect(storage.getItem(MAP_FOCUS_REQUEST_KEY)).toBeNull();
  });

  it("rechaza ubicaciones inválidas y permite limpiar la vista anterior al iniciar una sesión", () => {
    const storage = new MemoryStorage();
    storage.setItem(MAP_VIEW_KEY, JSON.stringify({ center: { latitude: 120, longitude: 0 } }));

    expect(readSavedMapView(storage)).toBeNull();

    saveMapView({ center: { latitude: -25.3, longitude: -57.6 }, selectedId: 8 }, storage);
    clearSavedMapView(storage);
    expect(readSavedMapView(storage)).toBeNull();
  });
});
