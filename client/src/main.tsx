import { trpc } from "@/lib/trpc";
import { COOKIE_NAME } from '@shared/const';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { persistQueryClient } from "@tanstack/query-persist-client-core";
import { httpBatchLink, httpLink } from "@trpc/client";
import { createRoot } from "react-dom/client";
import superjson from "superjson";
import App from "./App";
import { OfflineDataPreloader } from "./components/OfflineDataPreloader";
import { OfflineSync } from "./components/OfflineSync";
import { createIndexedDbPersister, shouldDehydrateOperationalQuery } from "./lib/indexedDbPersister";
import { nativeMobileFetch } from "./lib/nativeHttp";
import { getNativeSessionToken, isNativeAndroidApp } from "./lib/nativeSession";
import "./index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      networkMode: "offlineFirst",
      staleTime: 5 * 60 * 1000,
    },
  },
});

if (typeof window !== "undefined") {
  const persister = createIndexedDbPersister();
  void persistQueryClient({
    queryClient,
    persister,
    maxAge: 30 * 24 * 60 * 60 * 1000,
    dehydrateOptions: {
      shouldDehydrateQuery: query => {
        return shouldDehydrateOperationalQuery(query);
      },
    },
  });
}

queryClient.getQueryCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.query.state.error;
    console.error("[API Query Error]", error);
  }
});

queryClient.getMutationCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.mutation.state.error;
    console.error("[API Mutation Error]", error);
  }
});

const apiBaseUrl = (import.meta.env.VITE_PORTAL_API_URL ?? "").replace(/\/$/, "");
const apiHeaders = () => {
  if (isNativeAndroidApp()) {
    const token = getNativeSessionToken();
    return token ? { Authorization: `Bearer ${token}`, "X-Hortimax-Client": "android" } : { "X-Hortimax-Client": "android" };
  }
  try {
    const raw = sessionStorage.getItem("manus-cookie");
    if (raw) {
      const prefix = `${COOKIE_NAME}=`;
      const pair = raw.split(";").find(s => s.trim().startsWith(prefix));
      const token = pair?.trim().slice(prefix.length);
      if (token) return { Authorization: `Bearer ${token}` };
    }
  } catch {
    // sessionStorage no está disponible.
  }
  return {};
};
const apiFetch = (input: RequestInfo | URL, init?: RequestInit) => nativeMobileFetch(input, { ...(init ?? {}), credentials: "include" });
const apiLink = isNativeAndroidApp()
  ? httpLink({ url: `${apiBaseUrl}/api/trpc`, transformer: superjson, headers: apiHeaders, fetch: apiFetch })
  : httpBatchLink({ url: `${apiBaseUrl}/api/trpc`, transformer: superjson, headers: apiHeaders, fetch: apiFetch });

const trpcClient = trpc.createClient({
  links: [apiLink],
});

if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    void navigator.serviceWorker.register("/sw.js?v=auth-clean-1", { updateViaCache: "none" });
  });
}

createRoot(document.getElementById("root")!).render(
  <trpc.Provider client={trpcClient} queryClient={queryClient}>
    <QueryClientProvider client={queryClient}>
      <OfflineDataPreloader />
      <OfflineSync />
      <App />
    </QueryClientProvider>
  </trpc.Provider>
);
