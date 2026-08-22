import { FieldShell } from "@/components/FieldShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { downloadCsv, formatDateTime } from "@/lib/format";
import { trpc } from "@/lib/trpc";
import { CalendarClock, Download, NotebookPen, Search } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Link } from "wouter";

export default function NotesBoard() {
  const utils = trpc.useUtils();
  const [search, setSearch] = useState("");
  const notesQuery = trpc.notes.list.useQuery({ search: search.trim() || undefined });
  const notes = notesQuery.data ?? [];

  const exportar = async () => {
    try {
      const result = await utils.admin.exportCsv.fetch({ dataset: "notes", scope: "mine" });
      downloadCsv(result.filename, result.csv);
      toast.success("Planilla de notas descargada");
    } catch {
      toast.error("No se pudo exportar");
    }
  };

  return (
    <FieldShell
      title="Planilla de notas"
      subtitle={`${notes.length} registro${notes.length === 1 ? "" : "s"}`}
      action={
        <Button variant="ghost" size="icon" className="rounded-full" onClick={exportar}>
          <Download className="h-5 w-5" />
        </Button>
      }>
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar dentro de las notas"
            className="pl-9 h-11"
          />
        </div>

        {notesQuery.isLoading ? (
          <div className="space-y-2">
            {[0, 1, 2].map(i => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
        ) : notes.length === 0 ? (
          <div className="surface-card px-6 py-12 text-center">
            <div className="grid place-items-center h-12 w-12 rounded-full bg-secondary mx-auto mb-3">
              <NotebookPen className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="font-medium">Sin notas todavía</p>
            <p className="text-sm text-muted-foreground mt-1">
              Las notas se cargan desde la ficha de cada cliente o al hacer check-in.
            </p>
          </div>
        ) : (
          <div className="space-y-2 stagger-in">
            {notes.map(note => (
              <Link key={note.id} href={`/sitios/${note.siteId}`} className="block">
                <div className="surface-card p-3.5 hover:shadow-md transition-shadow duration-200">
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
                  </div>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap line-clamp-4">
                    {note.content}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2 truncate">
                    {note.siteName}
                    {note.siteZone ? ` · ${note.siteZone}` : ""}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </FieldShell>
  );
}
