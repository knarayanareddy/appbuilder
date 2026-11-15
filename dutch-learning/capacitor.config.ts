import type { CapacitorConfig } from "@capacitor/cli";

/**
 * The APK carries the whole app; nothing is fetched at runtime. Speech uses the
 * phone's own Dutch voice through the text-to-speech plugin.
 */
const config: CapacitorConfig = {
  appId: "com.taal.app",
  appName: "Taal",
  webDir: "dist",
  backgroundColor: "#0b1220",
  android: {
    allowMixedContent: false,
  },
};

export default config;
