# Verificación del preliminar

## Mapa de Google Maps

El 22 de agosto de 2026 se verificó el componente `ClientMap` directamente en la **URL pública de la vista previa**. La comprobación aislada confirmó que el SDK de Google Maps se carga correctamente (`mapsLoaded: true`) y que el lienzo del mapa está presente (`mapCanvas: true`).

La herramienta de capturas internas usa `127.0.0.1`, un origen que el proxy de mapas rechaza, por lo que esas capturas pueden mostrar un fondo gris. Esto no afecta la vista previa pública ni el uso desde un navegador normal.

## Flujos inspeccionados

| Flujo | Evidencia verificada |
|---|---|
| GPS en vivo | `useGeolocation` usa `watchPosition` y una lectura puntual de alta precisión para actualizar latitud, longitud y precisión. |
| Nuevo sitio | El formulario exige coordenadas GPS, muestra precisión y guarda latitud/longitud mediante `sites.create`. |
| Check-in | El diálogo registra fecha/hora automática, coordenadas disponibles y una nota opcional ligada al sitio. |
| Notas | La ficha del sitio muestra cabecera de fecha/hora, categoría, autor, contenido e historial. |
| Búsqueda y filtros | Los listados de vendedor y admin envían búsqueda, zona, tipo y —en admin— vendedor al backend. |
| Navegación móvil | La vista de campo cuenta con navegación inferior fija para Mapa, Clientes y Notas. |

## Calidad técnica

- `pnpm check`: aprobado.
- `pnpm test`: 25 pruebas aprobadas en 6 archivos.
- Flujo de integración real comprobado en MariaDB aislado: crear sitio → registrar check-in → crear nota vinculada → leer detalle/planilla → validar restricción de acceso entre vendedores.
- Reasignación de cartera comprobada en MariaDB aislado: el comercial inicial pierde acceso al cliente y el comercial recién asignado obtiene acceso al detalle.
- En móvil, el botón de nuevo sitio queda separado de la navegación inferior; las notas ya no aparecen como sección independiente y se gestionan desde la ficha del cliente.
- Revisión responsive explícita: en escritorio, mapa admin, usuarios y actividad mantienen paneles y acciones sin solaparse; en móvil, el mapa reserva altura para el CTA y la navegación, y los filtros de clientes apilan el selector de comerciales a ancho completo.

| Vista verificada en escritorio | Resultado de la revisión |
|---|---|
| `/admin/mapa` | Panel lateral, filtros, selector de comerciales y control de capas ocupan zonas separadas; no se superponen. |
| `/sitios/:id` | El estado de ficha inexistente mantiene el botón de regreso por encima de la navegación inferior y sin cruces. |
| `/admin/clientes/:id` | El estado de carga y la estructura de ficha respetan el panel lateral sin invadir el contenido. |
| `/admin/usuarios` | Botón de alta, tabla y acción de acceso mantienen columnas y espaciado legible. |
| `/admin/actividad` | Tarjetas, exportación de check-ins y lista de visitas quedan en filas independientes; no hay panel global de notas. |

## Puntos y selección de ubicación

- `ClientMap` registra el evento nativo `click` de Google Maps y convierte el `latLng` en coordenadas validadas.
- En modo **Elegir en mapa**, `FieldMap` toma esas coordenadas, muestra el pin temporal, abre el formulario y marca la fuente como **ubicación manual**.
- Las coordenadas tipeadas admiten coma decimal, se validan por rango geográfico y se cubren con pruebas unitarias, junto con los enlaces de Google Maps, Waze y WhatsApp.

## Selector centrado de ubicación

- **Nuevo punto** abre el selector sin solicitar previamente GPS ni requerir tocar una zona puntual del mapa.
- El pin permanece fijo en el centro; el evento `idle` de Google Maps actualiza la coordenada central cuando el usuario arrastra o hace zoom.
- **Usar esta ubicación** devuelve esa coordenada al formulario como ubicación manual; **Mi ubicación** recentra opcionalmente el selector mediante GPS.

## Marca HORTIMAX y agenda de relevamientos

- Se verificó el logo HORTIMAX proporcionado (940 × 174 px) y se publicó como activo estático administrado en los encabezados de campo, acceso y administración.
- La identidad visible ahora es **Portal de Seguimiento a Clientes**; el panel administrativo muestra también la agenda global de próximos relevamientos.
- La integración real de MariaDB aislada cubre cliente → check-in → nota → próximo relevamiento → lectura en detalle, incluidos los permisos de cartera.

## Consulta pública temporal

- La vista previa sin cookie de sesión abre directamente el mapa centrado en Paraguay y no muestra el formulario de acceso ni acciones de alta o check-in.
- El listado `/sitios` abre sin credenciales, permite búsqueda y filtros, y oculta alta, exportación y check-in; en una cartera vacía muestra solo el estado de consulta.
- Tipos, compilación y 37 pruebas automatizadas pasaron; se comprueba que los procedimientos públicos permiten leer, mientras la creación de puntos sin sesión responde `UNAUTHORIZED`.

## Carga pública temporal

- El encabezado móvil conserva solamente la marca HORTIMAX y el botón flotante de alta se presenta como `+`, separado de la navegación inferior.
- Las altas sin sesión crean puntos marcados con `publicSubmission=true`; una acción exclusivamente administrativa elimina solo esos puntos junto con sus check-ins, notas, relevamientos y asignaciones vinculadas.
- Una integración real de MariaDB aislada verificó la creación pública, el marcado temporal y la limpieza administrativa sin afectar un punto interno existente.
- Prueba interactiva sin sesión: el botón flotante `+` abrió `LocationPickerDialog` sobre la navegación inferior; al confirmar la ubicación manual, se abrió el formulario **Nuevo punto de cliente** con sus coordenadas preseleccionadas.
- Prueba completa sin sesión: se registró desde la interfaz el punto temporal `Punto UI público temporal 20260824`, se confirmó el mensaje de éxito y la aparición en el mapa; luego se eliminó únicamente ese punto y una consulta verificó que quedaron `0` registros coincidentes.

## Incidencia de acceso

- Los registros de producción no muestran errores de aplicación ni despliegue fallido; el servicio se reinició correctamente y solo registra solicitudes sin cookie de sesión, coherentes con el modo público temporal.
- Tras la sincronización/reinicio, la raíz publicada `mapaclientes-cqpci7xz.manus.space` respondió HTTP 200 y la vista previa también respondió HTTP 200. La causa probable fue una indisponibilidad transitoria durante la sincronización del servidor de desarrollo, no un error persistente de la aplicación publicada.
- Capturas revisadas en escritorio y móvil para panel de administración, clientes, notas, perfil y usuarios.

## Selector, satélite y zona automática

- El selector de ubicación se comprobó de forma interactiva en viewport móvil: el diálogo ocupa exactamente el ancho y alto disponibles (`500 × 701 px`), con pin fijo al centro.
- La alternancia **Satélite / Mapa** cambia correctamente el tipo de Google Maps dentro del selector.
- La geocodificación inversa detectó `Villa Hayes` desde el centro del pin. La regla aplicada prioriza distrito, después municipio/localidad y finalmente departamento; la zona se transfiere al campo editable del formulario.
- El formulario muestra los ejemplos **Invernadero López** y **Productor · planta 10.000 plantas de tomate · usa insumos**. La suite incluye pruebas de la regla territorial y finaliza con 41 pruebas aprobadas.
