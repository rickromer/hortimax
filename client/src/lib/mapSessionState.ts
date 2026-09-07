export type MapCoordinates = {
  latitude: number;
  longitude: number;
};

export type SavedMapView = {
  center: MapCoordinates;
  selectedId: number | null;
  zoom?: number;
};

export const MAP_GPS_AFTER_LOGIN_KEY = "hortimax-map-gps-after-login-v1";
export const MAP_VIEW_KEY = "hortimax-map-view-v1";

function browserSessionStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

function validCoordinates(value: unknown): value is MapCoordinates {
  if (!value || typeof value !== "object") return false;
  const { latitude, longitude } = value as Record<string, unknown>;
  return (
    typeof latitude === "number" &&
    Number.isFinite(latitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    typeof longitude === "number" &&
    Number.isFinite(longitude) &&
    longitude >= -180 &&
    longitude <= 180
  );
}

/** Marca explícitamente la única apertura de mapa que debe centrar GPS tras autenticar. */
export function requestGpsCenterAfterLogin(storage: Storage | null = browserSessionStorage()) {
  try {
    storage?.setItem(MAP_GPS_AFTER_LOGIN_KEY, "1");
  } catch {
    // El mapa mantiene su centro normal si el navegador bloquea el almacenamiento temporal.
  }
}

export function hasGpsCenterAfterLogin(storage: Storage | null = browserSessionStorage()) {
  try {
    return storage?.getItem(MAP_GPS_AFTER_LOGIN_KEY) === "1";
  } catch {
    return false;
  }
}

/** Consume el pedido una vez; los montajes siguientes del mapa no pueden recentrar por GPS. */
export function consumeGpsCenterAfterLogin(storage: Storage | null = browserSessionStorage()) {
  try {
    const requested = storage?.getItem(MAP_GPS_AFTER_LOGIN_KEY) === "1";
    storage?.removeItem(MAP_GPS_AFTER_LOGIN_KEY);
    return requested;
  } catch {
    return false;
  }
}

export function saveMapView(
  view: SavedMapView,
  storage: Storage | null = browserSessionStorage()
) {
  if (!validCoordinates(view.center)) return;
  try {
    storage?.setItem(MAP_VIEW_KEY, JSON.stringify(view));
  } catch {
    // La vista anterior no es indispensable para operar el portal.
  }
}

export function readSavedMapView(storage: Storage | null = browserSessionStorage()): SavedMapView | null {
  try {
    const raw = storage?.getItem(MAP_VIEW_KEY);
    if (!raw) return null;
    const value = JSON.parse(raw) as Partial<SavedMapView>;
    if (!validCoordinates(value.center)) return null;
    return {
      center: value.center,
      selectedId: Number.isInteger(value.selectedId) && Number(value.selectedId) > 0
        ? Number(value.selectedId)
        : null,
      zoom:
        typeof value.zoom === "number" && Number.isFinite(value.zoom) && value.zoom >= 2 && value.zoom <= 21
          ? value.zoom
          : undefined,
    };
  } catch {
    return null;
  }
}

export function clearSavedMapView(storage: Storage | null = browserSessionStorage()) {
  try {
    storage?.removeItem(MAP_VIEW_KEY);
  } catch {
    // No hay información sensible persistida ni una acción adicional necesaria.
  }
}
