import { AdminShell } from "@/components/AdminShell";
import { ClientMap } from "@/components/ClientMap";
import { ClientAssignmentsDialog } from "@/components/ClientAssignmentsDialog";
import { FollowupsPanel } from "@/components/FollowupsPanel";
import { PointLocationActions } from "@/components/PointLocationActions";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/_core/hooks/useAuth";
import { formatCoords, formatDateTime, formatDistance, timeAgo } from "@/lib/format";
import { trpc } from "@/lib/trpc";
import {
  ArrowLeft,
  CalendarClock,
  MapPin,
  Navigation,
  Phone,
  Archive,
  User,
  UsersRound,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Link, useLocation, useRoute } from "wouter";

export default function AdminClientDetail() {
  const [, params] = useRoute("/admin/clientes/:id");
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const siteId = Number(params?.id);
  const detailQuery = trpc.sites.detail.useQuery(
    { id: siteId },
    { enabled: Number.isFinite(siteId) && siteId > 0 }
  );
  const [assignmentsOpen, setAssignmentsOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const utils = trpc.useUtils();
  const archiveClient = trpc.admin.archiveClient.useMutation({
    onSuccess: async () => {
      await utils.sites.list.invalidate();
      toast.success("Cliente archivado en Papelera. Su historial se mantiene resguardado.");
      navigate("/admin/clientes");
    },
    onError: error => toast.error(error.message),
  });

  if (detailQuery.isLoading) {
    return (
      <AdminShell title="Cargando…">
        <Skeleton className="h-96 rounded-xl max-w-5xl" />
      </AdminShell>
    );
  }

  if (!detailQuery.data) {
    return (
      <AdminShell title="Cliente no encontrado">
        <div className="surface-card p-8 text-center max-w-md">
          <p className="text-muted-foreground mb-4">El sitio no existe o fue archivado.</p>
          <Button variant="outline" className="bg-background" asChild>
            <Link href="/admin/clientes">
              <ArrowLeft className="h-4 w-4" />
              Volver al listado
            </Link>
          </Button>
        </div>
      </AdminShell>
    );
  }

  const { site, checkins, notes, assignees, followups } = detailQuery.data;

  return (
    <AdminShell
      title={site.name}
      description={[site.clientType, site.department, site.zone].filter(Boolean).join(" · ") || "Sin clasificar"}>
      <div className="space-y-5 max-w-6xl">
        <Button variant="ghost" size="sm" className="-ml-2" asChild>
          <Link href="/admin/clientes">
            <ArrowLeft className="h-4 w-4" />
            Clientes
          </Link>
        </Button>

        {user?.role === "admin" && (
          <div className="flex justify-end">
            <Button variant="outline" size="sm" className="bg-background text-destructive border-destructive/40 hover:bg-destructive/10" onClick={() => setArchiveOpen(true)}>
              <Archive className="h-3.5 w-3.5" />
              Archivar cliente
            </Button>
          </div>
        )}

        <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          <div className="surface-card overflow-hidden">
            <div className="h-64 lg:h-80">
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
                fitToMarkers
                initialZoom={15}
                mapTypeId="hybrid"
              />
            </div>
          </div>

          <div className="surface-card p-5 space-y-4">
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

            <div className="grid gap-2 text-sm">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground">Contacto:</span>
                <span>{site.contactName || "—"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground">Teléfono:</span>
                <span>{site.phone || "—"}</span>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                <span className="text-muted-foreground">Referencia:</span>
                <span className="flex-1">{site.address || "—"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Navigation className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground">Registrado por:</span>
                <span>{site.ownerName ?? site.ownerUsername ?? "—"}</span>
              </div>
              <div className="flex items-center gap-2">
                <CalendarClock className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground">Alta:</span>
                <span>{formatDateTime(site.createdAt)}</span>
              </div>
            </div>

            <div className="pt-1">
              <p className="text-xs font-medium text-muted-foreground mb-2">Ubicación del punto</p>
              <PointLocationActions
                name={site.name}
                coords={{ latitude: site.latitude, longitude: site.longitude }}
              />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="rounded-lg bg-secondary/70 px-3 py-2.5">
                <p className="text-2xl font-bold tabular-nums">{checkins.length}</p>
                <p className="text-xs text-muted-foreground">Visitas</p>
              </div>
              <div className="rounded-lg bg-secondary/70 px-3 py-2.5">
                <p className="text-2xl font-bold tabular-nums">{notes.length}</p>
                <p className="text-xs text-muted-foreground">Notas</p>
              </div>
            </div>

            <div className="pt-1 border-t border-border/70">
              <div className="flex items-center justify-between gap-2 pt-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium">Cartera comercial</p>
                  <p className="text-xs text-muted-foreground">Quiénes pueden operar este cliente</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="bg-background shrink-0"
                  onClick={() => setAssignmentsOpen(true)}>
                  <UsersRound className="h-3.5 w-3.5" />
                  Asignar
                </Button>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2.5">
                {assignees.length ? (
                  assignees.map(assignee => (
                    <Badge key={assignee.id} variant="secondary">
                      {assignee.name ?? assignee.username}
                    </Badge>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground">Sin comerciales asignados.</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <Tabs defaultValue="notas">
          <TabsList>
            <TabsTrigger value="notas">Planilla de notas ({notes.length})</TabsTrigger>
            <TabsTrigger value="relevamientos">Próximos relevamientos ({followups.length})</TabsTrigger>
            <TabsTrigger value="visitas">Historial de visitas ({checkins.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="notas" className="mt-4">
            {notes.length === 0 ? (
              <p className="text-sm text-muted-foreground py-10 text-center surface-card">
                Sin notas registradas.
              </p>
            ) : (
              <div className="space-y-2 stagger-in">
                {notes.map(note => (
                  <div key={note.id} className="surface-card p-4">
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
                      <span className="text-xs text-muted-foreground ml-auto">
                        {note.userName ?? note.username}
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{note.content}</p>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="relevamientos" className="mt-4">
            <FollowupsPanel siteId={site.id} followups={followups} />
          </TabsContent>

          <TabsContent value="visitas" className="mt-4">
            {checkins.length === 0 ? (
              <p className="text-sm text-muted-foreground py-10 text-center surface-card">
                Sin visitas registradas.
              </p>
            ) : (
              <div className="space-y-2 stagger-in">
                {checkins.map(checkin => (
                  <div key={checkin.id} className="surface-card p-4 flex items-start gap-3">
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
                      {checkin.comment && <p className="text-sm mt-1.5">{checkin.comment}</p>}
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {timeAgo(checkin.createdAt)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
      <ClientAssignmentsDialog
        open={assignmentsOpen}
        onOpenChange={setAssignmentsOpen}
        siteId={site.id}
        clientName={site.name}
        assignedIds={assignees.map(assignee => assignee.id)}
      />
      <AlertDialog open={archiveOpen} onOpenChange={setArchiveOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Archivar {site.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              El cliente saldrá de la operación diaria, pero sus notas, visitas, relevamientos y asignaciones se conservarán en Papelera. Solo un administrador podrá restaurarlo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={archiveClient.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={archiveClient.isPending}
              onClick={event => {
                event.preventDefault();
                archiveClient.mutate({ id: site.id });
              }}>
              {archiveClient.isPending ? "Archivando…" : "Archivar en Papelera"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminShell>
  );
}
