import { AdminShell } from "@/components/AdminShell";
import { ClientMap } from "@/components/ClientMap";
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
import { timeAgo } from "@/lib/format";
import { trpc } from "@/lib/trpc";
import { Layers, Loader2, Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "wouter";

const ALL = "__todos__";

export default function AdminMap() {
  const [search, setSearch] = useState("");
  const [zone, setZone] = useState(ALL);
  const [clientType, setClientType] = useState(ALL);
  const [sellerId, setSellerId] = useState(ALL);
  const [mapType, setMapType] = useState<"roadmap" | "hybrid">("roadmap");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [focus, setFocus] = useState<{ latitude: number; longitude: number } | null>(null);

  const catalog = trpc.admin.catalog.useQuery(undefined, { staleTime: 5 * 60 * 1000 });
  const usersQuery = trpc.admin.listUsers.useQuery();
  const sitesQuery = trpc.sites.list.useQuery({
    search: search.trim() || undefined,
    zone: zone === ALL ? undefined : zone,
    clientType: clientType === ALL ? undefined : clientType,
    sellerId: sellerId === ALL ? undefined : Number(sellerId),
  });

  const sites = sitesQuery.data ?? [];
  const markers = useMemo(
    () =>
      sites.map(site => ({
        id: site.id,
        name: site.name,
        latitude: site.latitude,
        longitude: site.longitude,
        clientType: site.clientType,
        zone: site.zone,
        selected: site.id === selectedId,
      })),
    [sites, selectedId]
  );
  const selected = sites.find(s => s.id === selectedId) ?? null;

  return (
    <AdminShell
      title="Mapa general"
      description={`${sites.length} cliente${sites.length === 1 ? "" : "s"} en el mapa`}
      fill>
      <div className="absolute inset-0 flex">
        {/* Panel lateral de resultados */}
        <div className="hidden md:flex flex-col w-80 shrink-0 border-r border-border/70 bg-background">
          <div className="p-3 space-y-2 border-b border-border/70">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar cliente…"
                className="pl-9 h-10"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Select value={zone} onValueChange={setZone}>
                <SelectTrigger className="h-9 text-xs w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>Todas las zonas</SelectItem>
                  {(catalog.data?.zones ?? []).map(item => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={clientType} onValueChange={setClientType}>
                <SelectTrigger className="h-9 text-xs w-full">
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
            <Select value={sellerId} onValueChange={setSellerId}>
              <SelectTrigger className="h-9 text-xs w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Todos los vendedores</SelectItem>
                {(usersQuery.data ?? []).map(user => (
                  <SelectItem key={user.id} value={String(user.id)}>
                    {user.name ?? user.username}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-border/60">
            {sitesQuery.isLoading ? (
              <div className="p-6 flex justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : sites.length === 0 ? (
              <p className="p-6 text-sm text-muted-foreground text-center">
                No hay clientes con esos criterios.
              </p>
            ) : (
              sites.map(site => (
                <button
                  key={site.id}
                  onClick={() => {
                    setSelectedId(site.id);
                    setFocus({ latitude: site.latitude, longitude: site.longitude });
                  }}
                  className={
                    "w-full text-left px-3.5 py-3 transition-colors hover:bg-accent/50 " +
                    (site.id === selectedId ? "bg-accent/70" : "")
                  }>
                  <p className="text-sm font-medium truncate">{site.name}</p>
                  <div className="flex flex-wrap items-center gap-1.5 mt-1">
                    {site.clientType && (
                      <Badge variant="secondary" className="text-[10px] py-0">
                        {site.clientType}
                      </Badge>
                    )}
                    {site.zone && (
                      <Badge variant="outline" className="text-[10px] py-0">
                        {site.zone}
                      </Badge>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    {site.ownerName ?? site.ownerUsername} · {timeAgo(site.lastCheckinAt)}
                  </p>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Mapa */}
        <div className="relative flex-1">
          <ClientMap
            markers={markers}
            focus={focus}
            fitToMarkers
            mapTypeId={mapType}
            onMarkerClick={id => {
              setSelectedId(id);
              const site = sites.find(s => s.id === id);
              if (site) setFocus({ latitude: site.latitude, longitude: site.longitude });
            }}
          />

          <div className="md:hidden absolute top-3 inset-x-3 z-20">
            <div className="surface-card surface-lift flex items-center gap-2 px-3 py-2">
              <Search className="h-4 w-4 text-muted-foreground shrink-0" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar cliente…"
                className="border-0 shadow-none focus-visible:ring-0 h-8 px-0"
              />
            </div>
          </div>

          <Button
            size="icon"
            variant="secondary"
            className="absolute right-3 top-3 h-10 w-10 rounded-full shadow-lg bg-background hover:bg-background z-10"
            onClick={() => setMapType(t => (t === "roadmap" ? "hybrid" : "roadmap"))}>
            <Layers className="h-4.5 w-4.5" />
          </Button>

          {selected && (
            <div className="absolute bottom-4 inset-x-4 md:left-auto md:right-4 md:w-80 z-20 surface-card surface-lift p-4">
              <div className="flex items-start gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{selected.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {[selected.clientType, selected.zone].filter(Boolean).join(" · ") ||
                      "Sin clasificar"}
                  </p>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 shrink-0"
                  onClick={() => setSelectedId(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              {selected.description && (
                <p className="text-sm text-muted-foreground mt-2 line-clamp-3">
                  {selected.description}
                </p>
              )}
              <div className="flex items-center justify-between mt-3">
                <span className="text-xs text-muted-foreground truncate">
                  {selected.ownerName ?? selected.ownerUsername}
                </span>
                <Button size="sm" asChild>
                  <Link href={`/admin/clientes/${selected.id}`}>Ver ficha</Link>
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminShell>
  );
}

