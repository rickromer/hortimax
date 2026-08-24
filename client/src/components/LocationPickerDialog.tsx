import { ClientMap } from "@/components/ClientMap";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatCoords } from "@/lib/format";
import { zoneFromGeocode } from "@/lib/zoneFromGeocode";
import { PARAGUAY_CENTER } from "@shared/domain";
import { Check, Crosshair, Layers, Loader2, MapPin, Satellite } from "lucide-react";
import { useEffect, useRef, useState } from "react";

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex flex-col rounded-none border-0 p-0 gap-0 overflow-hidden"
        style={{
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          maxWidth: "none",
          transform: "none",
        }}>
        <DialogHeader className="px-5 pt-[calc(env(safe-area-inset-top)+1rem)] pb-3 shrink-0 bg-background">
          <DialogTitle>Elegí la ubicación del punto</DialogTitle>
          <DialogDescription>
            Mové el mapa hasta que la punta del pin quede exactamente en el lugar deseado.
          </DialogDescription>
        </DialogHeader>

        <div className="relative flex-1 min-h-0 bg-muted">
          <ClientMap
            markers={[]}
            focus={mapFocus}
            initialZoom={15}
            mapTypeId={mapType}
            onCenterChanged={setCenter}
          />

          <div className="absolute inset-0 z-10 pointer-events-none grid place-items-center">
            <MapPin className="h-14 w-14 -translate-y-1/2 text-primary fill-primary/15 drop-shadow-[0_5px_5px_rgba(0,0,0,0.35)]" />
          </div>

          <div className="absolute top-3 right-3 z-20 flex flex-col gap-2">
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

        <DialogFooter className="px-5 py-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] gap-2 sm:gap-2 shrink-0 border-t border-border/70 bg-background">
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
