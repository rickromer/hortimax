# HORTIMAX offline y APK Android

## Qué funciona sin señal

La aplicación precarga en IndexedDB toda la cartera permitida por el rol, sus fichas y el calendario operativo. También conserva las operaciones nuevas de campo: nuevos puntos, notas, visitas y próximos relevamientos. Si el envío comienza con señal y la conexión se corta durante la petición, la operación se guarda localmente. Al recuperar Internet, el sincronizador reintenta en orden y utiliza `clientRequestId` para no duplicar registros.

El APK incluye un paquete vectorial local de Paraguay basado en OpenStreetMap/Geofabrik, con carreteras, ciudades, límites, agua y referencias entre zoom 0 y 14. Los clientes sincronizados se superponen sobre ese mapa. Cuando hay conexión, el portal vuelve a Google Maps; la búsqueda de lugares, geocodificación y planillas de Google siguen requiriendo Internet.

## Instalación PWA

En Android, abrir el dominio publicado en Chrome, iniciar sesión con el usuario del portal y elegir **Instalar aplicación** o **Agregar a pantalla principal**. La PWA conserva la carcasa y el almacenamiento local del dispositivo. Cada vendedor debe abrir previamente los clientes que necesite consultar durante la jornada para que sus datos queden disponibles offline.

## APK compilado

Se generó un APK de prueba instalable con identificador `py.hortimax.portal`, firmado con la clave de depuración de Android. Incluye el PMTiles de Paraguay sin compresión ZIP para permitir lectura aleatoria local. El instalador final ocupa aproximadamente 173 MiB.

Para instalarlo, descargar el archivo en el teléfono, abrirlo y autorizar temporalmente **Instalar aplicaciones desconocidas** para el navegador o administrador de archivos usado. Android puede mostrar una advertencia porque no proviene de Play Store; revisar el nombre **HORTIMAX** y continuar. Después de instalar, abrirlo una vez con Internet, iniciar sesión y esperar el aviso de datos offline listos antes de salir a campo.

Esta firma es apropiada para pruebas internas. Para distribución estable y actualizaciones a largo plazo se debe generar una clave de firma de producción bajo control de HORTIMAX y conservarla respaldada.

## Recompilación reproducible

El repositorio contiene el proyecto Android de Capacitor y la configuración `py.hortimax.portal`. El comando `pnpm cap:sync` compila el portal con la API pública, sincroniza los recursos y copia el PMTiles externo en `android/app/src/main/assets/public/offline/`. En una computadora con Android Studio, SDK Android y una clave de firma, ejecutar:

```bash
pnpm install
pnpm cap:sync
pnpm cap open
```

Desde Android Studio se puede ejecutar en un dispositivo o generar un APK firmado desde **Build → Generate Signed Bundle / APK**. La compilación actual se verificó con Android SDK 36, Build Tools 36.0.0 y Java 21.

Para cambiar de servidor en una futura migración, usar `VITE_PORTAL_API_URL` al ejecutar `pnpm cap:sync`. El APK debe apuntar a una API HTTPS pública para sincronizar cuando vuelva la señal.

## Prueba de campo recomendada

Con Internet, iniciar sesión y esperar la precarga automática de la cartera. Luego activar modo avión, cerrar y reabrir el APK, navegar por el mapa local, abrir un cliente, cargar una nota, un check-in y un próximo relevamiento. Finalmente desactivar modo avión, esperar el indicador de sincronización y confirmar los registros en la ficha y en Administración. Repetir con un nuevo punto; el GPS del teléfono no necesita datos móviles, aunque la precisión depende del dispositivo y del cielo disponible.
