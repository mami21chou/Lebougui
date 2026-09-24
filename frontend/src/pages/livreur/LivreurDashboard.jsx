import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bike, Package, MapPin, Clock, Check, Phone, User,
  ToggleLeft, ToggleRight, ChevronRight, Layers, Crown
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { CommandeService } from '../../services/commandeService';
import LivreurBottomNav from '../../components/LivreurBottomNav';
import LoadingSpinner from '../../components/LoadingSpinner';

const formatPrice = (p) =>
  `${new Intl.NumberFormat('fr-FR').format(Number(p) || 0)} FCFA`;

// Clé localStorage pour mémoriser le choix "en ligne" du livreur
const DISPO_KEY = (userId) => `livreur_dispo_${userId}`;

// Extrait la zone principale d'une adresse (ex: "Plateau, Dakar" → "plateau")
const extraireZone = (adresse) => {
  if (!adresse) return '';
  return adresse.split(',')[0].trim().toLowerCase();
};

export default function LivreurDashboard() {
  const navigate = useNavigate();
  const { utilisateur } = useAuth();

  const [disponible, setDisponible] = useState(false);
  const [courses, setCourses] = useState([]);
  const [selection, setSelection] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [enCours, setEnCours] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [zoneSelectionnee, setZoneSelectionnee] = useState(null);

  const userId = utilisateur?.id || utilisateur?.utilisateur?.id;
  const dispoKey = DISPO_KEY(userId);

  // ═══════════════════════════════════════════════════════════
  // 1. INITIALISATION DU STATUT "EN LIGNE"
  //    - Si le livreur a déjà un choix mémorisé → on le reprend
  //    - Sinon → on le met EN LIGNE par défaut (à sa 1ère visite)
  // ═══════════════════════════════════════════════════════════
  useEffect(() => {
    if (!userId) return;

    const choixMemorise = localStorage.getItem(dispoKey);
    const dispoBackend = utilisateur?.profil_livreur?.disponible;

    // Priorité : backend si présent, sinon localStorage, sinon true
    let etatInitial;
    if (dispoBackend === true || dispoBackend === false) {
      etatInitial = dispoBackend;
    } else if (choixMemorise !== null) {
      etatInitial = choixMemorise === 'true';
    } else {
      etatInitial = true; // ← En ligne par défaut à la 1ère ouverture
    }

    setDisponible(etatInitial);

    // Synchroniser silencieusement avec le backend si différent
    if (dispoBackend !== etatInitial) {
      CommandeService.toggleDisponible(etatInitial).catch(() => {});
    }
  }, [userId, dispoKey, utilisateur?.profil_livreur?.disponible]);

  // ═══════════════════════════════════════════════════════════
  // 2. CHARGEMENT DE LA LIVRAISON EN COURS
  //    Rechargé à chaque focus de la page + polling 15s
  // ═══════════════════════════════════════════════════════════
  const loadEnCours = useCallback(async () => {
    try {
      const res = await CommandeService.getLivraisonEnCours();
      setEnCours(res?.en_cours || null);
    } catch {
      setEnCours(null);
    }
  }, []);

  useEffect(() => {
    loadEnCours();
    const interval = setInterval(loadEnCours, 15000);

    // Recharger quand l'utilisateur revient sur l'onglet
    const onFocus = () => loadEnCours();
    window.addEventListener('focus', onFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, [loadEnCours]);

  // ═══════════════════════════════════════════════════════════
  // 3. CHARGEMENT DES COURSES DISPONIBLES
  // ═══════════════════════════════════════════════════════════
  const loadCourses = useCallback(async () => {
    try {
      setChargement(true);
      const res = await CommandeService.listerCoursesDisponibles();
      setCourses(res.resultats || []);
      if (res.raison === 'hors_ligne') {
        setFeedback('Mettez-vous en ligne pour voir les courses.');
      } else {
        setFeedback('');
      }
    } catch (err) {
      console.error('Erreur chargement courses:', err);
    } finally {
      setChargement(false);
    }
  }, []);

  useEffect(() => {
    if (disponible) {
      loadCourses();
    } else {
      setCourses([]);
      setChargement(false);
    }
    const interval = setInterval(() => {
      if (disponible) loadCourses();
    }, 15000);
    return () => clearInterval(interval);
  }, [disponible, loadCourses]);

  // ═══════════════════════════════════════════════════════════
  // 4. TOGGLE DISPONIBLE (mémorisé)
  // ═══════════════════════════════════════════════════════════
  const toggleDisponible = async () => {
    const nouveau = !disponible;
    setDisponible(nouveau);
    localStorage.setItem(dispoKey, String(nouveau));

    if (!nouveau) {
      setCourses([]);
      setSelection([]);
      setZoneSelectionnee(null);
    }

    try {
      const res = await CommandeService.toggleDisponible(nouveau);
      if (typeof res?.disponible === 'boolean') {
        setDisponible(res.disponible);
        localStorage.setItem(dispoKey, String(res.disponible));
      }
    } catch {
      // Rollback en cas d'échec réseau
      setDisponible(!nouveau);
      localStorage.setItem(dispoKey, String(!nouveau));
      setFeedback('Impossible de changer la disponibilité.');
    }
  };

  // ═══════════════════════════════════════════════════════════
  // 5. REGROUPEMENT PAR ZONE (amélioré)
  //    On compare sur le 1er mot de l'adresse (zone), pas la
  //    chaîne entière, pour éviter les faux négatifs.
  // ═══════════════════════════════════════════════════════════
  const toggleSelection = (cmd) => {
    setSelection((prev) => {
      const existe = prev.find((c) => c.id === cmd.id);
      if (existe) {
        const next = prev.filter((c) => c.id !== cmd.id);
        setZoneSelectionnee(next.length > 0 ? extraireZone(next[0].adresse_livraison) : null);
        return next;
      }

      if (prev.length > 0) {
        const ref = prev[0];

        // Même pêcheur obligatoire
        if (ref.pecheur !== cmd.pecheur) {
          setFeedback('Toutes les commandes doivent venir du même pêcheur.');
          setTimeout(() => setFeedback(''), 3000);
          return prev;
        }

        // Même zone : on compare sur la zone extraite
        const zoneRef = extraireZone(ref.adresse_livraison);
        const zoneCmd = extraireZone(cmd.adresse_livraison);

        if (zoneRef !== zoneCmd) {
          setFeedback(
            `Regroupement impossible : les commandes doivent être dans la même zone (${ref.adresse_livraison?.split(',')[0]} ≠ ${cmd.adresse_livraison?.split(',')[0]}).`
          );
          setTimeout(() => setFeedback(''), 3500);
          return prev;
        }
      }

      const next = [...prev, cmd];
      setZoneSelectionnee(extraireZone(next[0].adresse_livraison));
      return next;
    });
  };

  // ═══════════════════════════════════════════════════════════
  // 6. ACCEPTER LA SÉLECTION
  // ═══════════════════════════════════════════════════════════
  const accepter = async () => {
    if (selection.length === 0) return;
    try {
      const liv = await CommandeService.accepterCourse(selection.map((c) => c.id));
      setSelection([]);
      setZoneSelectionnee(null);
      navigate(`/livreur/livraison/${liv.id}/recuperer`);
    } catch (err) {
      setFeedback(err.response?.data?.erreur || "Impossible d'accepter la course.");
      setTimeout(() => setFeedback(''), 3500);
    }
  };

  const totalGain = selection.reduce((s, c) => s + 1000, 0);
  const nbCommandesEnCours = enCours?.commandes_detail?.length || enCours?.commandes?.length || 0;

  return (
    <div className="min-h-screen bg-stone-300 font-sans antialiased sm:flex sm:items-center sm:justify-center sm:py-6">
      <div className="relative flex h-screen w-full max-w-md flex-col overflow-hidden bg-[#FAF6F0] sm:h-[880px] sm:max-h-[92vh] sm:rounded-[40px] sm:border-8 sm:border-stone-300 sm:shadow-2xl">

        {/* ═══════════════ HEADER ═══════════════ */}
        <header className="shrink-0 bg-[#0C3B4A] px-5 pb-6 pt-6">
          <div className="flex items-center justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <div className="relative shrink-0">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white">
                  <Bike size={20} />
                </div>
                <span
                  className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-[#0C3B4A] ${
                    disponible ? 'bg-emerald-400' : 'bg-stone-400'
                  }`}
                />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 min-w-0">
  <h1 className="truncate text-base font-extrabold leading-tight text-white">
    {utilisateur?.prenom} {utilisateur?.nom}
  </h1>
  {utilisateur?.status_premium?.some(
    (p) => p.statut === 'actif' && p.fonction === 'badge_livreur'
  ) && (
    <Crown size={15} className="shrink-0 text-amber-400" />
  )}
</div>
                <p className="flex items-center gap-1 text-[11px] text-white/60">
                  <Bike size={10} />
                  {utilisateur?.profil_livreur?.vehicule?.immatriculation || 'N/A'}
                </p>
              </div>
            </div>

            {/* Toggle : plus visible, texte explicatif */}
            <button
              onClick={toggleDisponible}
              className="flex shrink-0 items-center gap-2 rounded-full bg-white/10 px-3 py-2 transition hover:bg-white/20"
              aria-label={disponible ? 'Passer hors ligne' : 'Passer en ligne'}
            >
              <span className="text-[10px] font-bold uppercase tracking-wider text-white">
                {disponible ? 'En ligne' : 'Hors ligne'}
              </span>
              {disponible ? (
                <ToggleRight size={22} className="text-emerald-400" />
              ) : (
                <ToggleLeft size={22} className="text-white/50" />
              )}
            </button>
          </div>
        </header>

        {/* ═══════════════ FEEDBACK ═══════════════ */}
        {feedback && (
          <div className="mx-5 mt-4 shrink-0 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs font-medium text-amber-800">
            {feedback}
          </div>
        )}

        {/* ═══════════════ LIVRAISON EN COURS ═══════════════ */}
        {enCours && (
          <div className="mx-5 mt-4 shrink-0 overflow-hidden rounded-3xl border-2 border-orange-300 bg-gradient-to-br from-orange-50 to-orange-100/50">
            <div className="p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-500 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-white">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
                  Course en cours
                </span>
                <span className="text-[10px] font-bold text-orange-700">
                  {nbCommandesEnCours} commande{nbCommandesEnCours > 1 ? 's' : ''}
                </span>
              </div>

              <p className="mb-1 text-xs font-bold text-stone-800">
                Ne perdez pas votre course
              </p>
              <p className="mb-3 text-[11px] text-stone-600">
                Reprenez là où vous vous étiez arrêté.
              </p>

              <button
                onClick={() => navigate(`/livreur/livraison/${enCours.id}/recuperer`)}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#FF6B4A] py-3 text-xs font-black text-white shadow-sm transition hover:bg-[#E85A39] active:scale-[0.98]"
              >
                Continuer la course
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}

        {/* ═══════════════ LISTE DES COURSES ═══════════════ */}
        <main className="no-scrollbar flex-1 overflow-y-auto px-5 pb-24 pt-4">

          {/* HORS LIGNE */}
          {!disponible ? (
            <div className="mt-8 text-center">
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-stone-100">
                <ToggleLeft size={40} className="text-stone-400" />
              </div>
              <h3 className="mb-2 font-bold text-stone-900">Vous êtes hors ligne</h3>
              <p className="mx-auto mb-6 max-w-[240px] text-xs text-stone-500">
                Activez le mode en ligne pour voir les courses disponibles dans votre zone.
              </p>
              <button
                onClick={toggleDisponible}
                className="rounded-2xl bg-[#0C3B4A] px-6 py-3 text-xs font-black text-white shadow-md transition hover:bg-[#082833]"
              >
                Passer en ligne
              </button>
            </div>
          ) : chargement ? (
            <div className="py-12 text-center">
              <LoadingSpinner size="lg" />
            </div>
          ) : courses.length === 0 ? (
            <div className="mt-8 rounded-3xl border border-stone-100 bg-white p-8 text-center shadow-sm">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-stone-100">
                <Package size={24} className="text-stone-400" />
              </div>
              <h3 className="mb-2 font-bold text-stone-900">Aucune course disponible</h3>
              <p className="text-xs text-stone-500">
                Actualisation automatique toutes les 15 secondes.
              </p>
            </div>
          ) : (
            <div className="space-y-3">

              {/* En-tête avec zone sélectionnée */}
              {zoneSelectionnee && (
                <div className="flex items-center justify-between rounded-2xl bg-blue-50 px-3 py-2">
                  <span className="flex items-center gap-1.5 text-[11px] font-bold text-blue-700">
                    <Layers size={12} />
                    Zone : {zoneSelectionnee}
                  </span>
                  <span className="text-[10px] font-bold text-blue-600">
                    {selection.length} sélectionnée{selection.length > 1 ? 's' : ''}
                  </span>
                </div>
              )}

              <p className="text-xs font-bold uppercase tracking-wider text-stone-400">
                {courses.length} course{courses.length > 1 ? 's' : ''} disponible
                {courses.length > 1 ? 's' : ''}
              </p>

              {courses.map((cmd) => {
                const prod = cmd.lignes?.[0]?.produit_detail || {};
                const selected = selection.some((c) => c.id === cmd.id);
                return (
                  <div
                    key={cmd.id}
                    onClick={() => toggleSelection(cmd)}
                    className={`cursor-pointer rounded-3xl border-2 bg-white p-4 shadow-sm transition ${
                      selected
                        ? 'border-[#FF6B4A] bg-orange-50/30'
                        : 'border-stone-100 hover:border-stone-200'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-black text-emerald-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        COMMANDE PAYÉE
                      </span>
                      {selected && (
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#FF6B4A] text-white">
                          <Check size={14} strokeWidth={3} />
                        </span>
                      )}
                    </div>

                    <div className="mt-3 flex gap-3">
                      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-stone-100">
                        <img
                          src={prod.media || 'https://images.unsplash.com/photo-1534483509719-3feaee7c30da?w=100'}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-extrabold text-[#0F2A4A]">
                          {prod.nom || 'Produit'}
                        </p>
                        <p className="text-[11px] text-stone-500">
                          {cmd.lignes?.[0]?.quantite || 0} kg
                        </p>
                        <p className="mt-1 flex items-center gap-1 truncate text-[11px] text-stone-500">
                          <MapPin size={10} /> {cmd.adresse_livraison}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between border-t border-stone-100 pt-3">
                      <div>
                        <p className="text-[10px] text-stone-400">Pêcheur</p>
                        <p className="text-xs font-bold text-stone-700">
                          {cmd.nom_pecheur}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-stone-400">Gain estimé</p>
                        <p className="text-sm font-black text-[#FF6B4A]">
                          {formatPrice(1000)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>

        {/* ═══════════════ BOUTON ACCEPTER (fixe en bas) ═══════════════ */}
        {selection.length > 0 && (
          <div className="absolute bottom-20 left-4 right-4 z-20">
            <button
              onClick={accepter}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#FF6B4A] py-4 text-sm font-black text-white shadow-xl shadow-orange-500/30 transition hover:bg-[#E85A39] active:scale-[0.98]"
            >
              <Check size={18} strokeWidth={3} />
              Accepter {selection.length} course{selection.length > 1 ? 's' : ''} — {formatPrice(totalGain)}
            </button>
          </div>
        )}

        <LivreurBottomNav />
      </div>
    </div>
  );
}