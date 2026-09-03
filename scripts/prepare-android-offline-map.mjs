import { access, copyFile, mkdir, stat } from "node:fs/promises";
import path from "node:path";

const projectRoot = path.resolve(import.meta.dirname, "..");
const source = process.env.HORTIMAX_OFFLINE_MAP_SOURCE
  ? path.resolve(process.env.HORTIMAX_OFFLINE_MAP_SOURCE)
  : "/home/ubuntu/webdev-static-assets/paraguay-mapsforge-v5.map";
const destination = path.join(
  projectRoot,
  "android/app/src/main/assets/public/offline/paraguay.map"
);

try {
  await access(source);
} catch {
  throw new Error(
    `No se encontró el mapa offline en ${source}. Definí HORTIMAX_OFFLINE_MAP_SOURCE con la ruta del mapa mapsforge completo de Paraguay.`
  );
}

await mkdir(path.dirname(destination), { recursive: true });
await copyFile(source, destination);
const info = await stat(destination);
if (info.size < 100_000_000 || info.size > 250_000_000) {
  throw new Error(`El paquete offline tiene un tamaño inesperado: ${info.size} bytes`);
}
console.log(`Mapa offline listo para Android: ${destination} (${info.size} bytes)`);
