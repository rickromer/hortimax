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
- Capturas revisadas en escritorio y móvil para panel de administración, clientes, notas, perfil y usuarios.
