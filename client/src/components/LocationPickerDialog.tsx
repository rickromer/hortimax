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
import { PARAGUAY_CENTER } from "@shared/domain";
import { Check, Crosshair, Loader2, MapPin } from "lucide-react";
import { useEffect, useState } from "react";

type Coordinates = { latitude: number; longitude: number; accuracy?: number };
const DEFAULT_CENTER: Coordinates = {
  latitude: PARAGUAY_CENTER.lat,
  longitude: PARAGUAY_CENTER.lng,
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialCoords?: Coordinates | null;
  onConfirm: (coords: Coordinates) => void;
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

  useEffect(() => {
    if (open) {
      const start = initialCoords ?? DEFAULT_CENTER;
      setCenter(start);
      setMapFocus(start);
    }
  }, [open, initialCoords]);

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
      <DialogContent className="sm:max-w-2xl p-0 overflow-hidden gap-0">
        <DialogHeader className="px-5 pt-5 pb-3">
          <DialogTitle>Elegí la ubicación del punto</DialogTitle>
          <DialogDescription>
            Mové el mapa hasta que la punta del pin quede exactamente en el lugar deseado.
          </DialogDescription>
        </DialogHeader>

        <div className="relative h-[56dvh] min-h-[340px] max-h-[520px] bg-muted">
          <ClientMap
            markers={[]}
            focus={mapFocus}
            initialZoom={15}
            onCenterChanged={setCenter}
          />

          <div className="absolute inset-0 z-10 pointer-events-none grid place-items-center">
            <MapPin className="h-14 w-14 -translate-y-1/2 text-primary fill-primary/15 drop-shadow-[0_5px_5px_rgba(0,0,0,0.35)]" />
          </div>

          <div className="absolute top-3 right-3 z-20">
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
          </div>

          <div className="absolute bottom-3 left-1/2 z-20 -translate-x-1/2 rounded-full bg-background/95 px-3 py-1.5 shadow-md backdrop-blur">
            <span className="font-mono text-xs whitespace-nowrap">{formatCoords(center.latitude, center.longitude)}</span>
          </div>
        </div>

        <DialogFooter className="px-5 py-4 gap-2 sm:gap-2 border-t border-border/70">
          <Button type="button" variant="outline" className="bg-background" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={() => {
              onConfirm(center);
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
