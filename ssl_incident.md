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
