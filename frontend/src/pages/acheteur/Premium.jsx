import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Crown, CheckCircle2, Clock, ShieldOff, Sparkles,
  ArrowLeft, AlertCircle, XCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UtilisateurService } from '../../services/utilisateurService';

const PRIX_MENSUEL = 1000;
const DUREES = [
  { mois: 1 },
  { mois: 3 },
  { mois: 6 },
  { mois: 12 },
];

const AVANTAGES = {
  acheteur: [
    'Alertes personnalisées par poisson et zone',
    'Accès prioritaire aux arrivages rares',
    'Notifications WhatsApp instantanées',
    'Support dédié acheteur',
  ],
  pecheur: [
    'Badge « Pêcheur PRO » visible par les acheteurs',
    'Mise en avant dans les résultats de recherche',
    'Statistiques avancées de vente',
    'Accès aux alertes acheteurs',
  ],
  livreur: [
    'Accès prioritaire aux livraisons',
    'Badge « Livreur PRO » sur votre profil',
    'Meilleures courses proposées',
    'Statistiques de gains détaillées',
  ],
};

export default function Premium() {
  const navigate = useNavigate();
  const { utilisateur, estPecheur, estLivreur, estAcheteur, setUtilisateur } = useAuth();

  const [dureeChoisie, setDureeChoisie] = useState(1);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const role = estPecheur() ? 'pecheur' : estLivreur() ? 'livreur' : estAcheteur() ? 'acheteur' : null;

  const fonctionPremium =
    role === 'pecheur' ? 'badge_pecheur' :
    role === 'livreur' ? 'badge_livreur' :
    'abonnement_acheteur';

  const premiumInfo = useMemo(() => {
    const premiums = utilisateur?.status_premium || [];
    const premium = premiums.find((p) => p.fonction === fonctionPremium);
    if (!premium) return { etat: 'aucun' };

    if (premium.statut === 'actif') {
      const expiration = premium.date_expiration ? new Date(premium.date_expiration) : null;
      const estExpire = expiration && expiration < new Date();
      if (estExpire) return { etat: 'expire', premium, dateExpiration: expiration };
      return {
        etat: 'actif',
        premium,
        dateExpiration: expiration,
        joursRestants: expiration ? Math.ceil((expiration - new Date()) / (1000 * 60 * 60 * 24)) : null,
      };
    }
    if (premium.statut === 'en_attente') return { etat: 'en_attente', premium, motif: premium.motif_validation };
    if (premium.statut === 'revoque') return { etat: 'revoque', premium };
    return { etat: 'aucun' };
  }, [utilisateur, fonctionPremium]);

  const prixTotal = dureeChoisie * PRIX_MENSUEL;

  const handleSouscrire = async () => {
    setLoading(true);
    setFeedback(null);
    try {
      const res = await UtilisateurService.souscrirePremium(fonctionPremium, dureeChoisie);
      const userData = await UtilisateurService.getProfil();
      setUtilisateur(userData);
      setFeedback({
        type: res.validation_manuelle_requise ? 'warning' : 'success',
        text: res.message,
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err.response?.data?.erreur || err.response?.data?.detail || 'Erreur lors de la souscription.',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!role) return null;

  return (
    <div className="min-h-screen bg-stone-300 font-sans antialiased sm:flex sm:items-center sm:justify-center sm:py-6">
      <div className="relative flex h-screen w-full max-w-md flex-col overflow-hidden bg-[#FAF6F0] sm:h-[880px] sm:max-h-[92vh] sm:rounded-[40px] sm:border-8 sm:border-stone-300 sm:shadow-2xl">

        <header className="shrink-0 bg-[#0C3B4A] px-5 pb-5 pt-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="font-display text-lg font-black text-white">Premium</h1>
          </div>
        </header>

        <main className="no-scrollbar flex-1 overflow-y-auto px-5 pb-8 pt-5 space-y-5">

          {/* Cas 1 — Actif */}
          {premiumInfo.etat === 'actif' && (
            <>
              <div className="overflow-hidden rounded-3xl bg-[#0C3B4A] p-6 text-white shadow-sm">
                <div className="flex items-start justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-400">
                    <Crown size={24} className="text-[#0C3B4A]" />
                  </div>
                  <span className="rounded-full bg-emerald-500 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-white">
                    Actif
                  </span>
                </div>
                <h2 className="font-display mt-4 text-xl font-black leading-tight">
                  Compte Premium
                </h2>
                <p className="mt-1 text-xs text-white/70">Tous vos avantages sont débloqués</p>
                <div className="mt-5 grid grid-cols-2 gap-3 border-t border-white/10 pt-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-white/50">Expire le</p>
                    <p className="mt-1 text-sm font-black">
                      {premiumInfo.dateExpiration?.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-white/50">Jours restants</p>
                    <p className="mt-1 text-sm font-black text-amber-300">
                      {premiumInfo.joursRestants} jour{premiumInfo.joursRestants > 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-400">Vos avantages</h3>
                <ul className="mt-3 space-y-2.5">
                  {(AVANTAGES[role] || []).map((avantage, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-xs text-slate-700">
                      <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-emerald-500" />
                      <span>{avantage}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}

          {/* Cas 2 — En attente */}
          {premiumInfo.etat === 'en_attente' && (
            <div className="rounded-3xl border border-orange-200 bg-orange-50 p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-100">
                  <Clock size={24} className="text-orange-600" />
                </div>
                <div>
                  <h2 className="font-display text-base font-black text-orange-900">En attente de validation</h2>
                  <p className="mt-0.5 text-xs text-orange-700">Un administrateur examine votre demande</p>
                </div>
              </div>
              {premiumInfo.motif && (
                <div className="mt-4 rounded-xl border border-orange-200 bg-white/60 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-orange-700">Motif</p>
                  <p className="mt-0.5 text-xs text-orange-900">{premiumInfo.motif}</p>
                </div>
              )}
            </div>
          )}

          {/* Cas 3 — Révoqué */}
          {premiumInfo.etat === 'revoque' && (
            <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100">
                  <ShieldOff size={24} className="text-rose-600" />
                </div>
                <div>
                  <h2 className="font-display text-base font-black text-rose-900">Badge révoqué</h2>
                  <p className="mt-0.5 text-xs text-rose-700">Faites une nouvelle demande</p>
                </div>
              </div>
            </div>
          )}

          {/* Cas 4 — Aucun OU Expiré → Formulaire d'achat */}
          {(premiumInfo.etat === 'aucun' || premiumInfo.etat === 'expire') && (
            <>
              {premiumInfo.etat === 'expire' && (
                <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                  <AlertCircle size={18} className="mt-0.5 shrink-0 text-amber-600" />
                  <div>
                    <p className="text-sm font-bold text-amber-800">Votre abonnement a expiré</p>
                    <p className="mt-0.5 text-xs text-amber-700">
                      Expiré le {premiumInfo.dateExpiration?.toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>
              )}

              {feedback && (
                <div className={`rounded-2xl border p-4 text-xs ${
                  feedback.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' :
                  feedback.type === 'warning' ? 'border-orange-200 bg-orange-50 text-orange-800' :
                  'border-rose-200 bg-rose-50 text-rose-800'
                }`}>
                  {feedback.text}
                </div>
              )}

              <div className="rounded-3xl bg-gradient-to-br from-amber-400 to-orange-500 p-5 text-white shadow-lg">
                <div className="flex items-center gap-2">
                  <Sparkles size={20} />
                  <span className="text-[10px] font-black uppercase tracking-widest">
                    {role === 'acheteur' ? 'Passez PRO' : 'Certifiez votre compte'}
                  </span>
                </div>
                <h2 className="font-display mt-2 text-xl font-black leading-tight">
                  {role === 'acheteur' ? 'Abonnement Acheteur PRO' : role === 'pecheur' ? 'Badge Pêcheur PRO' : 'Badge Livreur PRO'}
                </h2>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-400">Durée</h3>
                <div className="mt-3 grid grid-cols-4 gap-2">
                  {DUREES.map((d) => {
                    const actif = dureeChoisie === d.mois;
                    return (
                      <button
                        key={d.mois}
                        onClick={() => setDureeChoisie(d.mois)}
                        className={`flex flex-col items-center gap-1 rounded-xl border py-2.5 transition ${
                          actif ? 'border-[#FF6B4A] bg-orange-50' : 'border-slate-200 bg-white'
                        }`}
                      >
                        <span className={`text-sm font-black ${actif ? 'text-[#FF6B4A]' : 'text-slate-700'}`}>{d.mois}</span>
                        <span className={`text-[9px] font-bold uppercase ${actif ? 'text-[#FF6B4A]' : 'text-slate-400'}`}>mois</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-400">Ce que vous obtenez</h3>
                <ul className="mt-3 space-y-2.5">
                  {(AVANTAGES[role] || []).map((avantage, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-xs text-slate-700">
                      <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-emerald-500" />
                      <span>{avantage}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <span className="text-xs text-slate-500">Prix mensuel</span>
                  <span className="text-sm font-bold text-slate-900">{new Intl.NumberFormat('fr-FR').format(PRIX_MENSUEL)} FCFA</span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-100 py-3">
                  <span className="text-xs text-slate-500">Durée</span>
                  <span className="text-sm font-bold text-slate-900">{dureeChoisie} mois</span>
                </div>
                <div className="flex items-center justify-between pt-3">
                  <span className="text-sm font-black text-slate-900">Total à payer</span>
                  <span className="text-xl font-black text-[#FF6B4A]">{new Intl.NumberFormat('fr-FR').format(prixTotal)} FCFA</span>
                </div>
              </div>

              <button
                onClick={handleSouscrire}
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#FF6B4A] py-4 text-sm font-black text-white shadow-lg transition hover:bg-[#E85A39] active:scale-[0.98] disabled:opacity-60"
              >
                {loading ? 'Traitement...' : (
                  <>
                    <Crown size={16} />
                    S'abonner pour {new Intl.NumberFormat('fr-FR').format(prixTotal)} FCFA
                  </>
                )}
              </button>

              <p className="text-center text-[10px] text-slate-400">
                Paiement sécurisé via Wave ou Orange Money
              </p>
            </>
          )}

          <p className="pt-2 text-center text-[10px] text-stone-400">
            Lebougui Premium · Annulation possible à tout moment
          </p>
        </main>
      </div>
    </div>
  );
}