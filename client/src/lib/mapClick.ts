import type { PointCoordinates } from "./locationLinks";

type MapLatLng = { lat: () => number; lng: () => number };

/** Convierte un toque/clic de Google Maps en coordenadas válidas para un punto. */
export function mapClickToCoordinates(event: { latLng?: MapLatLng | null } | null | undefined): PointCoordinates | null {
  if (!event?.latLng) return null;
  const latitude = event.latLng.lat();
  const longitude = event.latLng.lng();
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  return { latitude, longitude };
}
