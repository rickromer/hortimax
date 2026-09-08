import { trpc } from "@/lib/trpc";
import { useEffect, useRef, useState } from "react";

const DETAIL_BATCH_SIZE = 8;

export function offlinePreloadKey(userId: number, sites: Array<{ id: number }>) {
  return `${userId}:${sites.map(site => site.id).sort((left, right) => left - right).join(",")}`;
}

export function OfflineDataPreloader() {
  const utils = trpc.useUtils();
  const me = trpc.auth.me.useQuery(undefined, { retry: false, refetchOnWindowFocus: false });
  const [online, setOnline] = useState(() => typeof navigator === "undefined" || navigator.onLine);
  const sites = trpc.sites.list.useQuery({}, { enabled: Boolean(me.data && online), staleTime: 5 * 60 * 1000 });
  trpc.calendar.timeline.useQuery(undefined, { enabled: Boolean(me.data && online), staleTime: 5 * 60 * 1000 });
  const runningForPortfolio = useRef<string | null>(null);

  useEffect(() => {
    const goOnline = () => {
      runningForPortfolio.current = null;
      setOnline(true);
    };
    const goOffline = () => {
      runningForPortfolio.current = null;
      setOnline(false);
    };
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  useEffect(() => {
    if (!online || !me.data || !sites.data) return;
    const userId = me.data.id;
    const siteData = sites.data;
    const preloadKey = offlinePreloadKey(userId, siteData);
    if (runningForPortfolio.current === preloadKey) return;
    runningForPortfolio.current = preloadKey;
    let cancelled = false;
    void (async () => {
      for (let index = 0; index < siteData.length && !cancelled; index += DETAIL_BATCH_SIZE) {
        const batch = siteData.slice(index, index + DETAIL_BATCH_SIZE);
        await Promise.all(
          batch.map(site => utils.sites.detail.prefetch({ id: site.id }, { staleTime: 0 }))
        );
      }
      if (!cancelled) {
        localStorage.setItem(
          `hortimax-offline-preload-${userId}`,
          JSON.stringify({ completedAt: Date.now(), siteCount: siteData.length })
        );
      }
    })().catch(error => {
      console.warn("No se pudo completar la precarga offline", error);
      runningForPortfolio.current = null;
    });
    return () => {
      cancelled = true;
    };
  }, [me.data, online, sites.data, utils]);

  return null;
}
