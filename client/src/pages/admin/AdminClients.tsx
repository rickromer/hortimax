import { AdminShell } from "@/components/AdminShell";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { downloadCsv, formatDateTime, timeAgo } from "@/lib/format";
import { trpc } from "@/lib/trpc";
import { Download, ExternalLink, Search, X } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Link } from "wouter";

const ALL = "__todos__";

export default function AdminClients() {
  const utils = trpc.useUtils();
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState(ALL);
  const [clientType, setClientType] = useState(ALL);
  const [sellerId, setSellerId] = useState(ALL);
  const tableScrollRef = useRef<HTMLDivElement>(null);
  const [tableScrollPercent, setTableScrollPercent] = useState(0);

  const updateTableScrollPercent = () => {
    const table = tableScrollRef.current;
    if (!table) return;
    const maxScroll = table.scrollWidth - table.clientWidth;
    setTableScrollPercent(maxScroll > 0 ? (table.scrollLeft / maxScroll) * 100 : 0);
  };

  const setTableScroll = (percent: number) => {
    const table = tableScrollRef.current;
    if (!table) return;
    table.scrollLeft = ((table.scrollWidth - table.clientWidth) * percent) / 100;
    setTableScrollPercent(percent);
  };

  const catalog = trpc.admin.catalog.useQuery(undefined, { staleTime: 5 * 60 * 1000 });
  const usersQuery = trpc.admin.listUsers.useQuery();
  const sitesQuery = trpc.sites.list.useQuery({
    search: search.trim() || undefined,
    department: department === ALL ? undefined : department,
    clientType: clientType === ALL ? undefined : clientType,
    sellerId: sellerId === ALL ? undefined : Number(sellerId),
  });

  const sites = sitesQuery.data ?? [];
  const hasFilters = department !== ALL || clientType !== ALL || sellerId !== ALL || search !== "";

  const exportar = async () => {
    try {
      const result = await utils.admin.exportCsv.fetch({ dataset: "sites", scope: "all" });
      downloadCsv(result.filename, result.csv);
      toast.success("Planilla de clientes descargada");
    } catch {
      toast.error("No se pudo exportar");
    }
  };

  return (
    <AdminShell
      title="Clientes"
      description={`${sites.length} sitio${sites.length === 1 ? "" : "s"} registrado${sites.length === 1 ? "" : "s"}`}
      actions={
        <Button variant="outline" className="bg-background" onClick={exportar}>
          <Download className="h-4 w-4" />
          <span className="hidden sm:inline">Exportar CSV</span>
        </Button>
      }>
      <div className="space-y-4 max-w-7xl">
        <div className="surface-card p-3 flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por nombre, contacto, descripción…"
              className="pl-9 h-10"
            />
          </div>
          <div className="grid grid-cols-2 sm:flex gap-2">
            <Select value={department} onValueChange={setDepartment}>
              <SelectTrigger className="h-10 sm:w-40 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Departamento</SelectItem>
                {(catalog.data?.departments ?? catalog.data?.zones ?? []).map(item => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={clientType} onValueChange={setClientType}>
              <SelectTrigger className="h-10 sm:w-40 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Tipo</SelectItem>
                {(catalog.data?.clientTypes ?? []).map(item => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sellerId} onValueChange={setSellerId}>
              <SelectTrigger className="h-10 sm:w-44 w-full col-span-2 sm:col-auto">
                <SelectValue placeholder="Asignado a" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>Todos los comerciales</SelectItem>
                  {(usersQuery.data ?? []).filter(user => user.role === "field" && user.active).map(user => (
                    <SelectItem key={user.id} value={String(user.id)}>
                      {user.name ?? user.username}
                    </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {hasFilters && (
            <Button
              variant="ghost"
              className="shrink-0"
              onClick={() => {
                setSearch("");
                setDepartment(ALL);
                setClientType(ALL);
                setSellerId(ALL);
              }}>
              <X className="h-4 w-4" />
              Limpiar
            </Button>
          )}
        </div>

        {sitesQuery.isLoading ? (
          <Skeleton className="h-96 rounded-xl" />
        ) : sites.length === 0 ? (
          <div className="surface-card px-6 py-16 text-center">
            <p className="font-medium">Sin resultados</p>
            <p className="text-sm text-muted-foreground mt-1">
              Ajustá los filtros o esperá a que los vendedores registren clientes.
            </p>
          </div>
        ) : (
          <>
            {/* Tabla en escritorio */}
            <div className="surface-card hidden md:block overflow-hidden">
              <div
                className="flex items-center gap-3 px-4 py-2 border-b border-border/70 bg-muted/30"
                aria-label="Control de desplazamiento horizontal de la tabla de clientes">
                <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">Desplazar columnas</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={tableScrollPercent}
                  onChange={event => setTableScroll(Number(event.target.value))}
                  className="h-2 w-full cursor-ew-resize accent-[var(--brand-teal)]"
                  aria-label="Desplazar columnas de la tabla hacia los costados"
                />
              </div>
              <div
                ref={tableScrollRef}
                className="overflow-x-auto"
                onScroll={updateTableScrollPercent}>
              <Table className="min-w-[1080px]">
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Cliente</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Departamento</TableHead>
                    <TableHead>Distrito / municipio</TableHead>
                    <TableHead>Registrado por</TableHead>
                    <TableHead>Última visita</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sites.map(site => (
                    <TableRow key={site.id}>
                      <TableCell className="max-w-[280px]">
                        <Link
                          href={`/admin/clientes/${site.id}`}
                          className="font-medium hover:underline underline-offset-2 block truncate">
                          {site.name}
                        </Link>
                        {site.contactName && (
                          <span className="text-xs text-muted-foreground block truncate">
                            {site.contactName}
                            {site.phone ? ` · ${site.phone}` : ""}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {site.clientType ? (
                          <Badge variant="secondary">{site.clientType}</Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">{site.department ?? "—"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{site.zone ?? "—"}</TableCell>
                      <TableCell className="text-sm truncate max-w-[160px]">
                        {site.ownerName ?? site.ownerUsername ?? "—"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {site.lastCheckinAt ? formatDateTime(site.lastCheckinAt) : "Sin visitas"}
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        <Button size="sm" variant="ghost" asChild>
                          <a
                            href={`https://www.google.com/maps?q=${site.latitude},${site.longitude}`}
                            target="_blank"
                            rel="noreferrer">
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        </Button>
                        <Button size="sm" variant="outline" className="bg-background" asChild>
                          <Link href={`/admin/clientes/${site.id}`}>Ficha</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>
            </div>

            {/* Tarjetas en móvil */}
            <div className="md:hidden space-y-2 stagger-in">
              {sites.map(site => (
                <Link key={site.id} href={`/admin/clientes/${site.id}`} className="block">
                  <div className="surface-card p-3.5">
                    <p className="font-medium truncate">{site.name}</p>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
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
                      {site.ownerName ?? site.ownerUsername} · {timeAgo(site.lastCheckinAt)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </AdminShell>
  );
}
