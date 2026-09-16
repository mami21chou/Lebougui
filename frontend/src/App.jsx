import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

// Imports des pages
import Register from "./pages/public/inscription";
import ConnexionPublic from "./pages/public/connexion";
import ConnexionAdmin from "./pages/admin/connexion";
// import PublicationForm from "./pages/pecheur/PublicationForm";
import PecheurDashboard from "./pages/pecheur/PecheurDashboard";
import CapturePublication from "./pages/pecheur/CapturePublication";

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Route Racine : Redirige vers le tableau de bord ou la publication */}
        <Route path="/" element={<Navigate to="/pecheur/publication" replace />} />

        {/* Routes Publiques */}
        <Route path="/inscription" element={<Register />} />
        <Route path="/connexion" element={<ConnexionPublic />} />

        {/* Route Administration */}
        <Route path="/admin/connexion" element={<ConnexionAdmin />} />

        {/* Routes Pêcheur */}
        <Route path="/pecheur/accueil" element={<PecheurDashboard />} />
        {/* <Route path="/pecheur/publication" element={<CapturePublication />} /> */}
        <Route path="/publication/nouvelle" element={<CapturePublication />} />
        {/* <Route path="/pecheur/publier" element={<PublicationForm />} /> */}

        {/* WILDCARD (Toujours mettre à la TOUTE FIN de la liste des routes) */}
        {/* <Route path="*" element={<Navigate to="/connexion" replace />} /> */}
      </Routes>
    </Router>
  );
}