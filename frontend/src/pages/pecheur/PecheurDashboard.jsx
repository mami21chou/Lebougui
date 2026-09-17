import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Camera, Mic, Video, Wind, Droplets, Compass, MapPin, Store, Package, ClipboardList, TrendingUp } from 'lucide-react';
import AudioRecorderModal from '../../components/AudioRecorderModal';
import { PublicationService } from '../../services/publicationService';
import UserMenu from '../../components/UserMenu';
import { useAuth } from '../../context/AuthContext';
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
        setProduits(produitsRes);
        setInformations(infosRes);
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

  // Audio seul → direction page nouvelle
  const handleAudioCaptured = (blob) => {
    setShowRecorder(false);
    navigate('/publication/nouvelle', { state: { audioBlob: blob, photoFile: null } });
  };

  // Audio + photo : on stocke le blob audio, puis on ouvre l'input photo
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
    e.target.value = ''; // reset input
  };

  return (
    <div className="min-h-screen bg-[#F7F4EF] text-slate-800 font-sans pb-24 max-w-md mx-auto shadow-2xl relative">
     <header className="p-5 flex items-center justify-between">
  <div>
    <span className="text-[10px] font-bold tracking-widest text-teal-600 uppercase">
      BONSOIR
    </span>
    <h1 className="text-lg font-black text-slate-900 leading-none">
      {(utilisateur?.prenom || 'Pêcheur').toUpperCase()}
    </h1>
  </div>

  <div className="flex items-center gap-2">
    <button
      onClick={() => requireAuthAction(() => alert("Notifications"))}
      className="relative p-2.5 bg-white rounded-full border border-slate-200/80 shadow-sm text-slate-700"
    >
      <Bell size={18} />
      <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-orange-500"></span>
    </button>

    <UserMenu
      photo={utilisateur?.photo}
      prenom={utilisateur?.prenom}
      nom={utilisateur?.nom}
      role="Pêcheur"
      showName={false}
    />
  </div>
</header>

      <main className="px-5 space-y-6">
        {/* Widget Météo Marine */}
        <div className="bg-[#0F4C64] rounded-3xl p-5 text-white shadow-lg space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[11px] font-semibold text-teal-200 tracking-wider uppercase">SOUMBÉDIOUNE • DAKAR</p>
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

            {/* Caméra : photo SEULE → on bloque car le back exige l'audio, on redirige plutôt vers l'enregistreur */}
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
                <span className="text-[9px] font-black uppercase tracking-wider mt-0.5">WOLOF</span>
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

        {/* Informations */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">INFORMATIONS DE PÊCHE</h3>
          {loading ? (
            <p className="text-xs text-slate-400 italic">Chargement des alertes...</p>
          ) : informations.length === 0 ? (
            <p className="text-xs text-slate-400">Aucune information enregistrée pour le moment.</p>
          ) : (
            informations.map((info) => (
              <div key={info.id} className="bg-white rounded-2xl p-4 shadow-sm border-l-teal-500 border-y border-r border-slate-200/60 space-y-1">
                <div className="flex justify-between items-center">
                  <h4 className="text-sm font-bold text-slate-900">{info.adresse || 'Zone de Pêche'}</h4>
                  <span className="text-[10px] text-slate-400">{info.description || "Aujourd'hui"}</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{info.description || info.texte_traduit}</p>
              </div>
            ))
          )}
        </div>

        {/* Marché */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">LE MARCHÉ DU JOUR</h3>
            <button className="text-xs font-bold text-orange-500">Voir tout</button>
          </div>

          {loading ? (
            <p className="text-xs text-slate-400 italic">Chargement des produits...</p>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {produits.map((item) => (
                <div key={item.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-200/60">
                  <div className="relative h-28 bg-slate-100">
                    <img src={item.media || item.image || "https://images.unsplash.com/photo-1534483509719-3feaee7c30da?w=400&auto=format&fit=crop&q=80"} alt={item.nom} className="w-full h-full object-cover" />
                    <span className="absolute top-2 left-2 px-2 py-0.5 bg-white/90 backdrop-blur-md rounded-full text-[9px] font-bold uppercase text-teal-700">
                      {item.categorie || 'POISSON'}
                    </span>
                  </div>
                  <div className="p-3 space-y-1">
                    <h4 className="text-xs font-bold text-slate-900">{item.nom}</h4>
                    <p className="text-[10px] text-slate-500 flex items-center gap-1"><MapPin size={10} /> {item.adresse || 'Dakar'}</p>
                    <div className="pt-2 flex items-baseline justify-between">
                      <span className="text-xs font-black text-orange-500">{item.prix} FCFA <span className="text-[9px] text-slate-400 font-normal">/kg</span></span>
                    </div>
                    <p className="text-[9px] text-slate-400 pt-1">{item.pecheur_prenom || item.pecheur_nom || 'Pêcheur'}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-slate-200/80 px-6 py-3 flex justify-between items-center text-slate-400">
        <button className="flex flex-col items-center gap-1 text-teal-600 font-bold">
          <Store size={18} />
          <span className="text-[9px]">Marché</span>
        </button>
        <button onClick={() => requireAuthAction(() => navigate('/pecheur/publications'))} className="flex flex-col items-center gap-1 hover:text-slate-700">
          <Package size={18} />
          <span className="text-[9px]">Publications</span>
        </button>
        <button onClick={() => requireAuthAction(() => navigate('/pecheur/commandes'))} className="flex flex-col items-center gap-1 hover:text-slate-700">
          <ClipboardList size={18} />
          <span className="text-[9px]">Commandes</span>
        </button>
        <button onClick={() => requireAuthAction(() => navigate('/pecheur/ventes'))} className="flex flex-col items-center gap-1 hover:text-slate-700">
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