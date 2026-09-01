import { trpc } from "@/lib/trpc";
import { canManageAll } from "@shared/permissions";
import { TRPCClientError } from "@trpc/client";
import { forgetOfflineCredential, getOfflineSession, onOfflineAuthChange } from "@/lib/offlineAuth";
import { useCallback, useEffect, useMemo, useState } from "react";

/**
 * Estado de autenticación de la app. El acceso es con usuario y contraseña
 * propios (sin OAuth): la sesión vive en una cookie firmada por el servidor.
 */
export function useAuth() {
  const utils = trpc.useUtils();
  const [offlineSession, setOfflineSession] = useState(() => getOfflineSession());

  useEffect(() => onOfflineAuthChange(() => setOfflineSession(getOfflineSession())), []);

  const meQuery = trpc.auth.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (meQuery.data) setOfflineSession(meQuery.data);
  }, [meQuery.data]);

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

  const state = useMemo(
    () => ({
      user: activeUser,
      loading: (meQuery.isLoading && !offlineAllowed) || logoutMutation.isPending,
      error: meQuery.error ?? logoutMutation.error ?? null,
      isAuthenticated: Boolean(activeUser),
      isAdmin: activeUser?.role === "admin",
      canManageAll: canManageAll(activeUser?.role),
    }),
    [
      activeUser,
      meQuery.error,
      meQuery.isLoading,
      offlineAllowed,
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
