import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);

import("@capacitor/splash-screen")
  .then(({ SplashScreen }) => {
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        SplashScreen.hide().catch(() => {});
      })
    );
  })
  .catch(() => {});
