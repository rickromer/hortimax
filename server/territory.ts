import { makeRequest } from "./_core/map";

type AddressComponent = { long_name?: string; types?: string[] };
type GeocodeResponse = {
  status?: string;
  results?: Array<{ address_components?: AddressComponent[] }>;
};

export type GeographicTerritory = {
  department: string | null;
  zone: string | null;
};

function componentByType(components: AddressComponent[] | undefined, type: string) {
  return components?.find(component => component.types?.includes(type))?.long_name?.trim() || null;
}

/** Obtiene departamento y distrito/municipio desde las coordenadas del pin. */
export async function territoryFromCoordinates(latitude: number, longitude: number): Promise<GeographicTerritory> {
  const response = await makeRequest<GeocodeResponse>("/maps/api/geocode/json", {
    latlng: `${latitude},${longitude}`,
    language: "es",
    region: "py",
  });
  const components = response.status === "OK" ? response.results?.[0]?.address_components : undefined;
  return {
    department: componentByType(components, "administrative_area_level_1"),
    zone:
      componentByType(components, "administrative_area_level_3") ||
      componentByType(components, "administrative_area_level_2") ||
      componentByType(components, "locality") ||
      componentByType(components, "sublocality_level_1"),
  };
}
