# HORTIMAX offline y APK Android

## Qué funciona sin señal

La aplicación guarda en el dispositivo los clientes y fichas consultados recientemente, además de las operaciones nuevas de campo: nuevos puntos, notas, visitas y próximos relevamientos. Si el envío comienza con señal y la conexión se corta durante la petición, la operación también se conserva localmente. Al recuperar Internet, el sincronizador reintenta en orden y utiliza `clientRequestId` para no duplicar registros.

El mapa de Google, la búsqueda de lugares y la geocodificación necesitan conexión. La ficha y los datos previamente sincronizados sí pueden abrirse offline. Las planillas de Google se abren cuando existe conexión y acceso válido al archivo.

## Instalación PWA

En Android, abrir el dominio publicado en Chrome, iniciar sesión con el usuario del portal y elegir **Instalar aplicación** o **Agregar a pantalla principal**. La PWA conserva la carcasa y el almacenamiento local del dispositivo. Cada vendedor debe abrir previamente los clientes que necesite consultar durante la jornada para que sus datos queden disponibles offline.

## Preparación del APK

El repositorio ahora contiene el proyecto Android de Capacitor y la configuración `py.hortimax.portal`. El comando `pnpm cap:sync` compila el portal con la API pública y sincroniza los recursos con `android/`. En una computadora con Android Studio, SDK Android y una clave de firma, ejecutar:

```bash
pnpm install
pnpm cap:sync
pnpm cap open
```

Desde Android Studio se puede ejecutar en un dispositivo o generar un APK firmado desde **Build → Generate Signed Bundle / APK**. El entorno de desarrollo actual no tiene Android SDK, Gradle ni una clave de firma, por lo que no se afirma que exista todavía un APK binario descargable; sí queda preparado el proyecto fuente reproducible para generarlo.

Para cambiar de servidor en una futura migración, usar `VITE_PORTAL_API_URL` al ejecutar `pnpm cap:sync`. El APK debe apuntar a una API HTTPS pública para sincronizar cuando vuelva la señal.

## Prueba de campo recomendada

Con Internet, iniciar sesión, abrir algunos clientes y crear una nota de prueba. Luego activar modo avión, abrir un cliente previamente consultado, cargar una nota, un check-in y un próximo relevamiento, y cerrar la pantalla. Finalmente desactivar modo avión, esperar el indicador de sincronización y confirmar los registros en la ficha y en Administración. Repetir con un nuevo punto si el dispositivo permite conservar coordenadas durante el modo avión.
