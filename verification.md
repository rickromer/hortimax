# Verificación del preliminar

## Mapa de Google Maps

El 22 de agosto de 2026 se verificó el componente `ClientMap` directamente en la **URL pública de la vista previa**. La comprobación aislada confirmó que el SDK de Google Maps se carga correctamente (`mapsLoaded: true`) y que el lienzo del mapa está presente (`mapCanvas: true`).

La herramienta de capturas internas usa `127.0.0.1`, un origen que el proxy de mapas rechaza, por lo que esas capturas pueden mostrar un fondo gris. Esto no afecta la vista previa pública ni el uso desde un navegador normal.

### Facturación para Google Maps Android

El 7 de septiembre de 2026 se comprobó en la consola Google Cloud de la cuenta autorizada que la cuenta **“Mi cuenta de facturación de Maps”** figura con estado **Activo**. En la pestaña de proyectos de esa misma cuenta, **Hortisheets** (ID `hortisheets`) aparece asociado explícitamente a dicha cuenta de facturación. La clave usada exclusivamente durante el empaquetado Android debe pertenecer a ese proyecto. La compilación no expone esa clave a la web publicada; la validación pendiente es exclusivamente física, al abrir el APK conectado en un teléfono.

La navegación directa al panel de APIs de Hortisheets solicitó una nueva autenticación de Google en el navegador conectado. No se realizó ningún cambio de cuenta, facturación, APIs ni restricciones; para completar esa comprobación visual se requiere revalidar la sesión de Google Cloud.

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

## Versión consolidada de cierre

- El mapa principal conserva el centro, zoom y cliente seleccionado de la sesión actual. Al volver de **Ver ficha**, no utiliza una lectura GPS posterior para desplazar la vista; solo enfoca el cliente indicado. El GPS se centra una única vez tras un inicio de sesión nuevo y el botón **Mi ubicación** conserva el recentrado manual.
- La caché offline vuelve a respetar la regla estándar de TanStack: persiste únicamente consultas operativas que terminaron con éxito. De ese modo, una consulta pendiente y su promesa interna no llegan a IndexedDB, eliminando el `DataCloneError` observado en la vista previa.
- La cuenta **Mi cuenta de facturación de Maps** fue comprobada como activa y **Hortisheets** (ID `hortisheets`) figura asociada a ella. Google exige una cuenta de facturación habilitada y una API key válida para evitar la marca de desarrollo; la comprobación visual definitiva depende de abrir el APK con conexión en un teléfono [2].
- La compilación aislada de Android completó correctamente con Google Maps JavaScript directo, sin modificar la carga por proxy de la web. El paquete final conservó el isologo original y contiene la referencia al cargador `maps.googleapis.com/maps/api/js`; el APK de entrega `HORTIMAX-v8-consolidado.apk` pesa **5.7 MB** y tiene SHA-256 `e6a651937c3a707e334111667d94924aabbf576f55f98c8c8affc459a9c2f09d`.
- Validación técnica final: `pnpm test` aprobó **103 pruebas** en 38 archivos, con 1 integración opcional omitida; `pnpm check`, `pnpm build` y Gradle Android finalizaron correctamente. Aún se requiere una prueba física conectada para afirmar que Google Maps no muestra la marca de desarrollo en el teléfono.

[2]: https://developers.google.com/maps/documentation/javascript/error-messages "Google Maps JavaScript API Error Messages"

## Sesión persistente por dispositivo único

Después del primer acceso válido con Internet, cada instalación conserva la cookie segura y la credencial local de su propio dispositivo. La cookie del portal y el token móvil se alinearon a una vigencia máxima de **un año**, por lo que cerrar y reabrir el navegador, PWA o APK no debe pedir nuevamente usuario ni contraseña durante ese plazo. La contraseña nunca se almacena: el modo offline conserva solamente un verificador PBKDF2 asociado al identificador local de instalación.

El cierre de sesión explícito elimina cookie, token móvil, sesión offline, verificador y el identificador del dispositivo. La desactivación o revocación administrativa sigue invalidando el usuario en el servidor. La validación final aprobó **105 pruebas** en 39 archivos, con una integración opcional omitida, además de `pnpm check` y `pnpm build`.

## Ícono Android alineado al favicon

El recurso de launcher Android se regeneró directamente desde el favicon HORTIMAX publicado, manteniendo el lienzo cuadrado y el isotipo multicolor original, sin recorte ni redibujo. La comprobación visual del recurso `mipmap-xxxhdpi/ic_launcher.png` confirma el mismo isotipo sobre fondo blanco; se generaron también los tamaños mdpi, hdpi, xhdpi y xxhdpi, además de las variantes launcher redonda y adaptativa.

## Alcance de Google Maps sin conexión

Las políticas de Google Maps JavaScript restringen la precarga, el almacenamiento y la caché del contenido cartográfico. La política específica de Map Tiles prohíbe expresamente los usos offline. Por ello, HORTIMAX mantiene Google Maps integrado mientras existe conexión y el APK solo puede mostrar una cartografía local propia cuando no hay red; la aplicación no descarga ni empaqueta mosaicos de Google [3] [4].

[3]: https://developers.google.com/maps/documentation/javascript/policies "Policies and attributions for Maps JavaScript API"
[4]: https://developers.google.com/maps/documentation/tile/policies "Map Tiles API Policies"

## Administración móvil, territorio y papelera

La tarjeta técnica de Mapa se retiró de Configuración. La distribución territorial se compactó en filas responsive con contador y se normalizó el valor histórico `Caaguazú Department` a `Caaguazú`, sin alterar los clientes, su estado ni su historial. La consulta posterior dejó 18 clientes activos y 1 archivado en Caaguazú, 1 activo y 3 archivados en Alto Paraná, 1 activo en Boquerón y 1 activo sin departamento.

Los cuatro clientes archivados ahora aparecen en **Administración → Papelera**. La recuperación está reservada a Administrador y cambia exclusivamente el estado `active` del punto, conservando notas, visitas, relevamientos, asignaciones y autoría. Los clientes eliminados definitivamente mediante la función administrativa anterior no pueden aparecer en la papelera porque esa operación ya borra sus datos dependientes.

## Mapa offline integrado en APK 1.0.7

El APK usa Google Maps cuando hay conexión. Si el estado de red nativo de Android queda sin conexión, la misma pantalla HORTIMAX reemplaza solo el lienzo por un visor local de Paraguay que conserva los pines, GPS, selección y alta manual. El archivo `paraguay-shortbread-1.0.pmtiles` se copia durante el build y quedó incluido en el APK como activo **sin compresión**, con 174.661.701 bytes; esa condición permite lecturas por rangos desde el WebView.

La validación técnica final aprobó **112 pruebas** en 42 archivos, con 1 integración opcional omitida; `pnpm check`, `pnpm build` y Gradle aprobaron. Falta confirmación física en un Android sin conexión para cerrar la incidencia de campo.

## Acceso conectado Android: corrección de transporte

La prueba física del APK 1.0.8 reportó que la verificación de usuario seguía fallando aun con Internet. El flujo Android se ajustó para usar solicitudes tRPC individuales mediante HTTP nativo, evitando el lote del WebView. El cuerpo JSON se convierte explícitamente antes de enviarse, se conserva el encabezado de identificación móvil y el servidor puede reconocer la solicitud Android aunque el transporte nativo no incluya `Origin`.

La web continúa usando el transporte por lotes y `fetch` del navegador. La corrección aprobó **113 pruebas** en 43 archivos, con una integración opcional omitida, además de TypeScript, compilación web y Gradle. El APK de prueba **1.0.9** requiere una comprobación física conectada antes de considerar resuelto el acceso.

## Navegación directa desde ficha de cliente

El mapa embebido de la ficha ahora tiene una capa táctil explícita que navega directamente a `/mapa?siteId=<id>`. El recorrido ya no abre un diálogo intermedio: el mapa principal recibe el identificador, enfoca el cliente y conserva la selección. La prueba `SiteDetail.locationActions.test.ts`, TypeScript, la compilación web y el empaquetado Android aprobaron. El APK de prueba **1.0.10** contiene este cambio y requiere confirmación física de la interacción táctil.

La causa de la falla posterior fue identificada y corregida: Wouter entrega la ruta y la consulta URL mediante hooks distintos. El mapa principal leía `siteId` desde la ruta, donde ese parámetro no existe; ahora usa `useSearch` y una utilidad probada para extraerlo. El APK **1.0.11** incluye el bundle actualizado y el recurso PMTiles sin compresión; la verificación física de ficha → mapa sigue pendiente.

Después de la confirmación física de que el flujo aún fallaba, se agregó una segunda vía independiente de la URL: la ficha guarda una solicitud temporal con el identificador y las coordenadas del cliente antes de navegar; el mapa la consume al montarse, de modo que centra el punto aunque la lista de clientes llegue tarde o esté vacía temporalmente. El APK **1.0.12** incluye este destino persistente, un botón visible de respaldo y la cartografía PMTiles sin compresión. La suite completa aprobó 116 pruebas, con 1 integración opcional omitida; tipos, build y Gradle aprobaron. Requiere prueba física.

El foco recibido desde ficha ahora propaga un zoom de detalle de nivel 17 a Google Maps y al visor local del APK. El centrado por GPS no participa en este flujo y sigue limitado al inicio de sesión o al control manual. La prueba `mapFocusZoom.test.ts`, TypeScript y la compilación web aprobaron; falta confirmación física.

El instalador **APK 1.0.13** fue compilado con el bundle que incluye el zoom de detalle y conserva la cartografía PMTiles de Paraguay empaquetada sin compresión. Se comprobó la presencia del bundle y del archivo cartográfico dentro del APK; la confirmación de comportamiento queda pendiente en un teléfono.

Confirmación física del usuario: el recorrido **ficha → mapa principal → cliente seleccionado con zoom** funciona correctamente en la web publicada. La validación equivalente del APK continúa pendiente.

Para Android se añadió un respaldo específico de Capacitor: la solicitud de foco se guarda de forma temporal tanto en `sessionStorage` como en `localStorage`, y se elimina al ser consumida. Así, aunque el WebView descarte el almacenamiento de sesión durante el cambio de ruta, el mapa recibe el cliente y el zoom solicitado. El APK **1.0.14** contiene este ajuste y se verificó que incluye el bundle actualizado y PMTiles; requiere confirmación física.

La cartografía offline se corrigió para no depender de solicitudes HTTP Range contra los activos de Capacitor. El visor ahora descarga una vez el archivo PMTiles que viene dentro del APK y sirve los tramos requeridos desde un Blob local en memoria; esto evita el fondo vacío observado cuando el WebView no responde rangos de activos correctamente. Las pruebas incluyen la lectura de rangos desde el Blob y la suite completa aprobó 119 pruebas, con 1 integración opcional omitida. El APK **1.0.15** requiere validación física en modo avión.

La prueba física de 1.0.15 confirmó que la carga completa del Blob no resolvió el visor. Se sustituyó por el puente nativo `OfflineMapAsset`: Android abre el PMTiles sin compresión desde `AssetManager` y devuelve únicamente los rangos requeridos al visor; de este modo se evita por completo el servidor de activos del WebView. También se sustituyó el aviso inferior por un indicador pequeño en la esquina superior para no cubrir Nuevo punto ni su confirmación. El APK **1.0.16** se compiló con el puente, el bundle actualizado y el PMTiles incluido; la suite completa aprobó 120 pruebas, con 1 integración opcional omitida. Requiere validación física en modo avión.

Se verificó la secuencia de inicio de Capacitor: los complementos registrados manualmente deben añadirse antes de que `BridgeActivity` construya el puente. El registro de `OfflineMapAsset` se ajustó a ese orden y se generó el APK **1.0.18**. El instalador incluye el bundle de visor, la cartografía de Paraguay de 174.661.701 bytes y compila correctamente con Gradle. Requiere la prueba física de renderizado, zoom, pines y creación de punto en modo avión.

La inspección del contrato de Capacitor identificó la causa del lector nativo: los números JSON entregados por el WebView llegan como `Integer` o `Double`, mientras `PluginCall.getLong()` solo acepta un `Long`. Por eso todos los offsets se convertían en `-1` y el complemento rechazaba cada lectura. `OfflineMapAsset` ahora usa `getDouble()` con validación de enteros antes de convertir a `long` e `int`. Además, el formulario Nuevo punto apila sus pares de campos y sus acciones por debajo de 640 px, evitando la superposición horizontal observada en Android. El APK **1.0.19** contiene ambas correcciones; la suite completa aprobó 124 pruebas, con 1 integración opcional omitida; tipos, build y Gradle aprobaron. Requiere validación física.

## APK 1.0.20: visor vectorial y datos operativos renovables

El fallback Android fue actualizado para entregar al motor MapLibre mosaicos vectoriales reales desde el PMTiles local mediante el protocolo `hortimax-pmtiles`. El estilo usa capas existentes del paquete OSM de Paraguay —terreno, agua, límites, calles, etiquetas y edificios— en vez del renderizado manual anterior. La fuente conserva desplazamiento, pellizco, zoom, GPS, pines y colocación de puntos dentro de la misma pantalla HORTIMAX. Con conexión, la aplicación continúa seleccionando Google Maps.

La caché operativa ahora queda identificada por el usuario autorizado del dispositivo: se elimina en el cierre de sesión o al ingresar una identidad distinta, pero no se descartan operaciones pendientes si vuelve a iniciar el mismo usuario. La cola offline incorpora actualizaciones de cliente y la precarga de fichas se renueva al cambiar la cartera o al recuperar conectividad; comprende el detalle, hasta 100 visitas, 200 notas, asignaciones y recordatorios pendientes autorizados.

La validación técnica de esta versión aprobó **129 pruebas** en 49 archivos, con 1 archivo de integración omitido (**130 pruebas** en total); `pnpm check`, `pnpm build` y Gradle Android finalizaron correctamente. La inspección del APK confirma: `versionCode 20` / `versionName 1.0.20`; PMTiles de Paraguay de **174.661.701 bytes** almacenado sin compresión; bundle que contiene el protocolo local; complemento `OfflineMapAssetPlugin` registrado antes del puente Capacitor y presente en `classes9.dex`; y recursos launcher de HORTIMAX en todas las densidades. El archivo instalable `HORTIMAX-Portal-1.0.20.apk` pesa aproximadamente **173 MiB** y tiene SHA-256 `ed1ca72cec07993fd459a5424efe3da96726f949e6dcdcbf79d3bd5e1372d5bc`.

Esta evidencia solo demuestra empaquetado y pruebas automatizadas. Sigue pendiente una única prueba física controlada: abrir primero con Internet para actualizar cartera, cerrar la aplicación, activar modo avión y comprobar calles visibles, pan/pellizco/zoom, GPS, ficha precargada y alta local; luego restaurar señal y confirmar sincronización automática y retorno a Google Maps. No se afirma funcionamiento offline hasta completar esa prueba en un teléfono.

## APK 1.0.21: corrección del visor vacío y formulario Android

La evidencia física del APK 1.0.20 mostró que los clientes, pines y GPS se cargaban, pero la cartografía local permanecía vacía. Se identificó que el visor usaba una URL manual con extensión `.pbf`; esa forma no coincide con el contrato del adaptador PMTiles que usa MapLibre para fuentes vectoriales. El visor ahora registra el `Protocol` oficial de PMTiles, vincula la instancia que lee rangos desde `OfflineMapAssetPlugin` y usa la URL estándar `pmtiles://<archivo>/{z}/{x}/{y}`. Así, los mosaicos que MapLibre solicita se resuelven desde el PMTiles empaquetado y no a través de la red ni de una URL de activos del WebView.

La inspección directa del archivo incluido confirmó mosaicos no vacíos en zoom 14 para Coronel Oviedo (**249.826 bytes**) y Caaguazú (**157.319 bytes**). La fuente vectorial conserva las capas OSM de calles, agua, límites y edificios previamente definidas. Esta comprobación no sustituye el renderizado físico en el teléfono, pero descarta que esos dos mosaicos de zona operativa estén ausentes o vacíos.

El formulario **Nuevo punto** ahora se comporta como una lámina móvil de altura `100dvh` disponible, con desplazamiento interno y contención del sobre-desplazamiento; conserva exactamente los mismos campos y validaciones. También compacta la ubicación y las coordenadas para pantallas estrechas, evitando que las acciones ocupen filas innecesarias. La corrección no cambia formularios ni rutas de la web conectada.

La suite completa aprobó **130 pruebas** en 49 archivos, con 1 archivo de integración omitido (**131 pruebas** en total); `pnpm check`, compilación web y Gradle Android aprobaron. El APK **1.0.21** mantiene el PMTiles de **174.661.701 bytes** almacenado sin compresión y el complemento nativo de lectura por rangos. Su SHA-256 es `836c2b84befbcef772d8f7da76cc975d3ca86aed12e4ddf1b58b0b7063d874bc`. La confirmación física de mapa vial y formulario sigue pendiente.

## Diagnóstico reproducible del visor vacío

La prueba física 1.0.21 confirmó que el mapa de fondo seguía vacío, aunque los pines, GPS y etiquetas se mostraban. Para aislar la causa se montó temporalmente, solo en desarrollo, el mismo componente MapLibre sobre el PMTiles real. Al cargar el archivo completo como Blob, reprodujo el fondo vacío. Al usar solicitudes HTTP `Range` estándar contra el mismo archivo, MapLibre renderizó en el navegador de diagnóstico las calles, tramas urbanas, edificios y agua de Coronel Oviedo. El registro de red confirmó las lecturas solicitadas por PMTiles: cabecera de 16.384 bytes, directorio de 7.668 bytes y mosaicos viales de 45.113 a 122.780 bytes.

Este resultado acota la falla al transporte nativo por puente JavaScript, no al archivo PMTiles ni a sus capas OSM. La siguiente implementación sustituye dicho transporte por un servidor HTTP local exclusivo de `127.0.0.1` dentro del APK. Ese servidor lee el activo empaquetado mediante rangos, devuelve respuestas `206 Partial Content` y permite que MapLibre y sus workers consuman el mismo contrato de red que demostró renderizar correctamente en el diagnóstico. La validación en teléfono sigue siendo obligatoria antes de afirmar que el modo avión está reparado.

## APK 1.0.22: servidor local de cartografía Android

El APK 1.0.22 reemplaza la transferencia de rangos desde JavaScript hacia el complemento Capacitor por un servidor local Android de solo lectura. El complemento abre un `ServerSocket` ligado exclusivamente a `127.0.0.1` y entrega el PMTiles del activo interno mediante respuestas HTTP `206 Partial Content`, con rango máximo de 2 MiB, sin exponer el archivo a la red del dispositivo. MapLibre recibe una URL de loopback y usa su lector estándar de rangos, que ya demostró renderizar calles y edificios con ese mismo contrato en el diagnóstico local.

Android permite tráfico HTTP únicamente hacia este origen local mediante la configuración de la aplicación. El modo conectado sigue seleccionando Google Maps y la web no usa ni expone el servidor. Las pruebas completas aprobaron **131 pruebas** en 49 archivos, con 1 archivo de integración omitido (**132 pruebas** en total); TypeScript, build web y Gradle Android completaron sin errores. El APK contiene `OfflineMapHttpServer`, `OfflineMapAssetPlugin`, el bundle con `getMapUrl` y el PMTiles de **174.661.701 bytes** almacenado sin compresión. Su SHA-256 es `75224307b08cc5a26eaf5a34e288242ea1b06aa8faaf630363e681e63ed0b48b`.

El render en teléfono no se declara resuelto todavía. Falta instalar el APK 1.0.22 y comprobar en modo avión que aparecen calles detrás de los pines, que el mapa se puede desplazar y ampliar, y que el formulario Nuevo punto permite llegar al botón de registro mediante scroll.

## APK 1.0.23: separación de Google Maps conectado y OSM local

La captura posterior del teléfono mostró que la aplicación estaba en línea y por eso montaba Google Maps JavaScript, pero Google lo señalaba como “For development purposes only”. La carga del SDK no fallaba: el problema es que JavaScript API valida el origen del WebView y la credencial/billing del proyecto, por lo que no es un mecanismo confiable para una aplicación Capacitor. Google documenta que ese mapa oscurecido o con marca de desarrollo indica un problema de credencial o facturación; además, el SDK de Android usa una clave asociada al paquete y la huella de firma, no al referer del WebView.[1] [2]

El APK 1.0.23 incorpora `@capacitor/google-maps` y, únicamente en Android con conexión, muestra Google Maps a través del SDK nativo. La clave ya existente se inyecta en el manifiesto durante Gradle mediante un placeholder de entorno, sin escribirse en el repositorio. El mapa recibe cámara, pines por tipo de cliente, selección, toque del mapa, GPS y el selector normal/híbrido. La interfaz web sigue usando su componente Google Maps previo y no recibe el SDK nativo.

Cuando Android informa falta de conexión, `FieldMap` no crea el mapa nativo: conserva el visor MapLibre/OSM local que entrega PMTiles de Paraguay desde el servidor loopback interno. Así quedan dos rutas excluyentes, sin “mezclar” Google y OSM: Google Maps nativo conectado, y OSM vial local con referencias y pines en modo avión. La suite completa aprobó **133 pruebas** en 50 archivos, con 1 archivo omitido (**134 pruebas** en total); TypeScript, build web y Gradle, con el plugin nativo de Google Maps, aprobaron. El APK 1.0.23 contiene el SDK Google Maps nativo, el servidor OSM local y PMTiles sin compresión. SHA-256: `2310452c7361cc8e1f268bad536435a701a8a4cfac285406c6ca9a0a9880029b`.

La prueba física continúa pendiente. Para declararlo funcionando se debe instalar 1.0.23 y verificar **primero con Internet** que Google Maps no muestre el aviso, responda a pan/zoom y pines; después cerrar la aplicación, activar modo avión y comprobar calles/referencias OSM, GPS, pan/zoom y Nuevo punto.

## APK 1.0.24: recuperación ante bloqueo de arranque Android

El reporte físico de 1.0.23 indicó que el APK quedaba indefinidamente en “Iniciando” antes de llegar al acceso, mientras la web continúa operativa. Se aisló el riesgo a inicializaciones nativas/HTTP propias del APK: una llamada `CapacitorHttp` sin respuesta no tenía un límite de tiempo y el servidor loopback del mapa se iniciaba al cargar el bridge, incluso sin abrir el mapa.

La versión 1.0.24 aplica dos cambios exclusivamente Android. Primero, toda petición HTTP nativa tiene ahora un límite de 12 segundos; una comunicación detenida pasa a error controlado y permite al login ofrecer su flujo normal u offline, en lugar de bloquearse indefinidamente. Segundo, el servidor PMTiles ya no se abre durante el inicio de la aplicación: se crea solo cuando MapLibre solicita el mapa sin señal. No cambia el formulario, datos, roles, permisos, sesiones web ni la interfaz conectada de la web.

La validación técnica aprobó **136 pruebas** en 52 archivos, con 1 archivo omitido (**137 pruebas** en total); TypeScript, build web y Gradle Android aprobaron. El APK 1.0.24 empaqueta Google Maps nativo, el servidor OSM local diferido y el PMTiles sin compresión. SHA-256: `520e0f919f20f9d5067a75722aa72587ae6f71bdb602dcbbd6478c248f5b2565`. La comprobación física del login aún es obligatoria antes de reanudar la prueba de mapas.

## Incidencia web móvil reportada el 8 de septiembre de 2026

La evidencia del usuario muestra Chrome móvil detenido en la pantalla de carga de una ruta protegida. La comprobación independiente del dominio publicado abrió correctamente `/acceso` y la consulta pública `auth.me` respondió HTTP 200 con usuario nulo en menos de cinco segundos. Por tanto, no hay evidencia de caída general del servidor ni de la API de sesión; la recuperación se concentra en evitar que una petición web móvil pendiente deje el componente de protección en carga indefinida y en actualizar la caché de aplicación controlada por el navegador.

En el entorno móvil de verificación, las rutas de acceso y de campo cargaron sin quedar en el splash. La sesión de prueba existente redirigió `/acceso` a campo, comportamiento esperado para una sesión activa. El error de Google Maps visible en ese entorno de pruebas es independiente de la recuperación de acceso y no se interpreta como fallo de autenticación ni del servidor web.

Como protección adicional ante el bloqueo persistente informado, `useAuth` libera el guard de ruta después de ocho segundos si `auth.me` permanece cargando, o inmediatamente si TanStack Query informa que la consulta está pausada. En ambos casos una sesión local previamente autorizada puede usarse en modo offline; sin ella, la ruta protegida redirige a `/acceso` en vez de permanecer en “Cargando”. La modificación se limita al estado transitorio de arranque y no toca usuarios, datos, formularios ni permisos. La regresión completa aprobó **139 pruebas** en 54 archivos, con 1 archivo omitido (**140 pruebas** en total), junto con TypeScript y build.

La comprobación publicada posterior abrió la raíz `/` y mostró el formulario de acceso HORTIMAX. La ruta directa `/mapa` respondió 404 desde el borde de publicación antes de entregar el cliente React, lo que no corresponde al comportamiento esperado para un enlace profundo. La recuperación de login debe preservar la raíz operativa y eliminar la dependencia de que el navegador/PWA reabra una ruta protegida directamente.

La manifestación instalada de HORTIMAX iniciaba en `/mapa`, precisamente la ruta profunda que el borde publicado devolvió como 404. Se corrigió `start_url` a `/`, que sí entrega el portal y redirige de forma interna al acceso cuando no existe una sesión. Sumado al límite de carga de autenticación, esto evita tanto el 404 al abrir la instalación como el splash permanente si la consulta de sesión queda suspendida. La validación completa aprobó **140 pruebas** en 55 archivos, con 1 archivo omitido (**141 pruebas** en total), junto con TypeScript y build.

La caché de instalación se actualizó a `hortimax-shell-v4` y ahora, si una navegación controlada recibe una respuesta no exitosa para una ruta de aplicación, devuelve la raíz del portal en lugar de conservar el 404. Las solicitudes de API siguen excluidas de esta regla. La suite completa volvió a aprobar **140 pruebas** en 55 archivos, con 1 archivo omitido (**141 pruebas** en total), junto con TypeScript y build. Falta verificar físicamente que Chrome/PWA adopta el nuevo trabajador y abre el login.

El dominio publicado respondió 404 para `/` durante la comprobación más reciente, pero respondió correctamente el formulario HORTIMAX en `/acceso`. La instalación y las recuperaciones de navegación se ajustaron a esa ruta publicada verificable. Cuando una consulta de sesión permanece cargando, el splash muestra uno de tres estados no sensibles: `HMX-AUTH-CHECK` mientras consulta, `HMX-AUTH-PAUSED` si queda pausada y `HMX-AUTH-TIMEOUT` si supera ocho segundos. La validación completa volvió a aprobar **140 pruebas** en 55 archivos, con 1 archivo omitido (**141 pruebas** en total), más TypeScript y build.

La traza publicada confirmó que `auth.me` responde correctamente con HTTP 200 y usuario nulo en aproximadamente 0,5 segundos desde `/acceso`; no es la consulta de sesión la que bloquea el formulario. La causa encontrada para instalaciones ya existentes era el trabajador de servicio: su precarga incluía `/`, ruta que el borde publicado respondió 404. Eso hace fallar `cache.addAll`, impide instalar el trabajador nuevo y conserva el cliente antiguo. Se actualizó a `hortimax-shell-v5` y su precarga contiene solo `/acceso` y el manifiesto, ambos recursos publicados válidos. Las pruebas completas volvieron a aprobar **140 pruebas** en 55 archivos, con 1 archivo omitido (**141 pruebas** en total), junto con TypeScript y build.

Después de autenticar, `Login` esperaba la generación local del verificador PBKDF2 para habilitar el ingreso offline antes de navegar. Esa tarea es secundaria al login online y puede demorar o no resolver en ciertos navegadores móviles, dejando la interfaz aparentemente cargando. La navegación a `/mapa` y la sesión local ahora se ejecutan inmediatamente después de conservar el aislamiento de cartera; la credencial offline se genera en segundo plano con captura de error. La precarga detallada de clientes continúa ejecutándose después de ingresar mediante el componente de precarga y no bloquea el mapa. La validación completa aprobó **141 pruebas** en 56 archivos, con 1 archivo omitido (**142 pruebas** en total), junto con TypeScript y build.

### Referencias

[1] [Google Maps JavaScript API — Error Messages](https://developers.google.com/maps/documentation/javascript/error-messages)

[2] [Maps SDK for Android — Get an API Key](https://developers.google.com/maps/documentation/android-sdk/get-api-key)
