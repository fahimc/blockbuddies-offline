package com.blockbuddies.offline;

import android.content.SharedPreferences;
import android.content.pm.PackageInfo;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.Window;
import android.view.WindowInsets;
import android.view.WindowInsetsController;
import android.view.WindowManager;
import android.webkit.CookieManager;
import android.webkit.WebStorage;
import android.webkit.WebView;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private static final String PREFS_NAME = "blockbuddies_native";
    private static final String WEB_CACHE_BUILD_KEY = "web_cache_build";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        registerPlugin(LocalSignalPlugin.class);
        clearStaleWebViewDataForThisBuild();
        super.onCreate(savedInstanceState);
        enterImmersiveMode();
    }

    @Override
    public void onResume() {
        super.onResume();
        enterImmersiveMode();
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) {
            enterImmersiveMode();
        }
    }

    private void enterImmersiveMode() {
        Window window = getWindow();
        window.addFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            WindowManager.LayoutParams attributes = window.getAttributes();
            attributes.layoutInDisplayCutoutMode =
                    WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES;
            window.setAttributes(attributes);
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            window.setDecorFitsSystemWindows(false);
            WindowInsetsController controller = window.getInsetsController();
            if (controller != null) {
                controller.hide(WindowInsets.Type.statusBars() | WindowInsets.Type.navigationBars());
                controller.setSystemBarsBehavior(
                        WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
            }
            return;
        }

        View decorView = window.getDecorView();
        decorView.setSystemUiVisibility(
                View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                        | View.SYSTEM_UI_FLAG_FULLSCREEN
                        | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                        | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                        | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                        | View.SYSTEM_UI_FLAG_LAYOUT_STABLE);
    }

    private void clearStaleWebViewDataForThisBuild() {
        String buildKey = getInstalledBuildKey();
        SharedPreferences prefs = getSharedPreferences(PREFS_NAME, MODE_PRIVATE);
        if (buildKey.equals(prefs.getString(WEB_CACHE_BUILD_KEY, ""))) {
            return;
        }

        try {
            WebView webView = new WebView(this);
            webView.clearCache(true);
            webView.clearHistory();
            webView.clearFormData();
            webView.destroy();
        } catch (Exception ignored) {
            // WebView can be unavailable in some test contexts.
        }

        try {
            WebStorage.getInstance().deleteAllData();
        } catch (Exception ignored) {
            // Best-effort cleanup for stale service worker/cache storage.
        }

        try {
            CookieManager cookieManager = CookieManager.getInstance();
            cookieManager.removeAllCookies(null);
            cookieManager.flush();
        } catch (Exception ignored) {
            // Cookies are not required for offline play.
        }

        prefs.edit().putString(WEB_CACHE_BUILD_KEY, buildKey).apply();
    }

    private String getInstalledBuildKey() {
        try {
            PackageInfo packageInfo = getPackageManager().getPackageInfo(getPackageName(), 0);
            long versionCode =
                    Build.VERSION.SDK_INT >= Build.VERSION_CODES.P
                            ? packageInfo.getLongVersionCode()
                            : packageInfo.versionCode;
            return packageInfo.versionName + ":" + versionCode;
        } catch (Exception ignored) {
            return "unknown";
        }
    }
}
