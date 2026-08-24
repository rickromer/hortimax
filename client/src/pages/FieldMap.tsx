import { CheckinDialog } from "@/components/CheckinDialog";
import { ClientMap } from "@/components/ClientMap";
import { FieldShell } from "@/components/FieldShell";
import { LocationPickerDialog } from "@/components/LocationPickerDialog";
import { SiteFormSheet } from "@/components/SiteFormSheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useGeolocation } from "@/hooks/useGeolocation";
import { formatDistance, timeAgo } from "@/lib/format";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import {
  ChevronRight,
  Crosshair,
  Layers,
  Loader2,
  MapPin,
  Navigation,
  Plus,
  Search,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Link } from "wouter";

export default function FieldMap() {
  const geo = useGeolocation();
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [focus, setFocus] = useState<{ latitude: number; longitude: number } | null>(null);
  const [mapType, setMapType] = useState<"roadmap" | "hybrid">("roadmap");
  const [newSiteOpen, setNewSiteOpen] = useState(false);
  const [manualCoords, setManualCoords] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [locationPickerOpen, setLocationPickerOpen] = useState(false);
  const [checkinSite, setCheckinSite] = useState<{ id: number; name: string } | null>(null);

  const sitesQuery = trpc.sites.list.useQuery(
    { search: search.trim() || undefined },
    { staleTime: 30_000 }
  );

  const position = geo.position;
  const nearbyQuery = trpc.sites.nearby.useQuery(
    position
      ? { latitude: position.latitude, longitude: position.longitude, radius: 500 }
      : { latitude: 0, longitude: 0 },
    { enabled: Boolean(position), staleTime: 20_000 }
  );

  const sites = sitesQuery.data ?? [];
  const nearby = position ? (nearbyQuery.data ?? []) : [];
  const selected = useMemo(
    () => sites.find(site => site.id === selectedId) ?? null,
    [sites, selectedId]
  );

  const markers = useMemo(() => {
    const mapped = sites.map(site => ({
        id: site.id,
        name: site.name,
        latitude: site.latitude,
        longitude: site.longitude,
        clientType: site.clientType,
        zone: site.zone,
        selected: site.id === selectedId,
      }));
    if (manualCoords) {
      mapped.push({
        id: -1,
        name: "Nuevo punto",
        latitude: manualCoords.latitude,
        longitude: manualCoords.longitude,
        clientType: "Prospecto",
        zone: null,
        selected: true,
      });
    }
    return mapped;
  }, [sites, selectedId, manualCoords]);

  const centerOnMe = async () => {
    const pos = position ?? (await geo.request());
    if (pos) setFocus({ latitude: pos.latitude, longitude: pos.longitude });
  };

  return (
    <FieldShell
      bleed
      title="Mapa de clientes"
      subtitle={
        geo.loading && !position
          ? "Buscando señal GPS…"
          : position
            ? `GPS activo · ±${position.accuracy} m`
            : "GPS sin señal"
      }
      action={
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full"
          onClick={() => setSearchOpen(v => !v)}
          aria-label="Buscar cliente">
          {searchOpen ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
        </Button>
      }>
      <div className="absolute inset-0">
        <ClientMap
          markers={markers}
          userPosition={position}
          focus={focus}
          fitToMarkers
          mapTypeId={mapType}
          onMarkerClick={id => {
            if (id === -1) return;
            setSelectedId(id);
            const site = sites.find(s => s.id === id);
              if (site) setFocus({ latitude: site.latitude, longitude: site.longitude });
          }}
        />

        {/* Buscador flotante */}
        {searchOpen && (
          <div className="absolute top-3 inset-x-3 z-20">
            <div className="surface-card surface-lift flex items-center gap-2 px-3 py-2">
              <Search className="h-4 w-4 text-muted-foreground shrink-0" />
              <Input
                autoFocus
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar cliente, zona o tipo…"
                className="border-0 shadow-none focus-visible:ring-0 h-8 px-0"
              />
              {sitesQuery.isFetching && (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              )}
            </div>
            {search.trim().length > 0 && (
              <div className="surface-card surface-lift mt-2 max-h-64 overflow-y-auto divide-y divide-border/60">
                {sites.length === 0 ? (
                  <p className="px-3 py-4 text-sm text-muted-foreground">
                    Sin resultados para “{search}”.
                  </p>
                ) : (
                  sites.slice(0, 12).map(site => (
                    <button
                      key={site.id}
                      className="w-full text-left px-3 py-2.5 hover:bg-accent/60 transition-colors"
                      onClick={() => {
                        setSelectedId(site.id);
                        setFocus({ latitude: site.latitude, longitude: site.longitude });
                        setSearchOpen(false);
                      }}>
                      <p className="text-sm font-medium truncate">{site.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {[site.clientType, site.zone].filter(Boolean).join(" · ") ||
                          "Sin clasificar"}
                      </p>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {/* Controles laterales */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 z-10 flex flex-col gap-2">
          <Button
            size="icon"
            variant="secondary"
            className="h-11 w-11 rounded-full shadow-lg bg-background hover:bg-background"
            onClick={centerOnMe}
            aria-label="Centrar en mi ubicación">
            {geo.loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Crosshair className="h-5 w-5" />
            )}
          </Button>
          <Button
            size="icon"
            variant="secondary"
            className="h-11 w-11 rounded-full shadow-lg bg-background hover:bg-background"
            onClick={() => setMapType(t => (t === "roadmap" ? "hybrid" : "roadmap"))}
            aria-label="Cambiar tipo de mapa">
            <Layers className="h-5 w-5" />
          </Button>
        </div>

        {/* Aviso de GPS */}
        {geo.error && (
          <div className="absolute top-3 inset-x-3 z-10 rounded-xl bg-destructive/95 text-destructive-foreground px-3 py-2.5 text-sm shadow-lg">
            {geo.error}
          </div>
        )}

        {/* Tarjeta inferior: sitio seleccionado o sitios cercanos */}
        <div className="absolute bottom-[calc(env(safe-area-inset-bottom)+9rem)] inset-x-3 z-20 space-y-2">
          {selected ? (
            <div className="surface-card surface-lift p-4 stagger-in">
              <div className="flex items-start gap-3">
                <div className="grid place-items-center h-10 w-10 rounded-xl bg-primary/10 text-primary shrink-0">
                  <MapPin className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{selected.name}</p>
                  <div className="flex flex-wrap items-center gap-1.5 mt-1">
                    {selected.clientType && (
                      <Badge variant="secondary" className="text-[11px]">
                        {selected.clientType}
                      </Badge>
                    )}
                    {selected.zone && (
                      <Badge variant="outline" className="text-[11px]">
                        {selected.zone}
                      </Badge>
                    )}
                    <span className="text-[11px] text-muted-foreground">
                      Última visita: {timeAgo(selected.lastCheckinAt)}
                    </span>
                  </div>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 shrink-0"
                  onClick={() => setSelectedId(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex gap-2 mt-3">
                <Button
                  className="flex-1"
                  onClick={() => setCheckinSite({ id: selected.id, name: selected.name })}>
                  <Navigation className="h-4 w-4" />
                  Check-in
                </Button>
                <Button variant="outline" className="flex-1 bg-background" asChild>
                  <Link href={`/sitios/${selected.id}`}>
                    Ver ficha
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          ) : nearby.length > 0 ? (
            <div className="surface-card surface-lift p-3">
              <p className="text-xs font-medium text-muted-foreground px-1 pb-2">
                Estás cerca de {nearby.length} sitio{nearby.length > 1 ? "s" : ""} registrado
                {nearby.length > 1 ? "s" : ""}
              </p>
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {nearby.slice(0, 4).map(site => (
                  <div
                    key={site.id}
                    className="flex items-center gap-2.5 rounded-lg px-2 py-2 hover:bg-accent/50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{site.name}</p>
                      <p className="text-xs text-muted-foreground">
                        a {formatDistance(site.distance)} · {site.clientType ?? "Sin tipo"}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setCheckinSite({ id: site.id, name: site.name })}>
                      Check-in
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        {/* Botón principal */}
        <Button
          className={cn(
            "absolute bottom-[calc(env(safe-area-inset-bottom)+5rem)] left-1/2 -translate-x-1/2 z-30 h-13 px-6 rounded-full shadow-xl",
            "text-base font-semibold"
          )}
          style={{ height: "3.25rem" }}
          onClick={() => {
            setManualCoords(null);
            setLocationPickerOpen(true);
          }}>
          <Plus className="h-5 w-5" />
          Nuevo punto
        </Button>
      </div>

      <SiteFormSheet
        open={newSiteOpen}
        onOpenChange={setNewSiteOpen}
        coords={manualCoords ?? position}
        locationSource={manualCoords ? "manual" : "gps"}
        onRequestLocation={async () => {
          setManualCoords(null);
          await geo.request();
        }}
        onSelectOnMap={() => {
          setNewSiteOpen(false);
          setLocationPickerOpen(true);
        }}
        onSaved={id => {
          setSelectedId(id);
          const savedAt = manualCoords ?? position;
          if (savedAt) setFocus({ latitude: savedAt.latitude, longitude: savedAt.longitude });
          setManualCoords(null);
        }}
      />

      <LocationPickerDialog
        open={locationPickerOpen}
        onOpenChange={setLocationPickerOpen}
        initialCoords={manualCoords ?? position}
        onRequestLocation={geo.request}
        onConfirm={coordinates => {
          setManualCoords(coordinates);
          setFocus(coordinates);
          setNewSiteOpen(true);
          toast.success("Ubicación manual seleccionada");
        }}
      />

      <CheckinDialog
        open={Boolean(checkinSite)}
        onOpenChange={open => !open && setCheckinSite(null)}
        site={checkinSite}
        coords={position}
      />
    </FieldShell>
  );
}
