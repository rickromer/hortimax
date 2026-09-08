import { Capacitor, CapacitorHttp } from "@capacitor/core";

export const NATIVE_HTTP_TIMEOUT_MS = 12_000;

/** Evita que un puente HTTP nativo sin respuesta bloquee el arranque de sesión. */
export async function awaitWithTimeout<T>(promise: Promise<T>, timeoutMs = NATIVE_HTTP_TIMEOUT_MS): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error("La conexión del dispositivo tardó demasiado.")), timeoutMs);
      }),
    ]);
  } finally {
    if (timeoutId !== undefined) clearTimeout(timeoutId);
  }
}

/**
 * Envía únicamente las peticiones de la API de la app mediante la pila HTTP
 * nativa de Android. Así el APK no depende del CORS ni de las cookies del
 * WebView para autenticar el acceso al portal publicado.
 */
export async function nativeMobileFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  if (!Capacitor.isNativePlatform()) return globalThis.fetch(input, init);

  const request = input instanceof Request ? input : new Request(input, init);
  const headers = Object.fromEntries(request.headers.entries());
  headers["X-Hortimax-Client"] = "android";
  const allowsBody = !["GET", "HEAD"].includes(request.method.toUpperCase());
  const body = allowsBody ? await request.text() : undefined;
  if (allowsBody && !headers["content-type"]) headers["content-type"] = "application/json";
  let data: unknown = body || undefined;
  if (body && headers["content-type"]?.includes("application/json")) {
    try {
      data = JSON.parse(body);
    } catch {
      // El cuerpo no es JSON; Capacitor lo enviará como texto.
    }
  }
  const result = await awaitWithTimeout(
    CapacitorHttp.request({
      url: request.url,
      method: request.method,
      headers,
      data,
      responseType: "text",
    })
  );

  return new Response(typeof result.data === "string" ? result.data : JSON.stringify(result.data ?? null), {
    status: result.status,
    headers: result.headers,
  });
}
