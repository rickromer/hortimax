import { AdminShell } from "@/components/AdminShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateTime } from "@/lib/format";
import { trpc } from "@/lib/trpc";
import { ArchiveRestore, MapPinned, RotateCcw } from "lucide-react";
import { toast } from "sonner";

/** Papelera administrativa: archivar desactiva un punto sin borrar su historial. */
export default function AdminArchived() {
  const utils = trpc.useUtils();
  const archivedQuery = trpc.admin.archivedClients.useQuery();
  const restoreClient = trpc.admin.restoreClient.useMutation({
    onSuccess: async result => {
      await Promise.all([
        utils.admin.archivedClients.invalidate(),
        utils.sites.list.invalidate(),
        utils.admin.stats.invalidate(),
      ]);
      toast.success(`${result.name} volvió a estar activo en Clientes.`);
    },
    onError: error => toast.error(error.message),
  });

  const archived = archivedQuery.data ?? [];
  return (
    <AdminShell
      title="Papelera de puntos"
      description={`${archived.length} punto${archived.length === 1 ? "" : "s"} archivado${archived.length === 1 ? "" : "s"} recuperable${archived.length === 1 ? "" : "s"}`}>
      <div className="max-w-4xl space-y-4">
        <div className="rounded-xl border border-[color:color-mix(in_oklab,var(--hortimax-teal)_28%,var(--border))] bg-[var(--hortimax-teal)]/6 p-4 text-sm">
          <div className="flex gap-3">
            <ArchiveRestore className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <div>
              <p className="font-semibold">Los puntos archivados no se eliminan</p>
              <p className="mt-1 text-muted-foreground">Conservan clientes, notas, visitas, recordatorios y su autoría. Solo Administración puede restaurarlos.</p>
            </div>
          </div>
        </div>

        {archivedQuery.isLoading ? (
          <Skeleton className="h-56 rounded-xl" />
        ) : archived.length === 0 ? (
          <div className="surface-card px-6 py-16 text-center">
            <MapPinned className="mx-auto h-8 w-8 text-muted-foreground/60" />
            <p className="mt-3 font-medium">La papelera está vacía</p>
            <p className="mt-1 text-sm text-muted-foreground">Los puntos archivados aparecerán aquí para poder recuperarlos.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {archived.map(site => (
              <div key={site.id} className="surface-card flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <p className="truncate font-semibold">{site.name}</p>
                    {site.clientType && <Badge variant="secondary" className="text-[11px]">{site.clientType}</Badge>}
                  </div>
                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {[site.department, site.zone].filter(Boolean).join(" · ") || "Sin territorio"} · Última actualización {formatDateTime(site.updatedAt)}
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="shrink-0 bg-background"
                  disabled={restoreClient.isPending}
                  onClick={() => restoreClient.mutate({ id: site.id })}>
                  <RotateCcw className="h-4 w-4" />
                  Recuperar punto
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminShell>
  );
}
