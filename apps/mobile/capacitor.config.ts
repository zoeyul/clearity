import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.clearity.app",
  appName: "Clearity",
  webDir: "../web/out",
  server: {
    androidScheme: "https",
  },
};

export default config;
