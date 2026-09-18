import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell, Camera, Mic, Video, Wind, Droplets, Compass, MapPin,
  Store, Package, ClipboardList, TrendingUp, Clock,
} from 'lucide-react';
import AudioRecorderModal from '../../components/AudioRecorderModal';
import UserMenu from '../../components/UserMenu';
import { useAuth } from '../../context/AuthContext';
import { PublicationService } from '../../services/publicationService';

// Vérifie si une date est aujourd'hui
const estAujourdhui = (dateStr) => {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
};

export default function PecheurDashboard() {
  const navigate = useNavigate();
  const { utilisateur } = useAuth();

  const [showRecorder, setShowRecorder] = useState(false);
  const [produits, setProduits] = useState([]);
  const [informations, setInformations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pendingAudio, setPendingAudio] = useState(null);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const [produitsRes, infosRes] = await Promise.all([
          PublicationService.getMarche(),
          PublicationService.getInformationsPeche(),
        ]);

        setProduits(produitsRes || []);

        //  Garde uniquement les infos d'aujourd'hui, triées du plus récent au plus ancien
        const infosDuJour = (infosRes || [])
          .filter((info) => estAujourdhui(info.date_publication))
          .sort(
            (a, b) =>
              new Date(b.date_publication).getTime() -
              new Date(a.date_publication).getTime()
          );

        setInformations(infosDuJour);
      } catch (err) {
        console.error("Erreur de chargement des données du marché:", err);
      } finally {
        setLoading(false);
      }
    };
    loadDashboardData();
  }, []);

  const requireAuthAction = (actionCallback) => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      window.location.href = `/connexion?redirect=${encodeURIComponent(window.location.pathname)}`;
      return;
    }
    actionCallback();
  };

  const handleOpenRecorder = () => requireAuthAction(() => setShowRecorder(true));

  // Audio seul → direction page publication
  const handleAudioCaptured = (blob) => {
    setShowRecorder(false);
    navigate('/publication/nouvelle', { state: { audioBlob: blob, photoFile: null } });
  };

  // Audio + photo : stocke le blob puis ouvre l'input photo
  const handleFinishAndAddPhoto = (blob) => {
    setShowRecorder(false);
    setPendingAudio(blob);
    document.getElementById('dashboard-photo-input')?.click();
  };

  const handlePhotoSelected = (e) => {
    const file = e.target.files?.[0];
    if (!file || !pendingAudio) return;
    navigate('/publication/nouvelle', {
      state: { audioBlob: pendingAudio, photoFile: file },
    });
    e.target.value = '';
  };

  return (
    <div className="min-h-screen bg-[#F7F4EF] text-slate-800 font-sans pb-24 max-w-md mx-auto shadow-2xl relative">
      {/* HEADER */}
      <header className="p-5 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <UserMenu
            photo={utilisateur?.photo}
            prenom={utilisateur?.prenom}
            nom={utilisateur?.nom}
            role="Pêcheur"
            showName={false}
          />
          <div className="min-w-0">
            <span className="text-[10px] font-bold tracking-widest text-teal-600 uppercase">
              BONSOIR
            </span>
            <h1 className="text-lg font-black text-slate-900 leading-none truncate">
              {(utilisateur?.prenom || 'PÊCHEUR').toUpperCase()}
            </h1>
          </div>
        </div>

        <button
          onClick={() => requireAuthAction(() => alert('Notifications'))}
          className="relative p-2.5 bg-white rounded-full border border-slate-200/80 shadow-sm text-slate-700 shrink-0"
        >
          <Bell size={18} />
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-orange-500"></span>
        </button>
      </header>

      <main className="px-5 space-y-6">
        {/* Widget Météo Marine */}
        <div className="bg-[#0F4C64] rounded-3xl p-5 text-white shadow-lg space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[11px] font-semibold text-teal-200 tracking-wider uppercase">
                SOUMBÉDIOUNE • DAKAR
              </p>
              <h2 className="text-4xl font-extrabold mt-1">27°C</h2>
              <p className="text-xs text-emerald-300 font-medium mt-1 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                Mer calme • bonne sortie
              </p>
            </div>
            <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl">
              <Compass className="text-teal-200" size={24} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/10 text-center">
            <div className="bg-white/10 rounded-2xl p-2.5">
              <Wind size={16} className="mx-auto text-teal-200 mb-1" />
              <p className="text-xs font-bold">12 km/h</p>
              <p className="text-[9px] text-slate-300">Vent</p>
            </div>
            <div className="bg-white/10 rounded-2xl p-2.5">
              <Droplets size={16} className="mx-auto text-teal-200 mb-1" />
              <p className="text-xs font-bold">78%</p>
              <p className="text-[9px] text-slate-300">Humidité</p>
            </div>
            <div className="bg-white/10 rounded-2xl p-2.5">
              <p className="text-xs font-bold mt-1">06:58</p>
              <p className="text-[9px] text-slate-300">Marée</p>
            </div>
          </div>
        </div>

        {/* Bloc Publication Vocale */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/60 text-center space-y-4">
          <h3 className="text-base font-bold text-slate-900">Publier</h3>

          <div className="flex items-center justify-center gap-6">
            <input
              id="dashboard-photo-input"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoSelected}
            />

            <button
              onClick={() => requireAuthAction(() => setShowRecorder(true))}
              className="p-3 bg-slate-100 rounded-full text-slate-600 hover:bg-slate-200 transition-colors"
            >
              <Camera size={20} />
            </button>

            <button onClick={handleOpenRecorder} className="relative group">
              <div className="absolute -inset-2 bg-orange-500/20 rounded-full blur-sm group-hover:bg-orange-500/30 transition-all"></div>
              <div className="relative w-20 h-20 bg-gradient-to-tr from-orange-500 to-amber-500 rounded-full flex flex-col items-center justify-center text-white shadow-lg shadow-orange-500/30 active:scale-95 transition-transform">
                <Mic size={28} />
                <span className="text-[9px] font-black uppercase tracking-wider mt-0.5">
                  WOLOF
                </span>
              </div>
            </button>

            <button
              onClick={() => requireAuthAction(() => setShowRecorder(true))}
              className="p-3 bg-slate-100 rounded-full text-slate-600 hover:bg-slate-200 transition-colors"
            >
              <Video size={20} />
            </button>
          </div>

          <p className="text-xs font-bold text-slate-700 tracking-wide">Waxal ci wolof</p>
        </div>

        {/* ==================== INFORMATIONS DE PÊCHE — AUJOURD'HUI ==================== */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              INFORMATIONS DE PÊCHE
            </h3>
            <span className="text-[10px] font-bold text-teal-600 uppercase tracking-wider">
              Aujourd'hui
            </span>
          </div>

          {loading ? (
            <p className="text-xs text-slate-400 italic">Chargement des alertes...</p>
          ) : informations.length === 0 ? (
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/60 text-center">
              <p className="text-xs text-slate-400">
                Aucune information publiée aujourd'hui.
              </p>
            </div>
          ) : (
            informations.map((info) => (
              <div
                key={info.id}
                className="bg-white rounded-2xl p-4 shadow-sm border-l-4 border-teal-500 border-y border-r border-slate-200/60 space-y-2"
              >
                {/* Zone + Heure */}
                <div className="flex justify-between items-center gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 shrink-0 rounded-full bg-teal-600 text-white text-[10px] font-bold flex items-center justify-center">
                      {(info.pecheur_prenom?.[0] || 'P').toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-slate-900 truncate">
                        {info.adresse || 'Zone de Pêche'}
                      </h4>
                      <p className="text-[10px] text-slate-400 truncate">
                        {info.pecheur_prenom} {info.pecheur_nom}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400 shrink-0 flex items-center gap-1">
                    <Clock size={10} />
                    {new Date(info.date_publication).toLocaleTimeString('fr-FR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                {/* Transcription wolof uniquement */}
                <div className="bg-slate-50 rounded-xl p-2.5 text-xs text-slate-700 italic border border-slate-100">
                  « {info.texte_transcrit || 'Aucune transcription'} »
                </div>

                {/* Lecteur audio */}
                {info.audio && (
                  <audio
                    controls
                    src={info.audio}
                    className="w-full h-9 rounded-lg"
                    preload="none"
                  />
                )}
              </div>
            ))
          )}
        </div>

        {/* ==================== LE MARCHÉ DU JOUR ==================== */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              LE MARCHÉ DU JOUR
            </h3>
            <button
              onClick={() => navigate('/pecheur/marche')}
              className="text-xs font-bold text-orange-500"
            >
              Voir tout
            </button>
          </div>

          {loading ? (
            <p className="text-xs text-slate-400 italic">Chargement des produits...</p>
          ) : produits.length === 0 ? (
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/60 text-center">
              <p className="text-xs text-slate-400">Aucun produit disponible.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {produits.slice(0, 4).map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-200/60"
                >
                  <div className="relative h-28 bg-slate-100">
                    <img
                      src={
                        item.media ||
                        item.image ||
                        'https://images.unsplash.com/photo-1534483509719-3feaee7c30da?w=400&auto=format&fit=crop&q=80'
                      }
                      alt={item.nom}
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute top-2 left-2 px-2 py-0.5 bg-white/90 backdrop-blur-md rounded-full text-[9px] font-bold uppercase text-teal-700">
                      {item.categorie === 'fruit_de_mer' ? 'Fruit de mer' : 'Poisson'}
                    </span>
                  </div>
                  <div className="p-3 space-y-1">
                    <h4 className="text-xs font-bold text-slate-900 truncate">
                      {item.nom}
                    </h4>
                    <p className="text-[10px] text-slate-500 flex items-center gap-1 truncate">
                      <MapPin size={10} /> {item.adresse || 'Dakar'}
                    </p>
                    <div className="pt-1 flex items-baseline justify-between">
                      <span className="text-xs font-black text-orange-500">
                        {item.prix} FCFA
                        <span className="text-[9px] text-slate-400 font-normal"> /kg</span>
                      </span>
                    </div>
                    <p className="text-[9px] text-slate-400 pt-0.5 truncate">
                      {item.pecheur_prenom || item.pecheur_nom || 'Pêcheur'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* BOTTOM NAV */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-slate-200/80 px-6 py-3 flex justify-between items-center text-slate-400">
        <button className="flex flex-col items-center gap-1 text-teal-600 font-bold">
          <Store size={18} />
          <span className="text-[9px]">Marché</span>
        </button>
        <button
          onClick={() => requireAuthAction(() => navigate('/pecheur/publications'))}
          className="flex flex-col items-center gap-1 hover:text-slate-700"
        >
          <Package size={18} />
          <span className="text-[9px]">Publications</span>
        </button>
        <button
          onClick={() => requireAuthAction(() => navigate('/pecheur/commandes'))}
          className="flex flex-col items-center gap-1 hover:text-slate-700"
        >
          <ClipboardList size={18} />
          <span className="text-[9px]">Commandes</span>
        </button>
        <button
          onClick={() => requireAuthAction(() => navigate('/pecheur/ventes'))}
          className="flex flex-col items-center gap-1 hover:text-slate-700"
        >
          <TrendingUp size={18} />
          <span className="text-[9px]">Ventes</span>
        </button>
      </nav>

      {showRecorder && (
        <AudioRecorderModal
          onCancel={() => setShowRecorder(false)}
          onAudioCaptured={handleAudioCaptured}
          onFinishAndAddPhoto={handleFinishAndAddPhoto}
        />
      )}
    </div>
  );
}