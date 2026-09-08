import { trpc } from "@/lib/trpc";
import { canManageAll } from "@shared/permissions";
import { TRPCClientError } from "@trpc/client";
import { forgetOfflineCredential, getOfflineSession, onOfflineAuthChange } from "@/lib/offlineAuth";
import { clearOfflineOperationalData } from "@/lib/offlineOperationalData";
import { useCallback, useEffect, useMemo, useState } from "react";

export const AUTH_BOOT_TIMEOUT_MS = 8_000;

export function getAuthStartupDiagnostic(input: {
  isLoading: boolean;
  fetchStatus: "fetching" | "paused" | "idle";
  timedOut: boolean;
}) {
  if (!input.isLoading) return null;
  if (input.timedOut) return "HMX-AUTH-TIMEOUT";
  if (input.fetchStatus === "paused") return "HMX-AUTH-PAUSED";
  return "HMX-AUTH-CHECK";
}

/**
 * Estado de autenticación de la app. El acceso es con usuario y contraseña
 * propios (sin OAuth): la sesión vive en una cookie firmada por el servidor.
 */
export function useAuth() {
  const utils = trpc.useUtils();
  const [offlineSession, setOfflineSession] = useState(() => getOfflineSession());
  const [bootstrapTimedOut, setBootstrapTimedOut] = useState(false);

  useEffect(() => onOfflineAuthChange(() => setOfflineSession(getOfflineSession())), []);

  const meQuery = trpc.auth.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (!meQuery.isLoading) {
      setBootstrapTimedOut(false);
      return;
    }

    const timer = window.setTimeout(() => setBootstrapTimedOut(true), AUTH_BOOT_TIMEOUT_MS);
    return () => window.clearTimeout(timer);
  }, [meQuery.isLoading]);

  useEffect(() => {
    if (!meQuery.data) return;
    setOfflineSession(meQuery.data);
    // La consulta sin filtros respeta el alcance del servidor: cartera propia
    // para Representante y cartera completa para Gerencia/Administración.
    void utils.sites.list.prefetch({});
  }, [meQuery.data, utils]);

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      utils.auth.me.setData(undefined, null);
    },
  });

  const logout = useCallback(async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch (error: unknown) {
      if (error instanceof TRPCClientError && error.data?.code === "UNAUTHORIZED") {
        return;
      }
      throw error;
    } finally {
      try {
        sessionStorage.removeItem("manus-cookie");
      } catch {}
      await clearOfflineOperationalData();
      forgetOfflineCredential();
      utils.auth.me.setData(undefined, null);
      await utils.auth.me.invalidate();
      if (typeof window !== "undefined" && window.location.pathname !== "/acceso") {
        window.location.replace("/acceso");
      }
    }
  }, [logoutMutation, utils]);

  const offlineAllowed = Boolean(offlineSession) && (meQuery.isError || (typeof navigator !== "undefined" && navigator.onLine === false));
  const activeUser = meQuery.data ?? (offlineAllowed ? offlineSession : null);
  const startupDiagnostic = getAuthStartupDiagnostic({
    isLoading: meQuery.isLoading,
    fetchStatus: meQuery.fetchStatus,
    timedOut: bootstrapTimedOut,
  });

  const state = useMemo(
    () => ({
      user: activeUser,
      loading:
        (meQuery.isLoading && meQuery.fetchStatus !== "paused" && !offlineAllowed && !bootstrapTimedOut) ||
        logoutMutation.isPending,
      error: meQuery.error ?? logoutMutation.error ?? null,
      startupDiagnostic,
      isAuthenticated: Boolean(activeUser),
      isAdmin: activeUser?.role === "admin",
      canManageAll: canManageAll(activeUser?.role),
    }),
    [
      activeUser,
      meQuery.error,
      meQuery.isLoading,
      meQuery.fetchStatus,
      offlineAllowed,
      bootstrapTimedOut,
      startupDiagnostic,
      logoutMutation.error,
      logoutMutation.isPending,
    ]
  );

  return {
    ...state,
    refresh: () => meQuery.refetch(),
    logout,
  };
}
