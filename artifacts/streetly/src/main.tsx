import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { initApi } from "./lib/utils";

initApi();

createRoot(document.getElementById("root")!).render(<App />);
