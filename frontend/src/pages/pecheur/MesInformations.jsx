import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Play, Pause, Clock, BadgeCheck, MapPin, Volume2,
} from 'lucide-react';
import PecheurHeader from '../../components/PecheurHeader';
import PecheurBottomNav from '../../components/PecheurBottomNav';
import { useAudio } from '../../context/AudioContext';
import { PublicationService } from '../../services/publicationService';

const formatRelative = (dateStr) => {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "à l'instant";
  if (min < 60) return `il y a ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `il y a ${h}h`;
  const j = Math.floor(h / 24);
  return `il y a ${j}j`;
};

const initiales = (prenom = '', nom = '') =>
  `${prenom[0] || ''}${nom[0] || ''}`.toUpperCase() || 'P';

export default function MesInformations() {
  const navigate = useNavigate();
  const { currentId: audioEnCours, play: playAudio, pause: pauseAudio } = useAudio();

  const [informations, setInformations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await PublicationService.getInformationsPeche();
        const sorted = (res || []).sort(
          (a, b) =>
            new Date(b.date_publication).getTime() -
            new Date(a.date_publication).getTime()
        );
        setInformations(sorted);
      } catch (err) {
        console.error('Erreur chargement infos:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const toggleAudio = (e, id, url) => {
    e.stopPropagation();
    if (!url) return;
    const key = `info-${id}`;
    if (audioEnCours === key) pauseAudio();
    else playAudio(key, url);
  };

  const isPlaying = (id) => audioEnCours === `info-${id}`;

  return (
    <div className="relative mx-auto min-h-screen max-w-md bg-[#F7F4EF] pb-28 font-sans text-slate-800 shadow-2xl">
      <PecheurHeader
        title="Informations de pêche"
        subtitle="Toutes les publications"
        rightIcon="none"
        showWave={false}
      />

      <main className="space-y-3 px-5 pt-4">
        {/* Bouton retour */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-500 transition hover:text-slate-900"
        >
          <ArrowLeft size={14} />
          <span>Retour</span>
        </button>

        {/* Compteur */}
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Toutes les informations
          </h2>
          <span className="rounded-full bg-teal-50 px-2 py-0.5 text-[10px] font-bold text-teal-700">
            {informations.length}
          </span>
        </div>

        {loading ? (
          <p className="text-xs italic text-slate-400">Chargement…</p>
        ) : informations.length === 0 ? (
          <div className="rounded-2xl border border-slate-200/60 bg-white p-5 text-center shadow-sm">
            <Volume2 size={24} className="mx-auto mb-2 text-slate-300" />
            <p className="text-xs text-slate-400">Aucune information disponible.</p>
          </div>
        ) : (
          informations.map((info) => {
            const playing = isPlaying(info.id);
            return (
              <div
                key={info.id}
                className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-sm"
              >
                <div className="flex items-center gap-3 p-3.5">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#0C3B4A] to-teal-600 text-sm font-black text-white shadow-sm">
                    {initiales(info.pecheur_prenom, info.pecheur_nom)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="truncate text-sm font-bold text-slate-900">
                        {info.pecheur_prenom} {info.pecheur_nom}
                      </p>
                      {info.pecheur_est_premium && (
                        <BadgeCheck size={14} className="shrink-0 text-teal-500" />
                      )}
                    </div>
                    <p className="flex items-center gap-1 truncate text-[11px] text-slate-400">
                      <MapPin size={10} />
                      {info.adresse || 'Zone non précisée'}
                      <span>·</span>
                      <Clock size={10} />
                      {formatRelative(info.date_publication)}
                    </p>
                  </div>
                </div>

                {info.audio && (
                  <button
                    type="button"
                    onClick={(e) => toggleAudio(e, info.id, info.audio)}
                    className="flex w-full items-center gap-3 border-t border-slate-100 bg-slate-50/50 px-3.5 py-3 transition hover:bg-slate-100"
                  >
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition ${
                        playing
                          ? 'bg-[#FF6B4A] text-white'
                          : 'bg-white text-[#0C3B4A] shadow-sm ring-1 ring-slate-200'
                      }`}
                    >
                      {playing ? (
                        <Pause size={14} fill="currentColor" />
                      ) : (
                        <Play size={14} fill="currentColor" className="ml-0.5" />
                      )}
                    </span>
                    <span className="flex-1 text-left">
                      <span className="block text-xs font-bold text-slate-700">
                        {playing ? 'En lecture…' : 'Écouter la note vocale'}
                      </span>
                      <span className="block text-[10px] text-slate-400">
                        Vocal wolof
                      </span>
                    </span>
                    <Volume2 size={16} className="text-slate-400" />
                  </button>
                )}
              </div>
            );
          })
        )}
      </main>

      <PecheurBottomNav />
    </div>
  );
}