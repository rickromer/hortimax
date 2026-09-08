# MapaClientes PY — TODO

## Base y datos
- [x] Esquema Drizzle: usuarios (con password, rol, estado, zona), sitios, check-ins, notas
- [x] Migración generada y aplicada en la base de datos
- [x] Cuenta administradora inicial disponible para definir credenciales locales

## Autenticación propia (usuario + contraseña)
- [x] Login con nombre de usuario y contraseña (sin OAuth)
- [x] Primer ingreso: el usuario define su propia contraseña antes de entrar
- [x] Sesión por cookie JWT y cierre de sesión
- [x] Middleware de rol admin en el backend

## Backend de negocio
- [x] CRUD de sitios (nombre, tipo/descripción, zona, teléfono, referencia, coordenadas)
- [x] Check-in en sitio con fecha/hora y coordenadas del vendedor
- [x] Notas por sitio con cabecera fecha/hora y texto libre
- [x] Buscador por nombre y filtros por zona, tipo y vendedor
- [x] Vendedor ve solo sus sitios; admin ve todo
- [x] Exportación CSV de sitios, check-ins y notas
- [x] Catálogo configurable de zonas y tipos de cliente

## App móvil del vendedor
- [x] Mapa Google Maps centrado en Paraguay con ubicación GPS en vivo
- [x] Botón "Nuevo sitio" que toma coordenadas GPS actuales
- [x] Detección de sitios cercanos para hacer check-in en lugar de duplicar
- [x] Ficha de sitio: datos, historial de check-ins y planilla de notas
- [x] Alta rápida de nota con cabecera automática de fecha/hora
- [x] Listado de mis sitios con buscador y filtros
- [x] Navegación inferior mobile-first

## Panel de administración
- [x] Mapa global con todos los sitios y filtros
- [x] Tabla de sitios con buscador, filtros y acceso a detalle
- [x] Gestión de usuarios: crear, activar/desactivar, reiniciar contraseña
- [x] Vista de actividad de vendedores (check-ins y notas recientes)
- [x] Métricas resumen (sitios, check-ins, notas, vendedores activos)
- [x] Exportación a CSV compatible con Google Sheets

## Estilo y calidad
- [x] Sistema visual premium (paleta, tipografía, tokens) en index.css
- [x] Interfaz completamente en español
- [x] Pruebas Vitest de autenticación, contraseñas, CSV y reglas geográficas
- [x] Pruebas de integración reales de sitios, check-ins y notas con MariaDB aislado
- [x] Verificación visual en móvil y escritorio
- [x] Verificación de Google Maps en la vista previa pública (SDK y lienzo de mapa cargados)

## Ajustes solicitados después del preliminar
- [x] Corregir solapamientos de botones, controles flotantes y navegación en vistas móviles y desktop
- [x] Permitir asignar cada cliente a uno o varios comerciales desde la administración
- [x] Restringir listados, mapa, detalle, check-ins y exportaciones de cada comercial a su cartera asignada
- [x] Presentar notas exclusivamente dentro de la ficha del cliente y mantener su relación visible con el cliente
- [x] Verificar y corregir controles y acciones en detalle de cliente, administración y usuarios en móvil y escritorio
- [x] Adaptar la actividad administrativa para no exponer una planilla global de notas fuera de los clientes
- [x] Verificar que toda consulta de notas navegue y muestre el cliente relacionado
- [x] Verificar en escritorio detalle de cliente, usuarios, actividad y controles de mapa tras los ajustes responsive
- [x] Revisar explícitamente en escritorio mapa admin, detalles, usuarios y actividad; documentar layout y solapamientos
- [x] Documentar por pantalla los resultados de la revisión responsive de escritorio

## Puntos y ubicación compartible
- [x] Reemplazar la etiqueta visible “Nuevo sitio” por “Nuevo punto” en la experiencia de campo
- [x] Permitir crear un punto mediante GPS, selección manual en el mapa o ingreso de coordenadas
- [x] Mostrar el modo de ubicación elegido y la precisión cuando se use GPS
- [x] Añadir acciones para abrir cada punto en Google Maps y Waze
- [x] Añadir compartir por WhatsApp y Web Share cuando el dispositivo lo soporte
- [x] Verificar e implementar la captura de toque en el mapa para elegir el punto manual
- [x] Verificar el flujo Elegir en mapa → coordenadas → formulario de punto

## Selector centrado de ubicación
- [x] Corregir el botón Nuevo punto para abrir el selector de ubicación sin depender de GPS ni de un toque inicial
- [x] Implementar un pin fijo en el centro del mapa mientras el usuario desplaza el mapa
- [x] Confirmar la posición central elegida y abrir el formulario con esas coordenadas
- [x] Conservar una acción opcional para centrar el selector en el GPS actual

## Marca HORTIMAX y próximos relevamientos
- [x] Subir y usar el logo HORTIMAX en los encabezados de campo y administración
- [x] Cambiar el nombre visible a Portal de Seguimiento a Clientes
- [x] Crear tabla, migración y permisos de próximos relevamientos vinculados a cada cliente
- [x] Permitir cargar descripción y fecha de próximo relevamiento desde la ficha del cliente
- [x] Mostrar próximos relevamientos en la ficha y en el panel administrativo

## Consulta pública temporal
- [x] Permitir ver libremente mapa, puntos, fichas, notas y próximos relevamientos sin inicio de sesión
- [x] Retirar redirecciones de acceso y controles de cuenta en el recorrido público
- [x] Ocultar o bloquear acciones de edición, check-in, agenda y administración para visitantes
- [x] Verificar que el modo público no permita modificar datos

## Botón de nuevo punto en móvil
- [x] Reemplazar el CTA móvil de Nuevo punto por un botón flotante compacto con símbolo +
- [x] Mantener el botón visible sobre la navegación inferior y conservar etiqueta accesible
- [x] Verificar que el botón abra el selector de ubicación en móvil
- [x] Definir que el botón + permita altas sin sesión durante el modo público temporal
- [x] Verificar el flujo público del botón + y selector de ubicación sobre la navegación inferior en móvil

## Carga pública temporal y limpieza futura
- [x] Habilitar el botón + y el flujo completo de alta de puntos sin sesión
- [x] Marcar los puntos creados públicamente para facilitar su limpieza posterior
- [x] Retirar el texto Mapa de puntos del encabezado de campo
- [x] Preparar una acción administrativa protegida para limpiar datos de prueba públicos
- [x] Verificar que solo la administración pueda ejecutar la limpieza futura
- [x] Probar en móvil público el tap sobre + y la apertura del selector por encima de la navegación inferior
- [x] Validar de punta a punta selector → formulario → creación pública y limpieza posterior de un punto de prueba
- [x] Enviar desde la interfaz pública un punto de prueba y confirmar el resultado visible
- [x] Limpiar únicamente el punto público de prueba creado en la validación de interfaz

## Incidencia de acceso
- [x] Diagnosticar por qué no se puede acceder al dominio publicado o a la vista previa
- [x] Restaurar el servicio publicado sin perder la versión vigente
- [x] Verificar acceso externo por dominio y vista previa después de la corrección
- [x] Documentar el resultado del diagnóstico de producción y la causa probable de la incidencia temporal
- [x] Confirmar nuevamente que la raíz publicada y la vista previa respondan después de la sincronización
- [x] Guardar y confirmar el diagnóstico de acceso temporal, la acción correctiva y las respuestas HTTP 200

## Selector y zona automática de puntos
- [x] Mostrar el selector de ubicación como pantalla completa en móvil y escritorio
- [x] Ofrecer vista satelital y mapa normal dentro del selector
- [x] Completar zona automáticamente desde el pin: distrito/municipio y, en ausencia, departamento
- [x] Permitir editar manualmente la zona automática antes de registrar el punto
- [x] Actualizar ejemplos del formulario a Invernadero López y productor de tomate

## Corrección visual del selector de ubicación
- [x] Eliminar el recuadro del diálogo y abrir una capa realmente a pantalla completa
- [x] Evitar márgenes, transformación de centrado y desbordamiento fuera del viewport móvil
- [x] Verificar en viewport móvil real que el mapa y los controles queden dentro de la pantalla

## Identidad visual y referencias satelitales
- [x] Aplicar los cuatro colores corporativos amarillo, rojo, verde y turquesa como tokens de interfaz
- [x] Añadir referencias y etiquetas útiles sobre el modo satelital del mapa
- [x] Incorporar una leyenda de tipos de punto y un panel de capas claro
- [x] Dar mayor presencia visual a encabezados, puntos, controles y estados de interfaz
- [x] Verificar contraste y legibilidad de la nueva identidad en móvil y escritorio
- [x] Verificar en escritorio franja corporativa, panel de referencias, pines y controles del mapa
- [x] Capturar evidencia del modo satelital híbrido con referencias visibles y panel de capas desplegado en escritorio

## Referencias en el selector de ubicación
- [x] Cambiar el selector de satélite puro a satélite híbrido con nombres, rutas y lugares
- [x] Ajustar el control del selector para aclarar que el modo satelital conserva referencias
- [x] Verificar interactivamente que al alternar el selector aparezcan referencias sobre la imagen satelital
- [x] Documentar referencias concretas visibles en la captura del selector híbrido
- [x] Confirmar en el documento de verificación la etiqueta visible del modo híbrido

## Notas, exportación y recordatorios
- [x] Diagnosticar y habilitar la creación de notas en el modo de uso actual
- [x] Guardar fecha, hora e historial cronológico de cada nota dentro del cliente
- [x] Añadir exportación CSV de notas compatible con Google Sheets
- [x] Agregar tipo Recordatorio a la agenda de próximos relevamientos
- [x] Verificar altas, historial, exportación y recordatorios en móvil y escritorio
- [x] Verificar en escritorio la creación de notas, historial y agenda de recordatorios
- [x] Probar desde la interfaz el botón Sheets y confirmar la descarga de la planilla
- [x] Documentar la evidencia específica de escritorio y exportación en la verificación
- [x] Confirmar físicamente el archivo CSV descargado por el botón Sheets en escritorio
- [x] Confirmar en el documento de verificación la evidencia de nota, recordatorio y exportación
- [x] Guardar y releer la evidencia final de escritorio para notas, recordatorios y Sheets

## Corrección de notas, visitas y GPS
- [x] Diagnosticar y corregir el fallo actual de creación de notas
- [x] Añadir una casilla para registrar visita al guardar una nota desde el cliente
- [x] Guardar fecha, hora y ubicación de la visita cuando el GPS esté disponible
- [x] Solicitar ubicación automáticamente al abrir el mapa en celular y centrar la vista
- [x] Mostrar y habilitar Mi ubicación en la vista general del mapa público
- [x] Verificar notas y visitas en móvil y escritorio
- [x] Confirmar en un celular físico el permiso de ubicación del navegador y el centrado GPS automático
- [x] Verificar en escritorio nota con visita vinculada e historial de ambos registros
- [x] Documentar la evidencia específica de escritorio de nota → visita vinculada
- [x] Guardar y releer la evidencia de escritorio de nota → visita vinculada
- [x] Confirmar en una computadora física el permiso de ubicación y el centrado automático del mapa
- [x] Confirmar en escritorio que Mi ubicación recentre el mapa después de moverlo

## Ajuste de categorías de notas
- [x] Reemplazar Aplicación por Visita técnica en las categorías sugeridas
- [x] Reemplazar Aplicación por Visita técnica en el catálogo persistido de notas
- [x] Reemplazar textos visibles restantes de Aplicación en formularios y ayudas de notas
- [x] Verificar que el selector de categoría muestre Visita técnica en la interfaz

## Favicon HORTIMAX
- [x] Generar un favicon cuadrado basado en el isologo HORTIMAX
- [x] Preparar una versión de alta resolución adecuada para la configuración del portal
- [x] Entregar el archivo y las instrucciones para cargarlo como favicon
- [x] Verificar visualmente el favicon final generado y su fidelidad al isologo HORTIMAX
- [x] Confirmar en navegador las referencias favicon y apple-touch-icon de la aplicación
- [x] Entregar la URL final del favicon y los pasos de carga en Settings → General
- [x] Verificar en navegador que favicon y apple-touch-icon resuelvan correctamente
- [x] Documentar evidencia directa de los cuatro trazos corporativos del favicon
- [x] Entregar explícitamente la URL final y pasos de Settings → General al usuario
- [x] Verificar con navegador automatizado las relaciones favicon y apple-touch-icon del documento publicado
- [x] Capturar y documentar los cuatro trazos corporativos visibles del favicon final
- [x] Guardar una evidencia explícita del favicon publicado, sus cuatro trazos y la URL final en la verificación
- [x] Registrar una referencia visual persistente al favicon final para revisión futura
- [x] Guardar una evidencia explícita del favicon publicado, sus cuatro trazos y la URL final en la verificación
- [x] Registrar una referencia visual persistente al favicon final para revisión futura

## Agrupación territorial por departamento
- [x] Incorporar el departamento político como clasificación principal de cada cliente
- [x] Mantener distrito o municipio como referencia local secundaria del cliente
- [x] Migrar o corregir los datos existentes afectados, incluido R.I. 3 Corrales → Caaguazú
- [x] Cambiar los filtros y listados para agrupar por departamento
- [x] Cubrir la nueva regla territorial con pruebas y validación visual

## Calendario público del equipo
- [x] Añadir un tercer menú inferior llamado Calendario
- [x] Consolidar visitas, próximas visitas y notas de todo el equipo en una vista pública
- [x] Organizar la agenda cronológicamente y distinguir cada tipo de actividad
- [x] Permitir abrir la ficha del cliente desde cada registro del calendario
- [x] Cubrir el calendario con pruebas y verificación visual móvil y escritorio
- [x] Mostrar un estado de error con reintento si no se puede cargar el calendario público
- [x] Verificar el manejo de error de la consulta de calendario
- [x] Verificar en la interfaz el error real del calendario público y el botón Reintentar
- [x] Probar en interfaz el estado de error público de Calendario con la consulta fallida
- [x] Verificar que el botón Reintentar del calendario ejecute refetch al pulsarlo

## Corrección de selector de Nuevo punto
- [x] Evitar que lecturas GPS posteriores vuelvan a centrar el selector durante la elección manual
- [x] Conservar el centrado GPS únicamente al abrir o al pulsar explícitamente Usar GPS
- [x] Cubrir la regla de no recentering con pruebas y validación móvil/escritorio

## Edición de clientes, acceso y privilegios
- [x] Diagnosticar y reparar la edición básica de clientes
- [x] Habilitar acceso real con usuario y contraseña
- [x] Definir roles Administrador, Gerente comercial y Representante de campo
- [x] Permitir designar más administradores y gerentes desde la gestión de usuarios
- [x] Delimitar y verificar el acceso total del Gerente comercial en la operación de clientes
- [x] Dar a Representante de campo visibilidad total y edición solo de sus propios puntos
- [x] Verificar con cuentas reales inicio de sesión, edición y restricciones de cada rol
- [x] Probar desde la interfaz la edición como propietario, gerente comercial y usuario sin permiso
- [x] Cubrir en pruebas las rutas operativas y la edición de clientes por Gerente comercial

## Incidencia de carga posterior a acceso y privilegios
- [x] Diagnosticar por qué el sitio no completa la carga en producción
- [x] Corregir la causa de la carga bloqueada y verificar la vista previa
- [x] Confirmar que el dominio publicado vuelve a mostrar acceso o aplicación correctamente
- [x] Verificar explícitamente la vista previa después de la recuperación TLS/proxy
- [x] Documentar que la recuperación dependió del certificado/proxy externo y no de un cambio de código

## Nueva incidencia de acceso intermitente
- [x] Diagnosticar el estado actual del dominio publicado y la vista previa
- [x] Determinar si el fallo es de TLS/proxy externo o de carga de la aplicación
- [x] Recuperar o escalar la disponibilidad estable del portal
- [x] Confirmar con navegador que el acceso vuelve a funcionar
- [x] Verificar explícitamente la vista previa durante la incidencia actual
- [x] Confirmar con comprobaciones repetidas que no hubo recuperación técnica pendiente y que el login obligatorio explica el cambio de acceso

## Retorno temporal al acceso directo
- [x] Retirar la redirección obligatoria a acceso en mapa, clientes, fichas y calendario
- [x] Restaurar temporalmente las acciones de operación de campo sin usuario
- [x] Mantener la administración y gestión de usuarios protegidas
- [x] Verificar acceso directo público y bloqueo de administración

## Ocultación temporal de login
- [x] Retirar el botón Ingresar de la cabecera pública
- [x] Conservar las rutas, pantalla y credenciales de login para reactivación futura
- [x] Verificar que la interfaz pública no muestre acceso visible al login

## Confirmación de página pública
- [x] Confirmar que mapa, clientes, fichas y calendario abren sin sesión en el dominio publicado
- [x] Confirmar que no quede ningún acceso visible de login en el recorrido público
- [x] Conservar la autenticación únicamente como mecanismo interno para reactivación futura

## Edición pública temporal de clientes
- [x] Mostrar la acción Editar en la ficha pública de cliente
- [x] Permitir que la actualización básica de datos del cliente funcione sin sesión temporalmente
- [x] Mantener Administración, Usuarios y acciones de borrado protegidos
- [x] Probar la edición pública de un cliente sin habilitar cambios administrativos

## Corrección de borrado en edición de cliente
- [x] Diagnosticar por qué los campos de texto no permiten borrar su contenido
- [x] Permitir editar, reemplazar y vaciar campos de texto en el formulario
- [x] Cubrir el borrado de texto con una prueba de interfaz

## Nuevo punto desde la vista actual del mapa
- [x] Conservar el centro visible actual del mapa general al abrir Nuevo punto
- [x] Priorizar la vista manual del mapa sobre la ubicación GPS para el centro inicial del selector
- [x] Mantener Mi ubicación como acción explícita dentro del selector
- [x] Cubrir con prueba el flujo mover mapa → Nuevo punto → selector centrado en la vista

## Visor unificado y búsqueda de Google Maps
- [x] Añadir una barra compacta de búsqueda de lugares de Google Maps dentro del visor principal
- [x] Restringir y priorizar resultados de búsqueda en Paraguay
- [x] Convertir Nuevo punto en un modo dentro del mapa existente, sin abrir selector de ventana adicional
- [x] Mostrar pin fijo, confirmar/cancelar y Mi ubicación dentro del modo Nuevo punto
- [x] Conectar la ubicación confirmada al formulario de datos del cliente
- [x] Probar búsqueda de lugar, movimiento manual y alta de punto en móvil y escritorio

## Simplificación de controles de Nuevo punto
- [x] Quitar Mi ubicación redundante del modo Nuevo punto
- [x] Mantener el control principal de Mi ubicación del mapa disponible
- [x] Verificar que el modo Nuevo punto conserve solo Cancelar y Usar esta ubicación

## Territorio automático por ubicación
- [x] Determinar Departamento y Distrito/Municipio únicamente mediante geocodificación del pin
- [x] Bloquear la edición manual de Departamento y Distrito/Municipio en el formulario
- [x] Actualizar el territorio automáticamente al cambiar la ubicación del punto
- [x] Identificar clientes existentes sin Departamento o Distrito/Municipio reconocido
- [x] Completar el territorio de los clientes existentes a partir de sus coordenadas
- [x] Probar campos bloqueados y clasificación automática en creación y edición

## Eliminación administrativa de clientes
- [x] Preparar una eliminación completa de cliente y sus datos vinculados solo para Administrador
- [x] Añadir confirmación explícita antes de eliminar desde Administración
- [x] Mantener la acción invisible e inaccesible para página pública, Gerente comercial y Representante
- [x] Cubrir con pruebas el permiso y la limpieza de datos vinculados

## Disponibilidad de eliminación para Administrador
- [x] Confirmar que la ficha administrativa muestre la acción Eliminar cliente
- [x] Confirmar que la acción requiera una confirmación explícita antes de borrar
- [x] Confirmar que el control no se muestre fuera de Administración

## Categoría Comentario en notas
- [x] Añadir Comentario al catálogo y los valores por defecto de categorías de notas
- [x] Mostrar Comentario en el selector de categoría de nota
- [x] Cubrir la nueva categoría con pruebas y datos existentes

## Rediseño de Calendario
- [x] Reemplazar pestañas grandes por controles compactos adecuados para escritorio
- [x] Añadir una vista mensual real con indicadores de visitas, próximos y notas por día
- [x] Permitir seleccionar un día del mes para filtrar el resumen de actividades
- [x] Separar calendario, filtros y resumen cronológico de actividad
- [x] Verificar el rediseño en escritorio y móvil

## Corrección de inicio de sesión
- [x] Mostrar siempre Iniciar sesión al abrir la ruta `/acceso`
- [x] Evitar que Configuración inicial aparezca solo por navegar a `/acceso`
- [x] Reservar la configuración inicial para el parámetro explícito de mantenimiento `?setup=1`
- [x] Probar el acceso normal y confirmar la continuidad del restablecimiento de contraseña

## Inicio principal en acceso
- [x] Redirigir la raíz `/` a `/acceso` para visitantes sin sesión
- [x] Mantener las rutas operativas accesibles después del inicio de sesión
- [x] Verificar que el dominio publicado abra la pantalla de login como primera vista

## Referencias de mapa de solo lectura
- [x] Desactivar las ventanas emergentes de negocios y lugares locales en el mapa
- [x] Mantener visibles rutas, nombres y referencias sin exponer acciones de compartir
- [x] Verificar en mapa general, ficha y selector de punto la lectura pasiva de referencias
- [x] Confirmar en el dominio publicado que los negocios locales no abran ventanas ni acciones al tocarlos
- [x] Verificar o descartar la carga intermitente del mapa observada en la captura de vista previa
- [x] Reintentar automáticamente la carga del SDK de Google Maps tras un fallo transitorio
- [x] Ofrecer una acción visible para reintentar el mapa cuando el SDK no se recupere solo

## Incidencia de enlace en Chrome
- [x] Comprobar en Chrome el estado HTTPS y la redirección del dominio publicado
- [x] Identificar si el enlace falla por certificado/proxy o por la carga de la aplicación
- [x] Recuperar la estabilidad del enlace publicado tras la propagación de DNS
- [x] Confirmar en Chrome que el enlace abre el portal correctamente

## Incidencia DNS NXDOMAIN
- [x] Comprobar la resolución DNS de mapaclientes-cqpci7xz.manus.space desde redes independientes
- [x] Determinar si el subdominio publicado requiere propagación o una corrección de plataforma
- [x] Determinar que no fue necesaria escalación tras estabilizarse la resolución DNS
- [x] Dar al usuario un enlace de acceso alternativo mientras el DNS se estabilizaba

## Corrección de barra horizontal nativa
- [x] Quitar el control superior artificial de desplazamiento
- [x] Mantener una barra nativa horizontal visible antes de llegar a la última fila
- [x] Sincronizar la barra visible con el desplazamiento de las columnas
- [x] Verificar y publicar la barra nativa corregida

## Corrección visual del logo HORTIMAX
- [x] Auditar el logo en acceso, vistas de campo y administración
- [x] Corregir proporción, recorte y contraste del logo según cada fondo
- [x] Verificar en móvil y escritorio y publicar la mejora visual

## Logo móvil y autoría de actividad
- [x] Reparar la carga del logo HORTIMAX en encabezados móviles
- [x] Mostrar el autor de cada nota en su historial de cliente
- [x] Mostrar el autor de notas y recordatorios en el calendario del equipo
- [x] Probar en móvil y escritorio y publicar las correcciones

## Fidelidad del isologo HORTIMAX
- [x] Retirar el respaldo vectorial que modifica el isologo original
- [x] Mantener únicamente el archivo original de marca en todas las cabeceras
- [x] Verificar y publicar la restauración fiel del isologo

## Proporción del isologo original aportado
- [x] Alojar exactamente el archivo original entregado por el usuario
- [x] Ajustar las cabeceras para que el wordmark horizontal no se comprima ni recorte
- [x] Verificar en móvil y escritorio y publicar la corrección

## Agrupación inteligente de puntos en el mapa
- [x] Agrupar clientes cercanos para evitar superposición de pines
- [x] Mostrar el total de clientes dentro de cada agrupación
- [x] Expandir o acercar el mapa al tocar una agrupación
- [x] Conservar pines individuales y selección al acercar el zoom
- [x] Probar con una distribución densa de clientes y publicar la mejora

## Simplificación del visor de mapa
- [x] Retirar la tarjeta “Estás cerca del sitio registrado”
- [x] Retirar el botón Check-in rápido contenido en esa tarjeta
- [x] Verificar y publicar el mapa sin la tarjeta de cercanía

## Responsable visible de actividad
- [x] Eliminar el respaldo “Equipo HORTIMAX” de notas, visitas y recordatorios
- [x] Resolver y mostrar nombre y apellido del usuario creador en cada actividad
- [x] Mostrar claramente “Sin responsable registrado” solo en datos históricos sin usuario
- [x] Probar y publicar la trazabilidad en ficha, calendario y actividad administrativa

## Administración: historial de actividad operativo
- [x] Retirar el menú y la ruta administrativa de Mapa general redundante
- [x] Unificar visitas, notas y recordatorios en Actividad administrativa
- [x] Añadir búsqueda por cliente, contenido y responsable
- [x] Añadir filtros de tipo, responsable y rango de fechas
- [x] Mostrar responsable, cliente, fecha y detalle para cada actividad histórica
- [x] Probar y publicar el historial administrativo completo

## Archivo recuperable confirmado para Representante
- [x] Hacer visible la acción de archivar en la ficha de un punto propio
- [x] Confirmar que un representante pueda archivar solo sus propios puntos
- [x] Mantener bloqueado el archivo de puntos ajenos y preservar la Papelera administrativa

## Cierre de sesión seguro
- [x] Redirigir explícitamente a `/acceso` al cerrar sesión
- [x] Bloquear `/sitios` y las demás rutas operativas cuando no haya sesión
- [x] Probar cierre de sesión y acceso directo a una ruta operativa

## Cartera exclusiva de Representante comercial
- [x] Limitar listados y mapa del Representante a clientes creados por él
- [x] Bloquear el acceso directo a fichas de clientes ajenos para Representante
- [x] Mantener visibilidad total para Gerente comercial y Administrador
- [x] Probar y publicar el aislamiento de cartera por rol

## Corrección de Vista de campo y acceso
- [x] Evitar que Vista de campo desde Administración cierre o pierda la sesión
- [x] Confirmar que el acceso a campo preserve la sesión administrativa existente
- [x] Dejar solo el título en el panel visual del login, retirando el texto descriptivo
- [x] Probar y publicar la navegación y el acceso simplificado

## Simplificación de acciones en listado de clientes
- [x] Retirar el botón directo Check-in de cada tarjeta de cliente
- [x] Enlazar la acción visible a la ficha del cliente y sus notas
- [x] Probar y publicar el listado simplificado

## Google Sheets por cliente Productor
- [x] Revisar la conexión disponible con Google Sheets y Drive
- [x] Definir una única planilla permanente por Productor en el Drive del administrador
- [x] Crear o vincular una hoja de Sheets por cada cliente Productor desde Notas
- [x] Mostrar el acceso a Sheets solo en fichas de tipo Productor
- [x] Probar y publicar el flujo de Sheets por cliente

## Creación automática de Sheets por Productor
- [x] Configurar una autorización de Google válida para la aplicación publicada
- [x] Crear la planilla desde el botón “+” y guardarla en el Drive personal autorizado
- [x] Persistir el identificador del archivo para reutilizar la misma planilla del Productor
- [x] Restringir la visibilidad del acceso a usuarios que ya pueden ver ese Productor
- [x] Probar y publicar la creación automática de la planilla

## Cambio a cuenta personal de Google
- [x] Retirar la conexión actual de Google Workspace corporativa
- [x] Preparar autorización OAuth con la cuenta personal de Google del usuario
- [x] Crear las planillas de Productores en el Drive personal autorizado

## OAuth y planillas personales — implementación
- [x] Persistir de forma cifrada la autorización renovable de Google y el vínculo Productor → planilla
- [x] Implementar inicio y retorno OAuth con validación anti-CSRF, limitado al administrador
- [x] Crear o reutilizar de forma idempotente la planilla única de cada Productor
- [x] Mostrar Crear planilla o Abrir planilla en Notas solo para Productores autorizados
- [x] Cubrir permisos, reutilización y configuración OAuth con pruebas automatizadas

## Corrección de retorno OAuth publicado
- [x] Usar el origen público reenviado en lugar de la URL interna de Cloud Run
- [x] Probar que la solicitud OAuth usa la URI pública registrada en Google

## Acceso simplificado a planillas para el equipo
- [x] Mostrar Conectar o Crear planilla únicamente al administrador
- [x] Mostrar a los demás usuarios autorizados solo Abrir planilla cuando ya exista

## Responsive y operación offline en campo
- [x] Auditar y corregir desbordamientos horizontales en las vistas móviles existentes
- [x] Incorporar manifest e instalación PWA para celulares Android y escritorio compatible
- [x] Cachear la carcasa de la aplicación y recursos seguros sin almacenar secretos
- [x] Permitir registrar notas, visitas y nuevos puntos sin conexión
- [x] Encolar operaciones offline con identificadores idempotentes y sincronizarlas al recuperar señal
- [x] Mostrar estado de conexión, pendientes y errores de sincronización al vendedor
- [x] Cubrir responsive, cola offline y reintentos con pruebas automatizadas
- [x] Validar en viewport móvil y publicar la mejora

> Alcance offline: el mapa de Google y la búsqueda de lugares requieren conexión; la captura de datos y la consulta de clientes previamente almacenados podrán funcionar sin señal. La sincronización se realizará cuando vuelva Internet.

## Correcciones reportadas — formulario y cartera por representante
- [x] Corregir el estado del formulario al cerrar Nuevo cliente para que las fichas sigan abriendo normalmente
- [x] Verificar que la navegación a fichas de clientes funcione después de cancelar el alta
- [x] Mostrar en Administración qué clientes creó cada representante
- [x] Permitir consultar la cartera creada por Nelson y por cada representante sin depender de un único nombre
- [x] Probar y publicar ambas correcciones

## Navegación ficha → mapa principal
- [x] Añadir acción Ver en mapa principal dentro de la ficha del cliente
- [x] Pasar coordenadas e identificador del cliente al mapa principal
- [x] Centrar y seleccionar el cliente al abrir /mapa
- [x] Cubrir y publicar la navegación contextual

## Planilla en ficha administrativa de Productor
- [x] Mostrar la planilla permanente también dentro de Administración → Clientes → Notas
- [x] Validar la ficha administrativa y publicar el ajuste

## Revisión integral solicitada por el usuario
- [x] Auditar nuevamente todos los flujos del portal frente a los pedidos acumulados
- [x] Verificar responsive en fichas, calendario, clientes, administración y mapa en viewport móvil
- [x] Sustituir la prueba del visor offline experimental por la verificación del APK Google Maps v7
- [x] Corregir cualquier diferencia entre lo implementado y lo informado al usuario
- [x] Preparar un informe completo y honesto antes del próximo checkpoint

## Aplicación instalable offline y APK Android
- [x] Auditar la PWA y la cola offline actuales frente al uso real en campo
- [x] Permitir abrir la aplicación y consultar datos previamente sincronizados sin Internet
- [x] Garantizar captura offline de nuevos puntos, notas, visitas y relevamientos con reintentos idempotentes
- [x] Mostrar claramente pendientes, sincronización, conflictos y errores al vendedor
- [x] Mejorar manifest, iconos, instalación y actualización de la PWA
- [x] Definir y preparar el empaquetado Android instalable tipo APK
- [x] Retirar de esta entrega la prueba del mapa offline experimental; se conserva la cola offline y se valida Google Maps conectado en APK v7
- [x] Publicar la versión web/PWA y entregar el procedimiento de instalación APK

## Dominio corporativo y configuración de marca
- [x] Mantener `mapaclientes-cqpci7xz.manus.space` como dominio activo; se difiere la vinculación de `crm.fcg.com.py`
- [x] Configurar nombre visible Portal de Seguimiento a Clientes HORTIMAX
- [x] Mantener el isologo HORTIMAX original y favicon en el dominio Manus activo
- [x] Mantener URI OAuth y API del APK en el dominio Manus activo hasta una migración futura
- [x] Verificar HTTPS, login, planillas y PWA en el dominio Manus activo

## Autenticación offline por dispositivo
- [x] Auditar el flujo actual de login, sesión y cierre de sesión offline
- [x] Persistir de forma local y protegida la identidad de usuarios que ya iniciaron sesión
- [x] Permitir reingreso offline solo en dispositivos previamente autorizados
- [x] Evitar que un usuario nuevo o un dispositivo no autorizado entre sin servidor
- [x] Mantener expiración, cierre de sesión y revocación al recuperar conexión
- [x] Cubrir autenticación offline, aislamiento de roles y sincronización posterior
- [x] Probar y publicar el flujo, dejando pendiente la confirmación en teléfono real

## Acceso persistente por usuario y teléfono
- [x] Mantener la sesión del usuario en su teléfono después del primer acceso online
- [x] Permitir apertura y reingreso offline sin volver a escribir la contraseña
- [x] Vincular la credencial local a un identificador único de instalación/dispositivo
- [x] Conservar roles y cartera del usuario durante el modo offline
- [x] Revocar y limpiar el acceso al cerrar sesión explícitamente o desde Administración
- [x] Cubrir acceso automático, dispositivo nuevo y cambio de contraseña con pruebas

## Corrección tras prueba real sin señal
- [x] Mantener la sesión y la identidad al cerrar y reabrir la PWA o APK
- [x] Precargar automáticamente todos los clientes permitidos para el rol antes de salir a campo
- [x] Precargar fichas y actividad necesaria para consulta offline
- [x] Mostrar mapa offline de Paraguay con puntos sincronizados cuando Google Maps no tenga red
- [x] Mantener Google Maps, búsqueda y referencias completas cuando vuelva la conectividad
- [x] Reemplazar el mapa alternativo por Google Maps conectado y conservar la captura offline sin sustituir la interfaz

## Mapa offline cartográfico completo
- [x] Sustituir la vista territorial simplificada por un mapa offline con carreteras, ciudades, departamentos y referencias de Paraguay
- [x] Seleccionar una fuente cartográfica compatible con uso offline y su licencia
- [x] Empaquetar el mapa para Android sin depender de Google Maps ni de red
- [x] Mantener los puntos de clientes sincronizados sobre el mapa offline
- [x] Definir el tamaño y el nivel de detalle del paquete para evitar una descarga excesiva
- [x] Validar visualmente rutas y ciudades sin red mediante el modo offline local; queda pendiente la prueba en teléfono real

## Mapa offline completo aprobado
- [x] Descargar y preparar el paquete vectorial completo de Paraguay, hasta aproximadamente 250 MB
- [x] Integrar carreteras, ciudades, departamentos y referencias en el APK
- [x] Superponer los clientes sincronizados y conservar captura offline
- [x] Compilar y validar técnicamente el APK; queda pendiente probar instalación y modo avión en el teléfono del usuario

## Incidencia crítica: mapa offline APK no operativo
- [x] Diagnosticar el arranque y la carga real de la cartografía en Android
- [x] Corregir la lectura del mapa local y el cambio automático a modo sin señal
- [x] Reconstruir un APK con la corrección y verificar contenido, permisos y tamaño
- [x] Retirar el APK v4 y su mapa alternativo por no cumplir el requerimiento de experiencia Google Maps

## Mapa offline navegable para PWA
- [x] Reemplazar el respaldo territorial básico de Chrome/PWA por cartografía vectorial navegable
- [x] Descargar el paquete completo de Paraguay bajo demanda y guardarlo en el dispositivo
- [x] Mostrar progreso, almacenamiento ocupado y la opción de actualizar o eliminar el mapa local
- [x] Usar rutas, ciudades, departamentos y clientes en la PWA sin señal
- [x] Retirar del flujo operativo PWA el mapa experimental y sus controles manuales; el modo completo se entrega en APK nativo

## Corrección de visor offline vacío
- [x] Corregir el render de calles, ciudades y rutas desde el archivo local de la PWA
- [x] Mostrar un estado de error accionable si el visor local no puede cargar cartografía
- [x] Permitir minimizar o cerrar el panel de mapa descargado sin eliminar el paquete
- [x] Sustituir el visor PWA no fiable por el visor mapsforge nativo dentro del APK

## Visor nativo Android tipo Google Maps sin señal
- [x] Reemplazar el visor PWA de respaldo por un motor Android nativo con gestos fluidos
- [x] Cargar automáticamente la cartografía local completa desde el APK al no haber señal
- [x] Mantener arrastre, zoom, pellizco, brújula, ubicación actual y pines interactivos
- [x] Sincronizar pines de clientes permitidos con el visor Android sin exponer otra cartera
- [x] Quitar botones y paneles manuales de mapa sin señal del flujo operativo
- [x] Compilar y validar el nuevo APK antes de prueba física

## Corrección crítica de APK: login y marca
- [x] Diagnosticar la conexión del APK al portal publicado y la validación de usuario
- [x] Corregir la autenticación del APK sin debilitar cookies ni permisos por rol
- [x] Restaurar el isologo HORTIMAX original dentro del APK
- [x] Reconstruir y validar técnicamente el instalador con login y marca correctos

## Regresión crítica: interfaz y mapa en APK
- [x] Retirar la sustitución automática por el visor nativo que reemplaza cabecera, comandos y navegación
- [x] Mantener Google Maps y la interfaz HORTIMAX completa en Android mientras exista conectividad verificable
- [x] Conservar clientes, GPS, búsqueda, selección y Nuevo punto dentro de la interfaz principal del APK
- [x] Mantener la cola y consulta offline sin sustituir toda la pantalla por un mapa alternativo
- [ ] Probar físicamente el APK v7 con Google Maps conectado, login, búsqueda, GPS y Nuevo punto

## Corrección aislada: Google Maps en APK
- [x] Mantener congelada la lógica de mapa de la versión web estable
- [x] Configurar una clave Google Maps directa y restringida para el origen local del APK
- [x] Aplicar la clave solo durante la compilación Android
- [x] Compilar y validar técnicamente el APK conectado con Google Maps, búsqueda, GPS y comandos completos

## Corrección visual y activación de Google Maps Android
- [x] Retirar el recuadro superior de “Sin señal” que tapa la interfaz
- [x] Mantener solo el indicador discreto de cola offline cuando corresponda
- [x] Activar facturación de Google Maps Platform en el proyecto de la clave Android
- [ ] Validar Google Maps sin la marca “For development purposes only” en el APK

## Centrado de mapa y retorno desde ficha
- [x] Centrar en GPS solo al iniciar una sesión nueva
- [x] Conservar la vista o cliente enfocado al volver desde Ver ficha
- [x] Mantener Mi ubicación como única acción manual de recentrado posterior
- [ ] Verificar retorno de ficha y selección de cliente en móvil y escritorio

## Corrección de usuarios de prueba y autoría histórica
- [x] Auditar todos los registros creados por Prueba 1 y Prueba 2
- [x] Reasignar registros de Prueba 1 a Luis David y retirar el usuario de prueba
- [x] Reasignar registros de Prueba 2 a Nelson Galarza y retirar el usuario de prueba
- [x] Verificar que clientes, notas, visitas y recordatorios muestren la autoría corregida

## Cierre de versión consolidada
- [x] Ejecutar la suite de regresión, chequeo de tipos y compilación web final
- [x] Compilar el APK Android con la clave de Maps inyectada solo durante el build
- [x] Inspeccionar el paquete Android sin incorporar secretos ni activos grandes al repositorio
- [ ] Realizar prueba física conectada final del APK: acceso, mapa, búsqueda, GPS, clientes, check-in y Nuevo punto
- [x] Corregir la persistencia IndexedDB cuando la caché contenga valores no serializables

## Sesión persistente por dispositivo único
- [x] Confirmar y ajustar la vigencia de sesión posterior al primer acceso online
- [x] Mantener el reingreso automático solo en la instalación previamente autorizada
- [x] Conservar cierre de sesión y revocación administrativa como forma de retirar el acceso
- [x] Cubrir y validar el cierre/reapertura de la app sin volver a pedir credenciales

## Operación offline completa por dispositivo
- [ ] Auditar sesión, cartera, fichas, notas, visitas, recordatorios, calendario y mapa local disponibles sin señal
- [ ] Confirmar que cada alta o edición offline se encola sin duplicados y se sincroniza automáticamente
- [ ] Aislar la caché de cada usuario y limpiar datos al cerrar o revocar sesión
- [ ] Validar físicamente el ciclo completo: uso con modo avión y sincronización posterior

## Requisito operativo offline prioritario
- [ ] Precargar automáticamente el mapa local y los datos autorizados al entrar con Internet
- [ ] Abrir HORTIMAX sin señal con GPS, mapa local, cartera, fichas e historial previamente consultado
- [ ] Permitir crear puntos, notas, visitas y recordatorios offline desde la misma interfaz
- [ ] Sincronizar automáticamente las operaciones idempotentes y refrescar la cartera al recuperar señal
- [ ] Corregir cualquier corte responsive sin modificar campos, textos, validaciones ni datos de formularios

## APK actualizado de entrega
- [x] Recompilar el instalador Android desde la versión consolidada vigente
- [x] Verificar logo original, cargador Google Maps y exclusión del APK del repositorio
- [x] Entregar el APK actualizado para la prueba física en teléfono

## Ícono Android con isotipo HORTIMAX
- [x] Reemplazar los recursos de ícono Android por el favicon isotipo publicado
- [x] Verificar los tamaños de launcher y el manifiesto Android
- [x] Recompilar y entregar el APK con el isotipo original como ícono

## Navegación desde mapa en Clientes
- [x] Hacer táctil la miniatura de mapa dentro de la ficha del cliente
- [x] Mostrar opciones para ver el punto en mapa principal, Google Maps o Waze
- [x] Validar la interacción en la ficha móvil sin retirar los accesos existentes

## Incidencia crítica: cartografía offline vacía en APK
- [x] Diagnosticar por qué el modo sin señal muestra pines pero no el mapa de fondo
- [x] Corregir la carga automática de cartografía local sin modificar la web
- [x] Compilar un APK aislado y verificar que incluya los recursos de mapa requeridos
- [ ] Confirmar físicamente el mapa sin conexión en un teléfono antes de cerrar el incidente

## Navegación offline con Google Maps oficial (descartada por decisión de producto)
- [x] Evaluar apertura externa de Google Maps cuando HORTIMAX no tenga señal
- [x] Descartar apertura externa: el mapa debe permanecer dentro de HORTIMAX
- [x] Reemplazar esta alternativa por cartografía local en la misma pantalla del APK

## Mapa offline integrado en HORTIMAX
- [x] Mantener la interfaz HORTIMAX dentro del APK al perder señal
- [x] Mostrar calles, rutas, ciudades y pines de la cartera sin conexión
- [x] Regresar automáticamente a Google Maps integrado cuando vuelva Internet
- [x] No abrir una aplicación externa ni modificar el mapa web
- [x] Empaquetar PMTiles sin compresión para permitir lectura local por rangos en Android

## Visor offline completo dentro de HORTIMAX
- [ ] Renderizar un mapa vial OSM completo, no una microvista ni un fondo simplificado
- [ ] Mantener pantalla completa, arrastre, pellizco, zoom, GPS, pines y selección de punto sin señal
- [ ] Conservar Google Maps e híbrido únicamente al existir conexión
- [ ] No descargar, clonar ni cachear cartografía o imágenes Google dentro del APK

## Administración móvil y puntos archivados
- [x] Compactar y hacer responsive la distribución por departamento en Administración
- [x] Normalizar departamentos duplicados o traducidos, incluido “Caaguazú Department”
- [x] Retirar la tarjeta técnica redundante de configuración de Mapa
- [x] Hacer visible el acceso a puntos archivados y su recuperación dentro de Administración
- [x] Verificar que el archivo conserve datos y no ejecute una eliminación definitiva

## Regresión física APK offline — septiembre 2026
- [ ] Verificar que la web publicada conserve Google Maps y fichas operativas antes de tocar Android
- [ ] Corregir el visor offline Android que muestra pines sobre un fondo vacío
- [ ] Corregir la apertura offline de fichas previamente sincronizadas
- [ ] Añadir pruebas de regresión para archivo PMTiles local y recuperación de detalle offline
- [ ] Compilar y confirmar físicamente el APK reparado con modo avión, sin modificar la web

## Reanudación de cartografía offline integrada
- [x] Sustituir la lectura HTTP por rangos por lectura local del PMTiles empaquetado
- [x] Corregir el renderizado de calles y rutas bajo los pines sin conexión
- [ ] Probar modo avión: mapa, zoom, pines y ficha previamente sincronizada

## Regresión física APK 1.0.15 sin señal
- [x] Diagnosticar la incompatibilidad del WebView con rangos de activos y reemplazarla por lectura nativa
- [x] Evitar que el aviso offline cubra los controles de selección y creación de punto
- [ ] Verificar físicamente nuevo punto y cartografía con modo avión antes de entregar otro APK

## Corrección de arranque del puente offline Android
- [x] Registrar OfflineMapAsset antes de que Capacitor cree el puente WebView
- [x] Compilar el APK 1.0.18 con el lector nativo y el aviso compacto
- [ ] Verificar en teléfono que aparezcan calles, rutas y controles de nuevo punto sin señal

## Regresión física APK 1.0.18
- [x] Corregir el formulario de Nuevo punto que se desborda horizontalmente en móvil
- [x] Corregir la conversión de rangos del mapa offline desde el WebView Android
- [ ] Validar operación offline completa: crear punto, ver cartera y sincronizar al recuperar señal

## Regresión crítica APK conectado — septiembre 2026
- [x] Diagnosticar por qué el APK no carga correctamente aun con conexión
- [x] Verificar API, autenticación móvil y cargador directo de Google Maps sin exponer claves
- [x] Corregir solo el empaquetado o ruta Android necesaria, sin modificar la web estable
- [ ] Compilar y confirmar físicamente el APK conectado antes de retomar el modo offline

## Regresión crítica APK conectado — septiembre 2026
- [x] Diagnosticar por qué el APK no carga correctamente aun con conexión
- [x] Verificar API, autenticación móvil y cargador directo de Google Maps sin exponer claves
- [x] Corregir solo el empaquetado o ruta Android necesaria, sin modificar la web estable
- [ ] Compilar y confirmar físicamente el APK conectado antes de retomar el modo offline

## Corrección de toque en miniatura de ficha
- [x] Evitar que Google Maps embebido capture el toque destinado a ir al punto
- [x] Abrir de forma fiable las opciones de navegación al tocar la miniatura
- [ ] Validar y publicar la interacción corregida en móvil

## Diagnóstico APK conectado confirmado
- [x] Corregir inicio de sesión Android que no llega a la API aun con Internet
- [x] Corregir carga de clientes Android posterior al acceso conectado
- [ ] Verificar en teléfono el flujo acceso → mapa → clientes antes de reparar el modo offline

## Revisión de transporte Android tras prueba física fallida
- [x] Instrumentar la respuesta de verificación de usuario sin exponer credenciales
- [x] Distinguir fallo de red, CORS, certificado, API o formato de respuesta en el APK
- [x] Corregir el transporte Android validado por evidencia y recompilar una versión nueva

## Corrección de ir al punto desde ficha
- [x] Navegar directamente al mapa principal con el identificador del cliente
- [x] Enfocar y seleccionar el punto solicitado sin abrir un diálogo intermedio
- [ ] Validar el recorrido ficha → mapa en móvil antes de publicar

## Corrección integral de foco ficha → mapa
- [x] Detectar por qué el mapa principal no consume o no encuentra el `siteId` recibido
- [x] Restaurar centro, zoom y selección del cliente solicitado en el mapa principal
- [x] Cubrir el recorrido completo desde la ficha con pruebas de parámetro y navegación
- [ ] Validar físicamente el recorrido ficha → mapa en móvil

## Diagnóstico físico de ficha → mapa persistente
- [x] Instrumentar el toque, la ruta emitida y el foco consumido por el mapa
- [x] Reproducir la causa en la dependencia de la lista cargada y el estado de ruta
- [x] Corregir el foco con un destino persistente independiente de la lista
- [ ] Validar físicamente el recorrido completo con el APK 1.0.12

## Zoom al punto elegido desde ficha
- [x] Aplicar zoom de detalle al cliente seleccionado al abrir el mapa principal
- [x] Conservar el centrado GPS solamente para inicio de sesión y acción manual
- [ ] Validar físicamente el foco y zoom desde la ficha en móvil

## Foco ficha → mapa exclusivo de Android
- [x] Diagnosticar por qué Capacitor no conserva la solicitud de foco de la ficha
- [x] Transferir el punto y zoom mediante un mecanismo compatible con Android
- [ ] Compilar y confirmar físicamente que el APK iguala el recorrido web

## Datos y operaciones offline por dispositivo
- [x] Aislar la caché y cola offline por usuario autorizado en el teléfono
- [x] Limpiar datos operativos locales al cerrar sesión o revocar el dispositivo
- [x] Conservar la cola pendiente cuando el mismo usuario vuelve a ingresar
- [x] Encolar de forma idempotente las ediciones de clientes realizadas sin señal
- [x] Verificar la precarga de ficha, notas, visitas y recordatorios antes de perder señal
- [x] Actualizar automáticamente la precarga cuando la cartera cambie o vuelva la conexión

## Incidencia física APK 1.0.20 — mapa y formulario
- [x] Corregir el visor Android sin señal que muestra pines pero no las calles del mapa local
- [x] Ajustar Nuevo punto para que use el ancho disponible y permita desplazarse por todo el formulario en Android
- [x] Cubrir ambas correcciones con pruebas y recompilar un APK aislado sin tocar la web estable
- [ ] Confirmar físicamente mapa vial y formulario corregido en el teléfono

## Bloqueo confirmado APK 1.0.21 — mosaicos invisibles
- [x] Trazar la lectura Android del PMTiles, la descompresión MVT y las capas vectoriales realmente entregadas a MapLibre
- [x] Sustituir la ruta que mantiene el fondo vacío por un render local comprobable sin alterar Google Maps web
- [x] Recompilar el APK solo después de verificar mosaicos y calles locales
- [ ] Probar físicamente el APK recompilado con modo avión antes de entregar como resuelto

## Incidencia conectada APK 1.0.22 — Google Maps Android rechazado
- [x] Separar de forma verificable el estado de red Android del cambio entre Google Maps y mapa local
- [x] Sustituir el Google Maps JavaScript en Android conectado por el SDK nativo, que no depende del origen WebView rechazado
- [ ] Probar físicamente los modos conectado y modo avión como recorridos independientes

## Comportamiento definitivo de cartografía Android
- [x] Usar Google Maps normal mediante SDK nativo únicamente cuando la conexión sea utilizable
- [x] Usar OSM local vial con referencias, pines, pan y zoom únicamente sin conexión
- [ ] Confirmar ambos modos en teléfono antes de declararlos disponibles
