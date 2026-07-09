import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { initApi } from "./lib/utils";

initApi();

createRoot(document.getElementById("root")!).render(<App />);

/* On native (Capacitor) builds, the OS-level splash screen is shown
   instantly on launch — even offline — straight from bundled app
   resources. Hide it the moment our own animated Preloader has mounted
   and painted, so the handoff from native splash to in-app Preloader is
   seamless with no blank gap. No-op on web. */
import("@capacitor/splash-screen")
  .then(({ SplashScreen }) => {
    requestAnimationFrame(() => requestAnimationFrame(() => {
      SplashScreen.hide().catch(() => {});
    }));
  })
  .catch(() => {});
