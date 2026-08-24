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
