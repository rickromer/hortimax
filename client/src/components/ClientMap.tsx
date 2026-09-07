/// <reference types="@types/google.maps" />

import { usePersistFn } from "@/hooks/usePersistFn";
import { mapClickToCoordinates } from "@/lib/mapClick";
import { clusterMapPoints } from "@/lib/mapClustering";
import { canRetryMapLoadAutomatically } from "@/lib/mapLoadRecovery";
import { READ_ONLY_MAP_REFERENCE_OPTIONS } from "@/lib/mapReferenceOptions";
import { cn } from "@/lib/utils";
import { PARAGUAY_CENTER, PARAGUAY_DEFAULT_ZOOM } from "@shared/domain";
import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    google?: typeof google;
    __mapsLoader__?: Promise<void>;
  }
}

const API_KEY = import.meta.env.VITE_FRONTEND_FORGE_API_KEY;
const FORGE_BASE_URL =
  import.meta.env.VITE_FRONTEND_FORGE_API_URL || "https://forge.butterfly-effect.dev";
const MAPS_PROXY_URL = `${FORGE_BASE_URL}/v1/maps/proxy`;

/**
 * Carga única del SDK de Google Maps.
 * Si en el futuro se usa una API key propia (VITE_GOOGLE_MAPS_API_KEY),
 * el script apunta directamente a Google sin cambiar nada más de la app.
 */
function loadMapScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.google?.maps) return Promise.resolve();
  if (window.__mapsLoader__) return window.__mapsLoader__;

  const ownKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;
  const src = ownKey
    ? `https://maps.googleapis.com/maps/api/js?key=${ownKey}&v=weekly&libraries=marker,places,geocoding,geometry&language=es&region=PY`
    : `${MAPS_PROXY_URL}/maps/api/js?key=${API_KEY}&v=weekly&libraries=marker,places,geocoding,geometry&language=es&region=PY`;

  window.__mapsLoader__ = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    if (!ownKey) script.crossOrigin = "anonymous";
    script.onload = () => resolve();
    script.onerror = () => {
      script.remove();
      window.__mapsLoader__ = undefined;
      reject(new Error("No se pudo cargar Google Maps"));
    };
    document.head.appendChild(script);
  });

  return window.__mapsLoader__;
}

export type MapMarker = {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  clientType?: string | null;
  zone?: string | null;
  selected?: boolean;
};

type ClientMapProps = {
  className?: string;
  markers: MapMarker[];
  userPosition?: { latitude: number; longitude: number; accuracy?: number } | null;
  focus?: { latitude: number; longitude: number } | null;
  focusZoom?: number;
  initialZoom?: number;
  fitToMarkers?: boolean;
  mapTypeId?: "roadmap" | "hybrid" | "satellite" | "terrain";
  onMarkerClick?: (id: number) => void;
  onMapClick?: (coords: { latitude: number; longitude: number }) => void;
  onCenterChanged?: (coords: { latitude: number; longitude: number; zoom?: number }) => void;
  onReady?: (map: google.maps.Map) => void;
  onLoadError?: () => void;
};

const PIN_COLORS: Record<string, string> = {
  Productor: "#3AA44B",
  Revendedor: "#E3A008",
  Cooperativa: "#0BA4A6",
  Acopio: "#CE0A0A",
  Prospecto: "#53666A",
};

function colorFor(type?: string | null) {
  if (!type) return "#53666A";
  return PIN_COLORS[type] ?? "#0BA4A6";
}

function buildPin(marker: MapMarker) {
  const el = document.createElement("div");
  el.style.cssText = `
    display:flex;align-items:center;justify-content:center;
    width:${marker.selected ? 34 : 26}px;height:${marker.selected ? 34 : 26}px;
    border-radius:50% 50% 50% 8%;
    transform:rotate(45deg);
    background:${colorFor(marker.clientType)};
    border:2.5px solid #fff;
    box-shadow:0 4px 10px rgba(15,40,30,.35);
    transition:transform 160ms cubic-bezier(0.23,1,0.32,1);
  `;
  const dot = document.createElement("div");
  dot.style.cssText =
    "width:7px;height:7px;border-radius:50%;background:#fff;transform:rotate(-45deg);";
  el.appendChild(dot);
  return el;
}

function buildUserDot() {
  const el = document.createElement("div");
  el.style.cssText = `
    width:18px;height:18px;border-radius:50%;
    background:#2563EB;border:3px solid #fff;
    box-shadow:0 0 0 6px rgba(37,99,235,.18), 0 2px 6px rgba(0,0,0,.3);
  `;
  return el;
}

function buildClusterPin(count: number) {
  const el = document.createElement("button");
  el.type = "button";
  el.setAttribute("aria-label", `${count} clientes cercanos. Acercar mapa`);
  const size = count >= 100 ? 52 : count >= 10 ? 46 : 40;
  el.textContent = String(count);
  el.style.cssText = `
    display:grid;place-items:center;width:${size}px;height:${size}px;border-radius:999px;
    background:#0BA4A6;color:#fff;border:3px solid #fff;box-shadow:0 4px 12px rgba(7,78,79,.42);
    font:700 13px/1 system-ui,sans-serif;cursor:pointer;letter-spacing:-.02em;
  `;
  return el;
}

export function ClientMap({
  className,
  markers,
  userPosition,
  focus,
  focusZoom,
  initialZoom = PARAGUAY_DEFAULT_ZOOM,
  fitToMarkers = false,
  mapTypeId = "roadmap",
  onMarkerClick,
  onMapClick,
  onCenterChanged,
  onReady,
  onLoadError,
}: ClientMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markerRefs = useRef<Map<number, google.maps.marker.AdvancedMarkerElement>>(new Map());
  const clusterRefs = useRef<Map<string, google.maps.marker.AdvancedMarkerElement>>(new Map());
  const userMarkerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);
  const accuracyRef = useRef<google.maps.Circle | null>(null);
  const readyRef = useRef(false);
  const didFitRef = useRef(false);
  const automaticRetryAttemptsRef = useRef(0);
  const onLoadErrorRef = useRef(onLoadError);
  const [loadError, setLoadError] = useState(false);
  const [retryToken, setRetryToken] = useState(0);

  useEffect(() => {
    onLoadErrorRef.current = onLoadError;
  }, [onLoadError]);

  const retryMap = usePersistFn((automatic = false) => {
    if (automatic) {
      if (!canRetryMapLoadAutomatically(automaticRetryAttemptsRef.current)) return;
      automaticRetryAttemptsRef.current += 1;
    } else {
      automaticRetryAttemptsRef.current = 0;
    }
    setLoadError(false);
    setRetryToken(token => token + 1);
  });

  const init = usePersistFn(async () => {
    try {
      await loadMapScript();
    } catch (error) {
      console.error(error);
      setLoadError(true);
      onLoadErrorRef.current?.();
      window.setTimeout(() => retryMap(true), 900);
      return;
    }
    if (!containerRef.current || mapRef.current) return;

    mapRef.current = new window.google!.maps.Map(containerRef.current, {
      center: focus
        ? { lat: focus.latitude, lng: focus.longitude }
        : PARAGUAY_CENTER,
      zoom: focus ? (focusZoom ?? initialZoom) : initialZoom,
      mapId: "DEMO_MAP_ID",
      mapTypeId,
      mapTypeControl: false,
      fullscreenControl: false,
      streetViewControl: false,
      zoomControl: false,
      ...READ_ONLY_MAP_REFERENCE_OPTIONS,
      scaleControl: true,
      gestureHandling: "greedy",
    });

    mapRef.current.addListener("click", (event: google.maps.MapMouseEvent) => {
      const coordinates = mapClickToCoordinates(event);
      if (coordinates) onMapClick?.(coordinates);
    });

    if (onCenterChanged) {
      mapRef.current.addListener("idle", () => {
        const center = mapRef.current?.getCenter();
        if (!center) return;
        onCenterChanged({
          latitude: center.lat(),
          longitude: center.lng(),
          zoom: mapRef.current?.getZoom(),
        });
      });
    }
    mapRef.current.addListener("idle", () => syncMarkers());

    readyRef.current = true;
    automaticRetryAttemptsRef.current = 0;
    setLoadError(false);
    onReady?.(mapRef.current);
    syncMarkers();
    syncUser();
  });

  const syncMarkers = usePersistFn(() => {
    const map = mapRef.current;
    if (!map || !window.google) return;
    const existing = markerRefs.current;
    const zoom = map.getZoom() ?? initialZoom;
    const clusters = clusterMapPoints(markers, zoom);
    const clusteredIds = new Set(clusters.flatMap(cluster => cluster.ids));
    const nextIds = new Set(markers.map(m => m.id));

    existing.forEach((marker, id) => {
      if (!nextIds.has(id)) {
        marker.map = null;
        existing.delete(id);
      }
    });

    markers.forEach(marker => {
      const current = existing.get(marker.id);
      if (current) {
        current.position = { lat: marker.latitude, lng: marker.longitude };
        current.content = buildPin(marker);
        current.zIndex = marker.selected ? 1000 : 1;
        current.map = clusteredIds.has(marker.id) ? null : map;
        return;
      }
      const advanced = new window.google!.maps.marker.AdvancedMarkerElement({
        map: clusteredIds.has(marker.id) ? null : map,
        position: { lat: marker.latitude, lng: marker.longitude },
        title: marker.name,
        content: buildPin(marker),
        zIndex: marker.selected ? 1000 : 1,
      });
      advanced.addListener("click", () => onMarkerClick?.(marker.id));
      existing.set(marker.id, advanced);
    });

    const activeClusterKeys = new Set(clusters.map(cluster => cluster.key));
    clusterRefs.current.forEach((clusterMarker, key) => {
      if (!activeClusterKeys.has(key)) {
        clusterMarker.map = null;
        clusterRefs.current.delete(key);
      }
    });
    clusters.forEach(cluster => {
      const current = clusterRefs.current.get(cluster.key);
      if (current) {
        current.position = { lat: cluster.latitude, lng: cluster.longitude };
        current.content = buildClusterPin(cluster.ids.length);
        current.map = map;
        return;
      }
      const clusterMarker = new window.google!.maps.marker.AdvancedMarkerElement({
        map,
        position: { lat: cluster.latitude, lng: cluster.longitude },
        title: `${cluster.ids.length} clientes cercanos`,
        content: buildClusterPin(cluster.ids.length),
        zIndex: 900,
      });
      clusterMarker.addListener("click", () => {
        map.panTo({ lat: cluster.latitude, lng: cluster.longitude });
        map.setZoom(Math.min((map.getZoom() ?? zoom) + 3, 18));
      });
      clusterRefs.current.set(cluster.key, clusterMarker);
    });

    if (fitToMarkers && markers.length > 0 && !didFitRef.current) {
      const bounds = new window.google!.maps.LatLngBounds();
      markers.forEach(m => bounds.extend({ lat: m.latitude, lng: m.longitude }));
      if (markers.length === 1) {
        map.setCenter({ lat: markers[0].latitude, lng: markers[0].longitude });
        map.setZoom(15);
      } else {
        map.fitBounds(bounds, 64);
      }
      didFitRef.current = true;
    }
  });

  const syncUser = usePersistFn(() => {
    const map = mapRef.current;
    if (!map || !window.google) return;
    if (!userPosition) {
      if (userMarkerRef.current) userMarkerRef.current.map = null;
      userMarkerRef.current = null;
      accuracyRef.current?.setMap(null);
      accuracyRef.current = null;
      return;
    }
    const position = { lat: userPosition.latitude, lng: userPosition.longitude };
    if (userMarkerRef.current) {
      userMarkerRef.current.position = position;
    } else {
      userMarkerRef.current = new window.google.maps.marker.AdvancedMarkerElement({
        map,
        position,
        content: buildUserDot(),
        zIndex: 2000,
        title: "Tu ubicación",
      });
    }
    const radius = userPosition.accuracy ?? 0;
    if (radius > 0) {
      if (accuracyRef.current) {
        accuracyRef.current.setCenter(position);
        accuracyRef.current.setRadius(radius);
      } else {
        accuracyRef.current = new window.google.maps.Circle({
          map,
          center: position,
          radius,
          strokeColor: "#2563EB",
          strokeOpacity: 0.25,
          strokeWeight: 1,
          fillColor: "#2563EB",
          fillOpacity: 0.08,
          clickable: false,
        });
      }
    }
  });

  useEffect(() => {
    init();
  }, [init, retryToken]);

  useEffect(() => {
    if (readyRef.current) syncMarkers();
  }, [markers, syncMarkers]);

  useEffect(() => {
    if (readyRef.current) syncUser();
  }, [userPosition, syncUser]);

  useEffect(() => {
    if (!readyRef.current || !mapRef.current || !focus) return;
    mapRef.current.panTo({ lat: focus.latitude, lng: focus.longitude });
    const currentZoom = mapRef.current.getZoom() ?? 0;
    const nextZoom = focusZoom ?? (currentZoom < 14 ? 16 : currentZoom);
    if (nextZoom !== currentZoom) mapRef.current.setZoom(nextZoom);
  }, [focus, focusZoom]);

  useEffect(() => {
    if (readyRef.current && mapRef.current) mapRef.current.setMapTypeId(mapTypeId);
  }, [mapTypeId]);

  return (
    <div className={cn("relative w-full h-full bg-muted", className)}>
      <div ref={containerRef} className="absolute inset-0" />
      {loadError && (
        <div className="absolute inset-0 grid place-items-center px-6 text-center">
          <div className="max-w-xs space-y-1.5">
            <p className="text-sm font-medium">No se pudo cargar el mapa</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Verificá tu conexión y recargá la página. Si el problema persiste, avisá a la
              administración.
            </p>
            <button
              type="button"
              onClick={() => retryMap(false)}
              className="mx-auto mt-3 inline-flex h-8 items-center rounded-md border border-border bg-background px-3 text-xs font-medium text-foreground shadow-sm transition-colors hover:bg-muted">
              Reintentar mapa
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function panMapTo(map: google.maps.Map | null, lat: number, lng: number, zoom = 16) {
  if (!map) return;
  map.panTo({ lat, lng });
  map.setZoom(zoom);
}
