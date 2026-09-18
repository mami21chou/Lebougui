import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Bell, Mic, Play, Pause, MapPin,
  Edit3, Trash2, Clock, Store, ShoppingBag,
  FileText, TrendingUp,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { usePublications } from '../../context/PublicationContext';
import { useAudio } from '../../context/AudioContext';

// ============================================================
// Lecteur audio — utilise le contexte global (un seul à la fois)
// ============================================================
const AudioPlayer = ({ id, audioUrl, duration = '0:28' }) => {
  const { currentId, play, pause } = useAudio();
  const isPlaying = currentId === id;

  const togglePlay = () => {
    if (!audioUrl) return;
    if (isPlaying) {
      pause();
    } else {
      play(id, audioUrl);
    }
  };

  return (
    <div className="bg-slate-50 rounded-xl px-3 py-2 flex items-center gap-3 border border-slate-200 my-2">
      <button
        type="button"
        onClick={togglePlay}
        aria-label={isPlaying ? 'Pause' : 'Lecture'}
        className="w-8 h-8 shrink-0 rounded-full bg-orange-500 text-white flex items-center justify-center hover:bg-orange-600 transition-colors"
      >
        {isPlaying ? <Pause size={14} /> : <Play size={14} className="ml-0.5" />}
      </button>

      <span className="text-[11px] font-medium text-slate-600 flex-1 truncate">
        Vocal wolof
      </span>

      <span className="text-[10px] text-slate-400 shrink-0">{duration}</span>
    </div>
  );
};

// ============================================================
// Helpers
// ============================================================
const formatRelative = (dateStr) => {
  if (!dateStr) return "Aujourd'hui";
  const diff = Date.now() - new Date(dateStr).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "À l'instant";
  if (min < 60) return `Il y a ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `Il y a ${h}h`;
  const j = Math.floor(h / 24);
  if (j < 7) return `Il y a ${j}j`;
  return new Date(dateStr).toLocaleDateString('fr-FR');
};

const initiales = (prenom = '', nom = '') =>
  `${prenom[0] || ''}${nom[0] || ''}`.toUpperCase() || 'P';

// ============================================================
// Sous-composants
// ============================================================
const EmptyState = ({ message }) => (
  <div className="bg-white rounded-2xl p-6 text-center shadow-sm">
    <p className="text-xs text-slate-500">{message}</p>
  </div>
);

const InfoCard = ({ info, isMine, showActions, onEdit, onDelete }) => {
  const auteurNom =
    info.pecheur_nom || info.pecheur_prenom
      ? `${info.pecheur_prenom || ''} ${info.pecheur_nom || ''}`.trim()
      : 'Pêcheur';
  const init = initiales(info.pecheur_prenom, info.pecheur_nom);

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/50 space-y-2.5">
      {/* Auteur */}
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-full bg-teal-600 text-white font-bold text-xs flex items-center justify-center">
          {init}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-xs font-bold text-slate-900 truncate">
            {auteurNom} {isMine && <span className="text-teal-600">(Moi)</span>}
          </h4>
          <p className="text-[10px] text-slate-400">
            {formatRelative(info.date_publication)}
          </p>
        </div>
      </div>

      {/* Localisation */}
      <p className="text-[11px] text-orange-500 font-medium flex items-center gap-1">
        <MapPin size={11} />
        {info.adresse || 'Zone non précisée'}
      </p>

      {/* Transcription wolof */}
      <div className="bg-slate-50 rounded-xl p-3 text-xs text-slate-700 italic border border-slate-100">
        « {info.texte_transcrit || 'Aucune transcription'} »
      </div>

      {/* Audio — id unique par info pour la gestion globale */}
      <AudioPlayer
        id={`info-${info.id}`}
        audioUrl={info.audio}
        duration={info.duree_audio || '0:18'}
      />

      {/* Actions (uniquement Mes posts) */}
      {showActions && isMine && (
        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={onEdit}
            className="flex-1 py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg flex items-center justify-center gap-1 transition-colors"
          >
            <Edit3 size={13} />
            Modifier
          </button>
          <button
            onClick={onDelete}
            className="flex-1 py-1.5 px-3 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold rounded-lg flex items-center justify-center gap-1 transition-colors"
          >
            <Trash2 size={13} />
            Supprimer
          </button>
        </div>
      )}
    </div>
  );
};

const ProduitCard = ({ prod, estDisponible, onToggle }) => (
  <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-200/50">
    {prod.media && (
      <div className="h-44 w-full relative bg-slate-100">
        <img src={prod.media} alt={prod.nom} className="w-full h-full object-cover" />
      </div>
    )}

    <div className="p-3.5 space-y-2">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-sm font-bold text-[#0F2A4A]">{prod.nom}</h3>
          <p className="text-[11px] text-slate-500">
            {prod.categorie === 'fruit_de_mer' ? 'Fruit de mer' : 'Poisson'} · {prod.prix} FCFA/kg
          </p>
        </div>
        <span className="text-xs font-bold text-orange-500">{prod.quantite} kg</span>
      </div>

      {prod.texte_transcrit && (
        <div className="bg-slate-50 rounded-xl p-2.5 text-[11px] text-slate-700 italic border border-slate-100">
          « {prod.texte_transcrit} »
        </div>
      )}

      {/* Audio — id unique par produit */}
      <AudioPlayer
        id={`prod-${prod.id}`}
        audioUrl={prod.audio}
        duration={prod.duree_audio || '0:28'}
      />

      <div className="pt-2 flex items-center justify-between border-t border-slate-100">
        <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
          <Clock size={12} />
          <span>
            Publié : <strong>{formatRelative(prod.date_publication)}</strong>
          </span>
        </div>

        <button
          type="button"
          onClick={onToggle}
          aria-label={estDisponible ? 'Désactiver' : 'Activer'}
          className={`w-11 h-6 rounded-full p-0.5 transition-colors duration-200 flex items-center ${
            estDisponible ? 'bg-emerald-500' : 'bg-slate-300'
          }`}
        >
          <span
            className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-200 ${
              estDisponible ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>
    </div>
  </div>
);

// ============================================================
// Page principale
// ============================================================
const MesPublications = () => {
  const { utilisateur, estPecheur } = useAuth();
  const {
    publications,
    mesPublications,
    chargerPublications,
    chargerMesPublications,
  } = usePublications();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [ongletActif, setOngletActif] = useState('mes_prises');
  const [statutsProduits, setStatutsProduits] = useState({});

  useEffect(() => {
    const load = async () => {
      try {
        if (!estPecheur()) {
          navigate('/connexion', { replace: true });
          return;
        }
        await Promise.all([chargerPublications(), chargerMesPublications()]);
      } catch (err) {
        console.error('Erreur lors du chargement:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [estPecheur, chargerPublications, chargerMesPublications, navigate]);

  useEffect(() => {
    if (mesPublications?.produits) {
      const map = {};
      mesPublications.produits.forEach((p) => {
        map[p.id] = p.statut !== 'rupture';
      });
      setStatutsProduits(map);
    }
  }, [mesPublications]);

  const handleToggleStatut = (id) => {
    setStatutsProduits((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  if (!estPecheur()) return null;

  const toutesLesInformations = publications?.informations || [];
  const mesInformations = mesPublications?.informations || [];
  const mesProduits = mesPublications?.produits || [];

  const totalInfos = toutesLesInformations.length;
  const totalMesPosts = mesInformations.length;
  const totalMesPrises = mesProduits.length;

  return (
    <div className="min-h-screen bg-[#F7F4EF] text-slate-800 font-sans pb-24 max-w-md mx-auto relative shadow-xl">

      {/* HEADER */}
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

      {/* BANNIÈRE */}
      <div className="px-5 my-3">
        <div className="bg-[#0F2A4A] rounded-2xl p-4 text-white flex items-center justify-between shadow-lg shadow-[#0F2A4A]/10 relative overflow-hidden">
          <div className="z-10 max-w-[65%]">
            <p className="text-xs font-semibold leading-snug text-slate-200">
              Signalez un banc ou vendez votre prise
            </p>
          </div>
          <button
            onClick={() => navigate('/pecheur/publication/nouvelle')}
            className="z-10 px-4 py-2 bg-[#FF6B35] hover:bg-[#ff5a20] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md shadow-[#FF6B35]/30"
          >
            <Mic size={14} />
            Publier
          </button>
          <div className="absolute -right-4 -bottom-6 w-24 h-24 rounded-full bg-white/5 pointer-events-none" />
        </div>
      </div>

      {/* ONGLETS */}
      <div className="px-5 my-4">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          {[
            { id: 'informations', label: 'Informations', count: totalInfos },
            { id: 'mes_posts', label: 'Mes posts', count: totalMesPosts },
            { id: 'mes_prises', label: 'Mes prises', count: totalMesPrises },
          ].map((tab) => {
            const active = ongletActif === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setOngletActif(tab.id)}
                className={`py-2 px-4 rounded-full text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-all ${
                  active
                    ? 'bg-[#0F2A4A] text-white shadow-md'
                    : 'bg-white text-slate-600 hover:bg-slate-100'
                }`}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span
                    className={`px-1.5 text-[10px] rounded-full ${
                      active ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* TITRE DE SECTION */}
      <div className="px-5 mb-2">
        <h2 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          {ongletActif === 'informations' && 'Toutes les informations de pêche'}
          {ongletActif === 'mes_posts' && "Mes posts d'information"}
          {ongletActif === 'mes_prises' && 'Mes prises en vente directe'}
        </h2>
      </div>

      {/* LISTE */}
      <main className="px-5 space-y-4">
        {loading ? (
          <div className="py-12 text-center text-slate-400 text-sm">
            Chargement de vos publications...
          </div>
        ) : (
          <>
            {ongletActif === 'informations' &&
              (toutesLesInformations.length === 0 ? (
                <EmptyState message="Aucune information de pêche pour le moment." />
              ) : (
                toutesLesInformations.map((info) => (
                  <InfoCard
                    key={info.id}
                    info={info}
                    isMine={info.pecheur === utilisateur?.id}
                    showActions={false}
                  />
                ))
              ))}

            {ongletActif === 'mes_posts' &&
              (mesInformations.length === 0 ? (
                <EmptyState message="Vous n'avez publié aucune information." />
              ) : (
                mesInformations.map((info) => (
                  <InfoCard
                    key={info.id}
                    info={info}
                    isMine={true}
                    showActions={true}
                    onEdit={() => alert(`Modifier info #${info.id}`)}
                    onDelete={() => alert(`Supprimer info #${info.id}`)}
                  />
                ))
              ))}

            {ongletActif === 'mes_prises' &&
              (mesProduits.length === 0 ? (
                <EmptyState message="Aucune prise en vente pour le moment." />
              ) : (
                mesProduits.map((prod) => (
                  <ProduitCard
                    key={prod.id}
                    prod={prod}
                    estDisponible={statutsProduits[prod.id] ?? true}
                    onToggle={() => handleToggleStatut(prod.id)}
                  />
                ))
              ))}
          </>
        )}
      </main>

      {/* BOTTOM NAV */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-slate-200/80 px-4 py-2 flex justify-around items-center text-slate-400 z-50">
        <button
          onClick={() => navigate('/pecheur/accueil')}
          className="flex flex-col items-center gap-1 hover:text-teal-600"
        >
          <Store size={18} />
          <span className="text-[9px] font-medium">Marché</span>
        </button>

        <button
          onClick={() => navigate('/pecheur/publications')}
          className="flex flex-col items-center gap-1 text-teal-600 font-bold relative"
        >
          <ShoppingBag size={18} />
          <span className="text-[9px]">Publications</span>
          <span className="w-1 h-1 rounded-full bg-teal-600 absolute -bottom-1" />
        </button>

        <button
          onClick={() => navigate('/pecheur/commandes')}
          className="flex flex-col items-center gap-1 hover:text-teal-600"
        >
          <FileText size={18} />
          <span className="text-[9px] font-medium">Commandes</span>
        </button>

        <button
          onClick={() => navigate('/pecheur/ventes')}
          className="flex flex-col items-center gap-1 hover:text-teal-600"
        >
          <TrendingUp size={18} />
          <span className="text-[9px] font-medium">Ventes</span>
        </button>
      </nav>
    </div>
  );
};

export default MesPublications;