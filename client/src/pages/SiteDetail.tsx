import { CheckinDialog } from "@/components/CheckinDialog";
import { ClientMap } from "@/components/ClientMap";
import { FieldShell } from "@/components/FieldShell";
import { useAuth } from "@/_core/hooks/useAuth";
import { FollowupsPanel } from "@/components/FollowupsPanel";
import { PointLocationActions } from "@/components/PointLocationActions";
import { SiteFormSheet } from "@/components/SiteFormSheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useGeolocation } from "@/hooks/useGeolocation";
import { downloadCsv, formatCoords, formatDateTime, formatDistance, timeAgo } from "@/lib/format";
import { trpc } from "@/lib/trpc";
import {
  ArrowLeft,
  CalendarClock,
  Download,
  Loader2,
  MapPin,
  Navigation,
  NotebookPen,
  Pencil,
  Phone,
  Plus,
  Trash2,
  User,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Link, useRoute } from "wouter";

export default function SiteDetail() {
  const [, params] = useRoute("/sitios/:id");
  const siteId = Number(params?.id);
  const { user } = useAuth();
  const canEdit = Boolean(user);
  const canContribute = true;
  const geo = useGeolocation({ enabled: true });
  const utils = trpc.useUtils();

  const [noteText, setNoteText] = useState("");
  const [noteCategory, setNoteCategory] = useState<string>("");
  const [registerVisit, setRegisterVisit] = useState(false);
  const [checkinOpen, setCheckinOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const detailQuery = trpc.sites.detail.useQuery(
    { id: siteId },
    { enabled: Number.isFinite(siteId) && siteId > 0 }
  );
  const catalog = trpc.admin.catalog.useQuery(undefined, {
    staleTime: 5 * 60 * 1000,
    enabled: true,
  });
  const noteCategories = catalog.data?.noteCategories?.length
    ? catalog.data.noteCategories
    : ["Visita técnica", "Visita comercial", "Pedido", "Entrega", "Reclamo", "Otro"];

  const createNote = trpc.notes.create.useMutation({
    onSuccess: async result => {
      setNoteText("");
      setNoteCategory("");
      setRegisterVisit(false);
      await Promise.all([
        utils.sites.detail.invalidate({ id: siteId }),
        utils.notes.list.invalidate(),
      ]);
      toast.success(result.registeredVisit ? "Nota y visita registradas" : "Nota agregada al historial");
    },
    onError: error => toast.error(error.message),
  });

  const removeNote = trpc.notes.remove.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.sites.detail.invalidate({ id: siteId }),
        utils.notes.list.invalidate(),
      ]);
      toast.success("Nota eliminada");
    },
    onError: error => toast.error(error.message),
  });

  const exportNotes = async () => {
    try {
      const result = await utils.notes.exportCsv.fetch({ siteId });
      downloadCsv(result.filename, result.csv);
      toast.success("Planilla descargada. Podés abrirla o importarla en Google Sheets.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo exportar la planilla");
    }
  };

  if (detailQuery.isLoading) {
    return (
      <FieldShell title="Cargando…">
        <div className="space-y-3">
          <Skeleton className="h-40 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
        </div>
      </FieldShell>
    );
  }

  if (!detailQuery.data) {
    return (
      <FieldShell title="Punto no encontrado">
        <div className="surface-card p-8 text-center space-y-3">
          <p className="text-muted-foreground">
            El punto no existe o no tenés permiso para verlo.
          </p>
          <Button asChild variant="outline" className="bg-background">
            <Link href="/sitios">
              <ArrowLeft className="h-4 w-4" />
              Volver a mis clientes
            </Link>
          </Button>
        </div>
      </FieldShell>
    );
  }

  const { site, checkins, notes, followups } = detailQuery.data;

  return (
    <FieldShell
      title={site.name}
      subtitle={[site.clientType, site.department, site.zone].filter(Boolean).join(" · ") || "Sin clasificar"}
      action={canEdit ? (
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full"
          onClick={() => setEditOpen(true)}
          aria-label="Editar sitio">
          <Pencil className="h-4.5 w-4.5" />
        </Button>
      ) : undefined}>
      <div className="space-y-4">
        <Button variant="ghost" size="sm" className="-ml-2" asChild>
          <Link href="/sitios">
            <ArrowLeft className="h-4 w-4" />
            Mis clientes
          </Link>
        </Button>

        {/* Mapa del punto */}
        <div className="surface-card overflow-hidden">
          <div className="h-44">
            <ClientMap
              markers={[
                {
                  id: site.id,
                  name: site.name,
                  latitude: site.latitude,
                  longitude: site.longitude,
                  clientType: site.clientType,
                  selected: true,
                },
              ]}
              userPosition={geo.position}
              fitToMarkers
              initialZoom={15}
            />
          </div>
          <div className="p-3.5 space-y-3">
            <div className="flex flex-wrap gap-1.5">
              {site.clientType && <Badge variant="secondary">{site.clientType}</Badge>}
              {site.department && <Badge variant="outline">{site.department}</Badge>}
              {site.zone && <Badge variant="outline" className="text-muted-foreground">{site.zone}</Badge>}
              <Badge variant="outline" className="font-mono text-[11px]">
                {formatCoords(site.latitude, site.longitude)}
              </Badge>
            </div>

            {site.description && (
              <p className="text-sm text-muted-foreground leading-relaxed">
                {site.description}
              </p>
            )}

            <div className="grid gap-1.5 text-sm">
              {site.contactName && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <User className="h-4 w-4 shrink-0" />
                  <span className="text-foreground">{site.contactName}</span>
                </div>
              )}
              {site.phone && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-4 w-4 shrink-0" />
                  <a href={`tel:${site.phone}`} className="text-foreground underline-offset-2 hover:underline">
                    {site.phone}
                  </a>
                </div>
              )}
              {site.address && (
                <div className="flex items-start gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4 shrink-0 mt-0.5" />
                  <span className="text-foreground">{site.address}</span>
                </div>
              )}
            </div>

            {canEdit && <div className="flex gap-2 pt-1">
              <Button className="flex-1" onClick={() => setCheckinOpen(true)}>
                <Navigation className="h-4 w-4" />
                Check-in
              </Button>
            </div>}
            <PointLocationActions
              name={site.name}
              coords={{ latitude: site.latitude, longitude: site.longitude }}
            />
          </div>
        </div>

        <Tabs defaultValue="notas">
          <TabsList className="w-full">
            <TabsTrigger value="notas" className="flex-1">
              Notas ({notes.length})
            </TabsTrigger>
            <TabsTrigger value="relevamientos" className="flex-1">
              Próximos ({followups.length})
            </TabsTrigger>
            <TabsTrigger value="visitas" className="flex-1">
              Visitas ({checkins.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="notas" className="space-y-3 mt-3">
            <div className="flex items-center justify-between gap-3 px-1">
              <div>
                <p className="text-sm font-semibold">Historial de notas</p>
                <p className="text-xs text-muted-foreground">Cada registro conserva fecha y hora automáticas.</p>
              </div>
              <Button variant="outline" size="sm" className="shrink-0 bg-background" onClick={exportNotes}>
                <Download className="h-4 w-4" />
                Sheets
              </Button>
            </div>
            {canContribute && <div className="surface-card p-3.5 space-y-3">
              <div className="flex items-center gap-2">
                <NotebookPen className="h-4 w-4 text-primary" />
                <p className="text-sm font-medium">Nueva nota</p>
                <span className="text-xs text-muted-foreground ml-auto">
                  {formatDateTime(new Date())}
                </span>
              </div>
              <Textarea
                value={noteText}
                onChange={e => setNoteText(e.target.value)}
                placeholder="Ej. Visita técnica al invernadero, se relevó cultivo de tomate"
                rows={3}
              />
              <label className="flex items-center gap-2.5 rounded-lg border border-border/70 bg-muted/35 px-3 py-2.5 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={registerVisit}
                  onChange={event => setRegisterVisit(event.target.checked)}
                  className="h-4 w-4 accent-[var(--hortimax-teal)]"
                />
                <span className="flex-1">
                  <span className="font-medium block">Registrar también como visita</span>
                  <span className="text-xs text-muted-foreground">Guarda fecha, hora y GPS si está disponible.</span>
                </span>
                <Navigation className="h-4 w-4 text-primary" />
              </label>
              <div className="flex gap-2">
                <Select value={noteCategory || undefined} onValueChange={setNoteCategory}>
                  <SelectTrigger className="h-10 flex-1">
                    <SelectValue placeholder="Categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {noteCategories.map(item => (
                      <SelectItem key={item} value={item}>
                        {item}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  onClick={() => {
                    if (noteText.trim().length === 0) {
                      toast.error("Escribí el contenido de la nota");
                      return;
                    }
                    createNote.mutate({
                      siteId,
                      content: noteText,
                      category: noteCategory || undefined,
                      registerVisit,
                      latitude: registerVisit ? geo.position?.latitude : undefined,
                      longitude: registerVisit ? geo.position?.longitude : undefined,
                    });
                  }}
                  disabled={createNote.isPending}>
                  {createNote.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  Agregar
                </Button>
              </div>
            </div>}

            {notes.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Todavía no hay notas para este cliente.
              </p>
            ) : (
              <div className="space-y-2 stagger-in">
                {notes.map(note => (
                  <div key={note.id} className="surface-card p-3.5">
                    <div className="flex items-center gap-2 pb-2 mb-2 border-b border-border/60">
                      <CalendarClock className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span className="text-xs font-semibold font-mono">
                        {formatDateTime(note.createdAt)}
                      </span>
                      {note.category && (
                        <Badge variant="secondary" className="text-[10px] py-0">
                          {note.category}
                        </Badge>
                      )}
                      <span className="text-[11px] text-muted-foreground ml-auto truncate max-w-[35%]">
                        {note.userName ?? note.username}
                      </span>
                      {canEdit && <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 shrink-0 text-muted-foreground hover:text-destructive"
                        onClick={() => removeNote.mutate({ id: note.id })}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>}
                    </div>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {note.content}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="relevamientos" className="mt-3">
            <FollowupsPanel siteId={site.id} followups={followups} readOnly={!canEdit} canCreate={canContribute} />
          </TabsContent>

          <TabsContent value="visitas" className="mt-3">
            {checkins.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Todavía no se registraron visitas.
              </p>
            ) : (
              <div className="space-y-2 stagger-in">
                {checkins.map(checkin => (
                  <div key={checkin.id} className="surface-card p-3.5 flex items-start gap-3">
                    <div className="grid place-items-center h-9 w-9 rounded-lg bg-primary/10 text-primary shrink-0">
                      <Navigation className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{formatDateTime(checkin.createdAt)}</p>
                      <p className="text-xs text-muted-foreground">
                        {checkin.userName ?? checkin.username}
                        {checkin.distanceMeters !== null &&
                          ` · a ${formatDistance(checkin.distanceMeters)} del pin`}
                      </p>
                      {checkin.comment && (
                        <p className="text-sm mt-1.5">{checkin.comment}</p>
                      )}
                    </div>
                    <span className="text-[11px] text-muted-foreground shrink-0">
                      {timeAgo(checkin.createdAt)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {canEdit && <CheckinDialog
        open={checkinOpen}
        onOpenChange={setCheckinOpen}
        site={{ id: site.id, name: site.name }}
        coords={geo.position}
      />}
      {canEdit && <SiteFormSheet
        open={editOpen}
        onOpenChange={setEditOpen}
        mode="edit"
        coords={null}
        initial={{
          id: site.id,
          name: site.name,
          clientType: site.clientType ?? "",
          department: site.department ?? "",
          zone: site.zone ?? "",
          description: site.description ?? "",
          contactName: site.contactName ?? "",
          phone: site.phone ?? "",
          address: site.address ?? "",
        }}
      />}
    </FieldShell>
  );
}
