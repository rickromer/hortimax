export type GeocodeAddressComponent = {
  long_name: string;
  types: string[];
};

export type GeocodedTerritory = {
  department: string | null;
  locality: string | null;
};

/**
 * Separa la división política principal de la referencia local devuelta por Google Maps.
 * En Paraguay, `administrative_area_level_1` corresponde al departamento; la localidad
 * prioriza distrito, municipio y localidad para no perder la referencia operativa.
 */
export function territoryFromGeocode(
  components: GeocodeAddressComponent[] | undefined
): GeocodedTerritory {
  if (!components?.length) return { department: null, locality: null };

  const findByType = (type: string) =>
    components.find(component => component.types.includes(type))?.long_name?.trim() || null;

  return {
    department: findByType("administrative_area_level_1"),
    locality:
      findByType("administrative_area_level_3") ||
      findByType("administrative_area_level_2") ||
      findByType("locality") ||
      findByType("sublocality_level_1"),
  };
}

/** Conserva compatibilidad para consumidores que solo necesitan una referencia local. */
export function zoneFromGeocode(components: GeocodeAddressComponent[] | undefined): string | null {
  const territory = territoryFromGeocode(components);
  return territory.locality || territory.department;
}
