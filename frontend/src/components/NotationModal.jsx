import React, { useState, useEffect } from 'react';
import {
  X, Star, Fish, Truck, Check, Loader2,
} from 'lucide-react';
import { CommandeService } from '../services/commandeService';

const NOMS_ETOILES = {
  1: 'Très mauvais',
  2: 'Mauvais',
  3: 'Moyen',
  4: 'Bien',
  5: 'Excellent',
};

export default function NotationModal({ commandeId, onClose, onSuccess }) {
  const [loading, setLoading] = useState(true);
  const [cibles, setCibles] = useState([]);
  const [activeCible, setActiveCible] = useState(null);
  const [etoile, setEtoile] = useState(5);
  const [commentaire, setCommentaire] = useState('');
  const [envoi, setEnvoi] = useState(false);

  // ═══════════════════════════════════════════════════════════
  // Charger les cibles (pêcheur + livreur)
  // ═══════════════════════════════════════════════════════════
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await CommandeService.getNotesCommande(commandeId);
        const liste = data.cibles_possibles || [];
        setCibles(liste);
        // Sélectionner la première cible non notée
        const premiereNonNotee = liste.find((c) => !c.deja_note);
        setActiveCible(premiereNonNotee || liste[0]);
      } catch (err) {
        console.error('Erreur chargement notes:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [commandeId]);

  // ═══════════════════════════════════════════════════════════
  // Envoyer une note
  // ═══════════════════════════════════════════════════════════
  const handleEnvoyer = async () => {
    if (!activeCible || activeCible.deja_note) return;
    setEnvoi(true);
    try {
      await CommandeService.creerNote({
        commande: commandeId,
        cible: activeCible.id,
        etoile,
        commentaire,
      });

      // Mettre à jour la liste
      const nouvelleListe = cibles.map((c) =>
        c.id === activeCible.id ? { ...c, deja_note: true } : c
      );
      setCibles(nouvelleListe);

      // Reset formulaire
      setCommentaire('');
      setEtoile(5);

      // Passer à la cible suivante non notée
      const suivante = nouvelleListe.find((c) => !c.deja_note);
      if (suivante) {
        setActiveCible(suivante);
      } else {
        onSuccess?.();
        setTimeout(onClose, 900);
      }
    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        err.response?.data?.cible?.[0] ||
        err.response?.data?.commande?.[0] ||
        'Erreur lors de l\'envoi';
      alert(msg);
    } finally {
      setEnvoi(false);
    }
  };

  const toutNote = cibles.length > 0 && cibles.every((c) => c.deja_note);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center sm:p-6">
      <div className="flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="font-display text-base font-black text-slate-900">
            {toutNote ? 'Merci pour vos avis !' : 'Noter cette commande'}
          </h2>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="no-scrollbar flex-1 overflow-y-auto p-5 space-y-5">
          {loading ? (
            <div className="flex h-40 items-center justify-center">
              <Loader2 className="animate-spin text-[#FF6B4A]" size={28} />
            </div>
          ) : toutNote ? (
            <div className="flex flex-col items-center py-8 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                <Check size={32} className="text-emerald-600" />
              </div>
              <p className="mt-4 text-sm font-bold text-slate-900">
                Tous les avis ont été envoyés
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Merci de contribuer à la qualité de la plateforme.
              </p>
            </div>
          ) : (
            <>
              {/* Sélection pêcheur / livreur */}
              <div className="grid grid-cols-2 gap-2">
                {cibles.map((c) => {
                  const Icon = c.type === 'pecheur' ? Fish : Truck;
                  const actif = activeCible?.id === c.id;
                  return (
                    <button
                      key={c.id}
                      onClick={() => !c.deja_note && setActiveCible(c)}
                      disabled={c.deja_note}
                      className={`relative flex items-center gap-2.5 rounded-2xl border-2 p-3 text-left transition ${
                        c.deja_note
                          ? 'cursor-default border-emerald-100 bg-emerald-50/50 opacity-70'
                          : actif
                          ? 'border-[#FF6B4A] bg-orange-50'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                          c.deja_note
                            ? 'bg-emerald-100 text-emerald-600'
                            : actif
                            ? 'bg-[#FF6B4A] text-white'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {c.deja_note ? <Check size={16} /> : <Icon size={16} />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          {c.type === 'pecheur' ? 'Pêcheur' : 'Livreur'}
                        </p>
                        <p className="truncate text-xs font-bold text-slate-800">
                          {c.nom}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Formulaire de notation */}
              {activeCible && !activeCible.deja_note && (
                <div className="space-y-4">
                  {/* Étoiles */}
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5 text-center">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Votre note
                    </p>
                    <div className="mt-3 flex items-center justify-center gap-1.5">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button
                          key={n}
                          onClick={() => setEtoile(n)}
                          className="transition active:scale-90"
                          aria-label={`${n} étoile${n > 1 ? 's' : ''}`}
                        >
                          <Star
                            size={36}
                            className={
                              n <= etoile
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-slate-300'
                            }
                          />
                        </button>
                      ))}
                    </div>
                    <p className="mt-2 text-sm font-bold text-amber-600">
                      {NOMS_ETOILES[etoile]}
                    </p>
                  </div>

                  {/* Commentaire */}
                  <div>
                    <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Commentaire (optionnel)
                    </label>
                    <textarea
                      value={commentaire}
                      onChange={(e) => setCommentaire(e.target.value)}
                      placeholder="Décrivez votre expérience…"
                      rows={3}
                      maxLength={300}
                      className="w-full resize-none rounded-2xl border border-slate-200 bg-white p-3.5 text-xs text-slate-800 outline-none transition focus:border-[#FF6B4A]"
                    />
                    <p className="mt-1 text-right text-[10px] text-slate-400">
                      {commentaire.length} / 300
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer — bouton envoyer */}
        {!loading && !toutNote && activeCible && !activeCible.deja_note && (
          <div className="border-t border-slate-100 bg-slate-50/60 p-4">
            <button
              onClick={handleEnvoyer}
              disabled={envoi}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#FF6B4A] py-3.5 text-sm font-black text-white shadow-lg shadow-orange-500/20 transition hover:bg-[#E85A39] active:scale-[0.98] disabled:opacity-60"
            >
              {envoi ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Envoi...
                </>
              ) : (
                <>
                  <Check size={16} />
                  Envoyer la note pour {activeCible.nom.split(' ')[0]}
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}