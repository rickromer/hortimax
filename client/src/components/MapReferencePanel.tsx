import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Layers, Map, MapPinned, Satellite } from "lucide-react";
import { useState } from "react";

export type ReferenceMapType = "roadmap" | "hybrid";

const LEGEND = [
  { label: "Productor", color: "#3AA44B" },
  { label: "Revendedor", color: "#E3A008" },
  { label: "Cooperativa", color: "#0BA4A6" },
  { label: "Acopio", color: "#CE0A0A" },
];

type Props = {
  mapType: ReferenceMapType;
  onMapTypeChange: (type: ReferenceMapType) => void;
  className?: string;
};

/** Panel compacto de capas y referencias para que satélite conserve contexto operativo. */
export function MapReferencePanel({ mapType, onMapTypeChange, className }: Props) {
  const [expanded, setExpanded] = useState(false);

  return (
    <section className={cn("w-fit", className)} aria-label="Capas y referencias del mapa">
      <div className="overflow-hidden rounded-2xl border border-white/70 bg-background/95 shadow-[0_16px_34px_-18px_rgba(8,70,70,.55)] backdrop-blur-xl">
        <div className="flex items-center gap-2 p-1.5">
          {expanded && (
            <div className="min-w-0 pl-2">
              <p className="text-xs font-bold leading-none">Capas y referencias</p>
              <p className="mt-1 text-[10px] text-muted-foreground">
                {mapType === "hybrid" ? "Satélite · rutas y lugares" : "Mapa vial · límites y rutas"}
              </p>
            </div>
          )}
          <Button
            type="button"
            size="icon"
            variant="secondary"
            className="h-10 w-10 shrink-0 rounded-xl bg-transparent hover:bg-accent/75"
            onClick={() => setExpanded(value => !value)}
            aria-label={expanded ? "Ocultar referencias del mapa" : "Mostrar capas y referencias"}>
            <Layers className="h-4.5 w-4.5" />
          </Button>
        </div>

        {expanded && (
          <div className="w-[min(17rem,calc(100vw-1.5rem))] space-y-3 border-t border-border/70 p-3">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onMapTypeChange("hybrid")}
                className={cn(
                  "rounded-xl border p-2 text-left transition-colors",
                  mapType === "hybrid"
                    ? "border-[color:var(--brand-teal)] bg-[color:var(--brand-teal-soft)]"
                    : "border-border hover:bg-accent/50"
                )}>
                <Satellite className="mb-1.5 h-4 w-4 text-[color:var(--brand-teal)]" />
                <p className="text-xs font-semibold">Satélite</p>
                <p className="mt-0.5 text-[10px] leading-tight text-muted-foreground">Imagen, rutas y lugares</p>
              </button>
              <button
                type="button"
                onClick={() => onMapTypeChange("roadmap")}
                className={cn(
                  "rounded-xl border p-2 text-left transition-colors",
                  mapType === "roadmap"
                    ? "border-[color:var(--brand-green)] bg-[color:var(--brand-green-soft)]"
                    : "border-border hover:bg-accent/50"
                )}>
                <Map className="mb-1.5 h-4 w-4 text-[color:var(--brand-green)]" />
                <p className="text-xs font-semibold">Mapa vial</p>
                <p className="mt-0.5 text-[10px] leading-tight text-muted-foreground">Calles, límites y zonas</p>
              </button>
            </div>

            <div className="rounded-xl bg-secondary/80 p-2.5">
              <div className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold">
                <MapPinned className="h-3.5 w-3.5 text-[color:var(--brand-red)]" />
                Leyenda de puntos
              </div>
              <div className="grid grid-cols-2 gap-x-2 gap-y-1.5">
                {LEGEND.map(item => (
                  <div key={item.label} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full ring-2 ring-white" style={{ backgroundColor: item.color }} />
                    {item.label}
                  </div>
                ))}
              </div>
            </div>

            <p className="text-[10px] leading-relaxed text-muted-foreground">
              En Satélite se mantienen nombres, rutas y referencias de lugares para orientar cada visita.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
