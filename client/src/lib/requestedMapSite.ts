export function parseRequestedMapSiteId(search: string): number | null {
  const value = Number(new URLSearchParams(search).get("siteId"));
  return Number.isInteger(value) && value > 0 ? value : null;
}
