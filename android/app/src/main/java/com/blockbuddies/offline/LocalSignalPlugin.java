package com.blockbuddies.offline;

import android.content.Context;
import android.net.nsd.NsdManager;
import android.net.nsd.NsdServiceInfo;
import android.net.wifi.WifiManager;
import android.os.Build;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.InetAddress;
import java.net.ServerSocket;
import java.net.Socket;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.concurrent.CopyOnWriteArrayList;

@CapacitorPlugin(name = "LocalSignal")
public class LocalSignalPlugin extends Plugin {
    private static final String SERVICE_TYPE = "_blockbuddies._tcp.";
    private static final String SERVICE_PREFIX = "BlockBuddies-";

    private LocalSignalServer server;
    private NsdManager nsdManager;
    private NsdManager.RegistrationListener registrationListener;
    private WifiManager.MulticastLock multicastLock;

    @PluginMethod
    public void isAvailable(PluginCall call) {
        JSObject result = new JSObject();
        result.put("available", true);
        call.resolve(result);
    }

    @PluginMethod
    public void startHost(PluginCall call) {
        String roomName = cleanRoomName(call.getString("roomName", "BlockBuddies"));
        String offerCode = call.getString("offerCode", "");
        if (offerCode.trim().isEmpty()) {
            call.reject("Missing host offer code.");
            return;
        }

        new Thread(() -> {
            try {
                stopHostInternal();
                server = new LocalSignalServer(roomName, offerCode);
                server.start();
                registerRoom(roomName, server.getPort());

                JSObject result = new JSObject();
                result.put("roomName", roomName);
                result.put("port", server.getPort());
                result.put("serviceName", SERVICE_PREFIX + roomName);
                call.resolve(result);
            } catch (Exception error) {
                stopHostInternal();
                call.reject("Could not start LAN room: " + error.getMessage());
            }
        }, "BlockBuddiesStartHost").start();
    }

    @PluginMethod
    public void stopHost(PluginCall call) {
        stopHostInternal();
        JSObject result = new JSObject();
        result.put("stopped", true);
        call.resolve(result);
    }

    @PluginMethod
    public void getAnswers(PluginCall call) {
        JSObject result = new JSObject();
        JSONArray answers = new JSONArray();
        if (server != null) {
            for (PendingAnswer answer : server.drainAnswers()) {
                JSObject entry = new JSObject();
                entry.put("answerCode", answer.answerCode);
                entry.put("name", answer.name);
                answers.put(entry);
            }
        }
        result.put("answers", answers);
        call.resolve(result);
    }

    @PluginMethod
    public void discoverRooms(PluginCall call) {
        Integer timeoutValue = call.getInt("timeoutMs", 1800);
        int timeoutMs = Math.max(700, Math.min(timeoutValue == null ? 1800 : timeoutValue, 4500));

        new Thread(() -> {
            List<JSObject> rooms = new CopyOnWriteArrayList<>();
            Set<String> roomKeys = Collections.synchronizedSet(new HashSet<>());
            NsdManager manager = getNsdManager();
            if (manager == null) {
                call.reject("Network discovery is unavailable on this device.");
                return;
            }

            acquireMulticastLock();
            NsdManager.DiscoveryListener listener = new NsdManager.DiscoveryListener() {
                @Override
                public void onDiscoveryStarted(String serviceType) {}

                @Override
                public void onServiceFound(NsdServiceInfo serviceInfo) {
                    if (!SERVICE_TYPE.equals(serviceInfo.getServiceType()) || !serviceInfo.getServiceName().startsWith(SERVICE_PREFIX)) {
                        return;
                    }
                    try {
                        manager.resolveService(serviceInfo, new NsdManager.ResolveListener() {
                            @Override
                            public void onResolveFailed(NsdServiceInfo serviceInfo, int errorCode) {}

                            @Override
                            public void onServiceResolved(NsdServiceInfo resolved) {
                                InetAddress host = resolved.getHost();
                                if (host == null || resolved.getPort() <= 0) return;
                                String roomName = roomNameFromService(resolved);
                                String key = host.getHostAddress() + ":" + resolved.getPort();
                                if (!roomKeys.add(key)) return;
                                JSObject room = new JSObject();
                                room.put("roomName", roomName);
                                room.put("host", host.getHostAddress());
                                room.put("port", resolved.getPort());
                                room.put("serviceName", resolved.getServiceName());
                                rooms.add(room);
                            }
                        });
                    } catch (IllegalArgumentException ignored) {
                        // Android may reject overlapping resolve calls; the next discovery pass can recover.
                    }
                }

                @Override
                public void onServiceLost(NsdServiceInfo serviceInfo) {}

                @Override
                public void onDiscoveryStopped(String serviceType) {}

                @Override
                public void onStartDiscoveryFailed(String serviceType, int errorCode) {
                    try {
                        manager.stopServiceDiscovery(this);
                    } catch (Exception ignored) {}
                }

                @Override
                public void onStopDiscoveryFailed(String serviceType, int errorCode) {}
            };

            try {
                manager.discoverServices(SERVICE_TYPE, NsdManager.PROTOCOL_DNS_SD, listener);
                Thread.sleep(timeoutMs);
                try {
                    manager.stopServiceDiscovery(listener);
                } catch (Exception ignored) {}

                JSObject result = new JSObject();
                JSONArray roomArray = new JSONArray();
                for (JSObject room : rooms) roomArray.put(room);
                result.put("rooms", roomArray);
                call.resolve(result);
            } catch (Exception error) {
                call.reject("Could not discover LAN rooms: " + error.getMessage());
            }
        }, "BlockBuddiesDiscoverRooms").start();
    }

    @PluginMethod
    public void getOffer(PluginCall call) {
        String host = call.getString("host", "");
        Integer portValue = call.getInt("port", 0);
        int port = portValue == null ? 0 : portValue;
        if (host.isEmpty() || port <= 0) {
            call.reject("Missing room host.");
            return;
        }

        new Thread(() -> {
            try {
                JSONObject response = httpJson("GET", host, port, "/offer", null);
                JSObject result = new JSObject();
                result.put("offerCode", response.optString("offerCode", ""));
                result.put("roomName", response.optString("roomName", ""));
                call.resolve(result);
            } catch (Exception error) {
                call.reject("Could not load room invite: " + error.getMessage());
            }
        }, "BlockBuddiesGetOffer").start();
    }

    @PluginMethod
    public void sendAnswer(PluginCall call) {
        String host = call.getString("host", "");
        Integer portValue = call.getInt("port", 0);
        int port = portValue == null ? 0 : portValue;
        String answerCode = call.getString("answerCode", "");
        String name = cleanRoomName(call.getString("name", "Guest"));
        if (host.isEmpty() || port <= 0 || answerCode.trim().isEmpty()) {
            call.reject("Missing answer or room host.");
            return;
        }

        new Thread(() -> {
            try {
                JSONObject body = new JSONObject();
                body.put("answerCode", answerCode);
                body.put("name", name);
                httpJson("POST", host, port, "/answer", body.toString());
                JSObject result = new JSObject();
                result.put("sent", true);
                call.resolve(result);
            } catch (Exception error) {
                call.reject("Could not send join request: " + error.getMessage());
            }
        }, "BlockBuddiesSendAnswer").start();
    }

    @Override
    protected void handleOnDestroy() {
        stopHostInternal();
        super.handleOnDestroy();
    }

    private void registerRoom(String roomName, int port) {
        NsdManager manager = getNsdManager();
        if (manager == null) return;
        acquireMulticastLock();

        NsdServiceInfo serviceInfo = new NsdServiceInfo();
        serviceInfo.setServiceName(SERVICE_PREFIX + roomName);
        serviceInfo.setServiceType(SERVICE_TYPE);
        serviceInfo.setPort(port);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            serviceInfo.setAttribute("room", roomName);
            serviceInfo.setAttribute("app", "BlockBuddies");
        }

        registrationListener = new NsdManager.RegistrationListener() {
            @Override
            public void onServiceRegistered(NsdServiceInfo serviceInfo) {}

            @Override
            public void onRegistrationFailed(NsdServiceInfo serviceInfo, int errorCode) {}

            @Override
            public void onServiceUnregistered(NsdServiceInfo serviceInfo) {}

            @Override
            public void onUnregistrationFailed(NsdServiceInfo serviceInfo, int errorCode) {}
        };
        manager.registerService(serviceInfo, NsdManager.PROTOCOL_DNS_SD, registrationListener);
    }

    private void stopHostInternal() {
        if (registrationListener != null && getNsdManager() != null) {
            try {
                getNsdManager().unregisterService(registrationListener);
            } catch (Exception ignored) {}
        }
        registrationListener = null;
        if (server != null) {
            server.stop();
            server = null;
        }
        releaseMulticastLock();
    }

    private NsdManager getNsdManager() {
        if (nsdManager == null) {
            nsdManager = (NsdManager) getContext().getSystemService(Context.NSD_SERVICE);
        }
        return nsdManager;
    }

    private void acquireMulticastLock() {
        if (multicastLock != null && multicastLock.isHeld()) return;
        try {
            WifiManager wifiManager = (WifiManager) getContext().getApplicationContext().getSystemService(Context.WIFI_SERVICE);
            multicastLock = wifiManager.createMulticastLock("blockbuddies-local-signal");
            multicastLock.setReferenceCounted(false);
            multicastLock.acquire();
        } catch (Exception ignored) {}
    }

    private void releaseMulticastLock() {
        try {
            if (multicastLock != null && multicastLock.isHeld()) multicastLock.release();
        } catch (Exception ignored) {}
        multicastLock = null;
    }

    private static String cleanRoomName(String input) {
        String cleaned = input == null ? "" : input.replaceAll("[^A-Za-z0-9 _-]", "").replaceAll("\\s+", " ").trim();
        if (cleaned.isEmpty()) return "BlockBuddies";
        return cleaned.length() > 18 ? cleaned.substring(0, 18) : cleaned;
    }

    private static String roomNameFromService(NsdServiceInfo serviceInfo) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP && serviceInfo.getAttributes().containsKey("room")) {
            return new String(serviceInfo.getAttributes().get("room"), StandardCharsets.UTF_8);
        }
        String serviceName = serviceInfo.getServiceName();
        return serviceName.startsWith(SERVICE_PREFIX) ? serviceName.substring(SERVICE_PREFIX.length()) : serviceName;
    }

    private static JSONObject httpJson(String method, String host, int port, String path, String body) throws Exception {
        URL url = new URL("http://" + host + ":" + port + path);
        HttpURLConnection connection = (HttpURLConnection) url.openConnection();
        connection.setConnectTimeout(2500);
        connection.setReadTimeout(3500);
        connection.setRequestMethod(method);
        connection.setRequestProperty("Accept", "application/json");
        if (body != null) {
            byte[] bytes = body.getBytes(StandardCharsets.UTF_8);
            connection.setDoOutput(true);
            connection.setRequestProperty("Content-Type", "application/json");
            connection.setRequestProperty("Content-Length", String.valueOf(bytes.length));
            try (OutputStream output = connection.getOutputStream()) {
                output.write(bytes);
            }
        }
        int code = connection.getResponseCode();
        BufferedReader reader = new BufferedReader(new InputStreamReader(
                code >= 400 ? connection.getErrorStream() : connection.getInputStream(),
                StandardCharsets.UTF_8));
        StringBuilder response = new StringBuilder();
        String line;
        while ((line = reader.readLine()) != null) response.append(line);
        reader.close();
        if (code >= 400) throw new IOException("HTTP " + code);
        return new JSONObject(response.toString());
    }

    private static final class PendingAnswer {
        final String answerCode;
        final String name;

        PendingAnswer(String answerCode, String name) {
            this.answerCode = answerCode;
            this.name = name;
        }
    }

    private static final class LocalSignalServer {
        private final String roomName;
        private final String offerCode;
        private final List<PendingAnswer> answers = Collections.synchronizedList(new ArrayList<>());
        private ServerSocket serverSocket;
        private Thread thread;
        private volatile boolean running;

        LocalSignalServer(String roomName, String offerCode) {
            this.roomName = roomName;
            this.offerCode = offerCode;
        }

        void start() throws IOException {
            serverSocket = new ServerSocket(0);
            running = true;
            thread = new Thread(this::serve, "BlockBuddiesSignalServer");
            thread.start();
        }

        int getPort() {
            return serverSocket == null ? 0 : serverSocket.getLocalPort();
        }

        List<PendingAnswer> drainAnswers() {
            synchronized (answers) {
                List<PendingAnswer> copy = new ArrayList<>(answers);
                answers.clear();
                return copy;
            }
        }

        void stop() {
            running = false;
            try {
                if (serverSocket != null) serverSocket.close();
            } catch (IOException ignored) {}
        }

        private void serve() {
            while (running && serverSocket != null && !serverSocket.isClosed()) {
                try {
                    Socket socket = serverSocket.accept();
                    new Thread(() -> handle(socket), "BlockBuddiesSignalClient").start();
                } catch (IOException ignored) {
                    if (!running) return;
                }
            }
        }

        private void handle(Socket socket) {
            try (Socket client = socket) {
                BufferedReader reader = new BufferedReader(new InputStreamReader(client.getInputStream(), StandardCharsets.UTF_8));
                String request = reader.readLine();
                if (request == null) return;
                String[] parts = request.split(" ");
                String method = parts.length > 0 ? parts[0] : "";
                String path = parts.length > 1 ? parts[1] : "/";
                int contentLength = 0;
                String header;
                while ((header = reader.readLine()) != null && !header.isEmpty()) {
                    String lower = header.toLowerCase();
                    if (lower.startsWith("content-length:")) {
                        contentLength = Integer.parseInt(header.substring(header.indexOf(':') + 1).trim());
                    }
                }
                char[] bodyChars = new char[Math.max(0, contentLength)];
                int read = 0;
                while (read < contentLength) {
                    int next = reader.read(bodyChars, read, contentLength - read);
                    if (next < 0) break;
                    read += next;
                }
                String body = new String(bodyChars, 0, read);
                if ("OPTIONS".equals(method)) {
                    send(client, 200, "{}");
                } else if ("GET".equals(method) && "/offer".equals(path)) {
                    JSONObject response = new JSONObject();
                    response.put("roomName", roomName);
                    response.put("offerCode", offerCode);
                    send(client, 200, response.toString());
                } else if ("POST".equals(method) && "/answer".equals(path)) {
                    JSONObject payload = new JSONObject(body);
                    answers.add(new PendingAnswer(payload.optString("answerCode", ""), payload.optString("name", "Guest")));
                    send(client, 200, "{\"ok\":true}");
                } else {
                    send(client, 404, "{\"error\":\"not_found\"}");
                }
            } catch (Exception ignored) {
                try {
                    send(socket, 500, "{\"error\":\"server_error\"}");
                } catch (Exception ignoredAgain) {}
            }
        }

        private void send(Socket client, int status, String body) throws IOException {
            byte[] bytes = body.getBytes(StandardCharsets.UTF_8);
            String statusText = status == 200 ? "OK" : status == 404 ? "Not Found" : "Error";
            String headers = "HTTP/1.1 " + status + " " + statusText + "\r\n"
                    + "Content-Type: application/json; charset=utf-8\r\n"
                    + "Access-Control-Allow-Origin: *\r\n"
                    + "Access-Control-Allow-Methods: GET, POST, OPTIONS\r\n"
                    + "Access-Control-Allow-Headers: Content-Type\r\n"
                    + "Content-Length: " + bytes.length + "\r\n"
                    + "Connection: close\r\n\r\n";
            OutputStream output = client.getOutputStream();
            output.write(headers.getBytes(StandardCharsets.UTF_8));
            output.write(bytes);
            output.flush();
        }
    }
}
