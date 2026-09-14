import { CheckinDialog } from "@/components/CheckinDialog";
import { ClientMap } from "@/components/ClientMap";
import { OfflineVectorMap } from "@/components/OfflineVectorMap";
import { FieldShell } from "@/components/FieldShell";
import { MapPlaceSearch } from "@/components/MapPlaceSearch";
import { useAuth } from "@/_core/hooks/useAuth";
import { MapReferencePanel } from "@/components/MapReferencePanel";
import { SiteFormSheet } from "@/components/SiteFormSheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useGeolocation } from "@/hooks/useGeolocation";
import { formatDistance, timeAgo } from "@/lib/format";
import { placeFromMapCenter, startMapPlacement } from "@/lib/mapPlacement";
import {
  consumeGpsCenterAfterLogin,
  consumeRequestedMapFocus,
  hasGpsCenterAfterLogin,
  readSavedMapView,
  saveMapView,
} from "@/lib/mapSessionState";
import { parseRequestedMapSiteId } from "@/lib/requestedMapSite";
import { resolveNewPointPickerStart } from "@/lib/newPointPickerStart";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { canManageAll } from "@shared/permissions";
import { Capacitor } from "@capacitor/core";
import { Network } from "@capacitor/network";
import {
  Check,
  ChevronRight,
  Crosshair,
  Loader2,
  MapPin,
  Navigation,
  Plus,
  Search,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Link, useLocation, useSearch } from "wouter";

export default function FieldMap() {
  const [location, setLocation] = useLocation();
  const mapSearch = useSearch();
  const { user } = useAuth();
  const canEdit = Boolean(user);
  const canCreatePoint = true;
  const geo = useGeolocation({ enabled: true });
  const restoredMapViewRef = useRef(readSavedMapView());
  const requestedFocusRef = useRef(consumeRequestedMapFocus());
  const [shouldCenterGpsAfterLogin, setShouldCenterGpsAfterLogin] = useState(() =>
    hasGpsCenterAfterLogin()
  );
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(
    () => requestedFocusRef.current?.siteId ?? restoredMapViewRef.current?.selectedId ?? null
  );
  const selectedIdRef = useRef<number | null>(
    requestedFocusRef.current?.siteId ?? restoredMapViewRef.current?.selectedId ?? null
  );
  const [focus, setFocus] = useState<{ latitude: number; longitude: number } | null>(
    () => requestedFocusRef.current
      ? { latitude: requestedFocusRef.current.latitude, longitude: requestedFocusRef.current.longitude }
      : restoredMapViewRef.current?.center ?? null
  );
  const [focusZoom, setFocusZoom] = useState<number | undefined>(
    () => requestedFocusRef.current ? 17 : undefined
  );
  const [visibleMapCenter, setVisibleMapCenter] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [mapType, setMapType] = useState<"roadmap" | "hybrid">("hybrid");
  const [newSiteOpen, setNewSiteOpen] = useState(false);
  const [manualCoords, setManualCoords] = useState<{
    latitude: number;
    longitude: number;
    department?: string | null;
    zone?: string | null;
  } | null>(null);
  const [placementMode, setPlacementMode] = useState(false);
  const [placementCoords, setPlacementCoords] = useState<{
    latitude: number;
    longitude: number;
    department?: string | null;
    zone?: string | null;
  } | null>(null);
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);
  const [online, setOnline] = useState(() => typeof navigator === "undefined" || navigator.onLine);
  const isNativeApp = Capacitor.isNativePlatform();
  const [connectedMapFallback, setConnectedMapFallback] = useState(false);
  // En Android conectado se usa ClientMap con el proxy de la web estable.
  // NativeGoogleMap queda fuera de la ruta operativa hasta resolver la autorización nativa.
  const nativeConnectedMode = false;
  const [checkinSite, setCheckinSite] = useState<{ id: number; name: string } | null>(null);
  const hasAutoCentered = useRef(false);

  const sitesQuery = trpc.sites.list.useQuery(
    { search: search.trim() || undefined },
    { staleTime: 30_000 }
  );
  // Network.getStatus puede informar desconectado aunque la API nativa ya haya
  // respondido. La consulta de cartera es la evidencia operativa de conexión.
  const connectedApiReady = isNativeApp && sitesQuery.isFetchedAfterMount && sitesQuery.isSuccess;
  const offlineMode = isNativeApp && !online && !connectedApiReady;
  const localMapMode = offlineMode ||
    (isNativeApp && (online || connectedApiReady) && connectedMapFallback);

  const position = geo.position;
  useEffect(() => {
    selectedIdRef.current = selectedId;
  }, [selectedId]);
  useEffect(() => {
    if (isNativeApp) {
      let listening = true;
      let listener: { remove: () => Promise<void> } | undefined;
      void Network.getStatus().then(status => {
        if (listening) setOnline(status.connected);
      });
      void Network.addListener("networkStatusChange", status => setOnline(status.connected)).then(value => {
        listener = value;
      });
      return () => {
        listening = false;
        void listener?.remove();
      };
    }
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, [isNativeApp]);
  useEffect(() => {
    if (offlineMode) setMapInstance(null);
  }, [offlineMode]);
  useEffect(() => {
    if (!position || !shouldCenterGpsAfterLogin || hasAutoCentered.current) return;
    hasAutoCentered.current = true;
    setFocus({ latitude: position.latitude, longitude: position.longitude });
    consumeGpsCenterAfterLogin();
    setShouldCenterGpsAfterLogin(false);
  }, [position, shouldCenterGpsAfterLogin]);
  const sites = sitesQuery.data ?? [];
  const requestedSiteId = useMemo(() => parseRequestedMapSiteId(mapSearch), [mapSearch]);
  useEffect(() => {
    const requestedFocus = requestedFocusRef.current;
    if (!requestedFocus) return;
    selectedIdRef.current = requestedFocus.siteId;
    setSelectedId(requestedFocus.siteId);
    setFocus({ latitude: requestedFocus.latitude, longitude: requestedFocus.longitude });
    setFocusZoom(17);
  }, []);
  useEffect(() => {
    if (!requestedSiteId) return;
    const requestedSite = sites.find(site => site.id === requestedSiteId);
    if (!requestedSite) return;
    selectedIdRef.current = requestedSite.id;
    setSelectedId(requestedSite.id);
    setFocus({ latitude: requestedSite.latitude, longitude: requestedSite.longitude });
    setFocusZoom(17);
  }, [requestedSiteId, sites]);
  const selected = useMemo(
    () => sites.find(site => site.id === selectedId) ?? null,
    [sites, selectedId]
  );
  const canEditSelected = Boolean(
    user && selected && (canManageAll(user.role) || selected.createdBy === user.id)
  );

  const markers = useMemo(() => {
    const mapped = sites.map(site => ({
        id: site.id,
        name: site.name,
        latitude: site.latitude,
        longitude: site.longitude,
        clientType: site.clientType,
        department: site.department,
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
        department: manualCoords.department ?? null,
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

  const pickerStartCoords = resolveNewPointPickerStart({
    manualCoords,
    visibleMapCenter,
    focus,
    userPosition: position,
  });

  const beginPlacement = (start = pickerStartCoords) => {
    const next = startMapPlacement(visibleMapCenter, start);
    if (!next) {
      toast.error("Esperá a que cargue el mapa o usá Mi ubicación para elegir el punto.");
      return;
    }
    setPlacementCoords(placeFromMapCenter(next));
    setPlacementMode(true);
    setFocus(next);
  };

  const confirmPlacement = () => {
    if (!placementCoords) return;
    setManualCoords(placementCoords);
    setPlacementMode(false);
    setNewSiteOpen(true);
    toast.success("Ubicación manual seleccionada");
  };

  return (
      <FieldShell
        bleed
        hideContext
        nativeMap={nativeConnectedMode}
      subtitle={
        geo.loading && !position
          ? "Buscando señal GPS…"
          : position
            ? `GPS activo · ±${position.accuracy} m`
            : "Ubicación no disponible"
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
        {localMapMode ? (
          <OfflineVectorMap
            markers={markers}
            userPosition={position}
            focus={focus}
            focusZoom={focusZoom}
            placementMode={placementMode}
            onMapClick={coords => {
              if (!placementMode) return;
              setPlacementCoords(placeFromMapCenter(coords));
              setFocus(coords);
            }}
            onCenterChanged={coords => {
              setVisibleMapCenter(coords);
              saveMapView({ center: { latitude: coords.latitude, longitude: coords.longitude }, selectedId: selectedIdRef.current, zoom: coords.zoom });
              if (placementMode) setPlacementCoords(placeFromMapCenter(coords));
            }}
            onMarkerClick={id => {
              selectedIdRef.current = id;
              setSelectedId(id);
              const site = sites.find(s => s.id === id);
              if (site) setFocus({ latitude: site.latitude, longitude: site.longitude });
            }}
          />
        ) : (
          <ClientMap
            markers={markers}
            userPosition={position}
            focus={focus}
            focusZoom={focusZoom}
            initialZoom={restoredMapViewRef.current?.zoom}
            mapTypeId={mapType}
            onReady={map => setMapInstance(map)}
            onLoadError={() => {
              if (isNativeApp && (online || connectedApiReady)) {
                setConnectedMapFallback(true);
                toast.error("Google Maps no está disponible; se activó el mapa local.");
              }
            }}
            onMapClick={coords => {
              if (!placementMode) return;
              setPlacementCoords(placeFromMapCenter(coords));
              setFocus(coords);
            }}
            onCenterChanged={coords => {
              setVisibleMapCenter(coords);
              saveMapView({
                center: { latitude: coords.latitude, longitude: coords.longitude },
                selectedId: selectedIdRef.current,
                zoom: coords.zoom,
              });
              if (placementMode) setPlacementCoords(placeFromMapCenter(coords));
            }}
            onMarkerClick={id => {
              if (id === -1) return;
              selectedIdRef.current = id;
              setSelectedId(id);
              const site = sites.find(s => s.id === id);
              if (site) setFocus({ latitude: site.latitude, longitude: site.longitude });
            }}
          />
        )}

        {!localMapMode && !nativeConnectedMode && (
          <div className={cn("absolute left-3 right-16 z-20 sm:right-auto sm:w-[24rem]", placementMode ? "top-20" : "top-3")}>
            <MapPlaceSearch
              map={mapInstance}
              onSelect={selection => {
                const coords = placeFromMapCenter(selection);
                setFocus(coords);
                setPlacementCoords(coords);
                if (!placementMode) setPlacementMode(false);
              }}
            />
          </div>
        )}

        {placementMode && (
          <>
            <div className="absolute top-3 inset-x-3 z-30 rounded-xl bg-background/95 px-3 py-2.5 shadow-lg backdrop-blur sm:left-3 sm:right-auto sm:w-[24rem]">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">Ubicá el nuevo punto</p>
                  <p className="text-xs text-muted-foreground">Mové el mapa o buscá un lugar. El pin central será la ubicación.</p>
                </div>
                <Button type="button" size="sm" variant="outline" className="bg-background" onClick={() => setPlacementMode(false)}>
                  Cancelar
                </Button>
              </div>
            </div>
            <div className="pointer-events-none absolute inset-0 z-20 grid place-items-center">
              <MapPin className="h-14 w-14 -translate-y-1/2 fill-primary/15 text-primary drop-shadow-[0_5px_5px_rgba(0,0,0,0.35)]" />
            </div>
            <div className="absolute bottom-[calc(env(safe-area-inset-bottom)+5rem)] left-1/2 z-30 -translate-x-1/2">
              <Button type="button" className="shadow-lg" onClick={confirmPlacement}>
                <Check className="h-4 w-4" />
                Usar esta ubicación
              </Button>
            </div>
          </>
        )}

        {/* Buscador de clientes flotante */}
        {searchOpen && (
          <div className="absolute top-16 inset-x-3 z-20 sm:top-3 sm:left-[25rem] sm:right-3">
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
                        selectedIdRef.current = site.id;
                        setSelectedId(site.id);
                        setFocus({ latitude: site.latitude, longitude: site.longitude });
                        setSearchOpen(false);
                      }}>
                      <p className="text-sm font-medium truncate">{site.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {[site.clientType, site.department, site.zone].filter(Boolean).join(" · ") ||
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
            aria-label="Mi ubicación">
            {geo.loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Crosshair className="h-5 w-5" />}
          </Button>
          {!offlineMode && <MapReferencePanel mapType={mapType} onMapTypeChange={setMapType} />}
        </div>

        {/* Aviso de GPS */}
        {geo.error && (
          <div className="absolute top-3 inset-x-3 z-10 rounded-xl bg-destructive/95 text-destructive-foreground px-3 py-2.5 text-sm shadow-lg">
            {geo.error} Podés seleccionar el punto manualmente en el mapa.
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
                    {selected.department && (
                      <Badge variant="outline" className="text-[11px]">
                        {selected.department}
                      </Badge>
                    )}
                    {selected.zone && (
                      <Badge variant="outline" className="text-[11px] text-muted-foreground">
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
                  onClick={() => {
                    selectedIdRef.current = null;
                    setSelectedId(null);
                  }}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex gap-2 mt-3">
                {canEditSelected && <Button
                  className="flex-1"
                  onClick={() => setCheckinSite({ id: selected.id, name: selected.name })}>
                  <Navigation className="h-4 w-4" />
                  Check-in
                </Button>}
                <Button variant="outline" className="flex-1 bg-background" asChild>
                  <Link href={`/sitios/${selected.id}`}>
                    Ver ficha
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          ) : null}
        </div>

        {/* Botón principal */}
        {canCreatePoint && !placementMode && <Button
          className={cn(
            "absolute bottom-[calc(env(safe-area-inset-bottom)+5rem)] left-1/2 -translate-x-1/2 z-30 h-14 w-14 p-0 rounded-full shadow-xl",
            "sm:w-auto sm:px-6 text-base font-semibold"
          )}
          aria-label="Nuevo punto"
          onClick={() => {
            setManualCoords(null);
            beginPlacement();
          }}>
          <Plus className="h-6 w-6" />
          <span className="sr-only sm:not-sr-only">Nuevo punto</span>
        </Button>}
      </div>

      {canCreatePoint && <SiteFormSheet
        open={newSiteOpen}
        onOpenChange={open => {
          setNewSiteOpen(open);
          if (!open) {
            setManualCoords(null);
            setPlacementCoords(null);
            setPlacementMode(false);
          }
        }}
        coords={manualCoords ?? position}
        locationSource={manualCoords ? "manual" : "gps"}
        autoDepartment={manualCoords?.department ?? undefined}
        autoZone={manualCoords?.zone ?? undefined}
        onRequestLocation={async () => {
          setManualCoords(null);
          await geo.request();
        }}
        onSelectOnMap={() => {
          setNewSiteOpen(false);
          beginPlacement(manualCoords ?? pickerStartCoords);
        }}
        onSaved={id => {
          selectedIdRef.current = id;
          setSelectedId(id);
          const savedAt = manualCoords ?? position;
          if (savedAt) setFocus({ latitude: savedAt.latitude, longitude: savedAt.longitude });
          setManualCoords(null);
        }}
      />}

      {canEdit && <CheckinDialog
        open={Boolean(checkinSite)}
        onOpenChange={open => !open && setCheckinSite(null)}
        site={checkinSite}
        coords={position}
      />}
    </FieldShell>
  );
}
