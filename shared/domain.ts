/** Centro geográfico aproximado de Paraguay y encuadre por defecto del mapa. */
export const PARAGUAY_CENTER = { lat: -23.4425, lng: -58.4438 };
export const PARAGUAY_DEFAULT_ZOOM = 6.4;

/** Tipos de cliente sugeridos por defecto (el catálogo es configurable). */
export const DEFAULT_CLIENT_TYPES = [
  "Productor",
  "Revendedor",
  "Cooperativa",
  "Acopio",
  "Prospecto",
];

/** Zonas por defecto: departamentos de Paraguay. */
export const DEFAULT_ZONES = [
  "Alto Paraguay",
  "Alto Paraná",
  "Amambay",
  "Asunción",
  "Boquerón",
  "Caaguazú",
  "Caazapá",
  "Canindeyú",
  "Central",
  "Concepción",
  "Cordillera",
  "Guairá",
  "Itapúa",
  "Misiones",
  "Ñeembucú",
  "Paraguarí",
  "Presidente Hayes",
  "San Pedro",
];

/** Categorías sugeridas para las notas de campo. */
export const DEFAULT_NOTE_CATEGORIES = [
  "Visita técnica",
  "Visita comercial",
  "Pedido",
  "Entrega",
  "Reclamo",
  "Otro",
];

/** Radio en metros para considerar que un sitio existente es "el mismo lugar". */
export const NEARBY_RADIUS_METERS = 300;

/** Distancia en metros entre dos coordenadas (fórmula de Haversine). */
export function distanceMeters(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): number {
  const R = 6371000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(h)));
}

/** Formatea una fecha en horario de Paraguay para cabeceras de nota. */
export function formatDateTimePy(date: Date): string {
  return new Intl.DateTimeFormat("es-PY", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Asuncion",
  }).format(date);
}
