export type OfflineUser = {
  id: number;
  username: string | null;
  name: string | null;
  phone?: string | null;
  zone?: string | null;
  role: "admin" | "manager" | "field";
  active: boolean;
};

type StoredCredential = {
  username: string;
  deviceId: string;
  salt: string;
  verifier: string;
  user: OfflineUser;
};

const CREDENTIAL_KEY = "hortimax-offline-credential-v1";
const SESSION_KEY = "hortimax-offline-session-v1";
const DEVICE_KEY = "hortimax-device-id-v1";
const CHANGE_EVENT = "hortimax-offline-auth-change";
const NATIVE_SESSION_TOKEN_KEY = "hortimax-native-session-token-v1";

function available() {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

function normalizeUsername(username: string | null | undefined) {
  return username?.trim().toLowerCase() ?? "";
}

function toBase64(bytes: Uint8Array) {
  let value = "";
  for (let index = 0; index < bytes.length; index += 1) value += String.fromCharCode(bytes[index] ?? 0);
  return btoa(value);
}

function fromBase64(value: string): Uint8Array<ArrayBuffer> {
  const bytes = Uint8Array.from(atob(value), char => char.charCodeAt(0));
  return bytes as Uint8Array<ArrayBuffer>;
}

async function deriveVerifier(username: string, password: string, salt: Uint8Array<ArrayBuffer>) {
  if (!globalThis.crypto?.subtle) throw new Error("El dispositivo no permite autenticación offline segura");
  const material = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(`${normalizeUsername(username)}:${password}`),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: 120_000, hash: "SHA-256" },
    material,
    256
  );
  return toBase64(new Uint8Array(bits));
}

function emitChange() {
  if (available()) window.dispatchEvent(new Event(CHANGE_EVENT));
}

function getOrCreateDeviceId() {
  if (!available()) return "server-only";
  const existing = localStorage.getItem(DEVICE_KEY);
  if (existing) return existing;
  const created = crypto.randomUUID();
  localStorage.setItem(DEVICE_KEY, created);
  return created;
}

export async function rememberOfflineCredential(user: OfflineUser, password: string) {
  if (!available()) return;
  const salt = crypto.getRandomValues(new Uint8Array(16)) as Uint8Array<ArrayBuffer>;
  const username = normalizeUsername(user.username);
  if (!username) throw new Error("El usuario no tiene identificador válido para uso offline");
  const verifier = await deriveVerifier(username, password, salt);
  const stored: StoredCredential = {
    username,
    deviceId: getOrCreateDeviceId(),
    salt: toBase64(salt),
    verifier,
    user,
  };
  localStorage.setItem(CREDENTIAL_KEY, JSON.stringify(stored));
  emitChange();
}

export async function verifyOfflineCredential(username: string, password: string) {
  if (!available()) return null;
  try {
    const raw = localStorage.getItem(CREDENTIAL_KEY);
    if (!raw) return null;
    const stored = JSON.parse(raw) as StoredCredential;
    if (stored.username !== normalizeUsername(username) || !stored.user.active) return null;
    const verifier = await deriveVerifier(username, password, fromBase64(stored.salt));
    return verifier === stored.verifier ? stored.user : null;
  } catch {
    return null;
  }
}

export function isNetworkFailure(error: unknown) {
  const message = error instanceof Error ? error.message : String(error ?? "");
  return error instanceof TypeError || /failed to fetch|networkerror|network request failed|load failed|internet disconnected|offline/i.test(message);
}

export function hasOfflineCredential(username?: string) {
  if (!available()) return false;
  try {
    const stored = JSON.parse(localStorage.getItem(CREDENTIAL_KEY) ?? "null") as StoredCredential | null;
    return Boolean(stored && (!username || stored.username === normalizeUsername(username)));
  } catch {
    return false;
  }
}

export function getRememberedOfflineUser(username: string): OfflineUser | null {
  if (!available()) return null;
  try {
    const stored = JSON.parse(localStorage.getItem(CREDENTIAL_KEY) ?? "null") as StoredCredential | null;
    return stored?.username === normalizeUsername(username) && stored.user.active ? stored.user : null;
  } catch {
    return null;
  }
}

export function setOfflineSession(user: OfflineUser) {
  if (!available()) return;
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  emitChange();
}

export function getOfflineSession(): OfflineUser | null {
  if (!available()) return null;
  try {
    const user = JSON.parse(localStorage.getItem(SESSION_KEY) ?? "null") as OfflineUser | null;
    return user?.active ? user : null;
  } catch {
    return null;
  }
}

export function clearOfflineSession() {
  if (!available()) return;
  localStorage.removeItem(SESSION_KEY);
  emitChange();
}

export function forgetOfflineCredential() {
  if (!available()) return;
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(CREDENTIAL_KEY);
  localStorage.removeItem(DEVICE_KEY);
  localStorage.removeItem(NATIVE_SESSION_TOKEN_KEY);
  emitChange();
}

export function onOfflineAuthChange(listener: () => void) {
  if (!available()) return () => undefined;
  window.addEventListener(CHANGE_EVENT, listener);
  return () => window.removeEventListener(CHANGE_EVENT, listener);
}

export { CHANGE_EVENT };
