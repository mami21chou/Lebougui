import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, Bell, Mic, Play, Pause, MapPin, 
  Edit3, Trash2, Clock, Store, ShoppingBag, 
  FileText, TrendingUp 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { usePublications } from '../../context/PublicationContext';

// --- Composant Lecteur Audio Épuré avec Forme d'Onde ---
const AudioPlayer = ({ audioUrl, duration = '0:28' }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(() => {});
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="bg-[#FFFBF5] rounded-xl p-2.5 flex items-center justify-between border border-[#F3E8D8]/60 my-2">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={togglePlay}
          className="w-9 h-9 rounded-full bg-[#FF6B35] text-white flex items-center justify-center shadow-md shadow-[#FF6B35]/20 hover:scale-105 transition-transform"
        >
          {isPlaying ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
        </button>
        <div className="flex flex-col">
          <span className="text-[11px] font-bold text-slate-800 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
            Message vocal (Wolof)
          </span>
          {/* Simulation d'onde audio */}
          <div className="flex items-center gap-0.5 h-3 mt-1">
            {[40, 70, 30, 90, 60, 100, 40, 80, 50, 90, 30, 70, 40, 20].map((h, idx) => (
              <span
                key={idx}
                className={`w-0.5 rounded-full transition-all duration-300 ${
                  isPlaying ? 'bg-teal-500' : 'bg-slate-300'
                }`}
                style={{ height: `${isPlaying ? Math.max(20, (h + Math.random() * 20) % 100) : h}%` }}
              />
            ))}
          </div>
        </div>
      </div>
      <span className="text-[10px] font-semibold text-slate-400">{duration}</span>
      {audioUrl && <audio ref={audioRef} src={audioUrl} onEnded={() => setIsPlaying(false)} />}
    </div>
  );
};

// --- Composant Principal ---
const MesPublications = () => {
  const { utilisateur, estPecheur } = useAuth();
  const { mesPublications, chargerMesPublications } = usePublications();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [ongletActif, setOngletActif] = useState('mes_prises'); // 'informations', 'mes_posts', 'mes_prises'
  const [statutsProduits, setStatutsProduits] = useState({});

  useEffect(() => {
    const loadData = async () => {
      try {
        if (!estPecheur()) {
          navigate('/connexion', { replace: true });
          return;
        }
        await chargerMesPublications();
      } catch (err) {
        console.error('Erreur lors du chargement des données:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [estPecheur, chargerMesPublications, navigate]);

  // Synchroniser le statut de disponibilité localement
  useEffect(() => {
    if (mesPublications?.produits) {
      const initialMap = {};
      mesPublications.produits.forEach((p) => {
        initialMap[p.id] = p.disponible ?? p.statut === 'visible';
      });
      setStatutsProduits(initialMap);
    }
  }, [mesPublications]);

  // Basculer la disponibilité d'une prise (Toggle disponible / terminé)
  const handleToggleStatut = async (id) => {
    const nvStatut = !statutsProduits[id];
    setStatutsProduits((prev) => ({ ...prev, [id]: nvStatut }));

    try {
      // Appel API pour mettre à jour la disponibilité en BD
      // await PublicationService.changerDisponibilite(id, nvStatut);
    } catch (err) {
      console.error('Erreur de modification du statut:', err);
      setStatutsProduits((prev) => ({ ...prev, [id]: !nvStatut })); // Rollback si erreur
    }
  };

  if (!estPecheur()) return null;

  const totalInfos = mesPublications?.informations?.length || 0;
  const totalPosts = (mesPublications?.produits?.length || 0) + totalInfos;
  const totalPrises = mesPublications?.produits?.length || 0;

  return (
    <div className="min-h-screen bg-[#F7F4EF] text-slate-800 font-sans pb-24 max-w-md mx-auto relative shadow-xl">
      
      {/* 1. Header principal */}
      <header className="px-5 pt-6 pb-2 flex items-center justify-between">
        <h1 className="text-2xl font-black text-[#0F2A4A] tracking-tight">Publications</h1>
        <div className="flex items-center gap-2">
          <button className="w-9 h-9 rounded-full bg-white shadow-sm flex items-center justify-center text-slate-600 hover:bg-slate-50">
            <Search size={18} />
          </button>
          <button className="w-9 h-9 rounded-full bg-white shadow-sm flex items-center justify-center text-slate-600 hover:bg-slate-50 relative">
            <Bell size={18} />
            <span className="absolute top-2 right-2 w-2 h-2 bg-[#FF6B35] rounded-full" />
          </button>
        </div>
      </header>

      {/* 2. Bannière d'appel à l'action */}
      <div className="px-5 my-3">
        <div className="bg-[#0F2A4A] rounded-2xl p-4 text-white flex items-center justify-between shadow-lg shadow-[#0F2A4A]/10 relative overflow-hidden">
          <div className="z-10 max-w-[65%]">
            <p className="text-xs font-semibold leading-snug text-slate-200">
              Signalez un banc ou vendez votre prise
            </p>
          </div>
          <button
            onClick={() => navigate('/pecheur/publication/nouvelle')}
            className="z-10 px-4 py-2 bg-[#FF6B35] hover:bg-[#ff5a20] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md shadow-[#FF6B35]/30 transition-all"
          >
            <Mic size={14} />
            Publier
          </button>
          {/* Motif en arrière-plan */}
          <div className="absolute -right-4 -bottom-6 w-24 h-24 rounded-full bg-white/5 pointer-events-none" />
        </div>
      </div>

      {/* 3. Onglets de filtrage */}
      <div className="px-5 my-4">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          <button
            onClick={() => setOngletActif('informations')}
            className={`py-2 px-4 rounded-full text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              ongletActif === 'informations'
                ? 'bg-[#0F2A4A] text-white shadow-md'
                : 'bg-white text-slate-600 hover:bg-slate-100'
            }`}
          >
            Informations
            {totalInfos > 0 && (
              <span className={`px-1.5 py-0.2 text-[10px] rounded-full ${ongletActif === 'informations' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}`}>
                {totalInfos}
              </span>
            )}
          </button>

          <button
            onClick={() => setOngletActif('mes_posts')}
            className={`py-2 px-4 rounded-full text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              ongletActif === 'mes_posts'
                ? 'bg-[#0F2A4A] text-white shadow-md'
                : 'bg-white text-slate-600 hover:bg-slate-100'
            }`}
          >
            Mes posts
            {totalPosts > 0 && (
              <span className={`px-1.5 py-0.2 text-[10px] rounded-full ${ongletActif === 'mes_posts' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}`}>
                {totalPosts}
              </span>
            )}
          </button>

          <button
            onClick={() => setOngletActif('mes_prises')}
            className={`py-2 px-4 rounded-full text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              ongletActif === 'mes_prises'
                ? 'bg-[#0F2A4A] text-white shadow-md'
                : 'bg-white text-slate-600 hover:bg-slate-100'
            }`}
          >
            Mes prises
          </button>
        </div>
      </div>

      {/* 4. Titre de section contextuel */}
      {ongletActif === 'mes_prises' && (
        <div className="px-5 mb-2">
          <h2 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Mes prises en vente directe
          </h2>
        </div>
      )}

      {/* 5. Liste des publications */}
      <main className="px-5 space-y-4">
        {loading ? (
          <div className="py-12 text-center text-slate-400 text-sm">Chargement de vos publications...</div>
        ) : (
          <>
            {/* --- CASE 1 : MES PRISES EN VENTE --- */}
            {ongletActif === 'mes_prises' && (
              mesPublications?.produits?.length === 0 ? (
                <div className="bg-white rounded-2xl p-6 text-center shadow-sm">
                  <p className="text-xs text-slate-500">Aucune prise en vente pour le moment.</p>
                </div>
              ) : (
                mesPublications.produits.map((prod) => {
                  const estDisponible = statutsProduits[prod.id] ?? true;

                  return (
                    <div key={prod.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-200/50">
                      {/* Image de la prise */}
                      {prod.media && (
                        <div className="h-44 w-full relative bg-slate-100">
                          <img src={prod.media} alt={prod.nom} className="w-full h-full object-cover" />
                        </div>
                      )}

                      <div className="p-3.5 space-y-2">
                        {/* Audio */}
                        <AudioPlayer audioUrl={prod.audio_url} duration={prod.duree_audio || '0:28'} />

                        {/* Pied de carte : Date & Toggle d'activation */}
                        <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                            <Clock size={12} />
                            <span>Publié : <strong>{prod.date_heure_format || 'Aujourd\'hui, 08:30'}</strong></span>
                          </div>

                          {/* Toggle Switch */}
                          <button
                            type="button"
                            onClick={() => handleToggleStatut(prod.id)}
                            className={`w-11 h-6 rounded-full p-0.5 transition-colors duration-200 ease-in-out focus:outline-none flex items-center ${
                              estDisponible ? 'bg-emerald-500' : 'bg-slate-300'
                            }`}
                          >
                            <span
                              className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
                                estDisponible ? 'translate-x-5' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )
            )}

            {/* --- CASE 2 : INFORMATIONS ET POSTS --- */}
            {(ongletActif === 'informations' || ongletActif === 'mes_posts') && (
              mesPublications?.informations?.map((info) => (
                <div key={info.id} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/50 space-y-2.5">
                  {/* Profil utilisateur */}
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-teal-600 text-white font-bold text-xs flex items-center justify-center">
                      {info.initiales || 'AS'}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{info.auteur || 'Assane Seck (Moi)'}</h4>
                      <p className="text-[10px] text-slate-400">{info.date_relative || 'Aujourd\'hui 16:05'}</p>
                    </div>
                  </div>

                  {/* Titre & Localisation */}
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 leading-snug">
                      {info.titre || 'Courants violents et dérive constatée vers Ngor'}
                    </h3>
                    <p className="text-[11px] text-orange-500 font-medium flex items-center gap-1 mt-0.5">
                      <MapPin size={11} />
                      {info.adresse || 'Fosse de Kayar & Passage Ile de Ngor'}
                    </p>
                  </div>

                  {/* Traduction / Description */}
                  <div className="bg-slate-50 rounded-xl p-3 text-xs text-slate-600 italic border border-slate-100">
                    « {info.description || 'Attention aux petites pirogues, courant fort orienté Sud-Ouest. Restez groupés jusqu\'à midi.'} »
                  </div>

                  {/* Audio */}
                  <AudioPlayer audioUrl={info.audio_url} duration={info.duree_audio || '0:18'} />

                  {/* Boutons d'action pour mes posts */}
                  {ongletActif === 'mes_posts' && (
                    <div className="flex items-center gap-2 pt-1">
                      <button className="flex-1 py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg flex items-center justify-center gap-1 transition-colors">
                        <Edit3 size={13} />
                        Modifier
                      </button>
                      <button className="flex-1 py-1.5 px-3 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold rounded-lg flex items-center justify-center gap-1 transition-colors">
                        <Trash2 size={13} />
                        Supprimer
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </>
        )}
      </main>

      {/* 6. Barre de navigation inférieure (Bottom Navigation) */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-slate-200/80 px-4 py-2 flex justify-around items-center text-slate-400 z-50">
        <button onClick={() => navigate('/pecheur/marche')} className="flex flex-col items-center gap-1 text-slate-400 hover:text-teal-600">
          <Store size={18} />
          <span className="text-[9px] font-medium">Marché</span>
        </button>

        <button onClick={() => navigate('/pecheur/publications')} className="flex flex-col items-center gap-1 text-teal-600 font-bold relative">
          <ShoppingBag size={18} />
          <span className="text-[9px]">Publications</span>
          <span className="w-1 h-1 rounded-full bg-teal-600 absolute -bottom-1" />
        </button>

        <button onClick={() => navigate('/pecheur/commandes')} className="flex flex-col items-center gap-1 text-slate-400 hover:text-teal-600">
          <FileText size={18} />
          <span className="text-[9px] font-medium">Commandes</span>
        </button>

        <button onClick={() => navigate('/pecheur/ventes')} className="flex flex-col items-center gap-1 text-slate-400 hover:text-teal-600">
          <TrendingUp size={18} />
          <span className="text-[9px] font-medium">Ventes</span>
        </button>
      </nav>
    </div>
  );
};

export default MesPublications;