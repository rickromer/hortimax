import { AdminShell } from "@/components/AdminShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { downloadCsv } from "@/lib/format";
import { trpc } from "@/lib/trpc";
import { CheckCircle2, Download, ExternalLink, FileSpreadsheet, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type Kind = "zone" | "clientType" | "noteCategory";

const SECTIONS: { kind: Kind; title: string; description: string }[] = [
  {
    kind: "clientType",
    title: "Tipos de cliente",
    description: "Clasificación que eligen los vendedores al registrar un sitio.",
  },
  {
    kind: "zone",
    title: "Zonas",
    description: "Áreas geográficas o comerciales para filtrar la cartera.",
  },
  {
    kind: "noteCategory",
    title: "Categorías de nota",
    description: "Etiquetas rápidas para clasificar cada registro de la planilla.",
  },
];

export default function AdminSettings() {
  const utils = trpc.useUtils();
  const catalog = trpc.admin.catalog.useQuery();
  const googleSheets = trpc.sheets.status.useQuery();
  const [drafts, setDrafts] = useState<Record<Kind, string>>({
    zone: "",
    clientType: "",
    noteCategory: "",
  });

  const addValue = trpc.admin.addCatalogValue.useMutation({
    onSuccess: async () => {
      await utils.admin.catalog.invalidate();
      toast.success("Valor agregado");
    },
    onError: error => toast.error(error.message),
  });

  const removeValue = trpc.admin.removeCatalogValue.useMutation({
    onSuccess: async () => {
      await utils.admin.catalog.invalidate();
      toast.success("Valor eliminado");
    },
    onError: error => toast.error(error.message),
  });

  const exportar = async (dataset: "sites" | "checkins" | "notes") => {
    try {
      const result = await utils.admin.exportCsv.fetch({ dataset, scope: "all" });
      downloadCsv(result.filename, result.csv);
      toast.success("Planilla descargada");
    } catch {
      toast.error("No se pudo exportar");
    }
  };

  const valuesFor = (kind: Kind) => {
    if (!catalog.data) return { values: [] as string[], rows: [] as { id: number; value: string }[] };
    if (kind === "zone") return { values: catalog.data.zones, rows: catalog.data.zoneRows };
    if (kind === "clientType")
      return { values: catalog.data.clientTypes, rows: catalog.data.clientTypeRows };
    return { values: catalog.data.noteCategories, rows: catalog.data.noteCategoryRows };
  };

  return (
    <AdminShell
      title="Configuración"
      description="Catálogos del sistema y exportación de datos">
      <div className="space-y-5 max-w-4xl">
        <div className="surface-card p-5">
          <p className="font-semibold">Exportar a planilla</p>
          <p className="text-sm text-muted-foreground mt-1 mb-4 leading-relaxed">
            Los archivos CSV se abren directamente en Google Sheets (Archivo → Importar) y en
            Excel, con la codificación y las fechas en horario de Asunción.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" className="bg-background" onClick={() => exportar("sites")}>
              <Download className="h-4 w-4" />
              Clientes
            </Button>
            <Button
              variant="outline"
              className="bg-background"
              onClick={() => exportar("checkins")}>
              <Download className="h-4 w-4" />
              Check-ins
            </Button>
            <Button variant="outline" className="bg-background" onClick={() => exportar("notes")}>
              <Download className="h-4 w-4" />
              Notas
            </Button>
          </div>
        </div>

        <div className="surface-card p-5 flex flex-wrap items-center gap-4">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--hortimax-teal)]/12 text-[var(--hortimax-teal)]">
            <FileSpreadsheet className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold">Google Sheets de Productores</p>
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
              {googleSheets.data?.connected
                ? "La cuenta personal autorizada está lista para crear una planilla permanente por Productor."
                : "Conectá tu cuenta personal de Google. Las planillas se guardarán en ese Drive y luego podrás reemplazar la conexión por una corporativa."}
            </p>
          </div>
          {googleSheets.data?.connected ? (
            <Badge variant="secondary" className="gap-1.5 bg-[var(--hortimax-teal)]/10 text-[var(--hortimax-teal)]">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Conectado
            </Badge>
          ) : googleSheets.data?.configured ? (
            <Button asChild>
              <a href="/api/google/authorize?returnTo=%2Fadmin%2Fconfiguracion">
                Conectar Google
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          ) : (
            <Badge variant="outline">Credenciales pendientes</Badge>
          )}
        </div>

        {SECTIONS.map(section => {
          const { values, rows } = valuesFor(section.kind);
          const rowMap = new Map(rows.map(row => [row.value, row.id]));
          return (
            <div key={section.kind} className="surface-card p-5 space-y-4">
              <div>
                <p className="font-semibold">{section.title}</p>
                <p className="text-sm text-muted-foreground mt-0.5">{section.description}</p>
              </div>

              <div className="flex flex-wrap gap-2">
                {values.map(value => {
                  const id = rowMap.get(value);
                  return (
                    <Badge
                      key={value}
                      variant="secondary"
                      className="pl-3 pr-1 py-1.5 text-sm gap-1">
                      {value}
                      {id && (
                        <button
                          className="grid place-items-center h-5 w-5 rounded-full hover:bg-destructive/15 hover:text-destructive transition-colors"
                          onClick={() => removeValue.mutate({ id })}
                          aria-label={`Eliminar ${value}`}>
                          <Trash2 className="h-3 w-3" />
                        </button>
                      )}
                    </Badge>
                  );
                })}
              </div>

              <form
                className="grid grid-cols-[minmax(0,1fr)_auto] gap-2"
                onSubmit={event => {
                  event.preventDefault();
                  const value = drafts[section.kind].trim();
                  if (!value) return;
                  addValue.mutate({ kind: section.kind, value });
                  setDrafts(prev => ({ ...prev, [section.kind]: "" }));
                }}>
                <Input
                  value={drafts[section.kind]}
                  onChange={e =>
                    setDrafts(prev => ({ ...prev, [section.kind]: e.target.value }))
                  }
                  placeholder="Agregar nuevo valor"
                  className="h-10 min-w-0 w-full"
                />
                <Button type="submit" variant="secondary" className="whitespace-nowrap" disabled={addValue.isPending}>
                  <Plus className="h-4 w-4" />
                  Agregar
                </Button>
              </form>
            </div>
          );
        })}

      </div>
    </AdminShell>
  );
}
