import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.streetly.app",
  appName: "Streetly",
  webDir: "dist/public",
  server: {
    url: "https://mystreetly.app",
    androidScheme: "https",
    cleartext: false,
  },
};

export default config;
