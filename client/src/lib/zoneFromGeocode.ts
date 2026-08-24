export type GeocodeAddressComponent = {
  long_name: string;
  types: string[];
};

/**
 * Devuelve la unidad territorial más útil para clasificar un punto en Paraguay:
 * distrito/municipio primero y departamento solo como respaldo.
 */
export function zoneFromGeocode(components: GeocodeAddressComponent[] | undefined): string | null {
  if (!components?.length) return null;

  const findByType = (type: string) =>
    components.find(component => component.types.includes(type))?.long_name?.trim() || null;

  return (
    findByType("administrative_area_level_3") ||
    findByType("administrative_area_level_2") ||
    findByType("locality") ||
    findByType("sublocality_level_1") ||
    findByType("administrative_area_level_1") ||
    null
  );
}
