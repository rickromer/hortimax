import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatDateLong } from "@/lib/format";
import { enqueueOfflineOperation, isOffline } from "@/lib/offlineQueue";
import { trpc } from "@/lib/trpc";
import { BellRing, CalendarPlus, CheckCircle2, Loader2, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type FollowupItem = {
  id: number;
  description: string;
  scheduledFor: Date | string;
  createdAt: Date | string;
  type: "reminder" | "visit" | "attention";
  userName?: string | null;
  username?: string | null;
};

type Props = {
  siteId: number;
  followups: FollowupItem[];
  readOnly?: boolean;
  canCreate?: boolean;
};

function dateInputToday() {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  return new Date(now.getTime() - offset * 60_000).toISOString().slice(0, 10);
}

function isOverdue(value: Date | string) {
  const scheduled = new Date(value);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  scheduled.setHours(0, 0, 0, 0);
  return scheduled < today;
}

/** Agenda simple de visitas o atenciones futuras que pertenece al cliente actual. */
const followupLabels = {
  reminder: "Recordatorio",
  visit: "Visita",
  attention: "Atención",
} as const;

export function FollowupsPanel({ siteId, followups, readOnly = false, canCreate = !readOnly }: Props) {
  const utils = trpc.useUtils();
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(dateInputToday);
  const [type, setType] = useState<keyof typeof followupLabels>("reminder");

  const invalidate = async () => {
    await Promise.all([
      utils.sites.detail.invalidate({ id: siteId }),
      utils.followups.list.invalidate(),
    ]);
  };

  const create = trpc.followups.create.useMutation({
    onSuccess: async () => {
      setDescription("");
      setDate(dateInputToday());
      setType("reminder");
      await invalidate();
      toast.success(`${followupLabels[type]} agendado`);
    },
    onError: error => toast.error(error.message),
  });

  const update = trpc.followups.update.useMutation({
    onSuccess: async () => {
      await invalidate();
      toast.success("Relevamiento marcado como realizado");
    },
    onError: error => toast.error(error.message),
  });

  const remove = trpc.followups.remove.useMutation({
    onSuccess: async () => {
      await invalidate();
      toast.success("Relevamiento eliminado");
    },
    onError: error => toast.error(error.message),
  });

  const schedule = () => {
    if (description.trim().length < 2) {
      toast.error("Escribí una descripción para el próximo relevamiento");
      return;
    }
    if (!date) {
      toast.error("Elegí una fecha");
      return;
    }
    const followupPayload = {
      siteId,
      description: description.trim(),
      scheduledFor: new Date(`${date}T12:00:00`),
      type,
    };
    if (isOffline()) {
      void enqueueOfflineOperation("followup.create", followupPayload)
        .then(() => {
          setDescription("");
          setDate(dateInputToday());
          setType("reminder");
          toast.success("Relevamiento guardado en el teléfono. Se sincronizará al recuperar señal.");
        })
        .catch(error => toast.error(error instanceof Error ? error.message : "No se pudo guardar sin conexión"));
      return;
    }
    create.mutate(followupPayload);
  };

  return (
    <div className="space-y-3">
      {canCreate && <div className="surface-card p-3.5 space-y-3">
        <div className="flex items-center gap-2">
          <div className="grid place-items-center h-8 w-8 rounded-lg bg-primary/10 text-primary shrink-0">
            <CalendarPlus className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-semibold">Agendar recordatorio</p>
            <p className="text-xs text-muted-foreground">Recordatorio, visita o atención pendiente de este cliente.</p>
          </div>
        </div>
        <Textarea
          value={description}
          onChange={event => setDescription(event.target.value)}
          placeholder="Ej. Revisar respuesta al fertilizante y coordinar próxima aplicación"
          rows={3}
        />
        <div className="grid gap-2 sm:grid-cols-2">
          <Select value={type} onValueChange={value => setType(value as keyof typeof followupLabels)}>
            <SelectTrigger className="h-10">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="reminder">Recordatorio</SelectItem>
              <SelectItem value="visit">Visita</SelectItem>
              <SelectItem value="attention">Atención</SelectItem>
            </SelectContent>
          </Select>
          <Input
            type="date"
            value={date}
            onChange={event => setDate(event.target.value)}
            className="h-10"
          />
        </div>
        <div className="flex justify-end">
          <Button className="sm:ml-auto" onClick={schedule} disabled={create.isPending}>
            {create.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            <BellRing className="h-4 w-4" />
            Agendar
          </Button>
        </div>
      </div>}

      {followups.length === 0 ? (
        <div className="surface-card py-10 px-5 text-center">
          <CalendarPlus className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm font-medium">No hay próximos relevamientos</p>
          <p className="text-xs text-muted-foreground mt-1">Agendá una fecha para volver a atender este cliente.</p>
        </div>
      ) : (
        <div className="space-y-2 stagger-in">
          {followups.map(followup => (
            <div key={followup.id} className="surface-card p-3.5 flex items-start gap-3">
              <div className="grid place-items-center h-9 w-9 rounded-lg bg-primary/10 text-primary shrink-0">
                <CalendarPlus className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold capitalize">{formatDateLong(followup.scheduledFor)}</p>
                  <Badge variant="secondary" className="text-[10px] py-0">
                    {followupLabels[followup.type ?? "reminder"]}
                  </Badge>
                  {isOverdue(followup.scheduledFor) && <Badge variant="destructive">Vencido</Badge>}
                </div>
                <p className="text-sm leading-relaxed whitespace-pre-wrap mt-1">{followup.description}</p>
                <p className="text-xs text-muted-foreground mt-1.5">
                  Agendado por {followup.userName ?? followup.username ?? "Registro anterior sin responsable"}
                </p>
              </div>
              {!readOnly && <div className="flex items-center gap-1 shrink-0">
                <Button
                  size="icon-sm"
                  variant="ghost"
                  className="text-primary hover:text-primary"
                  disabled={update.isPending}
                  onClick={() => update.mutate({ id: followup.id, status: "completed" })}
                  aria-label="Marcar relevamiento realizado">
                  <CheckCircle2 className="h-4 w-4" />
                </Button>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  className="text-muted-foreground hover:text-destructive"
                  disabled={remove.isPending}
                  onClick={() => remove.mutate({ id: followup.id })}
                  aria-label="Eliminar relevamiento">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
