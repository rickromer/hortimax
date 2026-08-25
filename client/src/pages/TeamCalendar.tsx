import { FieldShell } from "@/components/FieldShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getCalendarLoadState } from "@/lib/calendarLoadState";
import { formatDateLong, formatDateTime, formatDistance } from "@/lib/format";
import { trpc } from "@/lib/trpc";
import { CalendarClock, CheckCircle2, ClipboardPenLine, MapPin, NotebookPen, RefreshCw, UsersRound } from "lucide-react";
import React, { useMemo, useState } from "react";
import { Link } from "wouter";

type CalendarKind = "all" | "visit" | "upcoming" | "note";

const FILTERS: { value: CalendarKind; label: string }[] = [
  { value: "all", label: "Todo" },
  { value: "visit", label: "Visitas" },
  { value: "upcoming", label: "Próximos" },
  { value: "note", label: "Notas" },
];

const FOLLOWUP_LABEL: Record<string, string> = {
  visit: "Próxima visita",
  reminder: "Recordatorio",
  attention: "Atención programada",
};

function dayKey(value: Date) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Asuncion" }).format(value);
}

export default function TeamCalendar() {
  const [filter, setFilter] = useState<CalendarKind>("all");
  const timelineQuery = trpc.calendar.timeline.useQuery(undefined, { staleTime: 30_000 });
  const entries = timelineQuery.data?.entries ?? [];
  const loadState = getCalendarLoadState({
    isLoading: timelineQuery.isLoading,
    isError: timelineQuery.isError,
    entriesCount: entries.length,
  });
  const filteredEntries = useMemo(
    () => (filter === "all" ? entries : entries.filter(entry => entry.kind === filter)),
    [entries, filter]
  );
  const grouped = useMemo(() => {
    const groups = new Map<string, typeof filteredEntries>();
    filteredEntries.forEach(entry => {
      const key = dayKey(entry.occurredAt);
      groups.set(key, [...(groups.get(key) ?? []), entry]);
    });
    return Array.from(groups.values());
  }, [filteredEntries]);

  return (
    <FieldShell title="Calendario" subtitle="Actividad de todo el equipo">
      <div className="space-y-4">
        <section className="surface-card overflow-hidden">
          <div className="brand-spectrum h-1" aria-hidden="true" />
          <div className="p-4">
            <div className="flex items-start gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                <CalendarClock className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h1 className="font-semibold leading-tight">Calendario del equipo</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Visitas, próximos relevamientos y notas visibles para todo el equipo.
                </p>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
              <UsersRound className="h-3.5 w-3.5" />
              <span>{entries.length} registro{entries.length === 1 ? "" : "s"} consolidado{entries.length === 1 ? "" : "s"}</span>
            </div>
          </div>
        </section>

        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none" aria-label="Filtrar calendario">
          {FILTERS.map(item => (
            <Button
              key={item.value}
              type="button"
              size="sm"
              variant={filter === item.value ? "default" : "outline"}
              className={filter === item.value ? "shrink-0" : "shrink-0 bg-background"}
              onClick={() => setFilter(item.value)}>
              {item.label}
            </Button>
          ))}
        </div>

        {loadState === "loading" ? (
          <div className="space-y-3">
            {[0, 1, 2].map(item => <Skeleton key={item} className="h-28 rounded-xl" />)}
          </div>
        ) : loadState === "error" ? (
          <div className="surface-card px-6 py-12 text-center">
            <CalendarClock className="mx-auto h-9 w-9 text-destructive/75" />
            <p className="mt-3 font-medium">No se pudo cargar el calendario</p>
            <p className="mt-1 text-sm text-muted-foreground">Verificá la conexión e intentá nuevamente.</p>
            <Button size="sm" className="mt-4" onClick={() => timelineQuery.refetch()}>
              <RefreshCw className="h-3.5 w-3.5" />
              Reintentar
            </Button>
          </div>
        ) : loadState === "empty" || filteredEntries.length === 0 ? (
          <div className="surface-card px-6 py-14 text-center">
            <CalendarClock className="mx-auto h-9 w-9 text-muted-foreground/70" />
            <p className="mt-3 font-medium">Todavía no hay registros</p>
            <p className="mt-1 text-sm text-muted-foreground">Cuando el equipo registre actividad, aparecerá aquí.</p>
          </div>
        ) : (
          <div className="space-y-5">
            {grouped.map(group => (
              <section key={dayKey(group[0].occurredAt)} className="space-y-2.5">
                <p className="px-1 text-xs font-semibold capitalize text-muted-foreground">
                  {formatDateLong(group[0].occurredAt)}
                </p>
                <div className="space-y-2">
                  {group.map(entry => {
                    const isVisit = entry.kind === "visit";
                    const isUpcoming = entry.kind === "upcoming";
                    const Icon = isVisit ? CheckCircle2 : isUpcoming ? CalendarClock : NotebookPen;
                    const heading = isVisit
                      ? "Visita realizada"
                      : isUpcoming
                        ? FOLLOWUP_LABEL[entry.followupType ?? "reminder"]
                        : "Nota";
                    const color = isVisit
                      ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                      : isUpcoming
                        ? "bg-amber-50 text-amber-800 border-amber-100"
                        : "bg-cyan-50 text-cyan-800 border-cyan-100";

                    return (
                      <Link key={entry.id} href={`/sitios/${entry.siteId}`} className="block">
                        <article className="surface-card p-3.5 transition-transform duration-150 hover:-translate-y-0.5">
                          <div className="flex items-start gap-3">
                            <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg border ${color}`}>
                              <Icon className="h-4 w-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <Badge variant="outline" className={color}>{heading}</Badge>
                                {entry.kind === "note" && entry.category && <Badge variant="secondary">{entry.category}</Badge>}
                                {entry.kind === "note" && entry.checkinId && <Badge variant="secondary">Con visita</Badge>}
                              </div>
                              <p className="mt-1.5 font-semibold leading-tight">{entry.siteName ?? "Cliente sin nombre"}</p>
                              <p className="mt-1 text-sm leading-relaxed text-muted-foreground line-clamp-2">
                                {entry.description || (isVisit ? "Visita registrada sin comentario." : "Sin descripción")}
                              </p>
                              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                                <span>{formatDateTime(entry.occurredAt)}</span>
                                <span>{entry.author}</span>
                                {entry.kind === "visit" && entry.distanceMeters !== null && (
                                  <span>{formatDistance(entry.distanceMeters)}</span>
                                )}
                              </div>
                              {(entry.department || entry.locality) && (
                                <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                                  <span className="truncate">{[entry.department, entry.locality].filter(Boolean).join(" · ")}</span>
                                </div>
                              )}
                            </div>
                            <ClipboardPenLine className="mt-1 h-4 w-4 shrink-0 text-muted-foreground/65" />
                          </div>
                        </article>
                      </Link>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </FieldShell>
  );
}
