import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.clearity.app",
  appName: "Clearity",
  webDir: "www",
  server: {
    url: "https://clearity-taupe.vercel.app",
    cleartext: false,
    androidScheme: "https",
  },
};

export default config;
