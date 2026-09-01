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
- [ ] Verificar offline real en celular: abrir, capturar, cerrar y sincronizar al recuperar señal
- [x] Corregir cualquier diferencia entre lo implementado y lo informado al usuario
- [x] Preparar un informe completo y honesto antes del próximo checkpoint

## Aplicación instalable offline y APK Android
- [x] Auditar la PWA y la cola offline actuales frente al uso real en campo
- [x] Permitir abrir la aplicación y consultar datos previamente sincronizados sin Internet
- [x] Garantizar captura offline de nuevos puntos, notas, visitas y relevamientos con reintentos idempotentes
- [x] Mostrar claramente pendientes, sincronización, conflictos y errores al vendedor
- [x] Mejorar manifest, iconos, instalación y actualización de la PWA
- [x] Definir y preparar el empaquetado Android instalable tipo APK
- [ ] Probar el ciclo sin señal y sincronización al recuperar conectividad en un dispositivo real
- [x] Publicar la versión web/PWA y entregar el procedimiento de instalación APK
