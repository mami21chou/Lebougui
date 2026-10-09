import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";

import { AuthProvider } from "./context/AuthContext";
import { PublicationProvider } from "./context/PublicationContext";
import { CommandeProvider } from "./context/CommandeContext";
import { AudioProvider } from "./context/AudioContext";
import { NotificationProvider } from "./context/NotificationContext";

// ---------------------------------------------------------
// SERVICE WORKER FIREBASE (NON bloquant pour React)
// ---------------------------------------------------------
function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    console.warn(">>> [SW] Service Worker non supporté");
    return;
  }

  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/firebase-messaging-sw.js", {
        scope: "/firebase-cloud-messaging-push-scope",  // 🔑 scope isolé
      })
      .then((registration) => {
        console.log(">>> [SW] Enregistré :", registration.scope);
      })
      .catch((error) => {
        console.error(">>> [SW] ERREUR ENREGISTREMENT :", error);
      });
  });
}

registerServiceWorker();

// ---------------------------------------------------------
// REACT
// ---------------------------------------------------------
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AuthProvider>
      <PublicationProvider>
        <CommandeProvider>
          <AudioProvider>
            <NotificationProvider>
              <App />
            </NotificationProvider>
          </AudioProvider>
        </CommandeProvider>
      </PublicationProvider>
    </AuthProvider>
  </StrictMode>
);