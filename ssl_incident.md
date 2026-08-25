# Incidencia de disponibilidad — dominio publicado

Fecha de comprobación: 25 de agosto de 2026.

El navegador confirmó que `https://mapaclientes-cqpci7xz.manus.space/` no completa la conexión HTTPS y muestra `ERR_SSL_PROTOCOL_ERROR`. La petición desde línea de comandos también falla antes de recibir una respuesta HTTP con un error de protocolo TLS.

Esto sucede antes de que se descargue la aplicación, por lo que no es causado por las pantallas de login, calendario, edición o permisos. La vista previa local continuó ejecutándose y las comprobaciones de tipos, pruebas y compilación completaron correctamente. Se debe esperar/reintentar la provisión del certificado y del proxy del dominio publicado.

## Recuperación

Tras esperar la propagación del certificado, el navegador volvió a abrir correctamente `https://mapaclientes-cqpci7xz.manus.space/`. La conexión HTTPS se completó y la página mostró el formulario **Ingresá a tu cuenta**, con el campo Usuario y el botón Continuar. La indisponibilidad fue, por tanto, transitoria y se resolvió en la capa de certificado/proxy del dominio publicado.

La vista previa también se verificó después de la recuperación: `/acceso` carga el formulario completo de **Configuración inicial** para crear la cuenta de administrador. No se aplicó un cambio de código para recuperar la conexión; la recuperación dependió de que el certificado/proxy externo terminara de propagarse.

## Nueva comprobación

En la comprobación posterior, el dominio volvió a abrir con HTTPS y mostró la pantalla **Ingresá a tu cuenta**. Al ingresar el usuario administrativo `rickromer`, el formulario dejó visible el estado de carga de Continuar. Se debe confirmar si la consulta de verificación de usuario finaliza correctamente o queda pendiente, pues esa diferencia explica que el usuario perciba el sitio como no funcional aun cuando el dominio responde.

La verificación terminó correctamente y reconoció la cuenta, mostrando **Hola, RICARDO** y el campo de contraseña. El portal no está bloqueado: desde la activación del acceso por usuario y contraseña, el mapa solo se abre después de iniciar sesión. La incidencia reportada en esta comprobación se atribuye a la nueva pantalla de acceso obligatoria, no a un fallo de TLS, proxy o aplicación.

## Comprobación de Chrome posterior

La revisión actual en Chromium abrió `https://mapaclientes-cqpci7xz.manus.space/` con HTTPS, carga del mapa satelital híbrido, los controles **Nuevo punto**, **Mi ubicación** y la navegación de campo. No se detectaron errores en la consola del navegador. Por lo tanto, el enlace publicado está respondiendo correctamente en la comprobación actual; si el error persiste en el equipo del usuario, se requiere el texto o captura exacta de la pantalla de Chrome para distinguir una caché/red local de un problema transitorio del certificado.

## Diagnóstico de NXDOMAIN

El diagnóstico posterior comprobó que el dominio se resuelve desde tres fuentes independientes: el resolvedor local y los resolvedores públicos de Google y Cloudflare devolvieron `104.19.168.112` y `104.19.169.112`, con estado DNS correcto. Esto confirma que no existe un registro DNS faltante en este momento. El `DNS_PROBE_FINISHED_NXDOMAIN` reportado por Chrome corresponde, con alta probabilidad, a una caché DNS negativa o un resolvedor de la red local que aún no se actualizó.

El usuario confirmó posteriormente que el acceso se normalizó. No fue necesaria una escalación de plataforma: la resolución pública se estabilizó y la comprobación publicada volvió a abrir mapa, clientes y calendario.
