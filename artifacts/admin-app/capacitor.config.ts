import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.streetly.admin",
  appName: "Streetly Admin",
  webDir: "dist/public",
  server: {
    androidScheme: "https",
    cleartext: false,
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
    SplashScreen: {
      launchShowDuration: 0,
      launchAutoHide: false,
      backgroundColor: "#0a0f1eff",
      splashFullScreen: true,
      splashImmersive: true,
    },
  },
};

export default config;
