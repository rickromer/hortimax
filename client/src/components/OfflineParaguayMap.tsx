import { PARAGUAY_DEPARTMENTS } from "@/data/paraguayDepartments";
import { cn } from "@/lib/utils";
import { MapPin, WifiOff } from "lucide-react";

type OfflineMarker = {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  clientType?: string | null;
  selected?: boolean;
};

type OfflineParaguayMapProps = {
  markers: OfflineMarker[];
  focus?: { latitude: number; longitude: number } | null;
  onMarkerClick?: (id: number) => void;
  onMapClick?: (coords: { latitude: number; longitude: number }) => void;
};

const BOUNDS = { west: -62.7, east: -54.15, south: -27.7, north: -19.15 };
const COLORS: Record<string, string> = {
  Productor: "#3AA44B",
  Revendedor: "#E3A008",
  Cooperativa: "#0BA4A6",
  Acopio: "#CE0A0A",
};

function project(latitude: number, longitude: number) {
  return {
    x: ((longitude - BOUNDS.west) / (BOUNDS.east - BOUNDS.west)) * 1000,
    y: ((BOUNDS.north - latitude) / (BOUNDS.north - BOUNDS.south)) * 760,
  };
}

function colorFor(type?: string | null) {
  return COLORS[type ?? ""] ?? "#53666A";
}

export function OfflineParaguayMap({ markers, focus, onMarkerClick, onMapClick }: OfflineParaguayMapProps) {
  const handleMapClick = (event: React.MouseEvent<SVGSVGElement>) => {
    if (!onMapClick) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 1000;
    const y = ((event.clientY - rect.top) / rect.height) * 760;
    onMapClick({
      longitude: BOUNDS.west + (x / 1000) * (BOUNDS.east - BOUNDS.west),
      latitude: BOUNDS.north - (y / 760) * (BOUNDS.north - BOUNDS.south),
    });
  };
  const projectedFocus = focus ? project(focus.latitude, focus.longitude) : null;

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#e8f0e8]">
      <svg
        viewBox="0 0 1000 760"
        preserveAspectRatio="xMidYMid meet"
        className={cn("h-full w-full", onMapClick && "cursor-crosshair")}
        role="img"
        aria-label="Mapa offline de Paraguay con clientes sincronizados"
        onClick={handleMapClick}>
        <defs>
          <linearGradient id="offline-map-bg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#f7fbf5" />
            <stop offset="1" stopColor="#dceadd" />
          </linearGradient>
        </defs>
        <rect width="1000" height="760" fill="url(#offline-map-bg)" />
        <path d="M0 640 C170 580 240 680 390 620 S700 580 1000 650 V760 H0 Z" fill="#c8dfc9" opacity=".6" />
        {PARAGUAY_DEPARTMENTS.map(department =>
          department.polygons.map((polygon, index) =>
            polygon.map((ring, ringIndex) => {
              const points = ring.map(([longitude, latitude]) => {
                const point = project(latitude, longitude);
                return `${point.x.toFixed(1)},${point.y.toFixed(1)}`;
              }).join(" ");
              return (
                <polygon
                  key={`${department.name}-${index}-${ringIndex}`}
                  points={points}
                  fill={ringIndex === 0 ? "#eef6ec" : "#e8f0e8"}
                  stroke="#a8c4aa"
                  strokeWidth="1.5"
                  vectorEffect="non-scaling-stroke"
                />
              );
            })
          )
        )}
        {projectedFocus && (
          <circle cx={projectedFocus.x} cy={projectedFocus.y} r="25" fill="none" stroke="#0BA4A6" strokeWidth="3" opacity=".55" vectorEffect="non-scaling-stroke" />
        )}
        {markers.filter(marker => marker.id !== -1).map(marker => {
          const point = project(marker.latitude, marker.longitude);
          const radius = marker.selected ? 10 : 7;
          return (
            <g
              key={marker.id}
              role="button"
              tabIndex={0}
              aria-label={`${marker.name}. Abrir cliente`}
              onClick={event => { event.stopPropagation(); onMarkerClick?.(marker.id); }}
              onKeyDown={event => { if (event.key === "Enter" || event.key === " ") onMarkerClick?.(marker.id); }}
              className="cursor-pointer">
              <circle cx={point.x} cy={point.y} r={radius + 5} fill="white" opacity=".8" />
              <circle cx={point.x} cy={point.y} r={radius} fill={colorFor(marker.clientType)} stroke="white" strokeWidth="2" vectorEffect="non-scaling-stroke" />
            </g>
          );
        })}
      </svg>
      <div className="pointer-events-none absolute left-3 top-3 max-w-[calc(100%-1.5rem)] rounded-xl border border-amber-200 bg-white/95 px-3 py-2 text-xs text-foreground shadow-md backdrop-blur">
        <div className="flex items-center gap-2 font-semibold"><WifiOff className="h-3.5 w-3.5 text-amber-600" /> Mapa offline de Paraguay</div>
        <p className="mt-0.5 text-muted-foreground">{markers.length} cliente{markers.length === 1 ? "" : "s"} sincronizado{markers.length === 1 ? "" : "s"}. Google Maps vuelve al recuperar señal.</p>
      </div>
      <div className="pointer-events-none absolute bottom-3 right-3 rounded-lg border border-border/70 bg-card/90 px-2 py-1 text-[10px] text-muted-foreground shadow-sm">
        Vista territorial · sin calles ni búsqueda
      </div>
    </div>
  );
}
