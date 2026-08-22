import { useCallback, useEffect, useRef, useState } from "react";

export type Position = {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
};

type State = {
  position: Position | null;
  error: string | null;
  loading: boolean;
  supported: boolean;
};

/** Seguimiento continuo del GPS del dispositivo. */
export function useGeolocation(options?: { watch?: boolean }) {
  const watch = options?.watch ?? true;
  const watchIdRef = useRef<number | null>(null);
  const [state, setState] = useState<State>({
    position: null,
    error: null,
    loading: true,
    supported: typeof navigator !== "undefined" && "geolocation" in navigator,
  });

  const handleSuccess = useCallback((pos: GeolocationPosition) => {
    setState(prev => ({
      ...prev,
      loading: false,
      error: null,
      position: {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        accuracy: Math.round(pos.coords.accuracy),
        timestamp: pos.timestamp,
      },
    }));
  }, []);

  const handleError = useCallback((err: GeolocationPositionError) => {
    const messages: Record<number, string> = {
      1: "Permiso de ubicación denegado. Activalo en el navegador para registrar sitios.",
      2: "No se pudo obtener la ubicación. Verificá el GPS.",
      3: "La búsqueda de ubicación tardó demasiado.",
    };
    setState(prev => ({
      ...prev,
      loading: false,
      error: messages[err.code] ?? "No se pudo obtener la ubicación.",
    }));
  }, []);

  useEffect(() => {
    if (!state.supported || !watch) return;
    const id = navigator.geolocation.watchPosition(handleSuccess, handleError, {
      enableHighAccuracy: true,
      maximumAge: 10000,
      timeout: 20000,
    });
    watchIdRef.current = id;
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [handleError, handleSuccess, state.supported, watch]);

  /** Solicita una lectura puntual de alta precisión. */
  const request = useCallback(() => {
    if (!state.supported) {
      setState(prev => ({ ...prev, error: "Este dispositivo no soporta GPS." }));
      return Promise.resolve<Position | null>(null);
    }
    setState(prev => ({ ...prev, loading: true }));
    return new Promise<Position | null>(resolve => {
      navigator.geolocation.getCurrentPosition(
        pos => {
          handleSuccess(pos);
          resolve({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: Math.round(pos.coords.accuracy),
            timestamp: pos.timestamp,
          });
        },
        err => {
          handleError(err);
          resolve(null);
        },
        { enableHighAccuracy: true, maximumAge: 0, timeout: 20000 }
      );
    });
  }, [handleError, handleSuccess, state.supported]);

  return { ...state, request };
}

