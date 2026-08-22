import { AdminShell } from "@/components/AdminShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { downloadCsv, formatDateTime, formatDistance, timeAgo } from "@/lib/format";
import { trpc } from "@/lib/trpc";
import { CalendarClock, Download, Navigation } from "lucide-react";
import { toast } from "sonner";
import { Link } from "wouter";

export default function AdminActivity() {
  const utils = trpc.useUtils();
  const activityQuery = trpc.admin.activity.useQuery({ limit: 120 });
  const usersQuery = trpc.admin.listUsers.useQuery();

  const exportar = async (dataset: "checkins" | "notes") => {
    try {
      const result = await utils.admin.exportCsv.fetch({ dataset, scope: "all" });
      downloadCsv(result.filename, result.csv);
      toast.success("Planilla descargada");
    } catch {
      toast.error("No se pudo exportar");
    }
  };

  const checkins = activityQuery.data?.checkins ?? [];
  const notes = activityQuery.data?.notes ?? [];
  const sellers = (usersQuery.data ?? []).filter(u => u.active);

  return (
    <AdminShell
      title="Actividad del equipo"
      description="Visitas y notas registradas por los vendedores">
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

        <Tabs defaultValue="visitas">
          <div className="flex items-center gap-2 flex-wrap">
            <TabsList>
              <TabsTrigger value="visitas">Visitas</TabsTrigger>
              <TabsTrigger value="notas">Notas</TabsTrigger>
            </TabsList>
            <Button
              variant="outline"
              size="sm"
              className="bg-background ml-auto"
              onClick={() => exportar("checkins")}>
              <Download className="h-3.5 w-3.5" />
              Check-ins CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="bg-background"
              onClick={() => exportar("notes")}>
              <Download className="h-3.5 w-3.5" />
              Notas CSV
            </Button>
          </div>

          <TabsContent value="visitas" className="mt-4">
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
          </TabsContent>

          <TabsContent value="notas" className="mt-4">
            {activityQuery.isLoading ? (
              <Skeleton className="h-72 rounded-xl" />
            ) : notes.length === 0 ? (
              <p className="surface-card py-14 text-center text-sm text-muted-foreground">
                Sin notas registradas.
              </p>
            ) : (
              <div className="space-y-2">
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
                      <span className="text-xs text-muted-foreground ml-auto truncate max-w-[40%]">
                        {note.userName ?? note.username}
                      </span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                    <Link
                      href={`/admin/clientes/${note.siteId}`}
                      className="text-xs text-primary hover:underline underline-offset-2 mt-1.5 inline-block">
                      {note.siteName}
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AdminShell>
  );
}

