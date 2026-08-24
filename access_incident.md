# Incidencia temporal de acceso

**Fecha de verificación:** 24 de agosto de 2026.

Durante una sincronización de la vista previa, se reportó que el portal no era accesible. Se reinició el servidor de desarrollo para sincronizar el estado compartido y se revisaron los registros de producción. No hubo errores de aplicación, caídas de proceso ni despliegues fallidos; los únicos mensajes fueron solicitudes sin cookie de sesión, coherentes con el modo de consulta pública temporal.

La acción correctiva fue el reinicio/sincronización del servidor de desarrollo. El resultado final fue comprobado mediante solicitudes externas: la raíz publicada `https://mapaclientes-cqpci7xz.manus.space/` y la vista previa respondieron **HTTP 200**. La causa probable fue una indisponibilidad transitoria durante la sincronización, sin evidencia de un fallo persistente del portal publicado.
