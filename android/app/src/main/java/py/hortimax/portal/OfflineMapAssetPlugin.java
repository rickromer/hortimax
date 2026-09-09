package py.hortimax.portal;

import android.content.res.AssetFileDescriptor;
import android.util.Base64;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.FileInputStream;
import java.nio.ByteBuffer;
import java.nio.channels.FileChannel;

/** Lee tramos del PMTiles incluido sin pasar por HTTP Range del WebView. */
@CapacitorPlugin(name = "OfflineMapAsset")
public class OfflineMapAssetPlugin extends Plugin {
    private static final String ASSET_PATH = "public/offline/paraguay-shortbread-1.0.pmtiles";
    private static final int MAX_RANGE_BYTES = 2 * 1024 * 1024;
    private OfflineMapHttpServer localServer;

    /** URL loopback usada únicamente por MapLibre y sus workers para leer el activo local. */
    @PluginMethod
    public void getMapUrl(PluginCall call) {
        try {
            if (localServer == null) localServer = new OfflineMapHttpServer(getContext());
            JSObject result = new JSObject();
            result.put("url", localServer.getUrl());
            call.resolve(result);
        } catch (Exception error) {
            call.reject("No se pudo abrir el mapa local", error);
        }
    }

    @PluginMethod
    public void readRange(PluginCall call) {
        // Capacitor recibe los números JSON del WebView como Integer o Double,
        // no necesariamente como Long. getLong() rechaza esos valores y hacía
        // fallar cada lectura del PMTiles aunque el archivo estuviera incluido.
        Double offsetValue = call.getDouble("offset", -1D);
        Double lengthValue = call.getDouble("length", 0D);
        long offset = offsetValue == null ? -1L : offsetValue.longValue();
        int length = lengthValue == null ? 0 : lengthValue.intValue();

        if (offset < 0 || offsetValue == null || offsetValue != Math.floor(offsetValue)
                || length <= 0 || lengthValue == null || lengthValue != Math.floor(lengthValue)
                || length > MAX_RANGE_BYTES) {
            call.reject("Rango de cartografía inválido");
            return;
        }

        try (AssetFileDescriptor descriptor = getContext().getAssets().openFd(ASSET_PATH);
             FileInputStream input = new FileInputStream(descriptor.getFileDescriptor());
             FileChannel channel = input.getChannel()) {
            long available = descriptor.getLength();
            if (offset >= available) {
                call.reject("Rango de cartografía fuera del archivo");
                return;
            }

            int bytesToRead = (int) Math.min((long) length, available - offset);
            ByteBuffer buffer = ByteBuffer.allocate(bytesToRead);
            channel.position(descriptor.getStartOffset() + offset);
            while (buffer.hasRemaining() && channel.read(buffer) != -1) {
                // Completa el rango solicitado aunque Android devuelva lecturas parciales.
            }

            JSObject result = new JSObject();
            result.put("data", Base64.encodeToString(buffer.array(), Base64.NO_WRAP));
            call.resolve(result);
        } catch (Exception error) {
            call.reject("No se pudo leer la cartografía local", error);
        }
    }
}
