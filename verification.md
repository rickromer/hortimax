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

## Corrección de pantalla completa del selector

- Se eliminó el contenedor de diálogo de Radix y se reemplazó por una capa renderizada directamente sobre `document.body`, con `fixed inset-0` y bloqueo de scroll de fondo.
- La comprobación interactiva móvil confirma que el selector cubre exactamente el viewport disponible (`500 × 701 px`), sin transformación de centrado, márgenes ni recuadro externo; el mapa, pin, satélite y acciones quedan dentro de esa capa.

## Identidad corporativa y mapa satelital

- La muestra corporativa confirma cuatro acentos: amarillo, rojo, verde y turquesa. Se aplicaron como tokens de interfaz, franja de marca, pines y estados de mapa.
- El modo satelital usa la capa híbrida de Google Maps para conservar referencias: imágenes, rutas, nombres y lugares. Los iconos de lugar se habilitaron para permitir interacción con referencias nativas del mapa.
- El panel **Capas y referencias** fue probado de forma interactiva: muestra Satélite, Mapa vial, leyenda con Productor, Revendedor, Cooperativa y Acopio, además de la explicación de rutas y lugares.
- Revisión de escritorio: la franja corporativa recorre los encabezados con los cuatro colores, mientras el mapa híbrido presenta imágenes satelitales con nombres, rutas, límites y lugares visibles. El panel desplegado mantiene contraste suficiente sobre el mapa y separa claramente capas, leyenda y acciones.

## Referencias del selector de ubicación

- El selector dejó de usar `satellite` puro y ahora alterna entre Mapa vial y **Satélite + lugares** (Google Maps `hybrid`).
- La verificación interactiva confirma que, sobre la imagen aérea, se conservan rutas, nombres de lugares e íconos de referencias cercanas; el control cambia a **Mapa vial** al activar el modo híbrido.
- La captura de verificación del selector híbrido muestra explícitamente la etiqueta **DRQProducciones** y su ícono azul de lugar de Google Maps sobre la imagen aérea. También se ven referencias adicionales por iconos circulares y la escala de Google, elementos ausentes en la vista satelital pura reportada inicialmente.
- En la captura de comprobación del selector híbrido se ve la etiqueta de lugar **DRQProducciones** junto con su ícono azul de Google Maps, además de marcadores circulares de referencias cercanas y la atribución/escala de Google. Estas referencias no estaban disponibles en el modo satelital puro reportado por el usuario.

## Notas, historial y recordatorios

- La ficha de cliente ahora permite añadir notas sin sesión en el modo público. Cada nota se persiste con `createdAt` del servidor y se muestra en el **Historial de notas** con fecha y hora automáticas.
- El botón **Sheets** descarga un CSV UTF-8 con BOM y columnas de fecha/hora, cliente, zona, categoría, nota y autor; el archivo se puede abrir o importar directamente en Google Sheets.
- La agenda incorpora tipo **Recordatorio**, además de Visita y Atención. La integración real de MariaDB aislada validó nota pública, recordatorio público tipificado y permisos de cartera; la prueba de interfaz verificó nota → historial y recordatorio → agenda, y el punto temporal fue eliminado después.
- Validación de escritorio: desde la ficha pública se cargó una nota, se verificó su presencia inmediata en Historial de notas con cabecera de fecha/hora, y se agendó un Recordatorio que apareció en Próximos. El botón **Sheets** invocó la exportación y confirmó “Planilla descargada. Podés abrirla o importarla en Google Sheets.”; el endpoint devuelve CSV UTF-8 con los campos de la planilla.
- Confirmación física de exportación: una interacción de mouse real sobre **Sheets** descargó `notas-punto-qa-escritorio-notas-20260825.csv`. El archivo contiene BOM UTF-8 y la cabecera `Fecha y hora, Cliente, Zona, Categoría, Nota, Registrado por`, por lo que está listo para abrirse o importarse en Google Sheets.

### Evidencia final de escritorio

- En la ficha pública de prueba se creó una nota y apareció de inmediato dentro de **Historial de notas**, con la cabecera automática de fecha y hora.
- En la pestaña **Próximos** se agendó un elemento de tipo **Recordatorio** y se confirmó su aparición en la agenda.
- Con un gesto real de mouse sobre **Sheets**, Chrome descargó el CSV de la planilla; se comprobó su nombre, su BOM UTF-8 y sus columnas compatibles con Google Sheets.

## Nota con visita y geolocalización

- La creación de una nota incorpora la casilla **Registrar también como visita**. Al activarla, una única operación guarda la nota y un check-in vinculado, con fecha/hora del servidor, comentario de visita y coordenadas/distancia cuando el GPS está disponible.
- La integración real de MariaDB aislada validó la nota pública con visita vinculada. La comprobación móvil mostró que la nota se inserta en el historial y que la pestaña Visitas aumenta y presenta **Visita registrada desde nota**.
- El mapa general solicita geolocalización al abrirse, centra la primera lectura GPS y expone el control **Mi ubicación** sin necesidad de sesión. La comprobación en navegador automatizado verificó el control; la concesión de GPS debe confirmarse en el celular físico, donde el navegador muestra el permiso real.
- Validación de escritorio: se ingresó una nota con la casilla **Registrar también como visita** activa; la nota apareció inmediatamente en Historial de notas, la pestaña pasó a **Visitas (1)** y el registro de visita mostró el texto **Visita registrada desde nota**.

### Evidencia persistida de escritorio

- La automatización de escritorio devolvió `created.ok=true`, `noteVisible=true`, `historyVisible=true`, `visitsTab='Visitas (1)'` y `visitVisible=true` para el flujo completo **nota → visita vinculada**.
- El punto temporal de validación se eliminó después de comprobar ambos registros, sin afectar los datos existentes del portal.

## Categoría Visita técnica

- Se actualizó el valor por defecto y el catálogo persistido para reemplazar **Aplicación** por **Visita técnica**.
- La ficha pública ahora carga el catálogo aun sin sesión y dispone de categorías de respaldo para evitar un selector vacío. La verificación de interfaz abrió el selector y confirmó las opciones: Visita técnica, Visita comercial, Pedido, Entrega, Reclamo y Otro; **Aplicación** ya no aparece.
- La ayuda del campo de nota fue actualizada a “Ej. Visita técnica al invernadero, se relevó cultivo de tomate”.

## Favicon HORTIMAX

- Se generó un favicon cuadrado basado en el isologo geométrico multicolor de HORTIMAX, sin el wordmark, para conservar legibilidad en pestañas y accesos móviles.
- El favicon se integró tanto en `rel="icon"` como en `apple-touch-icon` de la cabecera del portal mediante el activo administrado del proyecto.
- Revisión visual: el archivo PNG final (1920 × 1920 px) conserva el símbolo HORTIMAX con sus cuatro trazos amarillo, turquesa, rojo y verde sobre fondo blanco; la vista previa referencia el activo dos veces, una por cada relación de icono.
- Navegador: el activo del favicon respondió correctamente como imagen PNG de 1920 × 1920 px y el portal publicado expone las relaciones `icon` y `apple-touch-icon` hacia `/manus-storage/hortimax-favicon_6236a44b.png`.
- Tras el despliegue exitoso, el dominio publicado volvió a cargar el portal y el activo de favicon permanece disponible desde el almacenamiento administrado para las dos relaciones de icono.
- Verificación de documento publicada: la inspección de `document.head` desde el navegador confirmó exactamente las relaciones `rel="icon"` y `rel="apple-touch-icon"`, ambas resueltas a `https://mapaclientes-cqpci7xz.manus.space/manus-storage/hortimax-favicon_6236a44b.png`.
- Evidencia visual directa: el favicon final es un activo WebP de 1920 × 1920 px con fondo blanco y cuatro trazos redondeados claramente distinguibles: amarillo a la izquierda, turquesa en la diagonal superior, rojo en la diagonal inferior y verde a la derecha.
- Referencia visual persistente: [`favicon_evidence.md`](./favicon_evidence.md) incorpora la imagen del activo final publicado, su URL y la descripción de cada uno de los cuatro trazos para revisión futura.

## Agrupación por departamento político

- El modelo de clientes ahora separa `department` como división política principal de `zone`, que queda reservada para distrito, municipio, localidad o referencia comercial.
- La migración agregó el índice de departamento y corrigió los datos existentes: **Comite de Productores RI3** conserva `R. I. Tres Corrales` como referencia local y queda asignado al departamento **Caaguazú**. Los demás valores que repetían el departamento se dejaron vacíos como localidad para evitar etiquetas duplicadas.
- Los filtros de campo, clientes administrativos y mapa administrativo usan **Departamento**; las tarjetas y fichas presentan primero el departamento y, solo si existe, el distrito o municipio como dato secundario.
- La suite aprobó `pnpm check` y 46 pruebas automatizadas (1 integración opcional omitida); la compilación de producción fue exitosa. Las capturas responsive verificaron el filtro Departamento y las tarjetas de R.I. 3 Corrales bajo Caaguazú en móvil y escritorio.

## Calendario público del equipo

- Se añadió el tercer acceso fijo **Calendario** al menú inferior de campo, junto a Mapa y Clientes.
- La ruta `/calendario` consolidada está disponible para toda persona con sesión, sin filtro de usuario o cartera; cada registro enlaza directamente a la ficha del cliente.
- La agenda ordena los registros por fecha, los agrupa por día y distingue visualmente Visita realizada, Próxima visita/Recordatorio/Atención y Nota; muestra autor, fecha/hora, distancia cuando existe y ubicación Departamento · localidad.
- La prueba de calendario confirma que la consulta pública no aplica filtro de cartera y solicita las tres fuentes globales. `pnpm check`, 47 pruebas automatizadas (1 integración opcional omitida) y la compilación de producción aprobaron. Las capturas verificaron la agenda con actividad real y la barra móvil de tres accesos.
- Si la consulta pública falla, Calendario presenta un mensaje visible de error y la acción **Reintentar**; la prueba de estado confirma que un fallo no se confunda con una agenda vacía. Tras esta cobertura, `pnpm check`, 49 pruebas automatizadas (1 integración opcional omitida) y la compilación aprobaron.
- La prueba interactiva del componente simula `trpc.calendar.timeline` en error, confirma el mensaje de fallo y pulsa **Reintentar**, verificando que ejecuta `refetch()`.

## Corrección de centrado en Nuevo punto

- El selector toma la ubicación inicial solo al abrirse. Las lecturas GPS posteriores del mapa general ya no cambian el foco mientras el selector permanece abierto y el usuario mueve manualmente el mapa.
- La acción **Mi ubicación** sigue siendo el único modo explícito de recentrar el selector con GPS después de abrirlo.
- Una prueba interactiva de DOM abre el selector con una posición, simula una actualización GPS distinta y confirma que `ClientMap` conserva el foco inicial. `pnpm check`, 53 pruebas automatizadas (1 integración opcional omitida) y la compilación aprobaron. Falta la confirmación física final en teléfono y computadora.

## Acceso, edición y privilegios

- El acceso por **usuario y contraseña** quedó habilitado en `/acceso`; las rutas de mapa, clientes y calendario exigen una sesión iniciada.
- La cuenta administrativa existente sin credenciales se conserva. En el primer acceso se muestra **Configuración inicial** para que el propietario defina su usuario y contraseña sin crear una cuenta paralela.
- Se implementaron tres roles: **Administrador** (administración, usuarios y operación total), **Gerente comercial** (ve y edita todos los puntos) y **Representante de campo** (ve todos los puntos y solo edita, registra visitas o carga notas/relevamientos en los puntos que creó).
- La ficha recibe el permiso de edición desde el backend, evitando mostrar acciones editables sobre puntos ajenos. La gestión de usuarios permite crear y asignar los tres roles, incluidos más administradores y gerentes comerciales.
- La migración convirtió el rol anterior `user` en `field`. `pnpm check`, 45 pruebas automatizadas (1 integración opcional omitida) y compilación de producción aprobaron; las pruebas cubren sesión requerida, vista global, propietario bloqueado en puntos ajenos y acceso total del gerente.
- El alcance del **Gerente comercial** incluye Resumen, Mapa general, Clientes, detalle de cliente y Actividad globales; Usuarios y Configuración permanecen exclusivamente para Administrador. Las pruebas de rutas y permisos confirman ese acceso, junto con la edición total de clientes por gerente. `pnpm check`, 49 pruebas automatizadas (1 integración opcional omitida) y la compilación final aprobaron.

## Acceso temporal sin login

- A solicitud del administrador, el mapa, el listado de clientes, las fichas y el calendario vuelven a abrirse directamente sin sesión. Durante este período, las altas de puntos anónimas quedan marcadas como `publicSubmission`, y notas y próximos relevamientos públicos usan el identificador técnico `0` para no atribuirlos a una persona.
- La comprobación sin sesión abrió la raíz con marcadores, Google Maps, el botón **Nuevo punto** y la navegación Mapa/Clientes/Calendario. La misma sesión anónima dirigida a `/admin` fue redirigida a `/acceso`, por lo que Administración y Usuarios continúan protegidos.

## Ocultación temporal de login

- El botón visible **Ingresar** se retiró de la cabecera pública. La prueba de componente sin sesión confirma que la interfaz conserva Mapa y Calendario, sin exponer ese acceso.
- No se eliminó ningún flujo de autenticación: `/acceso` continúa mostrando el formulario de usuario y contraseña, listo para reactivarlo cuando se vuelva a exigir sesión.
- `pnpm check`, 51 pruebas automatizadas (1 integración opcional omitida) y la compilación aprobaron. Las capturas móviles verificaron la cabecera pública sin acceso visible y la pantalla de login conservada por separado.

## Portal principal público

- En el dominio publicado, la raíz abre directamente el mapa híbrido con sus controles de campo, la navegación inferior y Nuevo punto, sin redirección a `/acceso` ni botón Ingresar.
- La ruta publicada `/sitios` abre el listado completo de clientes, con búsqueda, Departamento/localidad y sus enlaces a ficha, también sin sesión ni acceso visible de login.
- La ruta publicada `/calendario` abre el calendario consolidado de visitas, próximos relevamientos y notas, con sus filtros y enlaces a cada cliente, sin solicitar autenticación.

## Edición pública temporal de clientes

- La ficha pública ahora muestra el icono **Editar sitio** y abre el formulario **Editar punto** sin sesión. La validación visual en vista previa confirmó la carga de nombre, tipo, departamento, distrito/municipio, contacto, teléfono, descripción y referencia, junto a Guardar cambios.
- La actualización básica de cliente quedó temporalmente habilitada para visitantes; archivo de clientes, check-in directo, gestión de usuarios y Administración permanecen bajo permisos autenticados.
- La prueba de flujo confirma que una actualización anónima alcanza `updateSite`; las restricciones de un Representante autenticado sobre puntos ajenos y el acceso total de gerencia se conservan. `pnpm check`, 52 pruebas automatizadas (1 integración opcional omitida) y la compilación aprobaron. No se guardó una modificación de datos reales durante la verificación visual.

## Corrección del texto en edición de cliente

- Se corrigió el formulario controlado que reinicializaba valores al recibir un objeto `initial` nuevo del detalle, lo que impedía borrar texto. Ahora la reinicialización solo ocurre al abrir el formulario o cambiar de cliente; durante la edición se conservan las modificaciones del usuario, incluidos los campos vacíos.
- La prueba interactiva borra el nombre del cliente, fuerza un nuevo render con el mismo cliente y confirma que el campo permanece vacío. `pnpm check`, 55 pruebas automatizadas (1 integración opcional omitida) y la compilación aprobaron.
- En el dominio publicado, la ficha de **Comite de Productores RI3** mostró el control Editar sitio y abrió el formulario Editar punto con los campos de nombre, departamento, distrito/municipio, contacto, teléfono, descripción, dirección y Guardar cambios disponibles para la edición pública temporal.

## Nuevo punto desde la vista actual

- El mapa general guarda su centro visible al quedar en reposo. Al tocar **Nuevo punto**, el selector prioriza ese centro que la persona estaba mirando por encima de la última ubicación GPS recibida.
- La prioridad queda definida como: selección manual previa → centro visible del mapa → foco programático → GPS. El botón **Mi ubicación** del selector continúa siendo la acción explícita para volver al GPS.
- Las pruebas cubren el flujo lógico de mover el mapa a un centro distinto de la posición GPS y verifican que el selector recibe el centro manual. `pnpm check`, 57 pruebas automatizadas (1 integración opcional omitida) y compilación aprobaron.

## Visor unificado y búsqueda de lugares

- Se añadió la barra compacta **Buscar lugar en Google Maps** dentro del lienzo del visor principal. Usa Autocomplete/Places de Google Maps, sesga la consulta al área visible y restringe los resultados a Paraguay.
- **Nuevo punto** ya no abre la capa independiente: activa un modo sobre el mapa actual, con pin central, Cancelar, Mi ubicación y Usar esta ubicación. La búsqueda del lugar mueve el mismo visor; al confirmar, se abre solo el formulario de datos del cliente con las coordenadas elegidas.
- Las pruebas cubren la prioridad del centro visible, la ubicación manual confirmada y la restricción de Places a Paraguay. La barra integrada se verificó visualmente en móvil y escritorio; en el capturador de vista previa el SDK de mapas tuvo un fallo transitorio y quedó expuesta la recuperación manual. `pnpm check`, 61 pruebas automatizadas (1 integración opcional omitida) y compilación aprobaron.
- En el dominio publicado, la carga posterior mostró mosaicos reales de Google Maps. El usuario confirmó además que las sugerencias de búsqueda quedan correctamente limitadas a Paraguay.
- El usuario validó el flujo completo en su equipo: tocar negocios o referencias locales ya no abre paneles ni compartir; buscar un lugar, activar Nuevo punto y confirmar la ubicación ocurre dentro del mismo visor antes de abrir el formulario con esas coordenadas.

## Simplificación de controles de Nuevo punto

- La prueba interactiva en la vista previa abrió el modo Nuevo punto sobre el mismo mapa: se muestran el aviso de ubicación, **Cancelar** y **Usar esta ubicación**; el control interno duplicado **Mi ubicación** ya no aparece.
- El control principal de ubicación se mantiene disponible a la derecha del mapa durante todo el flujo. Tipos, 61 pruebas automatizadas (1 integración opcional omitida) y compilación aprobaron.

## Referencias locales de solo lectura

- Los mapas compartidos usan `clickableIcons: false`: los nombres, rutas, negocios y lugares de Google se conservan como referencia visual, pero ya no deben abrir sus paneles, enlaces de compartir o acciones de dirección al tocarlos. Los pines propios de HORTIMAX mantienen su interacción normal.
- Ante un fallo transitorio del SDK, el mapa realiza un reintento automático único. Si no se recupera, muestra la acción **Reintentar mapa**; la captura de vista previa verificó ese control de recuperación y las pruebas cubren el límite de reintento y las referencias pasivas. `pnpm check`, 54 pruebas automatizadas (1 integración opcional omitida) y compilación aprobaron.

## Territorio automático, Comentario y eliminación administrativa

- Departamento y Distrito/Municipio quedan como valores de solo lectura calculados a partir de las coordenadas. El formulario los recalcula al abrirse o cambiar el pin; el backend ignora cualquier valor territorial manual y lo reemplaza por geocodificación inversa.
- Se completaron los tres clientes pendientes: **Fermin Lopez** → Caaguazú / Caaguazú; **Agro Alex** → Caaguazú / Tres de Febrero; y **Silvio Figueredo** → Caaguazú / Yhú. Las fichas móviles verificaron los dos primeros territorios.
- **Comentario** fue agregado a los valores por defecto y al catálogo persistido de notas. La eliminación definitiva borra cliente, asignaciones, relevamientos, notas y visitas en una transacción, con acceso reservado a Administrador y confirmación explícita en la ficha administrativa.
- `pnpm test` aprobó 64 pruebas (1 integración opcional omitida), incluidos el bloqueo visual de territorio, la nueva categoría y la restricción de eliminación; la compilación de producción aprobó.
- El administrador confirmó en producción que la ficha administrativa muestra **Eliminar cliente** y que el diálogo de confirmación aparece antes de realizar cualquier borrado definitivo.

## Calendario mensual y resumen compacto

- Calendario pasó a una vista mensual real con controles anterior/siguiente, días de lunes a domingo e indicadores por color: verde para visitas, ámbar para próximos y turquesa para notas. Al tocar un día, el resumen queda filtrado a esa fecha; un segundo toque vuelve a mostrar el mes completo.
- El resumen queda separado bajo la grilla mensual e incorpora filtros compactos **Todo**, **Visitas**, **Próximos** y **Notas**. En escritorio los controles se mantienen pequeños y alineados a la derecha del resumen, sin las pestañas grandes anteriores.
- Las capturas verificaron agosto de 2026 con seis registros: el calendario muestra los días 25, 28 y 31 con indicadores y las tarjetas se distribuyen cronológicamente debajo. En móvil, la grilla, contadores y filtros compactos mantienen legibilidad sin superponerse.
- `pnpm check`, 66 pruebas automatizadas (1 integración opcional omitida) y compilación aprobaron, incluidas las pruebas de la grilla mensual y el cambio de mes.

## Inicio de sesión predeterminado

- La ruta `/acceso` muestra siempre **Ingresá a tu cuenta** con usuario y Continuar, incluso si la consulta interna informa que queda una configuración inicial pendiente. La captura móvil verificó que no aparece Configuración inicial en el recorrido normal.
- La configuración inicial queda aislada para un acceso explícito de mantenimiento con `?setup=1` y solo si realmente no existe administrador configurado; no interrumpe el inicio de sesión normal ni el proceso de activación/reset de cuentas existentes.
- `pnpm check`, 68 pruebas automatizadas (1 integración opcional omitida) y compilación aprobaron, incluidas las reglas que fuerzan login por defecto y habilitan configuración solo con parámetro explícito.

## Inicio principal en acceso

- La raíz `/` redirige a `/acceso`; las capturas móviles de ambas rutas muestran el mismo formulario de inicio de sesión sin Configuración inicial.
- El mapa operativo se trasladó a `/mapa`, y el flujo de login termina allí para evitar un bucle hacia acceso. La barra inferior Mapa usa también `/mapa` y los rechazos de rutas administrativas para roles no permitidos vuelven a esa vista.
- La vista previa confirmó las rutas de login y mapa. El SDK de mapas volvió a fallar transitoriamente en el capturador y presentó la acción de recuperación ya disponible.
- En una comprobación inmediata posterior al checkpoint, el dominio publicado aún respondió con la versión anterior del mapa en la raíz. La publicación del nuevo checkpoint debe terminar de propagarse antes de dar por validado `/acceso` como primera vista en producción.
- Tras completarse la propagación, el dominio publicado redirigió correctamente `https://mapaclientes-cqpci7xz.manus.space/` a `/acceso` y mostró **Ingresá a tu cuenta** con el campo Usuario y Continuar.

## Agrupación de clientes cercanos

- El visor incorpora agrupación por cuadrícula visual: a zoom amplio, los clientes próximos se consolidan en un contador turquesa; al pulsarlo, el mapa centra la zona y aumenta el zoom para revelar los pines individuales.
- Los puntos seleccionados permanecen individuales y los marcadores agrupados se recalculan ante cada movimiento o cambio de zoom. Las pruebas unitarias cubren agrupación de puntos cercanos, expansión a zoom alto y exclusión del punto seleccionado.
- La compilación y la suite de 74 pruebas aprobaron. El capturador interno volvió a rechazar la carga del SDK de Maps sobre su origen local, comportamiento documentado desde la primera verificación y ajeno al código de agrupación; en producción el mapa usa el proxy y el mecanismo de reintento disponible.

## Google Sheets permanente por Productor

- La aplicación dispone de una autorización OAuth independiente y reemplazable para una cuenta personal de Google. Las credenciales del cliente se mantienen como secretos de servidor y el refresh token se cifra con AES-256-GCM antes de guardarse.
- La autorización se inicia solo desde una sesión de **Administrador**, emplea nonce con cookie de corta duración contra CSRF y solo admite retornos internos del portal. La conexión puede sustituirse posteriormente por otra cuenta o un Drive corporativo sin modificar los vínculos ya guardados de Productor → planilla.
- Se añadieron tablas no destructivas para conservar la autorización y una relación única por Productor. La creación es idempotente: reutiliza el archivo asociado y busca por la propiedad interna del cliente antes de crear otro archivo.
- En la pestaña **Notas** de los clientes cuyo tipo es **Productor** se muestra “Planilla del Productor”: antes de conectar Google aparece el control administrativo de conexión; luego se habilita “Crear planilla” y, una vez creada, “Abrir planilla”. Los demás tipos de cliente no reciben ese control. La descarga histórica se renombró a **CSV** para no confundirla con la planilla permanente.
- La comprobación visual de `/admin/configuracion` verificó la tarjeta “Google Sheets de Productores” y el control “Conectar Google”. La ficha real del Productor **Fermin Lopez** mostró el bloque condicional y el botón de conexión. El capturador local de Maps mostró su error de origen ya documentado, sin afectar la interfaz de Sheets.
- Validación final: `pnpm test` aprobó **84 pruebas** en 29 archivos, con 1 integración opcional omitida; `pnpm check` y `pnpm build` aprobaron. La cobertura incluye configuración OAuth contra el extremo de Google sin crear archivos, cifrado local del token, detección exclusiva de Productor, bloqueo de retornos externos y aislamiento de cartera para planillas.

## Correcciones de septiembre de 2026

- Se corrigió el cierre de **Nuevo punto** en FieldMap: al cancelar se limpian las coordenadas manuales, el punto provisional y el modo de colocación, evitando que una capa o estado residual interfiera con la apertura de fichas.
- La ficha de cada cliente ahora incluye **Ver en mapa principal**. El enlace transporta `siteId` a `/mapa`; FieldMap localiza ese registro, lo selecciona y centra la vista en sus coordenadas al cargar.
- Administración → Clientes ahora filtra por **Creado por**, no por asignación. El selector incluye a todos los usuarios activos —incluido el Gerente comercial Nelson Galarza— y muestra el conteo de clientes creados por cada uno. La consulta de datos confirmó que Nelson tiene 1 cliente creado.
- La vista de pestañas conserva el ancho del viewport móvil con desplazamiento interno cuando las etiquetas no entran; los shells de Campo y Administración tienen `min-width: 0`, ancho máximo y desborde horizontal controlado. La captura móvil de `/acceso` a 375×812 no mostró desborde.
- El modo offline conserva puntos nuevos, notas, check-ins y próximos relevamientos en IndexedDB con claves idempotentes; el service worker cachea solo la carcasa de la aplicación y excluye las respuestas privadas del API. La suite pasó 87 pruebas en 30 archivos, con 1 integración opcional omitida; `pnpm check` y `pnpm build` también aprobaron. El bundle mantiene la advertencia conocida de tamaño superior a 500 kB.

## Validación final de operación móvil y navegación

- El manifest `manifest.webmanifest` define nombre corto HORTIMAX, modo `standalone`, idioma `es-PY`, ruta inicial `/mapa`, color corporativo y el isologo publicado como icono. `main.tsx` registra `/sw.js` únicamente en producción.
- El service worker utiliza estrategia network-first para recursos públicos, conserva la carcasa si no hay señal y excluye `/api/`, por lo que no almacena respuestas privadas ni credenciales.
- Las operaciones de nuevo punto, nota con visita, check-in y próximo relevamiento se encolan en IndexedDB cuando `navigator.onLine` es falso. El sincronizador respeta el orden, reintenta al recuperar señal o cada 30 segundos, informa pendientes/errores y elimina una operación solo después de una respuesta exitosa. Las claves `clientRequestId` permiten que el servidor rechace duplicados lógicos.
- La ficha de Administración → Clientes → Notas incluye la planilla permanente para Productores; el administrador puede crearla o abrirla y los demás perfiles autorizados solo pueden abrir una ya existente. La base confirmó una conexión personal activa y cuatro vínculos de planillas listas.
- Validación final: `pnpm test` aprobó 89 pruebas en 30 archivos, con 1 integración opcional omitida; `pnpm check` y `pnpm build` aprobaron. La captura móvil de `/acceso` a 375×812 confirmó que el contenido respeta el ancho del viewport; la advertencia restante es únicamente el tamaño del bundle JavaScript (>500 kB).

## Auditoría integral posterior al alcance ampliado

La revisión del código confirmó que el portal conserva los flujos de autenticación local, roles, cartera exclusiva de Representante, gestión global de Gerente/Administrador, clientes, fichas, notas, visitas, próximos relevamientos, calendario, actividad, CSV, mapa, ubicación compartible, Sheets por Productor y navegación ficha → mapa. La ficha administrativa sincronizada ahora incluye también la planilla permanente de Productor.

En responsive se capturaron `/acceso`, `/mapa`, `/sitios`, `/calendario` y `/admin/clientes` en 375×812. Los contenedores respetan el viewport y los controles inferiores no se desbordan. El mapa puede mostrar el estado de reintento cuando el SDK no carga en el entorno local; eso corresponde a dependencia de red del SDK, no a un desborde de la interfaz.

Como refuerzo para jornadas con cobertura inestable, las cuatro altas de campo guardan la operación en IndexedDB cuando no hay señal y también convierten un fallo de red real durante un envío iniciado en una operación pendiente. Al recuperar conectividad, el sincronizador conserva el orden, reintenta, informa pendientes y usa `clientRequestId` para evitar duplicados. La instalación PWA y el cacheo público de la carcasa están configurados; el mapa de Google y la búsqueda de lugares siguen requiriendo conexión.

La prueba automatizada final aprobó 90 tests en 30 archivos, con 1 integración opcional omitida; `pnpm check` y `pnpm build` también aprobaron. Falta una única validación externa: probar en un celular de campo el ciclo completo sin señal → captura → cierre/reapertura → recuperación de señal → sincronización, porque el entorno de desarrollo no puede simular de forma fiable la cobertura móvil real.

## Corrección tras prueba real sin señal

La prueba en dispositivo mostró que la cookie era de sesión y desaparecía al cerrar la aplicación. Se corrigió para persistir 30 días, conservando la firma, el uso HttpOnly y la política Secure; el logout explícito sigue revocando la confianza local. Tras un acceso online válido, el hook de autenticación precarga la cartera permitida por el servidor: Representante recibe sus puntos y Gerencia/Administración la cartera completa.

Cuando el dispositivo informa ausencia de red, FieldMap deja de intentar cargar Google Maps y muestra un mapa territorial local de Paraguay con límites departamentales empaquetados y los clientes sincronizados. El modo offline no ofrece calles, búsqueda de lugares ni imágenes satelitales; esas funciones regresan con conexión. La geometría se basa en el GeoJSON público de departamentos de Paraguay consultado en el gist de aVolpe [1].

La aplicación conserva el acceso del usuario previamente autorizado y reingresa automáticamente en el dispositivo; un dispositivo nuevo sigue requiriendo servidor. Validación de código: `pnpm test` aprobó 92 pruebas en 31 archivos, con 1 integración opcional omitida; `pnpm check` y `pnpm build` aprobaron. Queda pendiente repetir en teléfono real el ciclo completo de cierre, reapertura, captura sin señal y sincronización.

[1]: https://gist.github.com/aVolpe/0e1b1e6e25efafa8185d "GeoJson de los departamentos del Paraguay, aVolpe"

## APK Android con mapa cartográfico completo de Paraguay

Se reemplazó el respaldo territorial simplificado del APK por cartografía vectorial completa basada en el paquete Shortbread de OpenStreetMap/Geofabrik. El MBTiles original de **202.948.608 bytes** se convirtió a PMTiles v3 de **174.661.701 bytes**, con cobertura de Paraguay entre zoom 0 y 14. El archivo queda empaquetado sin compresión ZIP para lectura local por rangos y no se incluye en el despliegue web.

El visor Android usa MapLibre con un worker local y decodificación MVT directa desde PMTiles. La validación visual sin Google Maps mostró límites, agua, ciudades, carreteras y los **15 clientes sincronizados**; al enfocar un cliente a zoom operativo se renderizaron rutas troncales, secundarias y terciarias alrededor del punto. Con señal, FieldMap conserva Google Maps; sin señal dentro del APK usa el mapa local.

El APK de prueba compiló correctamente con Android SDK 36 y Java 21. El instalador ocupa aproximadamente **173 MiB**, incluye permisos de ubicación precisa/aproximada y el paquete PMTiles completo. SHA-256: `f13199e57dd53caa9bc9c3626a044103d354c9ff0fdb07e6a24d4d9a30166cab`.

La validación automatizada aprobó **96 pruebas** en 33 archivos, con 1 integración opcional omitida; `pnpm check` y `pnpm build` aprobaron. El emulador Android sin aceleración del sandbox no completó su arranque después de más de cinco minutos, por lo que la instalación, modo avión, cierre/reapertura y sincronización final deben confirmarse en el teléfono real del usuario.

## Corrección del respaldo offline en APK

La falla reportada no se trató como una diferencia visual: el selector del mapa confiaba solo en `navigator.onLine`. En Android, el WebView puede conservar ese valor aunque el teléfono ya no tenga una ruta de datos y, en ese caso, seguía intentando cargar Google Maps en vez de activar el paquete local.

El APK actualizado incorpora el complemento nativo de red de Capacitor. Al reportar Android pérdida de conectividad, o al fallar la carga de Google Maps, FieldMap conmuta de inmediato a la cartografía PMTiles local. Además, el botón **Usar mapa sin señal** permite forzar manualmente el mapa offline desde el APK cuando el sistema tarda en actualizar el estado de red. La nueva compilación incluye el complemento, la cartografía de 174.661.701 bytes y conserva el tamaño aproximado de 173 MiB.

La suite volvió a aprobar **96 pruebas** en 33 archivos, con 1 integración opcional omitida; `pnpm check`, `pnpm build` y la compilación Android aprobaron. SHA-256 del APK v3: `54590569e6aa86fe0351a8ababa9e64ae91e2acaf0f1447b40941ae91ef202f6`. Sigue pendiente únicamente la confirmación en el teléfono físico, porque el emulador sin aceleración no terminó de arrancar en el sandbox.

## Mapa completo descargable en PWA

La PWA ya no necesita conformarse con el respaldo territorial básico. Cuando tiene señal muestra una tarjeta **Mapa completo sin señal** desde la que el usuario descarga una vez el paquete PMTiles de Paraguay. El archivo se transmite por streaming y se guarda en el almacenamiento privado persistente del navegador, no dentro de la caché de respuestas de la aplicación.

Una vez guardado, el visor MapLibre abre el mismo archivo vectorial local mediante lectura por rangos. Así conserva rutas, calles, ciudades, límites, agua y los puntos HORTIMAX también en Chrome/PWA sin datos. La interfaz muestra progreso, tamaño local, y permite eliminar el paquete desde ese teléfono. La descarga rechaza archivos truncados antes de activar el visor completo. Validación: **98 pruebas** en 34 archivos, con 1 integración opcional omitida; tipos y build aprobaron. La prueba física de descarga y modo avión en Chrome/PWA sigue pendiente.

## Corrección del visor vacío en PWA

La captura del usuario evidenció que el archivo descargado estaba presente pero el mapa quedaba vacío. Se corrigieron dos causas: el visor ahora se inicia sobre la última ubicación GPS o el cliente enfocado a nivel vial (zoom 14), en vez de abrir el país completo sin rutas detalladas; y las capas se incorporan al evento de estilo disponible, no a un evento de carga que puede permanecer pendiente en Chrome móvil. El panel de mapa descargado también se puede minimizar sin borrar los 167 MB. Una captura local del modo offline forzado ya muestra carreteras, ríos, límites y ciudades. Validación técnica posterior: **99 pruebas** en 34 archivos, con 1 integración opcional omitida; tipos y build aprobaron. Sigue pendiente confirmarlo en el teléfono real tras actualizar la PWA.

La actualización actual eleva la versión de caché de la PWA para reemplazar el JavaScript anterior al abrirla con Internet. Además, el panel se puede minimizar también antes de descargar el mapa y se muestra un error accionable si el estilo local no termina de iniciar. Validación final de esta corrección: **99 pruebas** en 34 archivos, con 1 integración opcional omitida; chequeo de tipos y compilación aprobados.

## Sustitución por visor mapsforge Android nativo

El visor experimental de Chrome/PWA se retiró del recorrido operativo porque las pruebas físicas demostraron que no rendía cartografía de forma fiable. El modo sin señal definitivo queda en el APK Android, con mapsforge y el archivo vectorial oficial de Paraguay incluido en los activos de la aplicación. Al perder conexión, Android detecta el estado de red nativo y coloca automáticamente el mapa sobre el portal; al recuperar Internet se oculta y vuelve Google Maps.

El mapa nativo permite arrastrar, desplazar, acercar/alejar con pellizco y controles, muestra la escala y usa tema de conducción para priorizar rutas y localidades. Los clientes que la sesión puede ver se dibujan como pines: al tocar uno, se abre su ficha; el control “+” del encabezado toma el centro al que se desplazó el vendedor y permite registrar un punto sin señal. El paquete `paraguay.map` de 149,666,906 bytes fue empaquetado sin compresión en el APK de 149 MB. La compilación Android, `pnpm check` y las **99 pruebas** aprobaron. Falta exclusivamente probar la versión v4 en el teléfono físico del usuario.
