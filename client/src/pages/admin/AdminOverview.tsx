import { AdminShell } from "@/components/AdminShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateLong, formatDateTime, timeAgo } from "@/lib/format";
import { trpc } from "@/lib/trpc";
import {
  Activity,
  CalendarClock,
  MapPinned,
  Navigation,
  NotebookPen,
  Users,
} from "lucide-react";
import { Link } from "wouter";

function StatCard({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string;
  value: number | string;
  hint?: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="surface-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
            {label}
          </p>
          <p className="text-3xl font-bold tracking-tight mt-1.5 tabular-nums">{value}</p>
          {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
        </div>
        <div className="grid place-items-center h-10 w-10 rounded-xl bg-primary/10 text-primary shrink-0">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

export default function AdminOverview() {
  const statsQuery = trpc.admin.stats.useQuery();
  const activityQuery = trpc.admin.activity.useQuery({ limit: 8 });
  const followupsQuery = trpc.followups.list.useQuery({ limit: 8 });
  const stats = statsQuery.data;

  return (
    <AdminShell
      title="Resumen general"
      description="Estado del mapeo de clientes y actividad del equipo"
      actions={
        <Button asChild variant="outline" className="bg-background hidden sm:flex">
          <Link href="/admin/mapa">
            <MapPinned className="h-4 w-4" />
            Ver mapa general
          </Link>
        </Button>
      }>
      <div className="space-y-6 max-w-7xl">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 stagger-in">
          {statsQuery.isLoading ? (
            [0, 1, 2, 3].map(i => <Skeleton key={i} className="h-[122px] rounded-xl" />)
          ) : (
            <>
              <StatCard
                label="Clientes mapeados"
                value={stats?.totalSites ?? 0}
                hint="Sitios activos en el mapa"
                icon={MapPinned}
              />
              <StatCard
                label="Visitas totales"
                value={stats?.totalCheckins ?? 0}
                hint={`${stats?.weekCheckins ?? 0} en los últimos 7 días`}
                icon={Navigation}
              />
              <StatCard
                label="Notas cargadas"
                value={stats?.totalNotes ?? 0}
                hint="Registros en la planilla"
                icon={NotebookPen}
              />
              <StatCard
                label="Vendedores activos"
                value={stats?.totalSellers ?? 0}
                hint="Cuentas habilitadas"
                icon={Users}
              />
            </>
          )}
        </div>

        <div className="surface-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <CalendarClock className="h-4 w-4 text-primary" />
            <p className="font-semibold">Próximos relevamientos</p>
            <span className="text-xs text-muted-foreground">Agenda de visitas y atenciones</span>
          </div>
          {followupsQuery.isLoading ? (
            <Skeleton className="h-28" />
          ) : (followupsQuery.data?.length ?? 0) === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No hay relevamientos agendados.
            </p>
          ) : (
            <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
              {followupsQuery.data!.map(followup => (
                <Link
                  key={followup.id}
                  href={`/admin/clientes/${followup.siteId}`}
                  className="rounded-lg bg-secondary/60 p-3 hover:bg-secondary transition-colors">
                  <p className="text-xs font-medium text-primary capitalize truncate">
                    {formatDateLong(followup.scheduledFor)}
                  </p>
                  <p className="text-sm font-semibold truncate mt-1">{followup.siteName}</p>
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{followup.description}</p>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="surface-card p-5 lg:col-span-1">
            <p className="font-semibold">Distribución por zona</p>
            <p className="text-xs text-muted-foreground mb-4">Cantidad de clientes</p>
            {statsQuery.isLoading ? (
              <Skeleton className="h-40" />
            ) : (stats?.byZone.length ?? 0) === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">
                Sin datos todavía.
              </p>
            ) : (
              <div className="space-y-2.5">
                {stats!.byZone.slice(0, 8).map(item => {
                  const max = stats!.byZone[0].count || 1;
                  return (
                    <div key={item.zone} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="truncate">{item.zone}</span>
                        <span className="font-medium tabular-nums text-muted-foreground">
                          {item.count}
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary transition-[width] duration-500"
                          style={{ width: `${(item.count / max) * 100}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="surface-card p-5 lg:col-span-1">
            <p className="font-semibold">Tipos de cliente</p>
            <p className="text-xs text-muted-foreground mb-4">Clasificación de la cartera</p>
            {statsQuery.isLoading ? (
              <Skeleton className="h-40" />
            ) : (stats?.byType.length ?? 0) === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">
                Sin datos todavía.
              </p>
            ) : (
              <div className="space-y-2">
                {stats!.byType.slice(0, 8).map(item => (
                  <div
                    key={item.type}
                    className="flex items-center justify-between rounded-lg bg-secondary/60 px-3 py-2">
                    <span className="text-sm truncate">{item.type}</span>
                    <Badge variant="secondary" className="tabular-nums">
                      {item.count}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="surface-card p-5 lg:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="h-4 w-4 text-primary" />
              <p className="font-semibold">Últimas visitas</p>
              <Button variant="ghost" size="sm" className="ml-auto -mr-2" asChild>
                <Link href="/admin/actividad">Ver todo</Link>
              </Button>
            </div>
            {activityQuery.isLoading ? (
              <Skeleton className="h-40" />
            ) : (activityQuery.data?.checkins.length ?? 0) === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">
                Sin actividad registrada.
              </p>
            ) : (
              <div className="space-y-2.5">
                {activityQuery.data!.checkins.slice(0, 6).map(checkin => (
                  <Link
                    key={checkin.id}
                    href={`/admin/clientes/${checkin.siteId}`}
                    className="flex items-start gap-2.5 rounded-lg px-2 py-1.5 -mx-2 hover:bg-accent/50 transition-colors">
                    <CalendarClock className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{checkin.siteName}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {checkin.userName ?? checkin.username} · {formatDateTime(checkin.createdAt)}
                      </p>
                    </div>
                    <span className="text-[11px] text-muted-foreground shrink-0">
                      {timeAgo(checkin.createdAt)}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
