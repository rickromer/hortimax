# Verificación — Google Maps directo en APK Android

El origen de la falla del APK era que el cargador de Google Maps de la web usa un proxy administrado para el dominio publicado. Un WebView Capacitor se ejecuta como `http://localhost`, por lo que el proxy no puede identificarlo como la web publicada y el SDK de Maps terminaba mostrando la pantalla “No se pudo cargar el mapa”.

Se configuró una clave directa de Google Maps exclusiva para el build Android. La clave se probó contra **Maps JavaScript API** usando el origen `http://localhost/` y respondió correctamente. El script `cap:sync` inyecta esa clave solo mientras crea los archivos de Capacitor; el build de la web publicada no recibe ni usa esa variable y conserva el proxy existente.

Se construyó `HORTIMAX-Portal-Google-Maps-v7.apk`, de 5.1 MB, con SHA-256 `4d3abbb91a754a200771c585c60db0bc4ea8ab6224d9d338c0da2aa8941d2186`. La suite aprobó **99 pruebas** (una integración opcional omitida), TypeScript y Gradle Android. La siguiente y única comprobación pendiente es abrir v7 con Internet real en el teléfono y verificar mapa, búsqueda, GPS y Nuevo punto.
