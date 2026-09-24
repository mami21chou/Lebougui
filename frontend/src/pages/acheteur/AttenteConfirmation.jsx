import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Clock, Loader2, XCircle, ShoppingBag, Check, Smartphone,
  ArrowLeft, ShieldCheck,
} from 'lucide-react';
import { CommandeService } from '../../services/commandeService';

const formatPrice = (p) =>
  `${new Intl.NumberFormat('fr-FR').format(Number(p) || 0)} FCFA`;

export default function AttenteConfirmation() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [commande, setCommande] = useState(null);
  const [etape, setEtape] = useState('attente');
  const [erreur, setErreur] = useState('');
  const [moyenPaiement, setMoyenPaiement] = useState('wave');
  const [numeroTelephone, setNumeroTelephone] = useState('');
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const pollRef = useRef(null);

  useEffect(() => {
    if (!id) return;

    const verifier = async () => {
      try {
        const cmd = await CommandeService.recupererCommande(id);
        setCommande(cmd);

        if (cmd.statut === 'en_attente_paiement' && etape === 'attente') {
          clearInterval(pollRef.current);
          setEtape('paiement');
        } else if (['refusee', 'annulee'].includes(cmd.statut)) {
          clearInterval(pollRef.current);
          setEtape('refusee');
        }
      } catch (err) {
        console.warn('Erreur polling:', err);
      }
    };

    verifier();
    pollRef.current = setInterval(verifier, 5000);
    return () => clearInterval(pollRef.current);
  }, [id, etape]);

  const handlePayer = async () => {
    setIsPaying(true);
    try {
      await CommandeService.payerCommandeSimule(id, moyenPaiement, numeroTelephone);
      navigate('/acheteur/commandes');
    } catch (err) {
      setErreur(err.response?.data?.erreur || 'Erreur lors du paiement.');
      setEtape('erreur');
    } finally {
      setIsPaying(false);
    }
  };

  // ============================================================
  // WRAPPER COMMUN
  // ============================================================
  const Wrapper = ({ children, footer = null }) => (
    <div className="min-h-screen bg-stone-200 font-sans antialiased sm:flex sm:items-center sm:justify-center sm:py-6">
      <div className="relative flex h-screen w-full max-w-md flex-col overflow-hidden bg-[#FAF6F0] sm:h-[880px] sm:max-h-[92vh] sm:rounded-[40px] sm:border-8 sm:border-stone-300 sm:shadow-2xl">
        {children}
        {footer}
      </div>
    </div>
  );

  const Header = ({ title }) => (
    <header className="flex shrink-0 items-center gap-3 px-5 pb-4 pt-5">
      <button
        onClick={() => navigate(-1)}
        aria-label="Retour"
        className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-stone-700 shadow-sm transition hover:bg-stone-50"
      >
        <ArrowLeft size={17} />
      </button>
      <h1 className="text-sm font-bold text-stone-900">{title}</h1>
    </header>
  );

  // ============================================================
  // REFUSÉE
  // ============================================================
  if (etape === 'refusee') {
    return (
      <Wrapper>
        <main className="flex flex-1 flex-col items-center justify-center px-8 text-center">
          <XCircle size={48} className="mb-5 text-stone-300" strokeWidth={1.5} />
          <h2 className="mb-2 text-lg font-bold text-stone-900">
            Commande refusée
          </h2>
          <p className="mb-8 max-w-xs text-sm leading-relaxed text-stone-500">
            Le pêcheur n'a pas pu honorer votre commande. Vous ne serez pas débité.
          </p>
          <button
            onClick={() => navigate('/acheteur/accueil')}
            className="w-full rounded-2xl bg-[#0F2A4A] py-4 text-sm font-bold text-white transition active:scale-[0.98]"
          >
            Retour au marché
          </button>
        </main>
      </Wrapper>
    );
  }

  // ============================================================
  // ERREUR
  // ============================================================
  if (etape === 'erreur') {
    return (
      <Wrapper>
        <main className="flex flex-1 flex-col items-center justify-center px-8 text-center">
          <XCircle size={48} className="mb-5 text-stone-300" strokeWidth={1.5} />
          <h2 className="mb-2 text-lg font-bold text-stone-900">
            Paiement échoué
          </h2>
          <p className="mb-8 max-w-xs text-sm leading-relaxed text-stone-500">
            {erreur}
          </p>
          <button
            onClick={() => setEtape('paiement')}
            className="mb-3 w-full rounded-2xl bg-[#0F2A4A] py-4 text-sm font-bold text-white transition active:scale-[0.98]"
          >
            Réessayer
          </button>
          <button
            onClick={() => navigate('/acheteur/commandes')}
            className="w-full py-3 text-xs font-bold text-stone-500 transition hover:text-stone-800"
          >
            Voir mes commandes
          </button>
        </main>
      </Wrapper>
    );
  }

  // ============================================================
  // PAIEMENT
  // ============================================================
  if (etape === 'paiement') {
    const total =
      (commande?.lignes || []).reduce(
        (s, l) => s + Number(l.prix_unitaire) * Number(l.quantite),
        0
      ) + Number(commande?.frais_livraison || 0);

    const moyens = [
      {
        id: 'wave',
        label: 'Wave',
        logo: '/images/wave.png',
        fallback: 'W',
      },
      {
        id: 'om',
        label: 'Orange Money',
        logo: '/images/OM.png',
        fallback: 'OM',
      },
    ];

    return (
      <Wrapper
        footer={
          <footer className="shrink-0 border-t border-stone-100 bg-white px-5 py-4">
            <button
              onClick={handlePayer}
              disabled={isPaying}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#0F2A4A] py-4 text-sm font-bold text-white transition active:scale-[0.98] disabled:opacity-50"
            >
              {isPaying ? (
                <>
                  <Loader2 className="animate-spin" size={17} />
                  Traitement...
                </>
              ) : (
                <>
                  <ShoppingBag size={17} />
                  Payer {formatPrice(total)}
                </>
              )}
            </button>
          </footer>
        }
      >
        <Header title="Paiement" />

        <main className="no-scrollbar flex-1 overflow-y-auto px-5 pb-6">

          {/* Bandeau confirmation — sobre */}
          <div className="mb-6 flex items-center gap-3 rounded-2xl bg-stone-100 px-4 py-3">
            <Check size={18} className="shrink-0 text-stone-700" strokeWidth={2.5} />
            <p className="text-xs font-medium leading-snug text-stone-700">
              Le pêcheur a validé votre commande. Vous pouvez payer.
            </p>
          </div>

          {/* Détail commande — une seule carte unifiée */}
          <section className="mb-6 rounded-2xl bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-[10px] font-bold uppercase tracking-wider text-stone-400">
              Commande
            </h2>

            {commande?.lignes?.length > 0 ? (
              <div className="space-y-3">
                {commande.lignes.map((l, idx) => (
                  <div key={idx} className="flex items-center justify-between gap-3 text-xs">
                    <span className="min-w-0 flex-1 truncate text-stone-600">
                      {l.produit_detail?.nom || 'Produit'}
                      <span className="ml-1 text-stone-400">
                        × {l.quantite} kg
                      </span>
                    </span>
                    <span className="shrink-0 font-semibold text-stone-800">
                      {formatPrice(Number(l.prix_unitaire) * Number(l.quantite))}
                    </span>
                  </div>
                ))}

                {Number(commande.frais_livraison) > 0 && (
                  <div className="flex items-center justify-between gap-3 border-t border-stone-100 pt-3 text-xs">
                    <span className="text-stone-500">Livraison</span>
                    <span className="font-semibold text-stone-800">
                      {formatPrice(commande.frais_livraison)}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs italic text-stone-400">Chargement...</p>
            )}

            <div className="mt-5 flex items-baseline justify-between border-t border-stone-100 pt-4">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
                Total
              </span>
              <span className="text-lg font-black text-stone-900">
                {formatPrice(total)}
              </span>
            </div>
          </section>

          {/* Moyens de paiement — épuré */}
          <section className="mb-6">
            <h2 className="mb-3 px-1 text-[10px] font-bold uppercase tracking-wider text-stone-400">
              Paiement
            </h2>

            <div className="space-y-2">
              {moyens.map((m) => {
                const actif = moyenPaiement === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMoyenPaiement(m.id)}
                    className={`flex w-full items-center gap-3 rounded-2xl border bg-white p-3 text-left transition ${
                      actif
                        ? 'border-[#0F2A4A] shadow-sm'
                        : 'border-stone-200 hover:border-stone-300'
                    }`}
                  >
                    {/* Logo */}
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-stone-50">
                      <img
                        src={m.logo}
                        alt={m.label}
                        className="h-7 w-7 object-contain"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.style.display = 'none';
                          e.target.parentElement.innerHTML = `<span class="text-[11px] font-black text-stone-700">${m.fallback}</span>`;
                        }}
                      />
                    </div>

                    {/* Label */}
                    <span className="flex-1 text-sm font-bold text-stone-900">
                      {m.label}
                    </span>

                    {/* Radio épuré */}
                    <span
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition ${
                        actif
                          ? 'border-[#0F2A4A] bg-[#0F2A4A]'
                          : 'border-stone-300 bg-white'
                      }`}
                    >
                      {actif && (
                        <Check size={11} className="text-white" strokeWidth={3} />
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Numéro de téléphone — épuré */}
          <section className="mb-6">
            <h2 className="mb-3 px-1 text-[10px] font-bold uppercase tracking-wider text-stone-400">
              Numéro
            </h2>

            {!isEditingPhone ? (
              <button
                onClick={() => setIsEditingPhone(true)}
                className="flex w-full items-center justify-between rounded-2xl border border-stone-200 bg-white px-4 py-3.5 text-left transition hover:border-stone-300"
              >
                <span className="flex items-center gap-2 text-xs font-medium text-stone-500">
                  <Smartphone size={14} className="text-stone-400" />
                  Numéro de paiement
                </span>
                <span className="text-xs font-bold text-stone-900">
                  {numeroTelephone || 'Renseigner'}
                </span>
              </button>
            ) : (
              <div className="flex items-center gap-2 rounded-2xl border border-[#0F2A4A] bg-white p-2 pl-4">
                <span className="text-xs font-semibold text-stone-500">+221</span>
                <input
                  type="tel"
                  value={numeroTelephone}
                  onChange={(e) => setNumeroTelephone(e.target.value)}
                  placeholder="77 000 00 00"
                  className="flex-1 bg-transparent text-sm font-semibold text-stone-900 outline-none placeholder:font-normal placeholder:text-stone-300"
                  autoFocus
                />
                <button
                  onClick={() => setIsEditingPhone(false)}
                  className="shrink-0 rounded-xl bg-[#0F2A4A] px-3 py-2 text-[10px] font-bold text-white"
                >
                  OK
                </button>
              </div>
            )}
          </section>

          {/* Erreur */}
          {erreur && (
            <div className="mb-4 rounded-2xl bg-stone-100 p-3 text-xs text-stone-600">
              {erreur}
            </div>
          )}

          {/* Note sécurité */}
          <p className="flex items-center justify-center gap-1.5 text-[10px] font-medium text-stone-400">
            <ShieldCheck size={11} />
            Simulation · aucun débit réel
          </p>
        </main>
      </Wrapper>
    );
  }

  // ============================================================
  // ATTENTE
  // ============================================================
  return (
    <Wrapper>
      <Header title="Confirmation" />

      <main className="flex flex-1 flex-col items-center justify-center px-8 pb-6 text-center">

        {/* Icône horloge — simple, sans animation criarde */}
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-stone-100">
          <Clock size={28} className="text-stone-500" strokeWidth={1.5} />
        </div>

        <h2 className="mb-2 text-lg font-bold leading-tight text-stone-900">
          En attente du pêcheur
        </h2>

        <p className="mb-8 max-w-[240px] text-sm leading-relaxed text-stone-500">
          Il vérifie ses stocks. Vous pourrez payer dès qu'il aura validé.
        </p>

        {/* Numéro de commande — discret */}
        <div className="mb-8 flex items-center gap-2 rounded-full bg-stone-100 px-4 py-2">
          <Loader2 size={12} className="animate-spin text-stone-500" />
          <span className="text-[11px] font-medium text-stone-600">
            {commande?.numero || 'Vérification en cours...'}
          </span>
        </div>

        <button
          onClick={() => navigate('/acheteur/commandes')}
          className="w-full rounded-2xl bg-[#0F2A4A] py-4 text-sm font-bold text-white transition active:scale-[0.98]"
        >
          Voir mes commandes
        </button>
      </main>
    </Wrapper>
  );
}