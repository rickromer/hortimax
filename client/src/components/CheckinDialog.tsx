import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatDateTime } from "@/lib/format";
import { enqueueOfflineOperation, isOffline } from "@/lib/offlineQueue";
import { trpc } from "@/lib/trpc";
import { CheckCircle2, Clock, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  site: { id: number; name: string } | null;
  coords: { latitude: number; longitude: number } | null;
};

export function CheckinDialog({ open, onOpenChange, site, coords }: Props) {
  const utils = trpc.useUtils();
  const catalog = trpc.admin.catalog.useQuery(undefined, { staleTime: 5 * 60 * 1000 });
  const [note, setNote] = useState("");
  const [category, setCategory] = useState<string>("");
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    if (open) {
      setNote("");
      setCategory("");
      setNow(new Date());
    }
  }, [open]);

  const checkin = trpc.sites.checkin.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.sites.list.invalidate(),
        utils.notes.list.invalidate(),
        site ? utils.sites.detail.invalidate({ id: site.id }) : Promise.resolve(),
      ]);
      toast.success("Check-in registrado");
      onOpenChange(false);
    },
    onError: error => toast.error(error.message),
  });

  if (!site) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Check-in en {site.name}</DialogTitle>
          <DialogDescription>
            Se registra la visita con fecha y hora automáticas.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2 rounded-lg bg-secondary px-3 py-2.5 text-sm">
          <Clock className="h-4 w-4 text-primary" />
          <span className="font-medium">{formatDateTime(now)}</span>
          <span className="text-muted-foreground text-xs ml-auto">
            {coords ? "GPS activo" : "sin GPS"}
          </span>
        </div>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Categoría de la nota (opcional)</Label>
            <Select value={category || undefined} onValueChange={setCategory}>
              <SelectTrigger className="h-11 w-full">
                <SelectValue placeholder="Seleccionar" />
              </SelectTrigger>
              <SelectContent>
                {(catalog.data?.noteCategories ?? []).map(item => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="checkin-note">Nota de la visita (opcional)</Label>
            <Textarea
              id="checkin-note"
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Ej. Aplicación de fertilizante foliar, 40 ha, dosis 1,5 L/ha"
              rows={4}
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            variant="outline"
            className="bg-background"
            onClick={() => onOpenChange(false)}
            disabled={checkin.isPending}>
            Cancelar
          </Button>
          <Button
            onClick={() => {
              const checkinPayload = {
                siteId: site.id,
                latitude: coords?.latitude,
                longitude: coords?.longitude,
                note: note.trim() || undefined,
                noteCategory: category || undefined,
              };
              if (isOffline()) {
                void enqueueOfflineOperation("site.checkin", checkinPayload)
                  .then(() => {
                    toast.success("Check-in guardado en el teléfono. Se sincronizará al recuperar señal.");
                    onOpenChange(false);
                  })
                  .catch(error => toast.error(error instanceof Error ? error.message : "No se pudo guardar sin conexión"));
              } else {
                checkin.mutate(checkinPayload);
              }
            }}
            disabled={checkin.isPending}>
            {checkin.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            Confirmar check-in
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

