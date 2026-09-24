import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Mic, Play, Pause, MapPin,
  Edit3, Trash2, Clock,
} from 'lucide-react';
import PecheurHeader from '../../components/PecheurHeader';
import PecheurBottomNav from '../../components/PecheurBottomNav';
import { useAuth } from '../../context/AuthContext';
import { usePublications } from '../../context/PublicationContext';
import { useAudio } from '../../context/AudioContext';

const fallbackImage = '/images/fallback.png';

// ============================================================
// Lecteur audio — compact (utilisé dans la grille produits)
// ============================================================
const AudioButtonCompact = ({ id, audioUrl }) => {
  const { currentId, play, pause } = useAudio();
  const isPlaying = currentId === id;

  const togglePlay = (e) => {
    e.stopPropagation();
    if (!audioUrl) return;
    if (isPlaying) pause();
    else play(id, audioUrl);
  };

  return (
    <button
      type="button"
      onClick={togglePlay}
      aria-label={isPlaying ? 'Pause' : 'Lecture'}
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition ${
        isPlaying
          ? 'bg-[#FF6B4A] text-white shadow-md shadow-orange-500/30'
          : 'bg-slate-100 text-[#0C3B4A] hover:bg-slate-200'
      }`}
    >
      {isPlaying ? (
        <Pause size={13} fill="currentColor" />
      ) : (
        <Play size={13} fill="currentColor" className="ml-0.5" />
      )}
    </button>
  );
};

// ============================================================
// Lecteur audio — large (utilisé dans les cartes infos)
// ============================================================
const AudioPlayerRow = ({ id, audioUrl, duration = '0:28' }) => {
  const { currentId, play, pause } = useAudio();
  const isPlaying = currentId === id;

  const togglePlay = () => {
    if (!audioUrl) return;
    if (isPlaying) pause();
    else play(id, audioUrl);
  };

  return (
    <div className="flex items-center gap-3 rounded-2xl bg-slate-50 px-3 py-2.5">
      <button
        type="button"
        onClick={togglePlay}
        aria-label={isPlaying ? 'Pause' : 'Lecture'}
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition ${
          isPlaying
            ? 'bg-[#FF6B4A] text-white shadow-md shadow-orange-500/30'
            : 'bg-white text-[#0C3B4A] shadow-sm ring-1 ring-slate-200 hover:bg-slate-100'
        }`}
      >
        {isPlaying ? (
          <Pause size={14} fill="currentColor" />
        ) : (
          <Play size={14} fill="currentColor" className="ml-0.5" />
        )}
      </button>

      <span className="flex-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">
        Vocal wolof
      </span>

      <span className="shrink-0 text-[10px] font-bold text-slate-400">
        {duration}
      </span>
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
  <div className="col-span-2 flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white/60 px-6 py-14 text-center">
    <p className="text-xs font-medium text-slate-500">{message}</p>
  </div>
);

const InfoCard = ({ info, isMine, showActions, onEdit, onDelete }) => {
  const auteurNom =
    info.pecheur_nom || info.pecheur_prenom
      ? `${info.pecheur_prenom || ''} ${info.pecheur_nom || ''}`.trim()
      : 'Pêcheur';
  const init = initiales(info.pecheur_prenom, info.pecheur_nom);

  return (
    <article className="overflow-hidden rounded-3xl bg-white shadow-sm">
      <div className="flex">
        <div className="w-1 shrink-0 bg-gradient-to-b from-[#0C3B4A] to-teal-500" />

        <div className="flex-1 space-y-3 p-4">
          <header className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-[#0C3B4A] to-teal-600 text-xs font-black text-white">
              {init}
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="truncate text-sm font-bold text-slate-900">
                {auteurNom}
                {isMine && (
                  <span className="ml-1.5 rounded-full bg-teal-50 px-2 py-0.5 text-[10px] font-bold text-teal-700">
                    Moi
                  </span>
                )}
              </h4>
              <p className="flex items-center gap-1 text-[10px] text-slate-400">
                <Clock size={10} />
                {formatRelative(info.date_publication)}
              </p>
            </div>
          </header>

          <p className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2.5 py-1 text-[11px] font-semibold text-orange-600">
            <MapPin size={11} />
            {info.adresse || 'Zone non précisée'}
          </p>

          <div className="rounded-2xl bg-amber-50/70 p-3.5 text-xs italic leading-relaxed text-slate-700">
            « {info.texte_transcrit || 'Aucune transcription'} »
          </div>

          <AudioPlayerRow
            id={`info-${info.id}`}
            audioUrl={info.audio}
            duration={info.duree_audio || '0:18'}
          />

          {showActions && isMine && (
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={onEdit}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-slate-100 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-200"
              >
                <Edit3 size={13} />
                Modifier
              </button>
              <button
                onClick={onDelete}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-red-50 py-2 text-xs font-bold text-red-600 transition hover:bg-red-100"
              >
                <Trash2 size={13} />
                Supprimer
              </button>
            </div>
          )}
        </div>
      </div>
    </article>
  );
};

// ============================================================
// Carte produit — format compact pour grille 2 colonnes
// ============================================================
const ProduitCard = ({ prod, estDisponible, enCours, onToggle }) => (
  <article className="overflow-hidden rounded-2xl bg-white shadow-sm">
    {/* IMAGE */}
    <div className="relative aspect-square w-full overflow-hidden bg-slate-100">
      {prod.media ? (
        <img
          src={prod.media}
          alt={prod.nom}
          className={`h-full w-full object-cover transition duration-500 ${
            estDisponible ? '' : 'grayscale opacity-60'
          }`}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = fallbackImage;
          }}
        />
      ) : (
        <img
          src={fallbackImage}
          alt={prod.nom}
          className={`h-full w-full object-cover transition duration-500 ${
            estDisponible ? '' : 'grayscale opacity-60'
          }`}
        />
      )}
    </div>

    {/* CORPS */}
    <div className="space-y-2.5 p-2.5">
      {/* Nom */}
      <h3 className="truncate text-xs font-bold leading-tight text-[#0F2A4A]">
        {prod.nom}
      </h3>

      {/* Audio + Toggle sur la même ligne */}
      <div className="flex items-center justify-between gap-2">
        <AudioButtonCompact
          id={`prod-${prod.id}`}
          audioUrl={prod.audio}
        />

        <button
          type="button"
          onClick={onToggle}
          disabled={enCours}
          aria-label={estDisponible ? 'Désactiver' : 'Activer'}
          className={`flex h-5 w-9 items-center rounded-full p-0.5 transition-colors duration-200 disabled:opacity-60 ${
            estDisponible ? 'bg-emerald-500' : 'bg-slate-300'
          }`}
        >
          <span
            className={`h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
              estDisponible ? 'translate-x-4' : 'translate-x-0'
            }`}
          />
        </button>
      </div>
    </div>
  </article>
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
    changerStatutProduit,
  } = usePublications();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [ongletActif, setOngletActif] = useState('mes_prises');
  const [statutsProduits, setStatutsProduits] = useState({});
  const [statutEnCours, setStatutEnCours] = useState(null);

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

  const handleToggleStatut = async (id) => {
    if (statutEnCours === id) return;
    const ancien = statutsProduits[id] ?? true;

    setStatutsProduits((prev) => ({ ...prev, [id]: !ancien }));
    setStatutEnCours(id);

    const res = await changerStatutProduit(id, ancien ? 'rupture' : 'disponible');
    if (!res.success) {
      setStatutsProduits((prev) => ({ ...prev, [id]: ancien }));
      alert(res.error);
    }
    setStatutEnCours(null);
  };

  if (!estPecheur()) return null;

  const toutesLesInformations = publications?.informations || [];
  const mesInformations = mesPublications?.informations || [];
  const mesProduits = mesPublications?.produits || [];

  const totalInfos = toutesLesInformations.length;
  const totalMesPosts = mesInformations.length;
  const totalMesPrises = mesProduits.length;

  return (
    <div className="relative mx-auto min-h-screen max-w-md bg-[#F7F4EF] pb-24 font-sans text-slate-800 shadow-2xl">

      {/* HEADER */}
      <PecheurHeader
        title="Publications"
        subtitle="Vos prises et informations"
        rightIcon="bell"
        showWave={false}
        onRightIconClick={() => navigate('/pecheur/notifications')}
      />

      {/* BANNIÈRE PUBLIER */}
      <div className="px-5 pt-4">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-tr from-[#0F2A4A] via-[#0C3B4A] to-[#0F4C64] p-4 text-white shadow-lg shadow-[#0F2A4A]/20">
          <div className="relative z-10 flex items-center justify-between gap-3">
            <p className="text-sm font-black leading-tight">
              Signalez un banc
              <br />
              ou vendez votre prise
            </p>

            <button
              onClick={() => navigate('/pecheur/publication/nouvelle')}
              className="flex shrink-0 items-center gap-1.5 rounded-2xl bg-[#FF6B4A] px-4 py-2.5 text-xs font-black text-white shadow-lg shadow-orange-500/30 transition hover:bg-[#E85A39] active:scale-95"
            >
              <Mic size={14} />
              Publier
            </button>
          </div>

          <div className="pointer-events-none absolute -right-6 -bottom-8 h-32 w-32 rounded-full bg-teal-400/10 blur-2xl" />
          <div className="pointer-events-none absolute -right-2 -top-8 h-20 w-20 rounded-full bg-orange-400/10 blur-xl" />
        </div>
      </div>

      {/* ONGLETS */}
      <div className="px-5 pt-5">
        <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
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
                className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition ${
                  active
                    ? 'bg-[#0F2A4A] text-white shadow-md'
                    : 'bg-white text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span>{tab.label}</span>
                {tab.count > 0 && (
                  <span
                    className={`flex h-5 min-w-[20px] items-center justify-center rounded-full px-1 text-[10px] font-black ${
                      active ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
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

      {/* LISTE */}
      <main className="px-5 pt-4">
        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="aspect-square animate-pulse rounded-2xl bg-white"
              />
            ))}
          </div>
        ) : (
          <>
            {/* INFORMATIONS — liste pleine largeur */}
            {ongletActif === 'informations' && (
              <div className="space-y-3">
                {toutesLesInformations.length === 0 ? (
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
                )}
              </div>
            )}

            {/* MES POSTS — liste pleine largeur */}
            {ongletActif === 'mes_posts' && (
              <div className="space-y-3">
                {mesInformations.length === 0 ? (
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
                )}
              </div>
            )}

            {/* MES PRISES — grille 2×2 */}
            {ongletActif === 'mes_prises' && (
              <div className="grid grid-cols-2 gap-3">
                {mesProduits.length === 0 ? (
                  <EmptyState message="Aucune prise en vente pour le moment." />
                ) : (
                  mesProduits.map((prod) => (
                    <ProduitCard
                      key={prod.id}
                      prod={prod}
                      estDisponible={statutsProduits[prod.id] ?? true}
                      enCours={statutEnCours === prod.id}
                      onToggle={() => handleToggleStatut(prod.id)}
                    />
                  ))
                )}
              </div>
            )}
          </>
        )}
      </main>

      <PecheurBottomNav />
    </div>
  );
};

export default MesPublications;