import { FieldShell } from "@/components/FieldShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getCalendarLoadState } from "@/lib/calendarLoadState";
import {
  buildCalendarMonth,
  CALENDAR_WEEKDAYS,
  calendarDayKey,
  calendarMonthLabel,
  monthCursorFor,
  shiftCalendarMonth,
} from "@/lib/teamCalendarMonth";
import { formatDateLong, formatDateTime, formatDistance } from "@/lib/format";
import { trpc } from "@/lib/trpc";
import {
  CalendarClock,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardPenLine,
  MapPin,
  NotebookPen,
  RefreshCw,
  UsersRound,
} from "lucide-react";
import React, { useMemo, useState } from "react";
import { Link } from "wouter";

type CalendarKind = "all" | "visit" | "upcoming" | "note";

const FILTERS: { value: CalendarKind; label: string; dotClass: string }[] = [
  { value: "all", label: "Todo", dotClass: "bg-foreground" },
  { value: "visit", label: "Visitas", dotClass: "bg-emerald-500" },
  { value: "upcoming", label: "Próximos", dotClass: "bg-amber-500" },
  { value: "note", label: "Notas", dotClass: "bg-cyan-500" },
];

const FOLLOWUP_LABEL: Record<string, string> = {
  visit: "Próxima visita",
  reminder: "Recordatorio",
  attention: "Atención programada",
};

function entryDayKey(value: Date) {
  return calendarDayKey(value);
}

export default function TeamCalendar() {
  const [filter, setFilter] = useState<CalendarKind>("all");
  const [cursor, setCursor] = useState(() => monthCursorFor(new Date()));
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const timelineQuery = trpc.calendar.timeline.useQuery(undefined, { staleTime: 30_000 });
  const entries = timelineQuery.data?.entries ?? [];
  const loadState = getCalendarLoadState({
    isLoading: timelineQuery.isLoading,
    isError: timelineQuery.isError,
    entriesCount: entries.length,
  });
  const monthPrefix = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`;
  const monthEntries = useMemo(
    () => entries.filter(entry => entryDayKey(entry.occurredAt).startsWith(monthPrefix)),
    [entries, monthPrefix]
  );
  const filteredEntries = useMemo(
    () => (filter === "all" ? monthEntries : monthEntries.filter(entry => entry.kind === filter)),
    [filter, monthEntries]
  );
  const visibleEntries = useMemo(
    () => (selectedDay ? filteredEntries.filter(entry => entryDayKey(entry.occurredAt) === selectedDay) : filteredEntries),
    [filteredEntries, selectedDay]
  );
  const daySummary = useMemo(() => {
    const summary = new Map<string, { visit: number; upcoming: number; note: number }>();
    monthEntries.forEach(entry => {
      const key = entryDayKey(entry.occurredAt);
      const current = summary.get(key) ?? { visit: 0, upcoming: 0, note: 0 };
      current[entry.kind] += 1;
      summary.set(key, current);
    });
    return summary;
  }, [monthEntries]);
  const grouped = useMemo(() => {
    const groups = new Map<string, typeof visibleEntries>();
    visibleEntries.forEach(entry => {
      const key = entryDayKey(entry.occurredAt);
      groups.set(key, [...(groups.get(key) ?? []), entry]);
    });
    return Array.from(groups.values());
  }, [visibleEntries]);
  const cells = useMemo(() => buildCalendarMonth(cursor), [cursor]);
  const counts = useMemo(() => ({
    visit: monthEntries.filter(entry => entry.kind === "visit").length,
    upcoming: monthEntries.filter(entry => entry.kind === "upcoming").length,
    note: monthEntries.filter(entry => entry.kind === "note").length,
  }), [monthEntries]);

  const changeMonth = (amount: number) => {
    setCursor(current => shiftCalendarMonth(current, amount));
    setSelectedDay(null);
  };

  return (
    <FieldShell title="Calendario" subtitle="Actividad de todo el equipo">
      <div className="space-y-4">
        <section className="surface-card overflow-hidden">
          <div className="brand-spectrum h-1" aria-hidden="true" />
          <div className="p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                  <CalendarClock className="h-4.5 w-4.5" />
                </div>
                <div className="min-w-0">
                  <h1 className="font-semibold leading-tight">Calendario del equipo</h1>
                  <p className="mt-0.5 text-xs text-muted-foreground">Visitas, próximos y notas por fecha.</p>
                </div>
              </div>
              <div className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex">
                <UsersRound className="h-3.5 w-3.5" />
                {monthEntries.length} este mes
              </div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2">
              <div className="rounded-lg bg-emerald-50 px-2.5 py-2 text-center text-emerald-800">
                <p className="text-base font-bold tabular-nums">{counts.visit}</p><p className="text-[10px] font-medium">Visitas</p>
              </div>
              <div className="rounded-lg bg-amber-50 px-2.5 py-2 text-center text-amber-800">
                <p className="text-base font-bold tabular-nums">{counts.upcoming}</p><p className="text-[10px] font-medium">Próximos</p>
              </div>
              <div className="rounded-lg bg-cyan-50 px-2.5 py-2 text-center text-cyan-800">
                <p className="text-base font-bold tabular-nums">{counts.note}</p><p className="text-[10px] font-medium">Notas</p>
              </div>
            </div>
          </div>
        </section>

        <section className="surface-card p-3 sm:p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <Button type="button" size="icon" variant="outline" className="h-8 w-8 bg-background" aria-label="Mes anterior" onClick={() => changeMonth(-1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <button type="button" className="text-sm font-semibold capitalize" onClick={() => { setCursor(monthCursorFor(new Date())); setSelectedDay(null); }}>
              {calendarMonthLabel(cursor)}
            </button>
            <Button type="button" size="icon" variant="outline" className="h-8 w-8 bg-background" aria-label="Mes siguiente" onClick={() => changeMonth(1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center">
            {CALENDAR_WEEKDAYS.map(day => <span key={day} className="py-1 text-[10px] font-semibold text-muted-foreground">{day}</span>)}
            {cells.map(cell => {
              const summary = daySummary.get(cell.key);
              const selected = selectedDay === cell.key;
              const hasEntries = Boolean(summary && (summary.visit + summary.upcoming + summary.note));
              return (
                <button
                  key={cell.key}
                  type="button"
                  aria-label={`Ver actividad del ${cell.key}`}
                  onClick={() => setSelectedDay(current => current === cell.key ? null : cell.key)}
                  className={`relative flex min-h-11 flex-col items-center justify-center rounded-lg text-xs transition-colors sm:min-h-12 ${
                    selected ? "bg-primary text-primary-foreground shadow-sm" : hasEntries ? "bg-secondary hover:bg-secondary/75" : "hover:bg-secondary/60"
                  } ${cell.inMonth ? "font-medium" : "text-muted-foreground/40"}`}>
                  <span>{cell.day}</span>
                  {hasEntries && (
                    <span className="mt-1 flex gap-0.5" aria-hidden="true">
                      {summary!.visit > 0 && <i className={`h-1.5 w-1.5 rounded-full ${selected ? "bg-white" : "bg-emerald-500"}`} />}
                      {summary!.upcoming > 0 && <i className={`h-1.5 w-1.5 rounded-full ${selected ? "bg-white/80" : "bg-amber-500"}`} />}
                      {summary!.note > 0 && <i className={`h-1.5 w-1.5 rounded-full ${selected ? "bg-white/60" : "bg-cyan-500"}`} />}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <p className="mt-3 text-center text-[11px] text-muted-foreground">Tocá un día para ver su actividad; tocá nuevamente para ver todo el mes.</p>
        </section>

        <section className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold">Resumen de actividad</h2>
              <p className="text-xs text-muted-foreground">{selectedDay ? `Seleccionado: ${selectedDay}` : "Todo el mes seleccionado"}</p>
            </div>
            <div className="flex flex-wrap gap-1.5" aria-label="Filtrar resumen">
              {FILTERS.map(item => (
                <Button
                  key={item.value}
                  type="button"
                  size="sm"
                  variant={filter === item.value ? "default" : "outline"}
                  className={`h-8 gap-1.5 px-2.5 text-xs ${filter === item.value ? "" : "bg-background"}`}
                  onClick={() => setFilter(item.value)}>
                  <span className={`h-1.5 w-1.5 rounded-full ${filter === item.value ? "bg-primary-foreground" : item.dotClass}`} />
                  {item.label}
                </Button>
              ))}
            </div>
          </div>

          {loadState === "loading" ? (
            <div className="space-y-2">{[0, 1, 2].map(item => <Skeleton key={item} className="h-24 rounded-xl" />)}</div>
          ) : loadState === "error" ? (
            <div className="surface-card px-6 py-12 text-center">
              <CalendarClock className="mx-auto h-9 w-9 text-destructive/75" />
              <p className="mt-3 font-medium">No se pudo cargar el calendario</p>
              <p className="mt-1 text-sm text-muted-foreground">Verificá la conexión e intentá nuevamente.</p>
              <Button size="sm" className="mt-4" onClick={() => timelineQuery.refetch()}><RefreshCw className="h-3.5 w-3.5" />Reintentar</Button>
            </div>
          ) : visibleEntries.length === 0 ? (
            <div className="surface-card px-6 py-12 text-center">
              <CalendarClock className="mx-auto h-9 w-9 text-muted-foreground/70" />
              <p className="mt-3 font-medium">Sin actividad en esta selección</p>
              <p className="mt-1 text-sm text-muted-foreground">Probá otro día, mes o filtro.</p>
            </div>
          ) : (
            <div className="space-y-5">
              {grouped.map(group => (
                <section key={entryDayKey(group[0].occurredAt)} className="space-y-2.5">
                  <p className="px-1 text-xs font-semibold capitalize text-muted-foreground">{formatDateLong(group[0].occurredAt)}</p>
                  <div className="space-y-2">
                    {group.map(entry => {
                      const isVisit = entry.kind === "visit";
                      const isUpcoming = entry.kind === "upcoming";
                      const Icon = isVisit ? CheckCircle2 : isUpcoming ? CalendarClock : NotebookPen;
                      const heading = isVisit ? "Visita realizada" : isUpcoming ? FOLLOWUP_LABEL[entry.followupType ?? "reminder"] : "Nota";
                      const color = isVisit ? "bg-emerald-50 text-emerald-700 border-emerald-100" : isUpcoming ? "bg-amber-50 text-amber-800 border-amber-100" : "bg-cyan-50 text-cyan-800 border-cyan-100";
                      return (
                        <Link key={entry.id} href={`/sitios/${entry.siteId}`} className="block">
                          <article className="surface-card p-3.5 transition-transform duration-150 hover:-translate-y-0.5">
                            <div className="flex items-start gap-3">
                              <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg border ${color}`}><Icon className="h-4 w-4" /></div>
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <Badge variant="outline" className={color}>{heading}</Badge>
                                  {entry.kind === "note" && entry.category && <Badge variant="secondary">{entry.category}</Badge>}
                                  {entry.kind === "note" && entry.checkinId && <Badge variant="secondary">Con visita</Badge>}
                                </div>
                                <p className="mt-1.5 font-semibold leading-tight">{entry.siteName ?? "Cliente sin nombre"}</p>
                                <p className="mt-1 text-sm leading-relaxed text-muted-foreground line-clamp-2">{entry.description || (isVisit ? "Visita registrada sin comentario." : "Sin descripción")}</p>
                                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                                  <span>{formatDateTime(entry.occurredAt)}</span><span>{entry.author}</span>
                                  {entry.kind === "visit" && entry.distanceMeters !== null && <span>{formatDistance(entry.distanceMeters)}</span>}
                                </div>
                                {(entry.department || entry.locality) && <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="h-3.5 w-3.5 shrink-0" /><span className="truncate">{[entry.department, entry.locality].filter(Boolean).join(" · ")}</span></div>}
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
        </section>
      </div>
    </FieldShell>
  );
}
