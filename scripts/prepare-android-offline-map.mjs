import { access, copyFile, mkdir, stat } from "node:fs/promises";
import path from "node:path";

const projectRoot = path.resolve(import.meta.dirname, "..");
const logoSource = "/home/ubuntu/webdev-static-assets/hortimax-logo-original.png";
const logoDestination = path.join(projectRoot, "android/app/src/main/assets/public/offline/hortimax-logo-original.png");
const mapSource = process.env.HORTIMAX_OFFLINE_MAP_SOURCE || "/home/ubuntu/webdev-static-assets/paraguay-shortbread-1.0.pmtiles";
const mapDestination = path.join(projectRoot, "android/app/src/main/assets/public/offline/paraguay-shortbread-1.0.pmtiles");

try {
  await access(logoSource);
} catch {
  throw new Error(
    `No se encontró el isologo original en ${logoSource}.`
  );
}

await mkdir(path.dirname(logoDestination), { recursive: true });
await copyFile(logoSource, logoDestination);
try {
  await access(mapSource);
} catch {
  throw new Error(`No se encontró el paquete PMTiles offline en ${mapSource}.`);
}
await copyFile(mapSource, mapDestination);
const mapInfo = await stat(mapDestination);
if (mapInfo.size < 150_000_000 || mapInfo.size > 250_000_000) {
  throw new Error(`El paquete offline tiene un tamaño inesperado: ${mapInfo.size} bytes.`);
}
console.log(`Isologo y mapa offline listos para Android: ${mapInfo.size} bytes de cartografía de Paraguay.`);
