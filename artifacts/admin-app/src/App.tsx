import { useState, useEffect } from "react";
import PreloaderPage from "./pages/PreloaderPage";
import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import { getToken } from "./lib/api";

type Screen = "preloader" | "login" | "home";

export default function App() {
  const [screen, setScreen] = useState<Screen>("preloader");

  useEffect(() => {
    const timer = setTimeout(() => {
      const token = getToken();
      setScreen(token ? "home" : "login");
    }, 1600);
    return () => clearTimeout(timer);
  }, []);

  if (screen === "preloader") return <PreloaderPage />;
  if (screen === "login") return <LoginPage onLogin={() => setScreen("home")} />;
  return <HomePage onLogout={() => setScreen("login")} />;
}
