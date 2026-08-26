export type MapCoordinates = {
  latitude: number;
  longitude: number;
  department?: string | null;
  zone?: string | null;
};

/**
 * El selector debe respetar primero el lugar que la persona está viendo.
 * El GPS queda como respaldo y se usa de forma explícita dentro del selector.
 */
export function resolveNewPointPickerStart({
  manualCoords,
  visibleMapCenter,
  focus,
  userPosition,
}: {
  manualCoords?: MapCoordinates | null;
  visibleMapCenter?: MapCoordinates | null;
  focus?: MapCoordinates | null;
  userPosition?: MapCoordinates | null;
}): MapCoordinates | null {
  return manualCoords ?? visibleMapCenter ?? focus ?? userPosition ?? null;
}
