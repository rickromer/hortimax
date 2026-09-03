package py.hortimax.portal;

import android.content.Context;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.Path;
import android.graphics.drawable.BitmapDrawable;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.TextView;

import androidx.appcompat.widget.AppCompatButton;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import org.json.JSONObject;
import org.mapsforge.core.graphics.Bitmap;
import org.mapsforge.core.model.LatLong;
import org.mapsforge.map.android.graphics.AndroidGraphicFactory;
import org.mapsforge.map.android.util.AndroidUtil;
import org.mapsforge.map.datastore.MapDataStore;
import org.mapsforge.map.layer.cache.TileCache;
import org.mapsforge.map.layer.overlay.Marker;
import org.mapsforge.map.layer.renderer.TileRendererLayer;
import org.mapsforge.map.model.MapViewPosition;
import org.mapsforge.map.reader.MapFile;
import org.mapsforge.map.rendertheme.internal.MapsforgeThemes;
import org.mapsforge.map.android.view.MapView;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;

/**
 * Visor cartográfico offline de Android. El archivo .map va dentro del APK y se
 * copia una sola vez al almacenamiento privado para lectura aleatoria de mapsforge.
 */
@CapacitorPlugin(name = "OfflineNativeMap")
public class OfflineNativeMapPlugin extends Plugin {
    private FrameLayout overlay;
    private MapView mapView;
    private TileCache tileCache;
    private MapDataStore mapDataStore;
    private final List<Marker> markers = new ArrayList<>();
    private boolean mapReady = false;

    @PluginMethod
    public void show(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            try {
                ensureOverlay();
                if (!mapReady) initializeMap();
                updateMarkers(call.getArray("markers", new JSArray()));
                centerMap(call);
                overlay.setVisibility(View.VISIBLE);
                call.resolve();
            } catch (Exception error) {
                call.reject("No se pudo abrir el mapa offline de Paraguay", error);
            }
        });
    }

    @PluginMethod
    public void hide(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            if (overlay != null) overlay.setVisibility(View.GONE);
            call.resolve();
        });
    }

    private void ensureOverlay() {
        if (overlay != null) return;
        Context context = getActivity();
        overlay = new FrameLayout(context);
        overlay.setBackgroundColor(Color.rgb(245, 248, 244));

        LinearLayout shell = new LinearLayout(context);
        shell.setOrientation(LinearLayout.VERTICAL);
        shell.setBackgroundColor(Color.rgb(250, 250, 247));
        FrameLayout.LayoutParams shellParams = new FrameLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.MATCH_PARENT
        );
        overlay.addView(shell, shellParams);

        LinearLayout header = new LinearLayout(context);
        header.setGravity(Gravity.CENTER_VERTICAL);
        header.setPadding(dp(18), 0, dp(10), 0);
        header.setBackgroundColor(Color.rgb(18, 116, 92));
        TextView title = new TextView(context);
        title.setText("HORTIMAX · Mapa sin señal");
        title.setTextColor(Color.WHITE);
        title.setTextSize(17);
        title.setTypeface(null, android.graphics.Typeface.BOLD);
        header.addView(title, new LinearLayout.LayoutParams(0, dp(58), 1));
        AppCompatButton newPoint = new AppCompatButton(context);
        newPoint.setText("＋");
        newPoint.setTextColor(Color.WHITE);
        newPoint.setTextSize(28);
        newPoint.setAllCaps(false);
        newPoint.setBackgroundColor(Color.TRANSPARENT);
        newPoint.setContentDescription("Nuevo punto en el centro del mapa");
        newPoint.setOnClickListener(view -> chooseCurrentMapCenter());
        header.addView(newPoint, new LinearLayout.LayoutParams(dp(54), dp(58)));
        AppCompatButton close = new AppCompatButton(context);
        close.setText("Volver");
        close.setTextColor(Color.WHITE);
        close.setAllCaps(false);
        close.setBackgroundColor(Color.TRANSPARENT);
        close.setOnClickListener(view -> dismissToPortal());
        header.addView(close, new LinearLayout.LayoutParams(dp(90), dp(58)));
        shell.addView(header, new LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT, dp(58)
        ));

        mapView = new MapView(context);
        mapView.setClickable(true);
        mapView.setBuiltInZoomControls(true);
        mapView.getMapScaleBar().setVisible(true);
        shell.addView(mapView, new LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT, 0, 1f
        ));
        ((ViewGroup) getActivity().findViewById(android.R.id.content)).addView(overlay);
    }

    private void initializeMap() throws IOException {
        AndroidGraphicFactory.createInstance(getActivity().getApplication());
        File mapFile = copyMapAsset();
        tileCache = AndroidUtil.createTileCache(
            getContext(),
            "hortimax-native-map-cache",
            mapView.getModel().displayModel.getTileSize(),
            1f,
            mapView.getModel().frameBufferModel.getOverdrawFactor()
        );
        mapDataStore = new MapFile(mapFile);
        MapViewPosition position = mapView.getModel().mapViewPosition;
        TileRendererLayer baseLayer = new TileRendererLayer(
            tileCache,
            mapDataStore,
            position,
            AndroidGraphicFactory.INSTANCE
        );
        baseLayer.setXmlRenderTheme(MapsforgeThemes.MOTORIDER);
        mapView.getLayerManager().getLayers().add(baseLayer);
        mapView.setCenter(new LatLong(-23.4425, -58.4438));
        mapView.setZoomLevel((byte) 7);
        mapReady = true;
    }

    private File copyMapAsset() throws IOException {
        File destination = new File(getContext().getFilesDir(), "offline/paraguay.map");
        File parent = destination.getParentFile();
        if (parent != null && !parent.exists()) parent.mkdirs();
        if (destination.exists() && destination.length() > 100_000_000) return destination;
        try (InputStream input = getContext().getAssets().open("public/offline/paraguay.map");
             FileOutputStream output = new FileOutputStream(destination)) {
            byte[] buffer = new byte[64 * 1024];
            int read;
            while ((read = input.read(buffer)) != -1) output.write(buffer, 0, read);
        }
        if (destination.length() < 100_000_000) {
            throw new IOException("El paquete cartográfico de Paraguay está incompleto");
        }
        return destination;
    }

    private void updateMarkers(JSArray entries) {
        for (Marker marker : markers) mapView.getLayerManager().getLayers().remove(marker);
        markers.clear();
        for (int index = 0; index < entries.length(); index++) {
            try {
                JSONObject item = entries.getJSONObject(index);
                int id = item.getInt("id");
                double latitude = item.getDouble("latitude");
                double longitude = item.getDouble("longitude");
                String name = item.optString("name", "Cliente");
                boolean selected = item.optBoolean("selected", false);
                ClientMarker marker = new ClientMarker(
                    new LatLong(latitude, longitude),
                    createPin(selected ? Color.rgb(16, 161, 163) : Color.rgb(38, 142, 84)),
                    id,
                    name
                );
                markers.add(marker);
                mapView.getLayerManager().getLayers().add(marker);
            } catch (Exception ignored) {
                // Un pin inválido nunca debe impedir abrir el mapa en campo.
            }
        }
    }

    private void centerMap(PluginCall call) {
        JSObject focus = call.getObject("focus");
        JSObject userPosition = call.getObject("userPosition");
        JSObject target = focus != null ? focus : userPosition;
        if (target == null) return;
        double latitude = target.optDouble("latitude", -23.4425);
        double longitude = target.optDouble("longitude", -58.4438);
        if (!Double.isFinite(latitude) || !Double.isFinite(longitude)) return;
        mapView.setCenter(new LatLong(latitude, longitude));
        mapView.setZoomLevel((byte) 14);
    }

    private Bitmap createPin(int color) {
        int width = dp(34);
        int height = dp(46);
        android.graphics.Bitmap canvasBitmap = android.graphics.Bitmap.createBitmap(width, height, android.graphics.Bitmap.Config.ARGB_8888);
        Canvas canvas = new Canvas(canvasBitmap);
        Paint paint = new Paint(Paint.ANTI_ALIAS_FLAG);
        paint.setColor(color);
        canvas.drawCircle(width / 2f, dp(16), dp(13), paint);
        Path tip = new Path();
        tip.moveTo(width / 2f - dp(9), dp(23));
        tip.lineTo(width / 2f + dp(9), dp(23));
        tip.lineTo(width / 2f, dp(43));
        tip.close();
        canvas.drawPath(tip, paint);
        paint.setColor(Color.WHITE);
        canvas.drawCircle(width / 2f, dp(16), dp(5), paint);
        return AndroidGraphicFactory.convertToBitmap(new BitmapDrawable(getContext().getResources(), canvasBitmap));
    }

    private void dismissToPortal() {
        if (overlay != null) overlay.setVisibility(View.GONE);
        notifyListeners("dismissed", new JSObject());
    }

    private void chooseCurrentMapCenter() {
        if (mapView == null) return;
        LatLong center = mapView.getModel().mapViewPosition.getCenter();
        JSObject event = new JSObject();
        event.put("latitude", center.latitude);
        event.put("longitude", center.longitude);
        notifyListeners("chooseLocation", event);
        dismissToPortal();
    }

    private int dp(int value) {
        return Math.round(value * getContext().getResources().getDisplayMetrics().density);
    }

    @Override
    protected void handleOnDestroy() {
        if (mapView != null) mapView.destroyAll();
        if (tileCache != null) tileCache.destroy();
        if (mapDataStore != null) mapDataStore.close();
        AndroidGraphicFactory.clearResourceMemoryCache();
        super.handleOnDestroy();
    }

    private class ClientMarker extends Marker {
        private final int siteId;
        private final String siteName;

        ClientMarker(LatLong position, Bitmap bitmap, int id, String name) {
            super(position, bitmap, 0, -dp(23));
            this.siteId = id;
            this.siteName = name;
        }

        @Override
        public boolean onTap(LatLong tapLatLong, org.mapsforge.core.model.Point layerXY, org.mapsforge.core.model.Point tapXY) {
            JSObject event = new JSObject();
            event.put("id", siteId);
            event.put("name", siteName);
            notifyListeners("markerTap", event);
            return true;
        }
    }
}
