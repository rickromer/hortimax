export type MapCoordinates = {
  latitude: number;
  longitude: number;
  accuracy?: number;
  department?: string | null;
  zone?: string | null;
};

export function startMapPlacement(
  visibleCenter: MapCoordinates | null,
  fallback: MapCoordinates | null
): MapCoordinates | null {
  return visibleCenter ?? fallback;
}

export function placeFromMapCenter(center: MapCoordinates): MapCoordinates {
  return { ...center, accuracy: undefined };
}
