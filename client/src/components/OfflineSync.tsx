import { trpc } from "@/lib/trpc";
import {
  listOfflineOperations,
  onOfflineQueueChange,
  removeOfflineOperation,
  updateOfflineOperation,
  type OfflineOperation,
} from "@/lib/offlineQueue";
import { Cloud, CloudOff, Loader2, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

function isNetworkAvailable() {
  return typeof navigator === "undefined" || navigator.onLine;
}

export function OfflineSync() {
  const [online, setOnline] = useState(() => typeof navigator === "undefined" || navigator.onLine);
  const [pending, setPending] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const createSite = trpc.sites.create.useMutation();
  const checkin = trpc.sites.checkin.useMutation();
  const createNote = trpc.notes.create.useMutation();
  const createFollowup = trpc.followups.create.useMutation();

  const refreshCount = useCallback(async () => {
    setPending((await listOfflineOperations()).length);
  }, []);

  const flush = useCallback(async () => {
    if (!isNetworkAvailable() || syncing) return;
    const operations = await listOfflineOperations();
    if (!operations.length) return;
    setSyncing(true);
    setLastError(null);
    for (const operation of operations) {
      try {
        switch (operation.kind) {
          case "site.create":
            await createSite.mutateAsync(operation.input as Parameters<typeof createSite.mutateAsync>[0]);
            break;
          case "site.checkin":
            await checkin.mutateAsync(operation.input as Parameters<typeof checkin.mutateAsync>[0]);
            break;
          case "note.create":
            await createNote.mutateAsync(operation.input as Parameters<typeof createNote.mutateAsync>[0]);
            break;
          case "followup.create":
            await createFollowup.mutateAsync(operation.input as Parameters<typeof createFollowup.mutateAsync>[0]);
            break;
        }
        await removeOfflineOperation(operation.id);
      } catch (error) {
        const message = error instanceof Error ? error.message : "No se pudo sincronizar";
        await updateOfflineOperation({ ...operation, attempts: operation.attempts + 1, lastError: message });
        setLastError(message);
        break;
      }
    }
    setSyncing(false);
    await refreshCount();
  }, [checkin, createFollowup, createNote, createSite, refreshCount, syncing]);

  useEffect(() => {
    const goOnline = () => {
      setOnline(true);
      void flush();
    };
    const goOffline = () => setOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    const unsubscribe = onOfflineQueueChange(() => void refreshCount());
    void refreshCount();
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
      unsubscribe();
    };
  }, [flush, refreshCount]);

  useEffect(() => {
    const timer = window.setInterval(() => void flush(), 30_000);
    return () => window.clearInterval(timer);
  }, [flush]);

  if (!online) {
    return (
      <div className="pointer-events-none fixed right-3 top-[4.8rem] z-40 flex h-9 w-9 items-center justify-center rounded-full border border-amber-200 bg-card/95 text-amber-700 shadow-md backdrop-blur" title="Sin señal. Los registros se guardan en este dispositivo.">
        <CloudOff className="h-4 w-4" />
        <span className="sr-only">Sin señal. Los registros se guardan en este dispositivo.</span>
      </div>
    );
  }

  if (!pending && !syncing) return null;
  return (
    <div className="fixed inset-x-0 bottom-[4.6rem] z-40 flex justify-center px-3 pointer-events-none sm:bottom-4">
      <div className="pointer-events-auto flex max-w-xl items-center gap-2 rounded-full border border-border/70 bg-card/95 px-3 py-2 text-xs text-card-foreground shadow-lg backdrop-blur">
        <Cloud className="h-4 w-4 text-primary" />
        <span>
          {syncing ? "Sincronizando registros…" : `${pending} registro${pending === 1 ? "" : "s"} pendiente${pending === 1 ? "" : "s"}.`}
        </span>
        {syncing && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
        {pending > 0 && !syncing && (
          <button className="ml-1 inline-flex items-center gap-1 font-medium text-primary" onClick={() => void flush()}>
            <RefreshCw className="h-3.5 w-3.5" /> Reintentar
          </button>
        )}
        {lastError && <span className="sr-only">{lastError}</span>}
      </div>
    </div>
  );
}
