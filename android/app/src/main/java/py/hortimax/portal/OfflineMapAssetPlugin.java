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

    @PluginMethod
    public void readRange(PluginCall call) {
        Long offsetValue = call.getLong("offset", -1L);
        Integer lengthValue = call.getInt("length", 0);
        long offset = offsetValue == null ? -1L : offsetValue;
        int length = lengthValue == null ? 0 : lengthValue;

        if (offset < 0 || length <= 0 || length > MAX_RANGE_BYTES) {
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
