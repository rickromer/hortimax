import * as maplibregl from "maplibre-gl";
import maplibreWorkerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?url";
import { VectorTile } from "@mapbox/vector-tile";
import type { Feature, FeatureCollection, Geometry } from "geojson";
import type { GeoJSONSource, StyleSpecification } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { PbfReader } from "pbf";
import { PMTiles } from "pmtiles";
import { useEffect, useMemo, useRef, useState } from "react";

type OfflineMarker = {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  clientType?: string | null;
  selected?: boolean;
};

type OfflineVectorMapProps = {
  markers: OfflineMarker[];
  userPosition?: { latitude: number; longitude: number; accuracy?: number } | null;
  focus?: { latitude: number; longitude: number } | null;
  focusZoom?: number;
  placementMode?: boolean;
  onMarkerClick?: (id: number) => void;
  onMapClick?: (coords: { latitude: number; longitude: number }) => void;
  onCenterChanged?: (coords: { latitude: number; longitude: number; zoom?: number }) => void;
};

const CITIES = [
  ["Asunción", -25.2867, -57.3333], ["Ciudad del Este", -25.5097, -54.6111],
  ["Encarnación", -27.3306, -55.8667], ["Caaguazú", -25.4597, -56.0156],
  ["Coronel Oviedo", -25.4444, -56.4403], ["Concepción", -23.4064, -57.4344],
  ["Filadelfia", -22.3394, -60.0317], ["Pedro Juan Caballero", -22.5472, -55.7333],
] as const;

const CLIENT_COLORS: Record<string, string> = {
  Productor: "#3AA44B", Revendedor: "#E3A008", Cooperativa: "#0BA4A6", Acopio: "#CE0A0A",
};
const VECTOR_LAYERS = ["water_polygons", "water_lines", "boundaries", "street_labels", "streets", "buildings"] as const;

function clientColor(type?: string | null) {
  return CLIENT_COLORS[type ?? ""] ?? "#53666A";
}

function emptyFeatureCollection(): FeatureCollection<Geometry> {
  return { type: "FeatureCollection", features: [] };
}

export function longitudeToTileX(longitude: number, zoom: number) {
  return Math.floor(((longitude + 180) / 360) * 2 ** zoom);
}

export function latitudeToTileY(latitude: number, zoom: number) {
  const radians = (latitude * Math.PI) / 180;
  return Math.floor(((1 - Math.asinh(Math.tan(radians)) / Math.PI) / 2) * 2 ** zoom);
}

export function resolveOfflineInitialView(
  focus?: { latitude: number; longitude: number } | null,
  userPosition?: { latitude: number; longitude: number } | null,
) {
  const target = focus ?? userPosition;
  return target
    ? { center: [target.longitude, target.latitude] as [number, number], zoom: 14 }
    : { center: [-58.448255, -23.448435] as [number, number], zoom: 6.2 };
}

async function readVisibleFeatures(archive: PMTiles, map: maplibregl.Map) {
  const zoom = Math.max(0, Math.min(14, Math.floor(map.getZoom())));
  const bounds = map.getBounds();
  const maxIndex = 2 ** zoom - 1;
  const minX = Math.max(0, longitudeToTileX(bounds.getWest(), zoom) - 1);
  const maxX = Math.min(maxIndex, longitudeToTileX(bounds.getEast(), zoom) + 1);
  const minY = Math.max(0, latitudeToTileY(bounds.getNorth(), zoom) - 1);
  const maxY = Math.min(maxIndex, latitudeToTileY(bounds.getSouth(), zoom) + 1);
  const reads: Array<Promise<Feature<Geometry>[]>> = [];

  for (let x = minX; x <= maxX; x += 1) {
    for (let y = minY; y <= maxY; y += 1) {
      reads.push((async () => {
        const tileData = await archive.getZxy(zoom, x, y);
        if (!tileData) return [];
        const tile = new VectorTile(new PbfReader(new Uint8Array(tileData.data)));
        const features: Feature<Geometry>[] = [];
        for (const layerName of VECTOR_LAYERS) {
          const layer = tile.layers[layerName];
          if (!layer) continue;
          for (let index = 0; index < layer.length; index += 1) {
            const feature = layer.feature(index).toGeoJSON(x, y, zoom) as Feature<Geometry>;
            feature.properties = { ...(feature.properties ?? {}), _layer: layerName };
            features.push(feature);
          }
        }
        return features;
      })());
    }
  }
  return (await Promise.all(reads)).flat();
}

export function createOfflineMapStyle(): StyleSpecification {
  return {
    version: 8,
    sources: {
      paraguay: {
        type: "geojson",
        data: emptyFeatureCollection(),
        attribution: "© OpenStreetMap contributors · Geofabrik",
      },
    },
    layers: [
      { id: "background", type: "background", paint: { "background-color": "#e8f0e6" } },
      { id: "water-polygons", type: "fill", source: "paraguay", filter: ["==", ["get", "_layer"], "water_polygons"], paint: { "fill-color": "#b9dce8" } },
      { id: "water-lines", type: "line", source: "paraguay", filter: ["==", ["get", "_layer"], "water_lines"], paint: { "line-color": "#79b7cf", "line-width": ["interpolate", ["linear"], ["zoom"], 5, 0.6, 14, 2.4] } },
      { id: "boundaries", type: "line", source: "paraguay", filter: ["==", ["get", "_layer"], "boundaries"], paint: { "line-color": "#78917d", "line-width": ["interpolate", ["linear"], ["zoom"], 4, 0.8, 10, 1.8], "line-dasharray": [3, 2] } },
      { id: "road-casing", type: "line", source: "paraguay", filter: ["==", ["get", "_layer"], "streets"], minzoom: 6, paint: { "line-color": "#fff", "line-width": ["interpolate", ["linear"], ["zoom"], 6, 1.2, 10, 3.5, 14, 7], "line-opacity": 0.92 } },
      { id: "roads", type: "line", source: "paraguay", filter: ["==", ["get", "_layer"], "streets"], minzoom: 6, paint: { "line-color": ["match", ["get", "kind"], ["motorway", "trunk", "primary"], "#e6a23c", ["secondary", "tertiary"], "#e7c86c", "#c8c5b8"], "line-width": ["interpolate", ["linear"], ["zoom"], 6, 0.7, 10, 2, 14, 4.5] } },
      { id: "buildings", type: "fill", source: "paraguay", filter: ["==", ["get", "_layer"], "buildings"], minzoom: 13, paint: { "fill-color": "#d8d0c4", "fill-outline-color": "#b9afa2", "fill-opacity": 0.85 } },
    ],
  };
}

/** Visor de respaldo solo para APK sin red. No sustituye Google Maps en web ni al reconectar. */
export function OfflineVectorMap({
  markers, userPosition, focus, focusZoom, placementMode, onMarkerClick, onMapClick, onCenterChanged,
}: OfflineVectorMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markerRefs = useRef<maplibregl.Marker[]>([]);
  const cityRefs = useRef<maplibregl.Marker[]>([]);
  const tileLoadGeneration = useRef(0);
  const onMapClickRef = useRef(onMapClick);
  const onCenterChangedRef = useRef(onCenterChanged);
  const preferredFocusRef = useRef(focus ?? userPosition ?? null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const archiveUrl = useMemo(() => new URL("/offline/paraguay-shortbread-1.0.pmtiles", window.location.href).toString(), []);

  useEffect(() => {
    onMapClickRef.current = onMapClick;
    onCenterChangedRef.current = onCenterChanged;
    preferredFocusRef.current = focus ?? userPosition ?? null;
  }, [focus, onCenterChanged, onMapClick, userPosition]);

  useEffect(() => {
    if (!containerRef.current) return;
    maplibregl.setWorkerUrl(maplibreWorkerUrl);
    const archive = new PMTiles(archiveUrl);
    const initialView = resolveOfflineInitialView(focus, userPosition);
    if (focus && focusZoom) initialView.zoom = focusZoom;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: createOfflineMapStyle(),
      center: initialView.center,
      zoom: initialView.zoom,
      minZoom: 4.6,
      maxZoom: 14,
      maxBounds: [[-63.4, -28.25], [-53.5, -18.55]],
      attributionControl: false,
    });
    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right");
    map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-left");
    map.on("error", event => setLoadError(event.error?.message ?? "No se pudo abrir el mapa sin señal"));
    map.on("click", event => onMapClickRef.current?.({ latitude: event.lngLat.lat, longitude: event.lngLat.lng }));
    map.on("moveend", () => {
      const center = map.getCenter();
      onCenterChangedRef.current?.({ latitude: center.lat, longitude: center.lng, zoom: map.getZoom() });
    });

    let initialized = false;
    const loadVisibleTiles = async () => {
      const generation = ++tileLoadGeneration.current;
      try {
        const features = await readVisibleFeatures(archive, map);
        if (generation !== tileLoadGeneration.current || !map.getSource("paraguay")) return;
        (map.getSource("paraguay") as GeoJSONSource).setData({ type: "FeatureCollection", features });
        setLoadError(null);
      } catch (error) {
        if (generation === tileLoadGeneration.current) {
          setLoadError(error instanceof Error ? error.message : "No se pudo leer el paquete offline");
        }
      }
    };
    const initialize = () => {
      if (initialized) return;
      initialized = true;
      const target = preferredFocusRef.current;
      if (target) map.jumpTo({ center: [target.longitude, target.latitude], zoom: focusZoom ?? 14 });
      cityRefs.current = CITIES.map(([name, latitude, longitude]) => {
        const label = document.createElement("div");
        label.className = "offline-city-label";
        label.textContent = name;
        return new maplibregl.Marker({ element: label, anchor: "center" }).setLngLat([longitude, latitude]).addTo(map);
      });
      void loadVisibleTiles();
    };
    map.on("style.load", initialize);
    if (map.isStyleLoaded()) initialize();
    const timeout = window.setTimeout(() => {
      if (!initialized) setLoadError("El visor local no inició. Reinstalá el APK completo.");
    }, 8_000);
    map.on("moveend", loadVisibleTiles);

    return () => {
      window.clearTimeout(timeout);
      markerRefs.current.forEach(marker => marker.remove());
      cityRefs.current.forEach(marker => marker.remove());
      markerRefs.current = [];
      cityRefs.current = [];
      map.remove();
      mapRef.current = null;
    };
  }, [archiveUrl]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    markerRefs.current.forEach(marker => marker.remove());
    markerRefs.current = markers.filter(marker => marker.id !== -1).map(marker => {
      const element = document.createElement("button");
      element.type = "button";
      element.className = "offline-client-marker";
      element.style.setProperty("--marker-color", clientColor(marker.clientType));
      element.style.width = marker.selected ? "34px" : "27px";
      element.style.height = marker.selected ? "34px" : "27px";
      element.setAttribute("aria-label", `${marker.name}. Abrir cliente`);
      element.addEventListener("click", event => {
        event.stopPropagation();
        onMarkerClick?.(marker.id);
      });
      return new maplibregl.Marker({ element, anchor: "bottom" }).setLngLat([marker.longitude, marker.latitude]).addTo(map);
    });
    if (userPosition) {
      const dot = document.createElement("div");
      dot.className = "offline-user-marker";
      markerRefs.current.push(new maplibregl.Marker({ element: dot, anchor: "center" }).setLngLat([userPosition.longitude, userPosition.latitude]).addTo(map));
    }
  }, [markers, onMarkerClick, userPosition]);

  useEffect(() => {
    if (!focus || !mapRef.current) return;
    mapRef.current.easeTo({
      center: [focus.longitude, focus.latitude],
      zoom: focusZoom ?? Math.max(mapRef.current.getZoom(), 14),
      duration: 300,
    });
  }, [focus, focusZoom]);

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#e8f0e6]">
      <div ref={containerRef} className="h-full w-full" />
      <div className="pointer-events-none absolute left-3 top-3 z-10 rounded-full border border-emerald-200 bg-white/95 px-3 py-1.5 text-xs font-medium text-foreground shadow-md backdrop-blur">
        Mapa sin señal · {markers.filter(marker => marker.id !== -1).length} cliente{markers.filter(marker => marker.id !== -1).length === 1 ? "" : "s"}
      </div>
      {placementMode && <div className="pointer-events-none absolute left-1/2 top-1/2 z-20 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-white bg-primary shadow-lg" />}
      {loadError && (
        <div className="absolute inset-x-4 bottom-24 z-20 rounded-xl border border-destructive/30 bg-card px-4 py-3 text-sm text-card-foreground shadow-lg">
          <p className="font-semibold">No se pudo abrir el mapa offline</p>
          <p className="mt-1 text-muted-foreground">{loadError}</p>
        </div>
      )}
    </div>
  );
}
