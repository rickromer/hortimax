export type PointCoordinates = { latitude: number; longitude: number };

/** Convierte coordenadas escritas manualmente y valida sus rangos geográficos. */
export function parsePointCoordinates(latitudeRaw: string, longitudeRaw: string): PointCoordinates | null {
  const latitude = Number(latitudeRaw.trim().replace(",", "."));
  const longitude = Number(longitudeRaw.trim().replace(",", "."));
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) return null;
  if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) return null;
  return { latitude, longitude };
}

function coordinatesQuery({ latitude, longitude }: PointCoordinates) {
  return `${latitude},${longitude}`;
}

/** Enlace universal de navegación a Google Maps. */
export function googleMapsPointUrl(coords: PointCoordinates) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(coordinatesQuery(coords))}`;
}

/** Enlace de navegación directa a Waze. */
export function wazePointUrl(coords: PointCoordinates) {
  return `https://waze.com/ul?ll=${encodeURIComponent(coordinatesQuery(coords))}&navigate=yes`;
}

/** Texto legible para compartir un punto comercial. */
export function pointShareText(name: string, coords: PointCoordinates) {
  return `Punto: ${name}\nUbicación: ${googleMapsPointUrl(coords)}`;
}

/** Enlace de envío de la ubicación por WhatsApp. */
export function whatsappPointUrl(name: string, coords: PointCoordinates) {
  return `https://wa.me/?text=${encodeURIComponent(pointShareText(name, coords))}`;
}
