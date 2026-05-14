import { useEffect } from "react";
import { HashRouter, Route, Routes } from "react-router-dom";
import { HomePage } from "./pages/HomePage";
import { RegisterPage } from "./pages/RegisterPage";
import { QuizPage } from "./pages/QuizPage";
import { ResultsPage } from "./pages/ResultsPage";
import { LeaderboardPage } from "./pages/LeaderboardPage";
import { AdminPage } from "./pages/AdminPage";
import { WheelDemoPage } from "./pages/WheelDemoPage";
import { useAppStore } from "./store/app-store";

function ToastHost() {
  const toast = useAppStore((state) => state.toast);
  const dismissToast = useAppStore((state) => state.dismissToast);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timeoutId = window.setTimeout(() => dismissToast(), 2600);
    return () => window.clearTimeout(timeoutId);
  }, [dismissToast, toast]);

  if (!toast) {
    return null;
  }

  return <aside className={`toast ${toast.tone}`}>{toast.message}</aside>;
}

export default function App() {
  const initialize = useAppStore((state) => state.initialize);
  const loading = useAppStore((state) => state.loading);
  const error = useAppStore((state) => state.error);
  const setFullscreen = useAppStore((state) => state.setFullscreen);

  useEffect(() => {
    void initialize();
  }, [initialize]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        void setFullscreen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [setFullscreen]);

  if (loading) {
    return <div className="loading-screen">Uygulama hazırlanıyor...</div>;
  }

  if (error) {
    return <div className="loading-screen error">{error}</div>;
  }

  return (
    <HashRouter>
      <ToastHost />
      <Routes>
        <Route element={<HomePage />} path="/" />
        <Route element={<RegisterPage />} path="/register" />
        <Route element={<QuizPage />} path="/quiz" />
        <Route element={<ResultsPage />} path="/results" />
        <Route element={<LeaderboardPage />} path="/leaderboard" />
        <Route element={<WheelDemoPage />} path="/wheel-demo" />
        <Route element={<AdminPage />} path="/admin" />
      </Routes>
    </HashRouter>
  );
}
