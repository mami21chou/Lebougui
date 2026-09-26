import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Package, MapPin, Phone, ArrowLeft, CheckCircle, XCircle,
  Truck, Calendar, User, Printer, Share2, Star, Loader2
} from 'lucide-react';
import { useCommandes } from '../../context/CommandeContext';
import { useAuth } from '../../context/AuthContext';
import AcheteurHeader from '../../components/AcheteurHeader';
import AcheteurBottomNav from '../../components/AcheteurBottomNav';
import useCartCount from '../../hooks/useCartCount';
import NotationModal from '../../components/NotationModal';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// ═══════════════════════════════════════════════════════════
// Helper : calcul du sous-total d'une ligne (source unique de vérité)
// ═══════════════════════════════════════════════════════════
const ligneSousTotal = (ligne) => {
  const prix = Number(ligne?.prix_unitaire) || 0;
  const qte = Number(ligne?.quantite) || 0;
  return prix * qte;
};

export default function CommandeDetails() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { mesCommandes, chargerMesCommandes, annulerCommande } = useCommandes();
  const { estAuthentifie } = useAuth();
  const cartCount = useCartCount();

  const [commande, setCommande] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [succes, setSucces] = useState(null);

  const [livreurInfo, setLivreurInfo] = useState(null);
  const [livreurChargement, setLivreurChargement] = useState(false);
  const [showNotation, setShowNotation] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      navigate('/connexion');
      return;
    }
    if (estAuthentifie()) {
      chargerMesCommandes();
    }
  }, [navigate, estAuthentifie, chargerMesCommandes]);

  useEffect(() => {
    if (mesCommandes.liste.length > 0 && id) {
      const foundCommande = mesCommandes.liste.find((cmd) => cmd.id == id);
      if (foundCommande) setCommande(foundCommande);
      setChargement(false);
    }
  }, [id, mesCommandes.liste]);

  useEffect(() => {
    if (!commande) return;
    if (!['en_livraison', 'livree', 'en_recherche_livreur'].includes(commande.statut)) {
      return;
    }

    let cancelled = false;

    const chargerLivreur = async () => {
      setLivreurChargement(true);
      try {
        const token = localStorage.getItem('access_token');
        const res = await fetch(`${API_URL}/livraisons/`, {
          headers: {
            Authorization: token ? `Bearer ${token}` : '',
            'Content-Type': 'application/json',
          },
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json();
        const livraisons = Array.isArray(data) ? data : data.results || [];

        const livraison = livraisons.find((liv) => {
          const ids = liv.commandes || [];
          return ids.some((cid) => String(cid) === String(commande.id));
        });

        if (cancelled) return;

        if (livraison && livraison.nom_livreur) {
          setLivreurInfo({
            nom: livraison.nom_livreur,
            telephone: livraison.telephone_livreur || null,
            id: livraison.livreur || null,
          });
        } else {
          setLivreurInfo(null);
        }
      } catch (err) {
        if (!cancelled) {
          console.warn('Impossible de récupérer le livreur:', err.message);
          setLivreurInfo(null);
        }
      } finally {
        if (!cancelled) setLivreurChargement(false);
      }
    };

    chargerLivreur();
    return () => {
      cancelled = true;
    };
  }, [commande]);

  // ═══════════════════════════════════════════════════════════
  // CALCULS FINANCIERS — strict, source unique
  // ═══════════════════════════════════════════════════════════
  const sousTotal = useMemo(() => {
    if (!commande?.lignes) return 0;
    return commande.lignes.reduce((sum, l) => sum + ligneSousTotal(l), 0);
  }, [commande]);

  const fraisLivraison = Number(commande?.frais_livraison) || 0;
  const total = sousTotal + fraisLivraison;

  const formaterPrix = (prix) =>
    `${new Intl.NumberFormat('fr-FR').format(Math.round(Number(prix) || 0))} FCFA`;

  const formaterDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatutLabel = (statut) => {
    switch (statut) {
      case 'en_attente_pecheur': return 'En attente du pêcheur';
      case 'en_attente_paiement': return 'En attente de paiement';
      case 'en_recherche_livreur': return 'Recherche de livreur';
      case 'en_livraison': return 'En cours de livraison';
      case 'livree': return 'Livrée';
      case 'annulee': return 'Annulée';
      case 'refusee': return 'Refusée';
      default: return statut;
    }
  };

  const getStatutBadge = (statut) => {
    switch (statut) {
      case 'en_attente_pecheur':
      case 'en_attente_paiement':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'en_recherche_livreur':
      case 'en_livraison':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'livree':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'annulee':
      case 'refusee':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-stone-100 text-stone-700 border-stone-200';
    }
  };

  const pecheurNom =
    commande?.nom_pecheur ||
    `${commande?.pecheur?.prenom || ''} ${commande?.pecheur?.nom || ''}`.trim() ||
    commande?.lignes?.[0]?.produit_detail?.pecheur_nom ||
    'Pêcheur professionnel';

  const pecheurPhoto =
    commande?.pecheur?.photo ||
    commande?.pecheur?.utilisateur?.photo ||
    commande?.lignes?.[0]?.produit_detail?.pecheur_photo ||
    null;

  const telephonePecheur =
    commande?.telephone_pecheur ||
    commande?.pecheur?.telephone ||
    commande?.pecheur?.utilisateur?.telephone ||
    null;

  const livreurNom = livreurInfo?.nom || null;
  const livreurPhoto = livreurInfo?.photo || null;
  const telephoneLivreur = livreurInfo?.telephone || null;

  const handleAnnulerCommande = async () => {
    if (!window.confirm('Voulez-vous vraiment annuler cette commande ?')) return;
    setChargement(true);
    setErreur(null);
    try {
      const result = await annulerCommande(id);
      if (result.success) {
        setSucces('Votre commande a été annulée avec succès.');
        setCommande({ ...commande, statut: 'annulee' });
        setTimeout(() => navigate('/acheteur/commandes'), 2000);
      } else {
        setErreur(result.error || "Erreur lors de l'annulation.");
      }
    } catch (err) {
      setErreur(err.message || 'Une erreur est survenue.');
    } finally {
      setChargement(false);
    }
  };

  const handleAppeler = (tel) => {
    if (tel) window.location.href = `tel:${tel}`;
  };

  if (chargement) {
    return (
      <div className="min-h-screen bg-stone-300 font-sans antialiased sm:flex sm:items-center sm:justify-center sm:py-6">
        <div className="relative flex h-screen w-full max-w-md flex-col items-center justify-center bg-[#FAF6F0] sm:h-[880px] sm:max-h-[92vh] sm:rounded-[40px] sm:border-8 sm:border-stone-300 sm:shadow-2xl">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#FF6B4A] border-t-transparent" />
        </div>
      </div>
    );
  }

  if (!commande) {
    return (
      <div className="min-h-screen bg-stone-300 font-sans antialiased sm:flex sm:items-center sm:justify-center sm:py-6">
        <div className="relative flex h-screen w-full max-w-md flex-col overflow-hidden bg-[#FAF6F0] sm:h-[880px] sm:max-h-[92vh] sm:rounded-[40px] sm:border-8 sm:border-stone-300 sm:shadow-2xl">
          <main className="no-scrollbar flex h-full flex-col items-center justify-center px-5 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-stone-100 text-stone-400">
              <Package size={28} />
            </div>
            <h3 className="text-base font-bold text-stone-900 mb-1">
              Commande non trouvée
            </h3>
            <p className="text-xs text-stone-500 mb-6">
              La commande que vous cherchez n'existe pas ou n'est plus accessible.
            </p>
            <button
              onClick={() => navigate('/acheteur/commandes')}
              className="w-full rounded-2xl bg-[#0C3B4A] py-3 text-xs font-bold text-white shadow-md transition hover:bg-[#082833]"
            >
              Retour à mes commandes
            </button>
          </main>
          <AcheteurBottomNav />
        </div>
      </div>
    );
  }

  const etapeActuelle = (() => {
    switch (commande.statut) {
      case 'en_attente_pecheur':
      case 'en_attente_paiement':
      case 'payee':
        return 0;
      case 'en_recherche_livreur':
      case 'en_livraison':
        return 1;
      case 'livree':
        return 2;
      default:
        return 0;
    }
  })();

  const livreurEnRecherche = !livreurNom && commande.statut === 'en_recherche_livreur';
  const livreurTexte = livreurNom
    ? livreurNom
    : livreurChargement
    ? 'Chargement…'
    : livreurEnRecherche
    ? 'Recherche en cours…'
    : 'Pas encore assigné';

  return (
    <div className="min-h-screen bg-stone-300 font-sans antialiased sm:flex sm:items-center sm:justify-center sm:py-6">
      <div className="relative flex h-screen w-full max-w-md flex-col overflow-hidden bg-[#FAF6F0] sm:h-[880px] sm:max-h-[92vh] sm:rounded-[40px] sm:border-8 sm:border-stone-300 sm:shadow-2xl">

        <AcheteurHeader
          title="Détails commande"
          subtitle={`Réf. #${commande.numero || commande.id}`}
          cartCount={cartCount}
          showSearch={false}
        />

        <main className="no-scrollbar flex-1 overflow-y-auto px-5 pb-28 pt-2 space-y-4">

          {/* BOUTON RETOUR */}
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-xs font-bold text-stone-500 transition hover:text-stone-900"
          >
            <ArrowLeft size={14} />
            <span>Retour</span>
          </button>

          {/* MESSAGES */}
          {erreur && (
            <div className="flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
              <XCircle size={16} className="shrink-0 text-red-500" />
              <span className="flex-1">{erreur}</span>
              <button onClick={() => setErreur(null)} className="font-bold underline">
                Fermer
              </button>
            </div>
          )}
          {succes && (
            <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-700">
              <CheckCircle size={16} className="shrink-0 text-emerald-500" />
              <span className="flex-1">{succes}</span>
            </div>
          )}

          {/* FACTURE */}
          <div className="rounded-[28px] border border-stone-200/80 bg-white p-5 shadow-sm space-y-5">

            {/* EN-TÊTE FACTURE */}
            <div className="flex items-start justify-between border-b border-stone-100 pb-4">
              <div>
                <span className="text-[10px] font-extrabold tracking-widest text-stone-400 uppercase">
                  Reçu de commande
                </span>
                <h2 className="text-base font-black text-stone-900 mt-0.5">
                  Lebougui Market
                </h2>
                <p className="text-[11px] text-stone-500 flex items-center gap-1 mt-1">
                  <Calendar size={12} /> {formaterDate(commande.date_commande)}
                </p>
              </div>
              <span
                className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-wider ${getStatutBadge(commande.statut)}`}
              >
                {getStatutLabel(commande.statut)}
              </span>
            </div>

            {/* TIMELINE compacte */}
            <div className="flex items-center justify-between gap-1 bg-stone-50/70 rounded-2xl px-3 py-2.5">
              {[
                { key: 'confirmee', label: 'Confirmée', icon: CheckCircle },
                { key: 'livraison', label: 'Livraison', icon: Truck },
                { key: 'reception', label: 'Réception', icon: Package },
              ].map((etape, idx) => {
                const active = idx <= etapeActuelle;
                const Icone = etape.icon;
                return (
                  <React.Fragment key={etape.key}>
                    <div className="flex items-center gap-1.5">
                      <div
                        className={`flex h-6 w-6 items-center justify-center rounded-full transition ${
                          active
                            ? 'bg-[#0C3B4A] text-white'
                            : 'bg-stone-200 text-stone-400'
                        }`}
                      >
                        <Icone size={12} />
                      </div>
                      <span
                        className={`text-[10px] font-bold ${
                          active ? 'text-stone-900' : 'text-stone-400'
                        }`}
                      >
                        {etape.label}
                      </span>
                    </div>
                    {idx < 2 && (
                      <div
                        className={`h-px flex-1 mx-1 ${
                          idx < etapeActuelle ? 'bg-[#0C3B4A]' : 'bg-stone-200'
                        }`}
                      />
                    )}
                  </React.Fragment>
                );
              })}
            </div>

            {/* ADRESSE DE LIVRAISON */}
            <div className="border-b border-stone-100 pb-4">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-stone-400">
                Lieu de livraison
              </span>
              <div className="flex items-start gap-2 mt-1.5 text-stone-800">
                <MapPin size={15} className="shrink-0 text-[#FF6B4A] mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-stone-900 leading-snug">
                    {commande.adresse_livraison || 'Non spécifiée'}
                  </p>
                  {commande.distance_km && (
                    <p className="text-[10px] text-stone-500 mt-0.5">
                      Distance estimée : {commande.distance_km} km du point de pêche
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* ARTICLES */}
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-stone-400">
                Articles commandés ({commande.lignes?.length || 0})
              </span>

              <div className="mt-2.5 divide-y divide-stone-100">
                {commande.lignes?.map((ligne, index) => {
                  const produit = ligne.produit_detail || {};
                  const sousTotalLigne = ligneSousTotal(ligne);

                  return (
                    <div key={index} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2.5 pr-2 min-w-0">
                        <img
                          src={
                            produit.media ||
                            produit.image ||
                            'https://images.unsplash.com/photo-1534483509719-3feaee7c30da?w=200&auto=format&fit=crop&q=80'
                          }
                          alt={produit.nom}
                          className="h-10 w-10 shrink-0 rounded-xl border border-stone-100 object-cover"
                        />
                        <div className="min-w-0">
                          <p className="font-bold text-stone-900 truncate">
                            {produit.nom || 'Produit'}
                          </p>
                          <p className="text-[10px] text-stone-500">
                            {ligne.quantite} kg × {formaterPrix(ligne.prix_unitaire)}
                          </p>
                        </div>
                      </div>
                      <span className="font-bold text-stone-900 shrink-0">
                        {formaterPrix(sousTotalLigne)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* TOTAUX */}
            <div className="border-t border-stone-100 pt-3.5 space-y-2 text-xs">
              <div className="flex justify-between text-stone-500">
                <span>Sous-total articles</span>
                <span className="font-semibold text-stone-900">
                  {formaterPrix(sousTotal)}
                </span>
              </div>
              {fraisLivraison > 0 && (
                <div className="flex justify-between text-stone-500">
                  <span>Frais de livraison</span>
                  <span className="font-semibold text-stone-900">
                    {formaterPrix(fraisLivraison)}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center border-t border-stone-100 pt-2.5 text-sm font-black">
                <span className="text-stone-900">Total à payer</span>
                <span className="text-[#FF6B4A] text-base">
                  {formaterPrix(total)}
                </span>
              </div>
            </div>

          </div>

          {/* CONTACTS */}
          <div className="space-y-2.5">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-stone-400 px-1">
              Intervenants
            </span>

            {/* PÊCHEUR */}
            <div className="flex items-center justify-between rounded-2xl border border-stone-200/80 bg-white p-3 shadow-sm">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-stone-200 bg-stone-100">
                  {pecheurPhoto ? (
                    <img src={pecheurPhoto} alt={pecheurNom} className="h-full w-full object-cover" />
                  ) : (
                    <User size={18} className="text-stone-400" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-stone-400">Pêcheur</p>
                  <p className="truncate text-xs font-bold text-stone-900">{pecheurNom}</p>
                </div>
              </div>
              <button
                onClick={() => handleAppeler(telephonePecheur)}
                disabled={!telephonePecheur}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 transition hover:bg-emerald-200 disabled:opacity-40"
                aria-label="Appeler le pêcheur"
              >
                <Phone size={15} />
              </button>
            </div>

            {/* LIVREUR */}
            <div className="flex items-center justify-between rounded-2xl border border-stone-200/80 bg-white p-3 shadow-sm">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-stone-200 bg-stone-100">
                  {livreurPhoto ? (
                    <img src={livreurPhoto} alt={livreurNom} className="h-full w-full object-cover" />
                  ) : livreurChargement ? (
                    <Loader2 size={18} className="animate-spin text-blue-500" />
                  ) : livreurNom ? (
                    <span className="text-xs font-bold text-[#0C3B4A]">
                      {livreurNom.charAt(0).toUpperCase()}
                    </span>
                  ) : livreurEnRecherche ? (
                    <Loader2 size={18} className="animate-spin text-blue-500" />
                  ) : (
                    <Truck size={18} className="text-stone-400" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-stone-400">Livreur</p>
                  <p
                    className={`truncate text-xs font-bold ${
                      livreurNom
                        ? 'text-stone-900'
                        : livreurEnRecherche
                        ? 'text-blue-600'
                        : 'text-stone-400'
                    }`}
                  >
                    {livreurTexte}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleAppeler(telephoneLivreur)}
                disabled={!telephoneLivreur}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 transition hover:bg-emerald-200 disabled:opacity-40"
                aria-label="Appeler le livreur"
              >
                <Phone size={15} />
              </button>
            </div>
          </div>

          {/* ACTIONS */}
          <section className="space-y-2.5 pt-1">
            {commande.statut === 'en_attente_paiement' && (
              <button
                onClick={() => navigate(`/acheteur/paiement/${commande.id}`)}
                className="w-full rounded-2xl bg-[#FF6B4A] py-3.5 text-xs font-extrabold text-white shadow-lg shadow-orange-500/25 transition hover:bg-[#E85A39]"
              >
                Payer la commande
              </button>
            )}

            {commande.statut === 'en_livraison' && (
              <button
                onClick={() => navigate(`/acheteur/suivi-livraison/${commande.id}`)}
                className="w-full rounded-2xl bg-[#0C3B4A] py-3.5 text-xs font-extrabold text-white shadow-md transition hover:bg-[#082833]"
              >
                Suivre la livraison en direct
              </button>
            )}

            {commande.statut === 'livree' && (
              <div className="space-y-2">
                <p className="px-1 text-[10px] font-bold uppercase tracking-wider text-stone-400">
                  Votre avis compte
                </p>

                <button
                  onClick={() => setShowNotation(true)}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#FF6B4A] py-3.5 text-xs font-extrabold text-white shadow-lg shadow-orange-500/25 transition hover:bg-[#E85A39] active:scale-[0.98]"
                >
                  <Star size={14} fill="currentColor" />
                  Noter le pêcheur & le livreur
                </button>
              </div>
            )}

            {['en_attente_pecheur', 'en_attente_paiement'].includes(commande.statut) && (
              <button
                onClick={handleAnnulerCommande}
                disabled={chargement}
                className="w-full rounded-2xl border border-red-200 bg-red-50 py-3 text-xs font-bold text-red-600 transition hover:bg-red-100"
              >
                Annuler la commande
              </button>
            )}

            <div className="flex items-center justify-center gap-4 pt-2 text-[11px] font-bold text-stone-500">
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 transition hover:text-stone-900"
              >
                <Printer size={13} />
                <span>Imprimer</span>
              </button>
              <span className="h-3 w-px bg-stone-200" />
              <button
                onClick={() => {
                  navigator.clipboard?.writeText(
                    `Commande #${commande.numero || commande.id}`
                  );
                  setSucces('Numéro de commande copié !');
                  setTimeout(() => setSucces(null), 2000);
                }}
                className="flex items-center gap-1.5 transition hover:text-stone-900"
              >
                <Share2 size={13} />
                <span>Partager</span>
              </button>
            </div>
          </section>
        </main>

        <AcheteurBottomNav />

        {/* MODALE DE NOTATION */}
        {showNotation && (
          <NotationModal
            commandeId={commande.id}
            onClose={() => setShowNotation(false)}
            onSuccess={() => {
              setSucces('Merci pour votre avis !');
              setTimeout(() => setSucces(null), 2500);
            }}
          />
        )}
      </div>
    </div>
  );
}