#!/usr/bin/env node
/**
 * Adds the on-device Dutch speech recogniser to the generated Android project.
 *
 * `npx cap add android` produces a bare WebView shell; this script makes it able to
 * listen. It is idempotent and safe to run on every build:
 *
 *   1. writes a small Capacitor plugin that unpacks the Vosk model from assets once and
 *      runs recognition on the microphone;
 *   2. registers that plugin in MainActivity;
 *   3. adds the two Gradle dependencies Vosk needs.
 *
 * If `android/app/src/main/assets/model-nl` is missing (a build without the 39 MB model),
 * the plugin still compiles and reports `ready: false`, so the app simply hides the
 * microphone instead of failing. The manifest permission is added by
 * `scripts/patch-android-manifest.py`, which owns every manifest edit.
 *
 * Usage: node scripts/android-speech.mjs [path/to/android]
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const root = resolve(process.argv[2] ?? "android");
const appId = "com.taal.app";
const packagePath = appId.split(".").join("/");
const javaDir = join(root, "app/src/main/java", packagePath);
const assetsDir = join(root, "app/src/main/assets/model-nl");

const PLUGIN = `package ${appId};

import android.Manifest;
import android.content.res.AssetManager;
import android.os.Handler;
import android.os.Looper;

import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

import org.json.JSONObject;
import org.vosk.LibVosk;
import org.vosk.LogLevel;
import org.vosk.Model;
import org.vosk.Recognizer;
import org.vosk.android.RecognitionListener;
import org.vosk.android.SpeechService;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * Dutch speech recognition, offline, on the phone.
 *
 * The Vosk model ships inside the APK's assets. Vosk cannot read a compressed asset
 * directly, so the first call unpacks it into the app's files directory (marked with a
 * file, so it happens once), then loads a Model. Recognition runs on Vosk's own audio
 * thread; nothing is uploaded and the microphone is released on stop.
 *
 * Written by scripts/android-speech.mjs. Do not edit the generated copy.
 */
@CapacitorPlugin(
    name = "DutchSpeech",
    permissions = { @Permission(alias = "microphone", strings = { Manifest.permission.RECORD_AUDIO }) }
)
public class DutchSpeechPlugin extends Plugin implements RecognitionListener {

    private static final String ASSET_DIR = "model-nl";
    private static final String INSTALL_DIR = "model-nl";
    private static final String MARKER = ".installed";

    private final ExecutorService worker = Executors.newSingleThreadExecutor();
    private final Handler main = new Handler(Looper.getMainLooper());

    private Model model;
    private SpeechService service;
    private PluginCall pendingStop;
    private String latest = "";
    private boolean recording = false;

    @Override
    public void load() {
        LibVosk.setLogLevel(LogLevel.WARNINGS);
    }

    private File installDir() {
        return new File(getContext().getFilesDir(), INSTALL_DIR);
    }

    private boolean installed() {
        return new File(installDir(), MARKER).exists();
    }

    @PluginMethod
    public void available(PluginCall call) {
        JSObject result = new JSObject();
        result.put("ready", installed());
        call.resolve(result);
    }

    @PluginMethod
    public void prepare(final PluginCall call) {
        if (model != null) {
            call.resolve();
            return;
        }
        worker.execute(() -> {
            try {
                if (!installed()) {
                    install();
                }
                model = new Model(installDir().getAbsolutePath());
                resolveOnMain(call, null);
            } catch (Exception error) {
                rejectOnMain(call, "Cannot prepare the Dutch model: " + error.getMessage());
            }
        });
    }

    @PluginMethod
    public void start(final PluginCall call) {
        if (getPermissionState("microphone") != PermissionState.GRANTED) {
            requestPermissionForAlias("microphone", call, "microphoneCallback");
            return;
        }
        begin(call);
    }

    @PermissionCallback
    private void microphoneCallback(PluginCall call) {
        if (getPermissionState("microphone") == PermissionState.GRANTED) {
            begin(call);
        } else {
            call.reject("Microphone permission was not granted.");
        }
    }

    @PluginMethod
    public void stop(final PluginCall call) {
        if (service == null || !recording) {
            JSObject result = new JSObject();
            result.put("text", latest);
            call.resolve(result);
            return;
        }

        pendingStop = call;
        main.post(() -> {
            if (service != null) {
                service.stop();
            }
        });
        // SpeechService reports the final hypothesis asynchronously; never leave the
        // caller hanging if it does not.
        main.postDelayed(this::finishStop, 2000);
    }

    private void begin(final PluginCall call) {
        if (model == null) {
            call.reject("The Dutch model is not loaded yet.");
            return;
        }
        main.post(() -> {
            try {
                if (service != null) {
                    service.stop();
                    service.shutdown();
                    service = null;
                }
                Recognizer recognizer = new Recognizer(model, 16000.0f);
                service = new SpeechService(recognizer, 16000.0f);
                latest = "";
                recording = true;
                service.startListening(this);

                JSObject result = new JSObject();
                result.put("started", true);
                call.resolve(result);
            } catch (Exception error) {
                recording = false;
                call.reject("Cannot start listening: " + error.getMessage());
            }
        });
    }

    private void finishStop() {
        PluginCall call = pendingStop;
        if (call == null) {
            return;
        }
        pendingStop = null;
        recording = false;

        JSObject result = new JSObject();
        result.put("text", latest);
        call.resolve(result);

        if (service != null) {
            service.shutdown();
            service = null;
        }
    }

    @Override
    public void onPartialResult(String hypothesis) {
        String text = extract(hypothesis, "partial");
        if (!text.isEmpty()) {
            latest = text;
        }
    }

    @Override
    public void onResult(String hypothesis) {
        String text = extract(hypothesis, "text");
        if (!text.isEmpty()) {
            latest = text;
        }
    }

    @Override
    public void onFinalResult(String hypothesis) {
        String text = extract(hypothesis, "text");
        if (!text.isEmpty()) {
            latest = text;
        }
        main.post(this::finishStop);
    }

    @Override
    public void onError(Exception error) {
        PluginCall call = pendingStop;
        pendingStop = null;
        recording = false;
        if (call != null) {
            call.reject("Recognition failed: " + error.getMessage());
        }
    }

    @Override
    public void onTimeout() {
        main.post(this::finishStop);
    }

    private String extract(String hypothesis, String key) {
        try {
            return new JSONObject(hypothesis).optString(key, "").trim();
        } catch (Exception ignored) {
            return "";
        }
    }

    private void install() throws IOException {
        File target = installDir();
        deleteRecursive(target);
        if (!target.mkdirs() && !target.isDirectory()) {
            throw new IOException("cannot create " + target);
        }
        copyAsset(getContext().getAssets(), ASSET_DIR, target);
        File marker = new File(target, MARKER);
        if (!marker.createNewFile()) {
            throw new IOException("cannot write " + marker);
        }
    }

    private void copyAsset(AssetManager assets, String path, File target) throws IOException {
        String[] children = assets.list(path);
        if (children == null || children.length == 0) {
            try (InputStream in = assets.open(path); OutputStream out = new FileOutputStream(target)) {
                byte[] buffer = new byte[65536];
                int read;
                while ((read = in.read(buffer)) > 0) {
                    out.write(buffer, 0, read);
                }
            }
            return;
        }
        if (!target.mkdirs() && !target.isDirectory()) {
            throw new IOException("cannot create " + target);
        }
        for (String child : children) {
            copyAsset(assets, path + "/" + child, new File(target, child));
        }
    }

    private void deleteRecursive(File file) {
        if (!file.exists()) {
            return;
        }
        File[] children = file.listFiles();
        if (children != null) {
            for (File child : children) {
                deleteRecursive(child);
            }
        }
        // A failed delete only means the next unpack starts from what is already there.
        file.delete();
    }

    private void resolveOnMain(final PluginCall call, final JSObject value) {
        main.post(() -> {
            if (value == null) {
                call.resolve();
            } else {
                call.resolve(value);
            }
        });
    }

    private void rejectOnMain(final PluginCall call, final String message) {
        main.post(() -> call.reject(message));
    }

    @Override
    protected void handleOnDestroy() {
        if (service != null) {
            service.stop();
            service.shutdown();
            service = null;
        }
        worker.shutdown();
        super.handleOnDestroy();
    }
}
`;

const MAIN_ACTIVITY = `package ${appId};

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Local plugins must be registered before the bridge is created.
        registerPlugin(DutchSpeechPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
`;

function patchGradle(file) {
  let text = readFileSync(file, "utf8");
  if (text.includes("vosk-android")) {
    return false;
  }
  const dependenciesAt = text.lastIndexOf("dependencies {");
  if (dependenciesAt === -1) {
    throw new Error(`${file}: no dependencies block to add Vosk to`);
  }
  const closeAt = text.indexOf("}", dependenciesAt);
  if (closeAt === -1) {
    throw new Error(`${file}: dependencies block is not closed`);
  }
  const deps = `
    // Offline Dutch speech recognition (Apache-2.0). JNA is Vosk's JNI bridge; the
    // artifact is an aar published under com.alphacephei, not com.alphacep.
    implementation 'com.alphacephei:vosk-android:0.3.47@aar'
    implementation 'net.java.dev.jna:jna:5.13.0@aar'`;
  text = text.slice(0, closeAt) + deps + "\n" + text.slice(closeAt);
  writeFileSync(file, text);
  return true;
}

function main() {
  if (!existsSync(join(root, "app"))) {
    throw new Error(`${root}: not an Android project — run \`npx cap add android\` first`);
  }

  mkdirSync(javaDir, { recursive: true });
  writeFileSync(join(javaDir, "DutchSpeechPlugin.java"), PLUGIN);
  writeFileSync(join(javaDir, "MainActivity.java"), MAIN_ACTIVITY);

  const patched = patchGradle(join(root, "app/build.gradle"));
  const hasModel = existsSync(assetsDir);

  console.log(`wrote ${join(javaDir, "DutchSpeechPlugin.java")}`);
  console.log(patched ? "added vosk-android to app/build.gradle" : "vosk-android already in app/build.gradle");
  console.log(hasModel ? "model found in assets/model-nl" : "no model in assets/model-nl — the app will hide the microphone");
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
