import { AdminShell } from "@/components/AdminShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateTime, formatDistance } from "@/lib/format";
import { trpc } from "@/lib/trpc";
import { CalendarClock, ClipboardPenLine, Navigation, Search, SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "wouter";

type ActivityKind = "all" | "visit" | "note" | "upcoming";

const KIND_LABEL: Record<Exclude<ActivityKind, "all">, string> = {
  visit: "Visita",
  note: "Nota",
  upcoming: "Recordatorio",
};

function toDateBoundary(value: string, end = false) {
  if (!value) return undefined;
  return new Date(`${value}T${end ? "23:59:59.999" : "00:00:00.000"}`);
}

export default function AdminActivity() {
  const [search, setSearch] = useState("");
  const [kind, setKind] = useState<ActivityKind>("all");
  const [authorId, setAuthorId] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const usersQuery = trpc.admin.listUsers.useQuery();
  const input = useMemo(() => ({
    search: search.trim() || undefined,
    kind,
    authorId: authorId === "all" ? undefined : Number(authorId),
    from: toDateBoundary(from),
    to: toDateBoundary(to, true),
    limit: 1000,
  }), [search, kind, authorId, from, to]);
  const timelineQuery = trpc.admin.activityTimeline.useQuery(input);
  const entries = timelineQuery.data?.entries ?? [];
  const users = (usersQuery.data ?? []).filter(user => user.active);

  return (
    <AdminShell title="Actividad" description="Historial completo de visitas, notas y recordatorios del equipo">
      <div className="space-y-5 max-w-6xl">
        <section className="surface-card p-4 sm:p-5 space-y-3">
          <div className="flex items-center gap-2"><SlidersHorizontal className="h-4 w-4 text-primary" /><div><h2 className="text-sm font-semibold">Buscar historial</h2><p className="text-xs text-muted-foreground">Consultá qué se registró, por quién y cuándo.</p></div></div>
          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-5">
            <div className="relative md:col-span-2"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={event => setSearch(event.target.value)} className="pl-9" placeholder="Cliente, nota, responsable o lugar" /></div>
            <select aria-label="Tipo de actividad" value={kind} onChange={event => setKind(event.target.value as ActivityKind)} className="h-10 rounded-md border border-input bg-background px-3 text-sm"><option value="all">Todo tipo</option><option value="visit">Visitas</option><option value="note">Notas</option><option value="upcoming">Recordatorios</option></select>
            <select aria-label="Responsable" value={authorId} onChange={event => setAuthorId(event.target.value)} className="h-10 rounded-md border border-input bg-background px-3 text-sm"><option value="all">Todo responsable</option>{users.map(user => <option key={user.id} value={user.id}>{user.name ?? user.username}</option>)}</select>
            <div className="grid grid-cols-2 gap-2"><Input aria-label="Desde" type="date" value={from} onChange={event => setFrom(event.target.value)} /><Input aria-label="Hasta" type="date" value={to} onChange={event => setTo(event.target.value)} /></div>
          </div>
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between gap-3"><div><h2 className="text-base font-semibold">Historial de actividad</h2><p className="text-xs text-muted-foreground">{timelineQuery.isLoading ? "Cargando registros…" : `${entries.length} registro${entries.length === 1 ? "" : "s"} encontrado${entries.length === 1 ? "" : "s"}`}</p></div><Button variant="outline" size="sm" className="bg-background" onClick={() => { setSearch(""); setKind("all"); setAuthorId("all"); setFrom(""); setTo(""); }}>Limpiar filtros</Button></div>
          {timelineQuery.isLoading ? <Skeleton className="h-72 rounded-xl" /> : entries.length === 0 ? <div className="surface-card py-14 text-center"><CalendarClock className="mx-auto h-7 w-7 text-muted-foreground" /><p className="mt-2 text-sm font-medium">No hay actividad con estos filtros</p><p className="mt-1 text-xs text-muted-foreground">Probá otro cliente, responsable o período.</p></div> : <div className="space-y-2">{entries.map(entry => {
            const isVisit = entry.kind === "visit";
            const isNote = entry.kind === "note";
            const Icon = isVisit ? Navigation : isNote ? ClipboardPenLine : CalendarClock;
            const tone = isVisit ? "bg-emerald-50 text-emerald-700 border-emerald-100" : isNote ? "bg-cyan-50 text-cyan-800 border-cyan-100" : "bg-amber-50 text-amber-800 border-amber-100";
            return <Link key={entry.id} href={`/admin/clientes/${entry.siteId}`} className="block"><article className="surface-card flex items-start gap-3 p-3.5 transition-transform hover:-translate-y-0.5"><div className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg border ${tone}`}><Icon className="h-4 w-4" /></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-1.5"><Badge variant="outline" className={tone}>{entry.kind === "upcoming" && entry.followupType ? (entry.followupType === "visit" ? "Próxima visita" : entry.followupType === "attention" ? "Atención" : "Recordatorio") : KIND_LABEL[entry.kind]}</Badge>{entry.kind === "note" && entry.category && <Badge variant="secondary">{entry.category}</Badge>}</div><p className="mt-1.5 font-semibold">{entry.siteName ?? "Cliente sin nombre"}</p><p className="mt-1 text-sm leading-relaxed text-muted-foreground">{entry.description}</p><div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground"><span>{formatDateTime(entry.occurredAt)}</span><span>Registrado por {entry.authorName ?? "Registro anterior sin responsable"}</span>{isVisit && entry.distanceMeters !== null && <span>{formatDistance(entry.distanceMeters)}</span>}</div></div></article></Link>;
          })}</div>}
        </section>
      </div>
    </AdminShell>
  );
}
