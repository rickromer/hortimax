import { Button } from "@/components/ui/button";
import {
  downloadOfflineMap,
  formatMapBytes,
  getOfflineMapStatus,
  OFFLINE_MAP_EXPECTED_BYTES,
  removeOfflineMap,
  type OfflineMapStatus,
} from "@/lib/offlineMapStorage";
import { Download, Map, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type OfflineMapDownloadProps = {
  online: boolean;
  onReady: (file: File | null) => void;
};

export function OfflineMapDownload({ online, onReady }: OfflineMapDownloadProps) {
  const [status, setStatus] = useState<OfflineMapStatus>({ available: false, bytes: 0, updatedAt: null });
  const [progress, setProgress] = useState<number | null>(null);
  const [working, setWorking] = useState(false);

  useEffect(() => {
    void getOfflineMapStatus().then(setStatus);
  }, []);

  const download = async () => {
    if (!online) {
      toast.error("Conectá el teléfono a Internet para descargar el mapa una sola vez.");
      return;
    }
    setWorking(true);
    setProgress(0);
    try {
      const file = await downloadOfflineMap((received, total) => {
        setProgress(Math.min(100, Math.round((received / total) * 100)));
      });
      setStatus({ available: true, bytes: file?.size ?? OFFLINE_MAP_EXPECTED_BYTES, updatedAt: Date.now() });
      onReady(file);
      toast.success("Mapa completo de Paraguay disponible sin señal.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo descargar el mapa offline.");
      setProgress(null);
    } finally {
      setWorking(false);
    }
  };

  const remove = async () => {
    setWorking(true);
    await removeOfflineMap();
    setStatus({ available: false, bytes: 0, updatedAt: null });
    onReady(null);
    setWorking(false);
    toast.success("Mapa offline eliminado de este dispositivo.");
  };

  return (
    <div className="absolute left-3 right-3 top-14 z-30 mx-auto max-w-md rounded-2xl border border-border/80 bg-background/95 p-3 shadow-lg backdrop-blur sm:left-auto sm:right-3">
      <div className="flex items-start gap-2.5">
        <div className="mt-0.5 rounded-full bg-primary/10 p-2 text-primary"><Map className="h-4 w-4" /></div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">Mapa completo sin señal</p>
          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
            {status.available
              ? `Paraguay guardado en este teléfono · ${formatMapBytes(status.bytes)}`
              : `Calles, rutas y ciudades de Paraguay · ${formatMapBytes(OFFLINE_MAP_EXPECTED_BYTES)}`}
          </p>
          {progress !== null && (
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
              <div className="h-full bg-primary transition-[width]" style={{ width: `${progress}%` }} />
            </div>
          )}
        </div>
        {status.available ? (
          <Button type="button" size="icon" variant="ghost" className="h-8 w-8" disabled={working} onClick={() => void remove()} aria-label="Eliminar mapa offline">
            <Trash2 className="h-4 w-4" />
          </Button>
        ) : (
          <Button type="button" size="sm" className="h-8 shrink-0" disabled={working || !online} onClick={() => void download()}>
            <Download className="h-3.5 w-3.5" />
            {working ? `${progress ?? 0}%` : "Descargar"}
          </Button>
        )}
      </div>
    </div>
  );
}
