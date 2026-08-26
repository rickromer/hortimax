/// <reference types="@types/google.maps" />

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { canQueryMapPlaces, PARAGUAY_PLACE_RESTRICTION } from "@/lib/mapPlaceSearchOptions";
import { Loader2, MapPin, Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export type PlaceSelection = {
  latitude: number;
  longitude: number;
  label: string;
};

type Props = {
  map: google.maps.Map | null;
  compact?: boolean;
  onSelect: (selection: PlaceSelection) => void;
};

/** Búsqueda compacta de Google Places, sesgada a Paraguay y al área visible. */
export function MapPlaceSearch({ map, compact = false, onSelect }: Props) {
  const [query, setQuery] = useState("");
  const [predictions, setPredictions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [loading, setLoading] = useState(false);
  const serviceRef = useRef<google.maps.places.AutocompleteService | null>(null);

  useEffect(() => {
    const activeMap = map;
    if (!canQueryMapPlaces(query, Boolean(activeMap)) || !activeMap || !window.google?.maps?.places) {
      setPredictions([]);
      setLoading(false);
      return;
    }

    const timeout = window.setTimeout(() => {
      serviceRef.current ??= new window.google!.maps.places.AutocompleteService();
      setLoading(true);
      serviceRef.current.getPlacePredictions(
        {
          input: query.trim(),
          componentRestrictions: PARAGUAY_PLACE_RESTRICTION,
          locationBias: activeMap.getBounds() ?? undefined,
        },
        (results, status) => {
          setLoading(false);
          if (status !== window.google?.maps.places.PlacesServiceStatus.OK || !results) {
            setPredictions([]);
            return;
          }
          setPredictions(results.slice(0, 5));
        }
      );
    }, 260);
    return () => window.clearTimeout(timeout);
  }, [map, query]);

  const selectPrediction = (prediction: google.maps.places.AutocompletePrediction) => {
    if (!map || !window.google?.maps?.places) return;
    setLoading(true);
    const places = new window.google.maps.places.PlacesService(map);
    places.getDetails(
      { placeId: prediction.place_id, fields: ["geometry", "name", "formatted_address"] },
      (place, status) => {
        setLoading(false);
        const location = place?.geometry?.location;
        if (status !== window.google?.maps.places.PlacesServiceStatus.OK || !location) return;
        const selection = {
          latitude: location.lat(),
          longitude: location.lng(),
          label: place?.name || place?.formatted_address || prediction.description,
        };
        setQuery(selection.label);
        setPredictions([]);
        onSelect(selection);
      }
    );
  };

  return (
    <div className={compact ? "w-full" : "w-full max-w-md"}>
      <div className="surface-card flex items-center gap-2 px-3 py-2 shadow-lg">
        <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
        <Input
          value={query}
          onChange={event => setQuery(event.target.value)}
          placeholder="Buscar lugar en Google Maps"
          aria-label="Buscar lugar en Google Maps"
          className="h-8 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
        />
        {loading ? (
          <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" />
        ) : query ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0"
            aria-label="Limpiar búsqueda de lugar"
            onClick={() => setQuery("")}>
            <X className="h-4 w-4" />
          </Button>
        ) : null}
      </div>
      {predictions.length > 0 && (
        <div className="surface-card mt-2 overflow-hidden py-1 shadow-xl">
          {predictions.map(prediction => (
            <button
              key={prediction.place_id}
              type="button"
              className="flex w-full items-start gap-2 px-3 py-2.5 text-left transition-colors hover:bg-accent"
              onClick={() => selectPrediction(prediction)}>
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span className="line-clamp-2 text-sm">{prediction.description}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
