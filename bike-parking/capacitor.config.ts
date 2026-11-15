import type { CapacitorConfig } from "@capacitor/cli";

/**
 * The Android shell loads a local bundle from the APK — the app never talks to
 * the network, so "offline" is the default state rather than a mode.
 */
const config: CapacitorConfig = {
  appId: "com.bikelot.tracker",
  appName: "Bike Lot",
  webDir: "dist",
  backgroundColor: "#0f172a",
  android: {
    allowMixedContent: false,
    captureInput: true,
  },
};

export default config;
