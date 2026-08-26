import { AdminShell } from "@/components/AdminShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateTime } from "@/lib/format";
import { trpc } from "@/lib/trpc";
import { ArchiveRestore, MapPin, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Link } from "wouter";

export default function AdminTrash() {
  const utils = trpc.useUtils();
  const archivedQuery = trpc.admin.archivedClients.useQuery();
  const restoreClient = trpc.admin.restoreClient.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.admin.archivedClients.invalidate(),
        utils.sites.list.invalidate(),
      ]);
      toast.success("Cliente restaurado y disponible nuevamente en la operación.");
    },
    onError: error => toast.error(error.message),
  });

  const archived = archivedQuery.data ?? [];

  return (
    <AdminShell
      title="Papelera"
      description="Clientes archivados y recuperables">
      <div className="max-w-5xl space-y-5">
        <div className="surface-card p-4 flex gap-3 text-sm text-muted-foreground">
          <ArchiveRestore className="h-5 w-5 shrink-0 text-primary mt-0.5" />
          <p>
            Archivar retira un cliente de los mapas y listados operativos sin borrar su historial. Al restaurarlo, se recuperan el punto, las notas, las visitas, los relevamientos y las asignaciones que ya tenía.
          </p>
        </div>

        {archivedQuery.isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-28 rounded-xl" />
            <Skeleton className="h-28 rounded-xl" />
          </div>
        ) : archivedQuery.isError ? (
          <div className="surface-card py-12 px-6 text-center">
            <p className="font-semibold">No se pudo cargar la Papelera</p>
            <p className="text-sm text-muted-foreground mt-1">{archivedQuery.error.message}</p>
            <Button variant="outline" className="bg-background mt-4" onClick={() => archivedQuery.refetch()}>
              Reintentar
            </Button>
          </div>
        ) : archived.length === 0 ? (
          <div className="surface-card py-14 px-6 text-center">
            <ArchiveRestore className="h-9 w-9 text-muted-foreground mx-auto mb-3" />
            <p className="font-semibold">La Papelera está vacía</p>
            <p className="text-sm text-muted-foreground mt-1">No hay clientes archivados para restaurar.</p>
          </div>
        ) : (
          <div className="space-y-3 stagger-in">
            {archived.map(site => (
              <article key={site.id} className="surface-card p-4 flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="grid place-items-center h-10 w-10 rounded-xl bg-destructive/10 text-destructive shrink-0">
                  <MapPin className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link href={`/admin/clientes/${site.id}`} className="font-semibold hover:underline truncate">
                      {site.name}
                    </Link>
                    {site.department && <Badge variant="outline">{site.department}</Badge>}
                    {site.zone && <Badge variant="outline" className="text-muted-foreground">{site.zone}</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5">
                    Archivado {site.archivedAt ? formatDateTime(site.archivedAt) : "sin fecha registrada"}
                    {site.ownerName || site.ownerUsername ? ` · Registrado por ${site.ownerName ?? site.ownerUsername}` : ""}
                  </p>
                  {site.archiveReason && <p className="text-xs text-muted-foreground mt-1">Motivo: {site.archiveReason}</p>}
                </div>
                <Button
                  variant="outline"
                  className="bg-background sm:shrink-0"
                  onClick={() => restoreClient.mutate({ id: site.id })}
                  disabled={restoreClient.isPending}>
                  <RotateCcw className="h-4 w-4" />
                  {restoreClient.isPending ? "Restaurando…" : "Restaurar"}
                </Button>
              </article>
            ))}
          </div>
        )}
      </div>
    </AdminShell>
  );
}
