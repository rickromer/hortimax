import { GoogleMap, MapType } from "@capacitor/google-maps";
import { createElement, useEffect, useRef, useState } from "react";
import type { MapMarker } from "./ClientMap";

type NativeGoogleMapProps = {
  markers: MapMarker[];
  userPosition?: { latitude: number; longitude: number; accuracy?: number } | null;
  focus?: { latitude: number; longitude: number } | null;
  focusZoom?: number;
  initialZoom?: number;
  mapTypeId?: "roadmap" | "hybrid" | "satellite" | "terrain";
  onMarkerClick?: (id: number) => void;
  onMapClick?: (coords: { latitude: number; longitude: number }) => void;
  onCenterChanged?: (coords: { latitude: number; longitude: number; zoom?: number }) => void;
  onLoadError?: () => void;
};

const MAP_ID = "hortimax-android-connected-map";
const PARAGUAY_CENTER = { latitude: -23.4425, longitude: -58.4438 };

function colorFor(type?: string | null) {
  const colors: Record<string, { r: number; g: number; b: number }> = {
    Productor: { r: 58, g: 164, b: 75 },
    Revendedor: { r: 227, g: 160, b: 8 },
    Cooperativa: { r: 11, g: 164, b: 166 },
    Acopio: { r: 206, g: 10, b: 10 },
  };
  return colors[type ?? ""] ?? { r: 83, g: 102, b: 106 };
}

/**
 * Mapa conectado exclusivo de Android. El SDK nativo evita que Google valide
 * la vista como una página WebView; la web sigue usando ClientMap sin cambios.
 */
export function NativeGoogleMap({
  markers, userPosition, focus, focusZoom, initialZoom = 6, mapTypeId = "roadmap",
  onMarkerClick, onMapClick, onCenterChanged, onLoadError,
}: NativeGoogleMapProps) {
  const elementRef = useRef<HTMLElement>(null);
  const mapRef = useRef<GoogleMap | null>(null);
  const markerIdsRef = useRef(new Map<string, number>());
  const [ready, setReady] = useState(false);
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;

  useEffect(() => {
    let active = true;
    document.documentElement.classList.add("native-google-map-active");
    const create = async () => {
      if (!elementRef.current || !apiKey) throw new Error("No se configuró Google Maps Android");
      const target = focus ?? userPosition ?? PARAGUAY_CENTER;
      const map = await GoogleMap.create({
        id: MAP_ID,
        element: elementRef.current,
        apiKey,
        forceCreate: true,
        config: {
          center: { lat: target.latitude, lng: target.longitude },
          zoom: focus ? (focusZoom ?? 15) : initialZoom,
          mapTypeId,
        },
      });
      if (!active) {
        await map.destroy();
        return;
      }
      mapRef.current = map;
      await map.enableTouch();
      await map.setOnMapClickListener(event => onMapClick?.({ latitude: event.latitude, longitude: event.longitude }));
      await map.setOnMarkerClickListener(event => {
        const siteId = markerIdsRef.current.get(event.markerId);
        if (siteId !== undefined) onMarkerClick?.(siteId);
      });
      await map.setOnCameraIdleListener(event => onCenterChanged?.({
        latitude: event.latitude,
        longitude: event.longitude,
        zoom: event.zoom,
      }));
      setReady(true);
    };
    create().catch(error => {
      console.error("No se pudo iniciar Google Maps Android", error);
      if (active) onLoadError?.();
    });
    return () => {
      active = false;
      setReady(false);
      markerIdsRef.current.clear();
      const map = mapRef.current;
      mapRef.current = null;
      if (map) void map.destroy();
      document.documentElement.classList.remove("native-google-map-active");
    };
  // La creación debe ocurrir una sola vez; el resto se actualiza en efectos separados.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    void map.setMapType(
      mapTypeId === "hybrid" ? MapType.Hybrid : mapTypeId === "satellite" ? MapType.Satellite : mapTypeId === "terrain" ? MapType.Terrain : MapType.Normal
    );
  }, [mapTypeId, ready]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready || !focus) return;
    void map.setCamera({
      coordinate: { lat: focus.latitude, lng: focus.longitude },
      zoom: focusZoom ?? 16,
      animate: true,
    });
  }, [focus, focusZoom, ready]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    const updateMarkers = async () => {
      const previous = Array.from(markerIdsRef.current.keys());
      if (previous.length) await map.removeMarkers(previous);
      const items = [
        ...markers.map(marker => ({
          coordinate: { lat: marker.latitude, lng: marker.longitude },
          title: marker.name,
          snippet: [marker.clientType, marker.department, marker.zone].filter(Boolean).join(" · "),
          tintColor: { ...colorFor(marker.clientType), a: 255 },
          zIndex: marker.selected ? 1000 : 1,
        })),
        ...(userPosition ? [{
          coordinate: { lat: userPosition.latitude, lng: userPosition.longitude },
          title: "Tu ubicación",
          tintColor: { r: 37, g: 99, b: 235, a: 255 },
          zIndex: 2000,
        }] : []),
      ];
      const ids = items.length ? await map.addMarkers(items) : [];
      markerIdsRef.current = new Map(ids.slice(0, markers.length).map((id, index) => [id, markers[index].id]));
    };
    void updateMarkers().catch(error => console.error("No se pudieron actualizar pines Android", error));
  }, [markers, ready, userPosition]);

  return createElement("capacitor-google-map", {
    ref: elementRef,
    className: "absolute inset-0 block h-full w-full",
  });
}
