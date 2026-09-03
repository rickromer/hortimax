import { access, copyFile, mkdir, stat } from "node:fs/promises";
import path from "node:path";

const projectRoot = path.resolve(import.meta.dirname, "..");
const logoSource = "/home/ubuntu/webdev-static-assets/hortimax-logo-original.png";
const logoDestination = path.join(projectRoot, "android/app/src/main/assets/public/offline/hortimax-logo-original.png");

try {
  await access(logoSource);
} catch {
  throw new Error(
    `No se encontró el isologo original en ${logoSource}.`
  );
}

await mkdir(path.dirname(logoDestination), { recursive: true });
await copyFile(logoSource, logoDestination);
console.log(`Isologo original listo para Android: ${logoDestination}`);
