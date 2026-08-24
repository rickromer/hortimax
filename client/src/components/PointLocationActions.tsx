import { Button } from "@/components/ui/button";
import {
  googleMapsPointUrl,
  pointShareText,
  type PointCoordinates,
  whatsappPointUrl,
  wazePointUrl,
} from "@/lib/locationLinks";
import { ExternalLink, Map, Navigation, Share2 } from "lucide-react";
import { toast } from "sonner";

type Props = {
  name: string;
  coords: PointCoordinates;
  compact?: boolean;
};

/** Acciones de ubicación compatibles con web, Android y iPhone. */
export function PointLocationActions({ name, coords, compact = false }: Props) {
  const share = async () => {
    const text = pointShareText(name, coords);
    try {
      if (navigator.share) {
        await navigator.share({ title: name, text, url: googleMapsPointUrl(coords) });
        return;
      }
      window.open(whatsappPointUrl(name, coords), "_blank", "noopener,noreferrer");
    } catch (error) {
      if ((error as DOMException)?.name !== "AbortError") {
        toast.error("No se pudo abrir el menú para compartir");
      }
    }
  };

  const iconOnly = compact ? "" : "flex-1";

  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" className={`bg-background ${iconOnly}`} asChild>
        <a href={googleMapsPointUrl(coords)} target="_blank" rel="noreferrer">
          <Map className="h-4 w-4" />
          Google Maps
          {!compact && <ExternalLink className="h-3.5 w-3.5" />}
        </a>
      </Button>
      <Button variant="outline" className={`bg-background ${iconOnly}`} asChild>
        <a href={wazePointUrl(coords)} target="_blank" rel="noreferrer">
          <Navigation className="h-4 w-4" />
          Waze
        </a>
      </Button>
      <Button variant="secondary" className={iconOnly} onClick={share}>
        <Share2 className="h-4 w-4" />
        Compartir
      </Button>
      <Button variant="secondary" className={iconOnly} asChild>
        <a href={whatsappPointUrl(name, coords)} target="_blank" rel="noreferrer">
          WhatsApp
        </a>
      </Button>
    </div>
  );
}
