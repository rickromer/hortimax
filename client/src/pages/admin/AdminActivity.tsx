import { AdminShell } from "@/components/AdminShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { downloadCsv, formatDateTime, formatDistance, timeAgo } from "@/lib/format";
import { trpc } from "@/lib/trpc";
import { Download, Navigation } from "lucide-react";
import { toast } from "sonner";
import { Link } from "wouter";

export default function AdminActivity() {
  const utils = trpc.useUtils();
  const activityQuery = trpc.admin.activity.useQuery({ limit: 120 });
  const usersQuery = trpc.admin.listUsers.useQuery();

  const exportar = async () => {
    try {
      const result = await utils.admin.exportCsv.fetch({ dataset: "checkins", scope: "all" });
      downloadCsv(result.filename, result.csv);
      toast.success("Planilla descargada");
    } catch {
      toast.error("No se pudo exportar");
    }
  };

  const checkins = activityQuery.data?.checkins ?? [];
  const sellers = (usersQuery.data ?? []).filter(u => u.active);

  return (
    <AdminShell
      title="Actividad del equipo"
      description="Visitas registradas por los vendedores">
      <div className="space-y-5 max-w-6xl">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 stagger-in">
          {usersQuery.isLoading
            ? [0, 1, 2, 3].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)
            : sellers.map(user => (
                <div key={user.id} className="surface-card p-4">
                  <p className="font-medium truncate">{user.name ?? user.username}</p>
                  <p className="text-xs text-muted-foreground">@{user.username}</p>
                  <div className="flex gap-4 mt-2.5">
                    <div>
                      <p className="text-lg font-bold tabular-nums leading-none">
                        {user.sitesCount}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">clientes</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold tabular-nums leading-none">
                        {user.checkinsCount}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">visitas</p>
                    </div>
                    <div className="ml-auto text-right">
                      <p className="text-[11px] text-muted-foreground">último acceso</p>
                      <p className="text-[11px] font-medium">{timeAgo(user.lastSignedIn)}</p>
                    </div>
                  </div>
                </div>
              ))}
        </div>

        <section>
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-base font-semibold">Últimas visitas</h2>
              <p className="text-xs text-muted-foreground">Las notas se consultan desde la ficha de cada cliente.</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="bg-background shrink-0"
              onClick={exportar}>
              <Download className="h-3.5 w-3.5" />
              Check-ins CSV
            </Button>
          </div>

          {activityQuery.isLoading ? (
            <Skeleton className="h-72 rounded-xl" />
          ) : checkins.length === 0 ? (
            <p className="surface-card py-14 text-center text-sm text-muted-foreground">
              Sin visitas registradas.
            </p>
          ) : (
            <div className="space-y-2">
              {checkins.map(checkin => (
                <div key={checkin.id} className="surface-card p-3.5 flex items-start gap-3">
                  <div className="grid place-items-center h-9 w-9 rounded-lg bg-primary/10 text-primary shrink-0">
                    <Navigation className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/admin/clientes/${checkin.siteId}`}
                      className="font-medium text-sm hover:underline underline-offset-2">
                      {checkin.siteName}
                    </Link>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {checkin.userName ?? checkin.username} · {formatDateTime(checkin.createdAt)}
                      {checkin.distanceMeters !== null &&
                        ` · a ${formatDistance(checkin.distanceMeters)}`}
                    </p>
                    {checkin.comment && <p className="text-sm mt-1">{checkin.comment}</p>}
                  </div>
                  {checkin.siteZone && (
                    <Badge variant="outline" className="shrink-0 text-[11px]">
                      {checkin.siteZone}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </AdminShell>
  );
}
