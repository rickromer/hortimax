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
- `pnpm test`: 18 pruebas aprobadas en 4 archivos.
- Capturas revisadas en escritorio y móvil para panel de administración, clientes, notas, perfil y usuarios.
