# Investigación de mapa offline

La política oficial de teselas de OpenStreetMap no permite usar `tile.openstreetmap.org` como fuente para descargar sistemáticamente teselas y redistribuirlas offline; exige atribución visible y una fuente adecuada para el volumen de la aplicación [1]. OpenStreetMap publica sus datos bajo ODbL y requiere atribución [2].

Para un mapa offline de Paraguay se recomienda preparar datos vectoriales propios basados en OpenStreetMap y empaquetarlos como región offline para Android, usando un motor compatible como MapLibre. Esto permite incluir carreteras, ciudades, departamentos y los puntos de HORTIMAX sin depender de Google Maps. El paquete debe mostrar atribución OSM y definir una política de actualización. La PWA puede conservar un paquete reducido, pero el APK es la opción confiable para un mapa cartográfico completo.

La geometría departamental pública consultada proviene del gist `aVolpe/paraguay.json`, que contiene 18 departamentos en GeoJSON [3]. Se descargó y simplificó localmente para el respaldo territorial actual; para carreteras y ciudades todavía hace falta generar un paquete vectorial OSM completo con una fuente de teselas compatible o autoalojada.

[1]: https://operations.osmfoundation.org/policies/tiles/ "OpenStreetMap Tile Usage Policy"
[2]: https://www.openstreetmap.org/copyright "OpenStreetMap Copyright and License"
[3]: https://gist.github.com/aVolpe/0e1b1e6e25efafa8185d "GeoJson de los departamentos del Paraguay"

Geofabrik ofrece un extracto actualizado de Paraguay en OSM PBF de 147 MB y un paquete experimental vectorial `paraguay-shortbread-1.0.mbtiles` para MapLibre y otros visores MVT [4]. También ofrece GeoPackage de 310 MB. Esto confirma que un mapa cartográfico completo de Paraguay es sustancialmente mayor que el respaldo territorial actual y conviene distribuirlo como paquete descargable para Android, no cargarlo dentro del bundle inicial de la PWA. La fuente indica datos OSM bajo ODbL y atribución a OpenStreetMap Contributors.

[4]: https://download.geofabrik.de/south-america/paraguay.html "Download OpenStreetMap data for Paraguay, Geofabrik"

La documentación de Protomaps confirma que la herramienta `pmtiles` convierte MBTiles a PMTiles mediante `pmtiles convert INPUT.mbtiles OUTPUT.pmtiles`; PMTiles está diseñado para ser leído por MapLibre en el navegador y el nivel máximo de zoom determina el tamaño del archivo [5]. El paquete experimental de Paraguay medido por HTTP tiene 202,948,608 bytes, aproximadamente 194 MiB, por lo que debe ser una descarga explícita y no parte del bundle web inicial.

La arquitectura recomendada es: descargar el paquete una vez con señal desde la app Android, almacenarlo en almacenamiento local de la app, abrirlo con un visor MapLibre/PMTiles cuando no haya red, y volver a Google Maps cuando haya conexión. La PWA puede ofrecer el paquete como descarga opcional, pero el APK es el destino principal para evitar límites de almacenamiento del navegador.

[5]: https://docs.protomaps.com/pmtiles/create "Creating PMTiles, Protomaps Documentation"

## Evidencia de implementación

El archivo Geofabrik completo se descargó con **202.948.608 bytes** y se convirtió correctamente a PMTiles v3. El PMTiles resultante ocupa **174.661.701 bytes**, cubre Paraguay entre zoom 0 y 14 e incluye 186.464 mosaicos direccionables. El APK Android compiló correctamente e incluye el PMTiles sin compresión ZIP para acceso por rangos; su tamaño de prueba es aproximadamente **173 MiB**.

El manifiesto compilado incluye Internet, estado de red y ubicación precisa/aproximada. La lectura directa desde el navegador confirmó una cabecera válida y un mosaico vectorial de 70.238 bytes en el centro de Paraguay. La primera integración MapLibre quedó bloqueada en la carga de fuente con PMTiles 4.5; se alineó a PMTiles 3.2, la versión usada por el ejemplo oficial de MapLibre, para repetir la validación.
