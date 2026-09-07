import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatCoords } from "@/lib/format";
import { enqueueOfflineOperation, isNetworkFailure, isOffline } from "@/lib/offlineQueue";
import { parsePointCoordinates } from "@/lib/locationLinks";
import { trpc } from "@/lib/trpc";
import { territoryFromGeocode } from "@/lib/zoneFromGeocode";
import { Crosshair, Loader2, MapPin, MousePointer2 } from "lucide-react";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";

export type SiteFormValues = {
  id?: number;
  name: string;
  clientType: string;
  department: string;
  zone: string;
  description: string;
  contactName: string;
  phone: string;
  address: string;
};

const EMPTY: SiteFormValues = {
  name: "",
  clientType: "",
  department: "",
  zone: "",
  description: "",
  contactName: "",
  phone: "",
  address: "",
};

function initialValues(
  initial: Partial<SiteFormValues> | undefined,
  autoDepartment: string | undefined,
  autoZone: string | undefined
): SiteFormValues {
  return {
    ...EMPTY,
    ...initial,
    name: initial?.name ?? "",
    clientType: initial?.clientType ?? "",
    department: autoDepartment ?? initial?.department ?? "",
    zone: autoZone ?? initial?.zone ?? "",
    description: initial?.description ?? "",
    contactName: initial?.contactName ?? "",
    phone: initial?.phone ?? "",
    address: initial?.address ?? "",
  };
}

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  coords: { latitude: number; longitude: number; accuracy?: number } | null;
  locationSource?: "gps" | "manual";
  autoDepartment?: string;
  autoZone?: string;
  initial?: Partial<SiteFormValues>;
  mode?: "create" | "edit";
  onSaved?: (siteId: number) => void;
  onRequestLocation?: () => void;
  onSelectOnMap?: () => void;
};

export function SiteFormSheet({
  open,
  onOpenChange,
  coords,
  locationSource = "gps",
  autoDepartment,
  autoZone,
  initial,
  mode = "create",
  onSaved,
  onRequestLocation,
  onSelectOnMap,
}: Props) {
  const utils = trpc.useUtils();
  const catalog = trpc.admin.catalog.useQuery(undefined, { staleTime: 5 * 60 * 1000 });
  const initialId = initial?.id;
  const [values, setValues] = useState<SiteFormValues>(() => initialValues(initial, autoDepartment, autoZone));
  const [selectedCoords, setSelectedCoords] = useState<Props["coords"]>(coords);
  const [selectedSource, setSelectedSource] = useState<"gps" | "manual">(locationSource);
  const [showCoordinates, setShowCoordinates] = useState(false);
  const [latitudeInput, setLatitudeInput] = useState("");
  const [longitudeInput, setLongitudeInput] = useState("");
  const [territoryLoading, setTerritoryLoading] = useState(false);
  const territoryRequest = React.useRef(0);

  useEffect(() => {
    if (!open) return;
    setValues(initialValues(initial, autoDepartment, autoZone));
    setSelectedCoords(coords);
    setSelectedSource(locationSource);
    setLatitudeInput(coords ? String(coords.latitude) : "");
    setLongitudeInput(coords ? String(coords.longitude) : "");
    setShowCoordinates(false);
  }, [open, initialId]);

  useEffect(() => {
    if (!open || locationSource !== "manual") return;
    setSelectedCoords(coords);
    setSelectedSource("manual");
    setLatitudeInput(coords ? String(coords.latitude) : "");
    setLongitudeInput(coords ? String(coords.longitude) : "");
  }, [coords, locationSource, open]);

  useEffect(() => {
    if (!open || locationSource !== "gps" || selectedSource !== "gps") return;
    setSelectedCoords(coords);
    setLatitudeInput(coords ? String(coords.latitude) : "");
    setLongitudeInput(coords ? String(coords.longitude) : "");
  }, [coords, locationSource, open, selectedSource]);

  useEffect(() => {
    if (!open || !selectedCoords || !window.google?.maps?.Geocoder) return;
    const requestId = ++territoryRequest.current;
    setTerritoryLoading(true);
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode(
      { location: { lat: selectedCoords.latitude, lng: selectedCoords.longitude }, language: "es", region: "PY" },
      (results, status) => {
        if (requestId !== territoryRequest.current) return;
        setTerritoryLoading(false);
        if (status !== "OK") return;
        const territory = territoryFromGeocode(results?.[0]?.address_components);
        setValues(current => ({
          ...current,
          department: territory.department ?? "",
          zone: territory.locality ?? "",
        }));
      }
    );
  }, [open, selectedCoords?.latitude, selectedCoords?.longitude]);

  const invalidate = async () => {
    await Promise.all([utils.sites.list.invalidate(), utils.sites.nearby.invalidate()]);
  };

  const createSite = trpc.sites.create.useMutation({
    onSuccess: async site => {
      await invalidate();
      toast.success("Punto registrado en el mapa");
      onOpenChange(false);
      if (site?.id) onSaved?.(site.id);
    },
    onError: (error, input) => {
      if (isNetworkFailure(error)) {
        void enqueueOfflineOperation("site.create", input as Record<string, unknown>)
          .then(() => {
            toast.success("Punto guardado en el teléfono. Se sincronizará al recuperar señal.");
            onOpenChange(false);
          })
          .catch(queueError => toast.error(queueError instanceof Error ? queueError.message : "No se pudo guardar sin conexión"));
        return;
      }
      toast.error(error.message);
    },
  });

  const updateSite = trpc.sites.update.useMutation({
    onSuccess: async site => {
      await invalidate();
      if (site?.id) await utils.sites.detail.invalidate({ id: site.id });
      toast.success("Datos actualizados");
      onOpenChange(false);
      if (site?.id) onSaved?.(site.id);
    },
    onError: error => toast.error(error.message),
  });

  const busy = createSite.isPending || updateSite.isPending;
  const set = (key: keyof SiteFormValues, value: string) =>
    setValues(prev => ({ ...prev, [key]: value }));

  const applyManualCoordinates = () => {
    const parsed = parsePointCoordinates(latitudeInput, longitudeInput);
    if (!parsed) {
      toast.error("Ingresá coordenadas válidas: latitud entre -90 y 90, longitud entre -180 y 180");
      return;
    }
    setSelectedCoords(parsed);
    setSelectedSource("manual");
    toast.success("Coordenadas aplicadas al punto");
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (values.name.trim().length < 2) {
      toast.error("Ingresá el nombre del cliente");
      return;
    }

    const payload = {
      name: values.name.trim(),
      clientType: values.clientType || null,
      department: values.department || null,
      zone: values.zone || null,
      description: values.description.trim() || null,
      contactName: values.contactName.trim() || null,
      phone: values.phone.trim() || null,
      address: values.address.trim() || null,
    };

    if (mode === "edit" && initial?.id) {
      updateSite.mutate({ id: initial.id, ...payload });
      return;
    }

    if (!selectedCoords) {
      toast.error("Elegí una ubicación con GPS, el mapa o las coordenadas");
      return;
    }

    const createPayload = {
      ...payload,
      latitude: selectedCoords.latitude,
      longitude: selectedCoords.longitude,
      accuracy: selectedSource === "gps" ? selectedCoords.accuracy ?? null : null,
    };
    if (isOffline()) {
      void enqueueOfflineOperation("site.create", createPayload)
        .then(() => {
          toast.success("Punto guardado en el teléfono. Se sincronizará al recuperar señal.");
          onOpenChange(false);
        })
        .catch(error => toast.error(error instanceof Error ? error.message : "No se pudo guardar sin conexión"));
      return;
    }
    createSite.mutate(createPayload);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-1.5rem)] max-w-lg max-h-[92dvh] overflow-x-hidden overflow-y-auto px-4 py-5 sm:px-6">
        <DialogHeader>
          <DialogTitle>
            {mode === "edit" ? "Editar punto" : "Nuevo punto de cliente"}
          </DialogTitle>
          <DialogDescription>
            {mode === "edit"
              ? "Actualizá los datos del cliente."
              : "Podés usar tu GPS, elegir el lugar en el mapa o ingresar coordenadas."}
          </DialogDescription>
        </DialogHeader>

        {mode === "create" && (
          <div className="rounded-lg bg-secondary px-3 py-2.5 text-sm space-y-2.5">
            <div className="flex items-center gap-2.5">
            <MapPin className="h-4 w-4 text-primary shrink-0" />
            {selectedCoords ? (
              <span className="font-mono text-xs min-w-0 flex-1 truncate">
                {formatCoords(selectedCoords.latitude, selectedCoords.longitude)}
                {selectedSource === "gps" && selectedCoords.accuracy ? (
                  <span className="text-muted-foreground"> · GPS ±{selectedCoords.accuracy} m</span>
                ) : (
                  <span className="text-muted-foreground"> · ubicación manual</span>
                )}
              </span>
            ) : (
              <span className="text-muted-foreground flex-1">Todavía no elegiste una ubicación</span>
            )}
            </div>
            <div className="flex flex-col min-[420px]:flex-row min-[420px]:flex-wrap gap-2">
              {onRequestLocation && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-9 w-full min-[420px]:w-auto bg-background"
                  onClick={() => {
                    setSelectedSource("gps");
                    onRequestLocation();
                  }}>
                  <Crosshair className="h-3.5 w-3.5" />
                  Usar GPS
                </Button>
              )}
              {onSelectOnMap && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-9 w-full min-[420px]:w-auto bg-background"
                  onClick={onSelectOnMap}>
                  <MousePointer2 className="h-3.5 w-3.5" />
                  Elegir en mapa
                </Button>
              )}
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-9 w-full min-[420px]:w-auto"
                onClick={() => setShowCoordinates(show => !show)}>
                Coordenadas
              </Button>
            </div>
            {showCoordinates && (
              <div className="grid grid-cols-1 min-[420px]:grid-cols-[1fr_1fr_auto] gap-2 items-end pt-1">
                <div className="space-y-1">
                  <Label htmlFor="point-lat" className="text-xs">Latitud</Label>
                  <Input
                    id="point-lat"
                    inputMode="decimal"
                    value={latitudeInput}
                    onChange={event => setLatitudeInput(event.target.value)}
                    placeholder="-25.2637"
                    className="h-9 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="point-lng" className="text-xs">Longitud</Label>
                  <Input
                    id="point-lng"
                    inputMode="decimal"
                    value={longitudeInput}
                    onChange={event => setLongitudeInput(event.target.value)}
                    placeholder="-57.5759"
                    className="h-9 text-xs"
                  />
                </div>
                <Button type="button" size="sm" className="h-9 w-full min-[420px]:w-auto" onClick={applyManualCoordinates}>
                  Usar
                </Button>
              </div>
            )}
          </div>
        )}

        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="site-name">Nombre del cliente *</Label>
            <Input
              id="site-name"
              value={values.name}
              onChange={e => set("name", e.target.value)}
              placeholder="Ej. Invernadero López"
              required
              className="h-11"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Tipo de cliente</Label>
              <Select
                value={values.clientType || undefined}
                onValueChange={value => set("clientType", value)}>
                <SelectTrigger className="h-11 w-full">
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  {(catalog.data?.clientTypes ?? []).map(type => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="site-department">Departamento · según ubicación</Label>
              <Input
                id="site-department"
                value={values.department}
                readOnly
                aria-readonly="true"
                placeholder={territoryLoading ? "Reconociendo ubicación…" : "Sin identificar"}
                className="h-11 bg-muted text-muted-foreground"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="site-zone">Distrito o municipio · según ubicación</Label>
            <Input
              id="site-zone"
              value={values.zone}
              readOnly
              aria-readonly="true"
              placeholder={territoryLoading ? "Reconociendo ubicación…" : "Sin identificar"}
              className="h-11 bg-muted text-muted-foreground"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="site-contact">Contacto</Label>
              <Input
                id="site-contact"
                value={values.contactName}
                onChange={e => set("contactName", e.target.value)}
                placeholder="Nombre"
                className="h-11"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="site-phone">Teléfono</Label>
              <Input
                id="site-phone"
                type="tel"
                inputMode="tel"
                value={values.phone}
                onChange={e => set("phone", e.target.value)}
                placeholder="09xx xxx xxx"
                className="h-11"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="site-desc">Descripción</Label>
            <Textarea
              id="site-desc"
              value={values.description}
              onChange={e => set("description", e.target.value)}
              placeholder="Ej. Productor · planta 10.000 plantas de tomate · usa insumos"
              rows={3}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="site-address">Referencia o dirección</Label>
            <Input
              id="site-address"
              value={values.address}
              onChange={e => set("address", e.target.value)}
              placeholder="Ej. Ruta PY02 km 187, entrada al silo"
              className="h-11"
            />
          </div>

          <DialogFooter className="flex-col gap-2 sm:flex-row sm:gap-2">
            <Button
              type="button"
              variant="outline"
              className="w-full bg-background sm:w-auto"
              onClick={() => onOpenChange(false)}
              disabled={busy}>
              Cancelar
            </Button>
            <Button type="submit" className="w-full sm:w-auto" disabled={busy}>
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              {mode === "edit" ? "Guardar cambios" : "Registrar punto"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
