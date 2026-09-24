import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';

// Pages publiques
import Register from './pages/public/inscription';
import ConnexionPublic from './pages/public/connexion';
import ConnexionAdmin from './pages/admin/connexion';
import Profil from './pages/Profil';


// Pages pêcheur
import PecheurDashboard from './pages/pecheur/PecheurDashboard';
import CapturePublication from './pages/pecheur/CapturePublication';
import ValidationPublication from './pages/pecheur/ValidationPublication';
import MesPublications from './pages/pecheur/MesPublications';
import CommandesRecues from './pages/pecheur/CommandesRecues';
import Ventes from './pages/pecheur/Ventes';

// Pages acheteur
import AcheteurDashboard from './pages/acheteur/AcheteurDashboard';
import ProduitDetails from './pages/acheteur/ProduitDetails';
import Panier from './pages/acheteur/Panier';
import MesCommandes from './pages/acheteur/MesCommandes';
import CommandeDetails from './pages/acheteur/CommandeDetails';
import Alertes from './pages/acheteur/Alertes';
import SuiviLivraison from './pages/acheteur/SuiviLivraison';
import ItineraireLivreur from './pages/acheteur/ItineraireLivreur';
import Premium from './pages/acheteur/Premium';
import AttenteConfirmation from './pages/acheteur/AttenteConfirmation';
import RetourPaiement from './pages/acheteur/RetourPaiement';

// Pages livreur
import LivreurDashboard from './pages/livreur/LivreurDashboard';
import LivraisonEnCours from './pages/livreur/LivraisonEnCours';
import LivraisonGPS from './pages/livreur/LivraisonGPS';
import LivreurGPS from './pages/livreur/LivreurGPS';
import LivreurGains from './pages/livreur/Gains';
import LivraisonTerminee from './pages/livreur/LivraisonTerminee';


// Pour l'admin
import AdminDashboard from './pages/admin/Dashboard';
import AdminPecheurs from './pages/admin/Pecheurs';
import AdminLivreurs from './pages/admin/Livreurs';
import AdminAcheteurs from './pages/admin/Acheteurs';
import AdminSignalements from './pages/admin/Signalements';
import AdminPremium from './pages/admin/Premium';
import AdminStatistiques from './pages/admin/Statistiques';

export default function App() {
  return (
    <Router>
      <Routes>
        {/* <Route path="/" element={<Navigate to="/connexion" replace />} /> */}

        {/* ---------------- Routes publiques ---------------- */}
        <Route path="/inscription" element={<Register />} />
        <Route path="/connexion" element={<ConnexionPublic />} />
        <Route path="/admin/connexion" element={<ConnexionAdmin />} />

        {/* ---------------- Routes PÊCHEUR ---------------- */}
        <Route
          path="/pecheur/accueil"
          element={<ProtectedRoute roles={['pecheur']}><PecheurDashboard /></ProtectedRoute>}
        />
        <Route
          path="/publication/nouvelle"
          element={<ProtectedRoute roles={['pecheur']}><CapturePublication /></ProtectedRoute>}
        />
        <Route
          path="/publication/validation"
          element={<ProtectedRoute roles={['pecheur']}><ValidationPublication /></ProtectedRoute>}
        />
        <Route
          path="/pecheur/publications"
          element={<ProtectedRoute roles={['pecheur']}><MesPublications /></ProtectedRoute>}
        />
        <Route
          path="/pecheur/commandes"
          element={<ProtectedRoute roles={['pecheur']}><CommandesRecues /></ProtectedRoute>}
        />
        <Route
          path="/pecheur/ventes"
          element={<ProtectedRoute roles={['pecheur']}><Ventes /></ProtectedRoute>}
        />

        {/* ---------------- Routes ACHETEUR ---------------- */}
        <Route
          path="/acheteur/accueil"
          element={<ProtectedRoute roles={['acheteur']}><AcheteurDashboard /></ProtectedRoute>}
        />
        <Route
          path="/acheteur/produit/:id"
          element={<ProtectedRoute roles={['acheteur']}><ProduitDetails /></ProtectedRoute>}
        />
        <Route
          path="/acheteur/panier"
          element={<ProtectedRoute roles={['acheteur']}><Panier /></ProtectedRoute>}
        />
        <Route
          path="/acheteur/commandes"
          element={<ProtectedRoute roles={['acheteur']}><MesCommandes /></ProtectedRoute>}
        />
        <Route
          path="/acheteur/commande/attente/:id"
          element={<ProtectedRoute roles={['acheteur']}><AttenteConfirmation /></ProtectedRoute>}
        />
        <Route
          path="/acheteur/commande/:id"
          element={<ProtectedRoute roles={['acheteur']}><CommandeDetails /></ProtectedRoute>}
        />
        <Route
          path="/acheteur/commande/:id/annuler"
          element={<ProtectedRoute roles={['acheteur']}><CommandeDetails /></ProtectedRoute>}
        />
        <Route
          path="/acheteur/retour-paiement"
          element={<ProtectedRoute roles={['acheteur']}><RetourPaiement /></ProtectedRoute>}
        />
        <Route
          path="/acheteur/alertes"
          element={<ProtectedRoute roles={['acheteur']}><Alertes /></ProtectedRoute>}
        />
        <Route
          path="/acheteur/suivi-livraison/:id"
          element={<ProtectedRoute roles={['acheteur']}><SuiviLivraison /></ProtectedRoute>}
        />
        <Route
          path="/acheteur/itineraire/:id"
          element={<ProtectedRoute roles={['acheteur']}><ItineraireLivreur /></ProtectedRoute>}
        />
        <Route
          path="/acheteur/premium"
          element={<ProtectedRoute roles={['acheteur']}><Premium /></ProtectedRoute>}
        />

        {/* ---------------- Routes LIVREUR ---------------- */}
        <Route
          path="/livreur/accueil"
          element={<ProtectedRoute roles={['livreur']}><LivreurDashboard /></ProtectedRoute>}
        />
        <Route
          path="/livreur/livraison/:id/recuperer"
          element={<ProtectedRoute roles={['livreur']}><LivraisonEnCours /></ProtectedRoute>}
        />
        <Route
          path="/livreur/livraison/:id/gps"
          element={<ProtectedRoute roles={['livreur']}><LivraisonGPS /></ProtectedRoute>}
        />
        <Route
          path="/livreur/gps"
          element={<ProtectedRoute roles={['livreur']}><LivreurGPS /></ProtectedRoute>}
        />
        <Route
          path="/livreur/gains"
          element={<ProtectedRoute roles={['livreur']}><LivreurGains /></ProtectedRoute>}
        />
        <Route
          path="/livreur/livraison-terminee"
          element={<ProtectedRoute roles={['livreur']}><LivraisonTerminee /></ProtectedRoute>}
        />


        <Route
          path="/profil"
          element={
            <ProtectedRoute roles={['pecheur', 'acheteur', 'livreur']}>
              <Profil />
            </ProtectedRoute>
          }
        />
        {/* Partie admin */}

        <Route path="/admin/dashboard" element={<AdminDashboard />} />

          <Route path="/admin/pecheurs" element={<AdminPecheurs />} />
          <Route path="/admin/livreurs" element={<AdminLivreurs />} />
          <Route path="/admin/acheteurs" element={<AdminAcheteurs />} />
          <Route path="/admin/signalements" element={<AdminSignalements />} />
          <Route path="/admin/premium" element={<AdminPremium />} />  
          <Route path="/admin/statistiques" element={<AdminStatistiques />}/>
 

        {/* Fallback */}
        {/* <Route path="*" element={<Navigate to="/connexion" replace />} /> */}
      </Routes>
    </Router>
  );
}