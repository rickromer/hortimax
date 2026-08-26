export const PARAGUAY_PLACE_RESTRICTION = { country: "py" } as const;

export function canQueryMapPlaces(query: string, mapReady: boolean) {
  return mapReady && query.trim().length >= 2;
}
