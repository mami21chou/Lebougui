import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

// Imports des pages
import Register from "./pages/public/inscription";
import ConnexionPublic from "./pages/public/connexion";
import ConnexionAdmin from "./pages/admin/connexion";
// import PublicationForm from "./pages/pecheur/PublicationForm";
import PecheurDashboard from "./pages/pecheur/PecheurDashboard";
import CapturePublication from "./pages/pecheur/CapturePublication";
import ValidationPublication from "./pages/pecheur/ValidationPublication";
import MesPublications from "./pages/pecheur/MesPublications";
import CommandesRecues from "./pages/pecheur/CommandesRecues";
import Ventes from "./pages/pecheur/Ventes";

// Imports des pages acheteur
import AcheteurDashboard from "./pages/acheteur/AcheteurDashboard";
import Marche from "./pages/acheteur/Marche";
import ProduitDetails from "./pages/acheteur/ProduitDetails";
import Panier from "./pages/acheteur/Panier";
import MesCommandes from "./pages/acheteur/MesCommandes";
import CommandeDetails from "./pages/acheteur/CommandeDetails";
import Alertes from "./pages/acheteur/Alertes";
import SuiviLivraison from "./pages/acheteur/SuiviLivraison";
import ItineraireLivreur from "./pages/acheteur/ItineraireLivreur";
import Premium from "./pages/acheteur/Premium";
import RetourPaiement from "./pages/acheteur/RetourPaiement";
import AttenteConfirmation from "./pages/acheteur/AttenteConfirmation";


export default function App() {
  return (
    <Router>
      <Routes>
        {/* Route Racine : Redirige vers le tableau de bord selon le rôle */}
        <Route path="/" element={<Navigate to="/accueil" replace />} />

        {/* Routes Publiques */}
        <Route path="/inscription" element={<Register />} />
        <Route path="/connexion" element={<ConnexionPublic />} />

        {/* Route Administration */}
        <Route path="/admin/connexion" element={<ConnexionAdmin />} />

        {/* Routes Pêcheur */}
        <Route path="/pecheur/accueil" element={<PecheurDashboard />} />
        <Route path="/pecheur/publication" element={<Navigate to="/publication/nouvelle" replace />} />
        <Route path="/publication/nouvelle" element={<CapturePublication />} />
        <Route path="/publication/validation" element={<ValidationPublication />} />
        <Route path="/pecheur/publications" element={<MesPublications />} />
        <Route path="/pecheur/commandes" element={<CommandesRecues />} />
        <Route path="/pecheur/ventes" element={<Ventes />} />

        {/* Routes Acheteur */}
        <Route path="/acheteur/accueil" element={<AcheteurDashboard />} />
        <Route path="/acheteur/marche" element={<Marche />} />
        <Route path="/acheteur/produit/:id" element={<ProduitDetails />} />
        <Route path="/acheteur/panier" element={<Panier />} />
        <Route path="/acheteur/commandes" element={<MesCommandes />} />
        <Route path="/acheteur/commande/attente/:id" element={<AttenteConfirmation />} />
        <Route path="/acheteur/commande/:id" element={<CommandeDetails />} />
        <Route path="/acheteur/commande/:id/annuler" element={<CommandeDetails />} />
        <Route path="/acheteur/alertes" element={<Alertes />} />
        <Route path="/acheteur/suivi-livraison/:id" element={<SuiviLivraison />} />
        <Route path="/acheteur/itineraire/:id" element={<ItineraireLivreur />} />
        <Route path="/acheteur/premium" element={<Premium />} />
        <Route path="/acheteur/retour-paiement" element={<RetourPaiement />} />


        {/* Route par défaut selon le rôle */}
        <Route path="/accueil" element={<Navigate to="/acheteur/accueil" replace />} />

        {/* WILDCARD (Toujours mettre à la TOUTE FIN de la liste des routes) */}
        {/* <Route path="*" element={<Navigate to="/connexion" replace />} /> */}
      </Routes>
    </Router>
  );
}