# Verificación de corrección APK v5

## Autenticación desde Android

El instalador ejecutaba la interfaz desde el origen local de Capacitor y llamaba a la API publicada desde otro origen. El backend no respondía el preflight CORS para `http://localhost`, por lo que fallaba incluso la verificación pública de usuario. Se habilitó CORS con credenciales únicamente para `http://localhost`, `https://localhost` y `capacitor://localhost`, sin abrir la API a otros orígenes.

Después de validar la contraseña, el servidor entrega una credencial de sesión exclusivamente a la aplicación Android identificada. Esta se guarda por instalación y se envía como Bearer token; la web no recibe ese campo y el logout la elimina. El preflight local confirmó HTTP 204, origen permitido y credenciales habilitadas.

## Marca original

El isologo original fue copiado sin modificación desde el archivo aportado por el usuario y empaquetado en `assets/public/offline/hortimax-logo-original.png`. La huella SHA-256 coincide con la del archivo fuente.

## Validación técnica

El APK v5 ocupa 149 MB y su SHA-256 es `c889f70549f535a14ce5f0a4783a84d3b19c0c25cc655bc7e4e892d558f1f758`. La suite aprobó **101 pruebas** en 36 archivos, con una integración opcional omitida; el chequeo de tipos, build web y Gradle Android aprobaron. Falta probar el login y el logo en el teléfono físico.
