import * as maplibregl from "maplibre-gl";
import maplibreWorkerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?url";
import type { StyleSpecification } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { PMTiles, Protocol, type Source } from "pmtiles";
import { useEffect, useMemo, useRef, useState } from "react";
import { registerPlugin } from "@capacitor/core";
import { isNativeAndroidApp } from "@/lib/nativeSession";

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
const OFFLINE_PROTOCOL = "pmtiles";
const OFFLINE_ARCHIVE_KEY = "hortimax-native-asset:paraguay-shortbread-1.0.pmtiles";

type OfflineMapAssetPlugin = {
  readRange(options: { offset: number; length: number }): Promise<{ data: string }>;
};

const offlineMapAsset = registerPlugin<OfflineMapAssetPlugin>("OfflineMapAsset");

function decodeBase64Range(value: string) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes.buffer;
}

/**
 * El servidor de activos de Capacitor no responde de forma uniforme a solicitudes
 * HTTP Range grandes. Se lee una sola vez el PMTiles empaquetado y luego se sirven
 * los tramos desde el Blob local, sin volver a depender de la red ni de Range.
 */
export class AndroidAssetBlobSource implements Source {
  private assetPromise: Promise<Blob> | null = null;

  constructor(private readonly url: string) {}

  getKey() {
    return `hortimax-asset:${this.url}`;
  }

  private loadAsset() {
    if (!this.assetPromise) {
      this.assetPromise = fetch(this.url, { cache: "force-cache" }).then(async response => {
        if (!response.ok) throw new Error(`No se pudo leer el mapa local (${response.status})`);
        return response.blob();
      });
    }
    return this.assetPromise;
  }

  async getBytes(offset: number, length: number) {
    const asset = await this.loadAsset();
    return { data: await asset.slice(offset, offset + length).arrayBuffer() };
  }
}

/** Fuente de APK: lee rangos desde AssetManager, sin HTTP del WebView. */
export class AndroidNativeAssetSource implements Source {
  getKey() {
    return OFFLINE_ARCHIVE_KEY;
  }

  async getBytes(offset: number, length: number) {
    const response = await offlineMapAsset.readRange({ offset, length });
    return { data: decodeBase64Range(response.data) };
  }
}

function clientColor(type?: string | null) {
  return CLIENT_COLORS[type ?? ""] ?? "#53666A";
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

let offlineArchive: PMTiles | null = null;
let offlineProtocol: Protocol | null = null;
let protocolRegistered = false;

function getOfflineArchive(archiveUrl: string) {
  if (!offlineArchive) {
    offlineArchive = new PMTiles(
      isNativeAndroidApp() ? new AndroidNativeAssetSource() : new AndroidAssetBlobSource(archiveUrl)
    );
  }
  return offlineArchive;
}

export function parseOfflineTileUrl(url: string) {
  const match = url.match(/^pmtiles:\/\/(.+)\/(\d+)\/(\d+)\/(\d+)$/);
  if (!match) return null;
  return { archiveKey: match[1], z: Number(match[2]), x: Number(match[3]), y: Number(match[4]) };
}

function registerOfflineProtocol(archive: PMTiles) {
  if (!offlineProtocol) offlineProtocol = new Protocol({ metadata: false });
  offlineProtocol.add(archive);
  if (protocolRegistered) return;
  maplibregl.addProtocol(OFFLINE_PROTOCOL, offlineProtocol.tile);
  protocolRegistered = true;
}

export function createOfflineMapStyle(archiveKey = OFFLINE_ARCHIVE_KEY): StyleSpecification {
  return {
    version: 8,
    sources: {
      paraguay: {
        type: "vector",
        // Protocol de PMTiles: MapLibre solicita z/x/y sin extensión; el
        // adaptador oficial resuelve el archivo registrado desde AssetManager.
        tiles: [`${OFFLINE_PROTOCOL}://${archiveKey}/{z}/{x}/{y}`],
        minzoom: 0,
        maxzoom: 14,
        attribution: "© OpenStreetMap contributors · Geofabrik",
      },
    },
    layers: [
      { id: "background", type: "background", paint: { "background-color": "#e8f0e6" } },
      { id: "land", type: "fill", source: "paraguay", "source-layer": "land", paint: { "fill-color": "#edf3e7" } },
      { id: "water-polygons", type: "fill", source: "paraguay", "source-layer": "water_polygons", paint: { "fill-color": "#b9dce8" } },
      { id: "water-lines", type: "line", source: "paraguay", "source-layer": "water_lines", paint: { "line-color": "#79b7cf", "line-width": ["interpolate", ["linear"], ["zoom"], 5, 0.6, 14, 2.4] } },
      { id: "boundaries", type: "line", source: "paraguay", "source-layer": "boundaries", paint: { "line-color": "#78917d", "line-width": ["interpolate", ["linear"], ["zoom"], 4, 0.8, 10, 1.8], "line-dasharray": [3, 2] } },
      { id: "road-casing", type: "line", source: "paraguay", "source-layer": "streets", minzoom: 5, paint: { "line-color": "#fffdf7", "line-width": ["interpolate", ["linear"], ["zoom"], 5, 1, 10, 3.4, 14, 8], "line-opacity": 0.95 } },
      { id: "roads", type: "line", source: "paraguay", "source-layer": "streets", minzoom: 5, paint: { "line-color": "#d7c68e", "line-width": ["interpolate", ["linear"], ["zoom"], 5, 0.55, 10, 1.8, 14, 4.8] } },
      { id: "buildings", type: "fill", source: "paraguay", "source-layer": "buildings", minzoom: 13, paint: { "fill-color": "#d8d0c4", "fill-outline-color": "#b9afa2", "fill-opacity": 0.85 } },
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
    const archive = getOfflineArchive(archiveUrl);
    registerOfflineProtocol(archive);
    const initialView = resolveOfflineInitialView(focus, userPosition);
    if (focus && focusZoom) initialView.zoom = focusZoom;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: createOfflineMapStyle(archive.source.getKey()),
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
      setLoadError(null);
    };
    map.on("style.load", initialize);
    if (map.isStyleLoaded()) initialize();
    const timeout = window.setTimeout(() => {
      if (!initialized) setLoadError("El visor local no inició. Reinstalá el APK completo.");
    }, 8_000);

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
