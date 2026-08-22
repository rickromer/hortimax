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
import { trpc } from "@/lib/trpc";
import { Crosshair, Loader2, MapPin } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export type SiteFormValues = {
  id?: number;
  name: string;
  clientType: string;
  zone: string;
  description: string;
  contactName: string;
  phone: string;
  address: string;
};

const EMPTY: SiteFormValues = {
  name: "",
  clientType: "",
  zone: "",
  description: "",
  contactName: "",
  phone: "",
  address: "",
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  coords: { latitude: number; longitude: number; accuracy?: number } | null;
  initial?: Partial<SiteFormValues>;
  mode?: "create" | "edit";
  onSaved?: (siteId: number) => void;
  onRequestLocation?: () => void;
};

export function SiteFormSheet({
  open,
  onOpenChange,
  coords,
  initial,
  mode = "create",
  onSaved,
  onRequestLocation,
}: Props) {
  const utils = trpc.useUtils();
  const catalog = trpc.admin.catalog.useQuery(undefined, { staleTime: 5 * 60 * 1000 });
  const [values, setValues] = useState<SiteFormValues>({ ...EMPTY, ...initial });

  useEffect(() => {
    if (open) setValues({ ...EMPTY, ...initial });
  }, [open, initial]);

  const invalidate = async () => {
    await Promise.all([utils.sites.list.invalidate(), utils.sites.nearby.invalidate()]);
  };

  const createSite = trpc.sites.create.useMutation({
    onSuccess: async site => {
      await invalidate();
      toast.success("Sitio registrado en el mapa");
      onOpenChange(false);
      if (site?.id) onSaved?.(site.id);
    },
    onError: error => toast.error(error.message),
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

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (values.name.trim().length < 2) {
      toast.error("Ingresá el nombre del cliente");
      return;
    }

    const payload = {
      name: values.name.trim(),
      clientType: values.clientType || null,
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

    if (!coords) {
      toast.error("Necesitamos tu ubicación GPS para registrar el sitio");
      onRequestLocation?.();
      return;
    }

    createSite.mutate({
      ...payload,
      latitude: coords.latitude,
      longitude: coords.longitude,
      accuracy: coords.accuracy ?? null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[92dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "edit" ? "Editar sitio" : "Nuevo sitio de cliente"}
          </DialogTitle>
          <DialogDescription>
            {mode === "edit"
              ? "Actualizá los datos del cliente."
              : "Se guarda con las coordenadas GPS de tu ubicación actual."}
          </DialogDescription>
        </DialogHeader>

        {mode === "create" && (
          <div className="flex items-center gap-2.5 rounded-lg bg-secondary px-3 py-2.5 text-sm">
            <MapPin className="h-4 w-4 text-primary shrink-0" />
            {coords ? (
              <span className="font-mono text-xs">
                {formatCoords(coords.latitude, coords.longitude)}
                {coords.accuracy ? (
                  <span className="text-muted-foreground"> · ±{coords.accuracy} m</span>
                ) : null}
              </span>
            ) : (
              <span className="text-muted-foreground flex-1">Ubicación no disponible</span>
            )}
            {onRequestLocation && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="ml-auto h-7 px-2"
                onClick={onRequestLocation}>
                <Crosshair className="h-3.5 w-3.5" />
                Actualizar
              </Button>
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
              placeholder="Ej. Estancia San Rafael"
              required
              className="h-11"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
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
              <Label>Zona</Label>
              <Select value={values.zone || undefined} onValueChange={value => set("zone", value)}>
                <SelectTrigger className="h-11 w-full">
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  {(catalog.data?.zones ?? []).map(zone => (
                    <SelectItem key={zone} value={zone}>
                      {zone}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
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
              placeholder="Ej. Productor de soja, 400 ha, compra insumos por campaña"
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

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              className="bg-background"
              onClick={() => onOpenChange(false)}
              disabled={busy}>
              Cancelar
            </Button>
            <Button type="submit" disabled={busy}>
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              {mode === "edit" ? "Guardar cambios" : "Registrar sitio"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
