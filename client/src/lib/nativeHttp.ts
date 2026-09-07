import { Capacitor, CapacitorHttp } from "@capacitor/core";

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
  const result = await CapacitorHttp.request({
    url: request.url,
    method: request.method,
    headers,
    data: body || undefined,
    responseType: "text",
  });

  return new Response(typeof result.data === "string" ? result.data : JSON.stringify(result.data ?? null), {
    status: result.status,
    headers: result.headers,
  });
}
