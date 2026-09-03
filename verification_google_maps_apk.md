# Verificación de restauración de Google Maps en APK

La captura enviada confirmó que el visor Android nativo reemplazaba la aplicación completa, ocultando la cabecera HORTIMAX, búsqueda, navegación, ficha de cliente y flujo de Nuevo punto. Esa sustitución fue eliminada del recorrido principal.

La pantalla de campo vuelve a usar `ClientMap` y Google Maps de forma incondicional, incluidos clientes, GPS, búsqueda de lugares, selección de pines, capas, desplazamiento y creación de puntos. Se retiraron la detección nativa que abría el visor alternativo, el plugin mapsforge, sus dependencias Android, el paquete cartográfico y el código PWA experimental relacionado.

En ausencia de señal, la aplicación conserva la interfaz HORTIMAX y muestra un aviso breve: Google Maps no puede dibujar sin Internet, pero la cartera previamente sincronizada y las operaciones que la cola offline admita permanecen disponibles. La aplicación ya no abre una pantalla sustituta ni cambia de mapa automáticamente.

El APK con esta arquitectura compila en 5.1 MB, con versión Android `1.0.6` y código 6. La suite aprobó **96 pruebas** en 34 archivos, con una integración opcional omitida, y el chequeo de tipos aprobó. Falta la prueba física del APK v6 con conectividad real.
