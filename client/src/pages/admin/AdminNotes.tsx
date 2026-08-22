import { AdminShell } from "@/components/AdminShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { downloadCsv, formatDateTime } from "@/lib/format";
import { trpc } from "@/lib/trpc";
import { CalendarClock, Download, Search } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Link } from "wouter";

export default function AdminNotes() {
  const utils = trpc.useUtils();
  const [search, setSearch] = useState("");
  const notesQuery = trpc.notes.list.useQuery({
    search: search.trim() || undefined,
    scope: "all",
    limit: 300,
  });
  const notes = notesQuery.data ?? [];

  const exportar = async () => {
    try {
      const result = await utils.admin.exportCsv.fetch({ dataset: "notes", scope: "all" });
      downloadCsv(result.filename, result.csv);
      toast.success("Planilla de notas descargada");
    } catch {
      toast.error("No se pudo exportar");
    }
  };

  return (
    <AdminShell
      title="Planilla de notas"
      description={`${notes.length} registro${notes.length === 1 ? "" : "s"} de todo el equipo`}
      actions={
        <Button variant="outline" className="bg-background" onClick={exportar}>
          <Download className="h-4 w-4" />
          <span className="hidden sm:inline">Exportar CSV</span>
        </Button>
      }>
      <div className="space-y-4 max-w-5xl">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar texto dentro de las notas"
            className="pl-9 h-11"
          />
        </div>

        {notesQuery.isLoading ? (
          <div className="space-y-2">
            {[0, 1, 2, 3].map(i => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
        ) : notes.length === 0 ? (
          <div className="surface-card px-6 py-16 text-center">
            <p className="font-medium">Sin notas</p>
            <p className="text-sm text-muted-foreground mt-1">
              Las notas aparecen acá apenas los vendedores las cargan en campo.
            </p>
          </div>
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
                  <span className="text-xs text-muted-foreground ml-auto truncate max-w-[40%]">
                    {note.userName ?? note.username}
                  </span>
                </div>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{note.content}</p>
                <Link
                  href={`/admin/clientes/${note.siteId}`}
                  className="text-xs text-primary hover:underline underline-offset-2 mt-2 inline-block">
                  {note.siteName}
                  {note.siteZone ? ` · ${note.siteZone}` : ""}
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminShell>
  );
}
