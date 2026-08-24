import { ClientMap } from "@/components/ClientMap";
import { Button } from "@/components/ui/button";
import { formatCoords } from "@/lib/format";
import { zoneFromGeocode } from "@/lib/zoneFromGeocode";
import { PARAGUAY_CENTER } from "@shared/domain";
import { Check, Crosshair, Layers, Loader2, MapPin, Satellite, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

type Coordinates = { latitude: number; longitude: number; accuracy?: number };
type LocationSelection = Coordinates & { zone?: string | null };
const DEFAULT_CENTER: Coordinates = {
  latitude: PARAGUAY_CENTER.lat,
  longitude: PARAGUAY_CENTER.lng,
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialCoords?: Coordinates | null;
  onConfirm: (coords: LocationSelection) => void;
  onRequestLocation?: () => Promise<Coordinates | null>;
};

/** Selector tipo Marketplace: el pin se mantiene fijo mientras el usuario mueve el mapa. */
export function LocationPickerDialog({
  open,
  onOpenChange,
  initialCoords,
  onConfirm,
  onRequestLocation,
}: Props) {
  const [center, setCenter] = useState<Coordinates>(initialCoords ?? DEFAULT_CENTER);
  const [mapFocus, setMapFocus] = useState<Coordinates>(initialCoords ?? DEFAULT_CENTER);
  const [locating, setLocating] = useState(false);
  const [mapType, setMapType] = useState<"roadmap" | "satellite">("roadmap");
  const [zone, setZone] = useState<string | null>(null);
  const [lookingUpZone, setLookingUpZone] = useState(false);
  const lookupRequest = useRef(0);

  useEffect(() => {
    if (open) {
      const start = initialCoords ?? DEFAULT_CENTER;
      setCenter(start);
      setMapFocus(start);
      setZone(null);
    }
  }, [open, initialCoords]);

  useEffect(() => {
    if (!open || !window.google?.maps?.Geocoder) return;
    const requestId = ++lookupRequest.current;
    const timeout = window.setTimeout(() => {
      setLookingUpZone(true);
      const geocoder = new window.google!.maps.Geocoder();
      geocoder.geocode(
        { location: { lat: center.latitude, lng: center.longitude }, language: "es", region: "PY" },
        (results, status) => {
          if (requestId !== lookupRequest.current) return;
          setLookingUpZone(false);
          if (status !== "OK") {
            setZone(null);
            return;
          }
          setZone(zoneFromGeocode(results?.[0]?.address_components));
        }
      );
    }, 450);
    return () => window.clearTimeout(timeout);
  }, [center.latitude, center.longitude, open]);

  const centerOnGps = async () => {
    if (!onRequestLocation) return;
    setLocating(true);
    const position = await onRequestLocation();
    setLocating(false);
    if (position) {
      setCenter(position);
      setMapFocus(position);
    }
  };

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onOpenChange(false);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onOpenChange, open]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <section
      role="dialog"
      aria-modal="true"
      aria-labelledby="location-picker-title"
      data-testid="fullscreen-location-picker"
      className="fixed inset-0 z-[100] flex flex-col overflow-hidden bg-background"
      style={{ inset: 0 }}>
      <header className="flex shrink-0 items-start justify-between gap-3 border-b border-border/70 bg-background px-5 pb-3 pt-[max(1rem,env(safe-area-inset-top))]">
        <div className="min-w-0">
          <h2 id="location-picker-title" className="text-base font-semibold">
            Elegí la ubicación del punto
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Mové el mapa hasta que la punta del pin quede exactamente en el lugar deseado.
          </p>
        </div>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="-mr-2 h-9 w-9 shrink-0 rounded-full"
          onClick={() => onOpenChange(false)}
          aria-label="Cerrar selector de ubicación">
          <X className="h-5 w-5" />
        </Button>
      </header>

      <div className="relative min-h-0 flex-1 bg-muted">
        <ClientMap
          markers={[]}
          focus={mapFocus}
          initialZoom={15}
          mapTypeId={mapType}
          onCenterChanged={setCenter}
        />

        <div className="pointer-events-none absolute inset-0 z-10 grid place-items-center">
          <MapPin className="h-14 w-14 -translate-y-1/2 text-primary fill-primary/15 drop-shadow-[0_5px_5px_rgba(0,0,0,0.35)]" />
        </div>

        <div className="absolute right-3 top-3 z-20 flex flex-col gap-2">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className="bg-background shadow-md"
            disabled={locating || !onRequestLocation}
            onClick={centerOnGps}>
            {locating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Crosshair className="h-4 w-4" />}
            Mi ubicación
          </Button>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className="bg-background shadow-md"
            onClick={() => setMapType(type => (type === "roadmap" ? "satellite" : "roadmap"))}>
            {mapType === "roadmap" ? <Satellite className="h-4 w-4" /> : <Layers className="h-4 w-4" />}
            {mapType === "roadmap" ? "Satélite" : "Mapa"}
          </Button>
        </div>

        <div className="absolute bottom-3 left-1/2 z-20 w-[calc(100%-1.5rem)] max-w-md -translate-x-1/2 rounded-xl bg-background/95 px-3 py-2 shadow-md backdrop-blur">
          <p className="font-mono text-xs whitespace-nowrap text-center">{formatCoords(center.latitude, center.longitude)}</p>
          <p className="mt-0.5 text-center text-xs text-muted-foreground truncate">
            {lookingUpZone ? "Buscando distrito o municipio…" : zone ? `Zona detectada: ${zone}` : "Zona se completará al confirmar"}
          </p>
        </div>
      </div>

      <footer className="flex shrink-0 flex-col-reverse gap-2 border-t border-border/70 bg-background px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" className="bg-background" onClick={() => onOpenChange(false)}>
          Cancelar
        </Button>
        <Button
          type="button"
          onClick={() => {
            onConfirm({ ...center, zone });
            onOpenChange(false);
          }}>
          <Check className="h-4 w-4" />
          Usar esta ubicación
        </Button>
      </footer>
    </section>,
    document.body
  );
}
