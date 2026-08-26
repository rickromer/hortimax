import { FieldShell } from "@/components/FieldShell";
import { useAuth } from "@/_core/hooks/useAuth";
import { SiteFormSheet } from "@/components/SiteFormSheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useGeolocation } from "@/hooks/useGeolocation";
import { downloadCsv, timeAgo } from "@/lib/format";
import { trpc } from "@/lib/trpc";
import { Download, MapPin, NotebookPen, Plus, Search, SlidersHorizontal, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Link } from "wouter";

const ALL = "__todos__";

export default function SiteList() {
  const { user } = useAuth();
  const canEdit = Boolean(user);
  const geo = useGeolocation({ enabled: canEdit });
  const utils = trpc.useUtils();
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState<string>(ALL);
  const [clientType, setClientType] = useState<string>(ALL);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [newSiteOpen, setNewSiteOpen] = useState(false);

  const catalog = trpc.admin.catalog.useQuery(undefined, { staleTime: 5 * 60 * 1000 });
  const sitesQuery = trpc.sites.list.useQuery({
    search: search.trim() || undefined,
    department: department === ALL ? undefined : department,
    clientType: clientType === ALL ? undefined : clientType,
  });

  const sites = sitesQuery.data ?? [];
  const hasFilters = department !== ALL || clientType !== ALL;

  const exportar = async () => {
    try {
      const result = await utils.admin.exportCsv.fetch({ dataset: "sites", scope: "mine" });
      downloadCsv(result.filename, result.csv);
      toast.success("Planilla descargada");
    } catch {
      toast.error("No se pudo exportar");
    }
  };

  return (
    <FieldShell
      title={canEdit ? "Mis clientes" : "Clientes mapeados"}
      subtitle={`${sites.length} sitio${sites.length === 1 ? "" : "s"} registrado${sites.length === 1 ? "" : "s"}`}
      action={canEdit ? (
        <Button variant="ghost" size="icon" className="rounded-full" onClick={exportar}>
          <Download className="h-5 w-5" />
        </Button>
      ) : undefined}>
      <div className="space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por nombre, contacto o descripción"
              className="pl-9 h-11"
            />
          </div>
          <Button
            variant={hasFilters ? "default" : "outline"}
            size="icon"
            className={hasFilters ? "h-11 w-11" : "h-11 w-11 bg-background"}
            onClick={() => setFiltersOpen(v => !v)}>
            <SlidersHorizontal className="h-4 w-4" />
          </Button>
        </div>

        {filtersOpen && (
          <div className="surface-card p-3 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Departamento</label>
                <Select value={department} onValueChange={setDepartment}>
                  <SelectTrigger className="w-full h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL}>Todos los departamentos</SelectItem>
                    {(catalog.data?.departments ?? catalog.data?.zones ?? []).map(item => (
                      <SelectItem key={item} value={item}>
                        {item}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Tipo</label>
                <Select value={clientType} onValueChange={setClientType}>
                  <SelectTrigger className="w-full h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL}>Todos los tipos</SelectItem>
                    {(catalog.data?.clientTypes ?? []).map(item => (
                      <SelectItem key={item} value={item}>
                        {item}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {hasFilters && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={() => {
                  setDepartment(ALL);
                  setClientType(ALL);
                }}>
                <X className="h-3.5 w-3.5" />
                Limpiar filtros
              </Button>
            )}
          </div>
        )}

        {sitesQuery.isLoading ? (
          <div className="space-y-2">
            {[0, 1, 2, 3].map(i => (
              <Skeleton key={i} className="h-[86px] rounded-xl" />
            ))}
          </div>
        ) : sites.length === 0 ? (
          <div className="surface-card px-6 py-12 text-center">
            <div className="grid place-items-center h-12 w-12 rounded-full bg-secondary mx-auto mb-3">
              <MapPin className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="font-medium">Todavía no hay clientes</p>
            <p className="text-sm text-muted-foreground mt-1 mb-4">
              {search || hasFilters
                ? "Probá con otro criterio de búsqueda."
                : "Todavía no hay clientes registrados."}
            </p>
            {canEdit && <Button onClick={() => setNewSiteOpen(true)}>
              <Plus className="h-4 w-4" />
              Nuevo punto
            </Button>}
          </div>
        ) : (
          <div className="space-y-2 stagger-in">
            {sites.map(site => (
              <div key={site.id} className="surface-card p-3.5">
                <div className="flex items-start gap-3">
                  <Link href={`/sitios/${site.id}`} className="flex-1 min-w-0">
                    <p className="font-semibold leading-tight truncate">{site.name}</p>
                    <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                      {site.clientType && (
                        <Badge variant="secondary" className="text-[11px]">
                          {site.clientType}
                        </Badge>
                      )}
                      {site.department && (
                        <Badge variant="outline" className="text-[11px]">
                          {site.department}
                        </Badge>
                      )}
                      {site.zone && (
                        <Badge variant="outline" className="text-[11px] text-muted-foreground">
                          {site.zone}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1.5">
                      Última visita: {timeAgo(site.lastCheckinAt)}
                    </p>
                  </Link>
                  <Button size="icon" variant="secondary" className="shrink-0" asChild>
                    <Link href={`/sitios/${site.id}`} aria-label={`Abrir notas de ${site.name}`}>
                      <NotebookPen className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {canEdit && <SiteFormSheet
        open={newSiteOpen}
        onOpenChange={setNewSiteOpen}
        coords={geo.position}
        onRequestLocation={() => geo.request()}
      />}
    </FieldShell>
  );
}
