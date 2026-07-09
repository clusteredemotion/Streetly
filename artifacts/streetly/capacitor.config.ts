import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.streetly.app",
  appName: "Streetly",
  webDir: "dist/public",
  server: {
    url: "https://236f4c24-861d-4f53-8e8e-1fcdf9b2f034-00-2i0jwimjs30cw.worf.replit.dev",
    androidScheme: "https",
    cleartext: false,
  },
};

export default config;
