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
- [ ] Confirmar en un celular físico el permiso de ubicación del navegador y el centrado GPS automático
- [x] Verificar en escritorio nota con visita vinculada e historial de ambos registros
- [x] Documentar la evidencia específica de escritorio de nota → visita vinculada
- [x] Guardar y releer la evidencia de escritorio de nota → visita vinculada
- [ ] Confirmar en una computadora física el permiso de ubicación y el centrado automático del mapa
- [ ] Confirmar en escritorio que Mi ubicación recentre el mapa después de moverlo

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
- [ ] Cubrir la regla de no recentering con pruebas y validación móvil/escritorio

## Edición de clientes, acceso y privilegios
- [x] Diagnosticar y reparar la edición básica de clientes
- [x] Habilitar acceso real con usuario y contraseña
- [x] Definir roles Administrador, Gerente comercial y Representante de campo
- [x] Permitir designar más administradores y gerentes desde la gestión de usuarios
- [x] Delimitar y verificar el acceso total del Gerente comercial en la operación de clientes
- [x] Dar a Representante de campo visibilidad total y edición solo de sus propios puntos
- [ ] Verificar con cuentas reales inicio de sesión, edición y restricciones de cada rol
- [ ] Probar desde la interfaz la edición como propietario, gerente comercial y usuario sin permiso
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

## Referencias de mapa de solo lectura
- [x] Desactivar las ventanas emergentes de negocios y lugares locales en el mapa
- [x] Mantener visibles rutas, nombres y referencias sin exponer acciones de compartir
- [ ] Verificar en mapa general, ficha y selector de punto la lectura pasiva de referencias
- [ ] Confirmar en el dominio publicado que los negocios locales no abran ventanas ni acciones al tocarlos
- [ ] Verificar o descartar la carga intermitente del mapa observada en la captura de vista previa
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
