package py.hortimax.portal;

import android.content.Context;
import android.content.res.AssetFileDescriptor;

import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.FileInputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.io.OutputStreamWriter;
import java.net.InetAddress;
import java.net.ServerSocket;
import java.net.Socket;
import java.nio.charset.StandardCharsets;
import java.nio.channels.FileChannel;
import java.util.Locale;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Expone exclusivamente el PMTiles incluido en el APK sobre el loopback local.
 * MapLibre y sus workers entienden HTTP Range de forma nativa; así se evita que
 * el puente JavaScript/Capacitor transporte bytes grandes entre hilos.
 */
final class OfflineMapHttpServer {
    private static final String ASSET_PATH = "public/offline/paraguay-shortbread-1.0.pmtiles";
    private static final String RESOURCE_PATH = "/paraguay-shortbread-1.0.pmtiles";
    private static final int MAX_RANGE_BYTES = 2 * 1024 * 1024;
    private static final Pattern RANGE_PATTERN = Pattern.compile("bytes=(\\d+)-(\\d*)", Pattern.CASE_INSENSITIVE);

    private final Context context;
    private final ExecutorService executor = Executors.newCachedThreadPool();
    private ServerSocket serverSocket;

    OfflineMapHttpServer(Context context) {
        this.context = context.getApplicationContext();
    }

    synchronized void start() throws Exception {
        if (serverSocket != null && !serverSocket.isClosed()) return;
        serverSocket = new ServerSocket(0, 8, InetAddress.getByName("127.0.0.1"));
        executor.execute(this::acceptLoop);
    }

    synchronized String getUrl() throws Exception {
        start();
        return "http://127.0.0.1:" + serverSocket.getLocalPort() + RESOURCE_PATH;
    }

    private void acceptLoop() {
        while (serverSocket != null && !serverSocket.isClosed()) {
            try {
                Socket socket = serverSocket.accept();
                executor.execute(() -> handle(socket));
            } catch (Exception ignored) {
                // Al cerrar la app se cierra el socket; no hay una recuperación remota.
            }
        }
    }

    private void handle(Socket socket) {
        try (Socket client = socket;
             BufferedReader input = new BufferedReader(new InputStreamReader(client.getInputStream(), StandardCharsets.US_ASCII));
             OutputStream output = client.getOutputStream()) {
            String requestLine = input.readLine();
            if (requestLine == null) return;
            String range = null;
            String header;
            while ((header = input.readLine()) != null && !header.isEmpty()) {
                int separator = header.indexOf(':');
                if (separator > 0 && "range".equalsIgnoreCase(header.substring(0, separator).trim())) {
                    range = header.substring(separator + 1).trim();
                }
            }

            String[] request = requestLine.split(" ");
            if (request.length < 2 || !"GET".equals(request[0]) || !RESOURCE_PATH.equals(request[1])) {
                writeHeaders(output, "404 Not Found", 0, null, null);
                return;
            }

            try (AssetFileDescriptor descriptor = context.getAssets().openFd(ASSET_PATH);
                 FileInputStream asset = new FileInputStream(descriptor.getFileDescriptor());
                 FileChannel channel = asset.getChannel()) {
                long total = descriptor.getLength();
                Range requested = parseRange(range, total);
                if (requested == null) {
                    writeHeaders(output, "416 Range Not Satisfiable", 0, null, "bytes */" + total);
                    return;
                }
                int length = (int) (requested.end - requested.start + 1);
                writeHeaders(output, "206 Partial Content", length, "bytes", "bytes " + requested.start + "-" + requested.end + "/" + total);
                channel.position(descriptor.getStartOffset() + requested.start);
                byte[] buffer = new byte[Math.min(32 * 1024, length)];
                int remaining = length;
                while (remaining > 0) {
                    int read = asset.read(buffer, 0, Math.min(buffer.length, remaining));
                    if (read < 0) break;
                    output.write(buffer, 0, read);
                    remaining -= read;
                }
                output.flush();
            }
        } catch (Exception ignored) {
            // La solicitud abortada por MapLibre no compromete el servidor local.
        }
    }

    private Range parseRange(String header, long total) {
        if (header == null) return null;
        Matcher matcher = RANGE_PATTERN.matcher(header);
        if (!matcher.matches()) return null;
        long start = Long.parseLong(matcher.group(1));
        long requestedEnd = matcher.group(2).isEmpty() ? total - 1 : Long.parseLong(matcher.group(2));
        if (start < 0 || start >= total || requestedEnd < start) return null;
        long end = Math.min(requestedEnd, total - 1);
        if (end - start + 1 > MAX_RANGE_BYTES) return null;
        return new Range(start, end);
    }

    private void writeHeaders(OutputStream output, String status, int contentLength, String acceptRanges, String contentRange) throws Exception {
        BufferedWriter writer = new BufferedWriter(new OutputStreamWriter(output, StandardCharsets.US_ASCII));
        writer.write("HTTP/1.1 " + status + "\r\n");
        writer.write("Content-Type: application/octet-stream\r\n");
        writer.write("Content-Length: " + contentLength + "\r\n");
        writer.write("Access-Control-Allow-Origin: *\r\n");
        writer.write("Access-Control-Expose-Headers: Content-Length, Content-Range, ETag\r\n");
        writer.write("Cache-Control: no-store\r\n");
        writer.write("Connection: close\r\n");
        if (acceptRanges != null) writer.write("Accept-Ranges: " + acceptRanges + "\r\n");
        if (contentRange != null) writer.write("Content-Range: " + contentRange + "\r\n");
        writer.write("\r\n");
        writer.flush();
    }

    private static final class Range {
        final long start;
        final long end;

        Range(long start, long end) {
            this.start = start;
            this.end = end;
        }
    }
}
