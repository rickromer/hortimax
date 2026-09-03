import { Capacitor } from "@capacitor/core";

const NATIVE_SESSION_TOKEN_KEY = "hortimax-native-session-token-v1";

export function isNativeAndroidApp() {
  return Capacitor.isNativePlatform();
}

export function saveNativeSessionToken(token: string | null | undefined) {
  if (!token || !isNativeAndroidApp()) return;
  try {
    localStorage.setItem(NATIVE_SESSION_TOKEN_KEY, token);
  } catch {
    // El acceso con cookie continúa siendo el respaldo para navegadores comunes.
  }
}

export function getNativeSessionToken() {
  if (!isNativeAndroidApp()) return null;
  try {
    return localStorage.getItem(NATIVE_SESSION_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function clearNativeSessionToken() {
  try {
    localStorage.removeItem(NATIVE_SESSION_TOKEN_KEY);
  } catch {
    // localStorage no está disponible durante SSR ni en navegadores restringidos.
  }
}
