export type ClusterableMapPoint = {
  id: number;
  latitude: number;
  longitude: number;
  selected?: boolean;
};

export type MapPointCluster = {
  key: string;
  ids: number[];
  latitude: number;
  longitude: number;
};

const TILE_SIZE = 256;

function worldPoint(latitude: number, longitude: number, zoom: number) {
  const scale = TILE_SIZE * 2 ** zoom;
  const sinLatitude = Math.sin((latitude * Math.PI) / 180);
  return {
    x: ((longitude + 180) / 360) * scale,
    y: (0.5 - Math.log((1 + sinLatitude) / (1 - sinLatitude)) / (4 * Math.PI)) * scale,
  };
}

/** Agrupa puntos no seleccionados que ocuparían la misma área visual del mapa. */
export function clusterMapPoints(
  points: ClusterableMapPoint[],
  zoom: number,
  gridSize = 72,
  maxClusterZoom = 16,
): MapPointCluster[] {
  if (zoom >= maxClusterZoom) return [];

  const groups = new Map<string, ClusterableMapPoint[]>();
  points.filter(point => !point.selected).forEach(point => {
    const projected = worldPoint(point.latitude, point.longitude, zoom);
    const key = `${Math.floor(projected.x / gridSize)}:${Math.floor(projected.y / gridSize)}`;
    groups.set(key, [...(groups.get(key) ?? []), point]);
  });

  return Array.from(groups.entries())
    .filter(([, members]) => members.length > 1)
    .map(([key, members]) => ({
      key,
      ids: members.map(member => member.id),
      latitude: members.reduce((total, member) => total + member.latitude, 0) / members.length,
      longitude: members.reduce((total, member) => total + member.longitude, 0) / members.length,
    }));
}
