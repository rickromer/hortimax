import * as db from "./db";
import { GOOGLE_CONNECTION_KEY, refreshGoogleAccessToken } from "./googleOAuth";

const DRIVE_API = "https://www.googleapis.com/drive/v3";
const SHEETS_API = "https://sheets.googleapis.com/v4";
const SPREADSHEET_MIME = "application/vnd.google-apps.spreadsheet";

type DriveFile = { id?: string; webViewLink?: string; name?: string };

async function getAuthorizedHeaders() {
  const connection = await db.getGoogleConnection(GOOGLE_CONNECTION_KEY);
  if (!connection) {
    throw new Error("Un administrador debe conectar primero la cuenta personal de Google.");
  }
  const accessToken = await refreshGoogleAccessToken(connection.encryptedRefreshToken);
  return { Authorization: `Bearer ${accessToken}` };
}

function spreadsheetUrl(id: string, fromGoogle?: string) {
  return fromGoogle || `https://docs.google.com/spreadsheets/d/${id}/edit`;
}

async function findSpreadsheetForSite(siteId: number, headers: Record<string, string>) {
  const query = `appProperties has { key='hortimaxSiteId' and value='${siteId}' } and trashed=false`;
  const url = new URL(`${DRIVE_API}/files`);
  url.search = new URLSearchParams({
    q: query,
    spaces: "drive",
    fields: "files(id,webViewLink,name)",
    pageSize: "1",
  }).toString();
  const response = await fetch(url, { headers });
  if (!response.ok) throw new Error("No se pudo comprobar la planilla existente en Google Drive.");
  const payload = (await response.json()) as { files?: DriveFile[] };
  return payload.files?.[0] ?? null;
}

async function createSpreadsheetForSite(site: { id: number; name: string }, headers: Record<string, string>) {
  const response = await fetch(`${DRIVE_API}/files?fields=id,webViewLink,name`, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({
      name: `HORTIMAX · ${site.name}`.slice(0, 100),
      mimeType: SPREADSHEET_MIME,
      appProperties: { hortimaxSiteId: String(site.id), hortimaxPortal: "productores" },
    }),
  });
  const payload = (await response.json()) as DriveFile & { error?: { message?: string } };
  if (!response.ok || !payload.id) {
    throw new Error(payload.error?.message || "Google Drive no pudo crear la planilla.");
  }

  // La cabecera inicial vuelve la planilla utilizable sin copiar datos del portal.
  await fetch(`${SHEETS_API}/spreadsheets/${encodeURIComponent(payload.id)}/values/A1:E1?valueInputOption=RAW`, {
    method: "PUT",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({ values: [["Fecha y hora", "Tipo", "Detalle", "Usuario", "Visita"]] }),
  }).catch(() => undefined);

  return payload;
}

export async function createOrReuseProducerSpreadsheet(input: {
  site: { id: number; name: string };
  createdBy: number;
}) {
  const existing = await db.getSiteGoogleSheet(input.site.id);
  if (existing?.status === "ready" && existing.spreadsheetId && existing.spreadsheetUrl) return existing;
  if (existing?.status === "creating") {
    throw new Error("La planilla se está creando. Esperá unos segundos y volvé a intentarlo.");
  }

  const reservation = await db.reserveSiteGoogleSheet(input.site.id, input.createdBy);
  if (!reservation.created && reservation.sheet.status === "ready") return reservation.sheet;
  if (!reservation.created && reservation.sheet.status === "creating") {
    throw new Error("La planilla se está creando. Esperá unos segundos y volvé a intentarlo.");
  }

  try {
    const headers = await getAuthorizedHeaders();
    const fromDrive = await findSpreadsheetForSite(input.site.id, headers);
    const file = fromDrive ?? (await createSpreadsheetForSite(input.site, headers));
    if (!file.id) throw new Error("Google no devolvió el identificador de la planilla.");
    const ready = await db.markSiteGoogleSheetReady({
      siteId: input.site.id,
      spreadsheetId: file.id,
      spreadsheetUrl: spreadsheetUrl(file.id, file.webViewLink),
    });
    if (!ready) throw new Error("No se pudo guardar el enlace de la planilla.");
    return ready;
  } catch (error) {
    const message = error instanceof Error ? error.message.slice(0, 500) : "No se pudo crear la planilla.";
    await db.markSiteGoogleSheetFailed(input.site.id, message);
    throw new Error(message);
  }
}
