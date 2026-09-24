import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, MapPin, Phone, Mail, Calendar, Shield, ShieldCheck,
  Crown, Star, Package, Bike, CheckCircle2,
  LogOut, Settings, ChevronRight, Award, Wallet, Fish, ShoppingBag,
  XCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import UserMenu from '../components/UserMenu';

// ═══════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL
// ═══════════════════════════════════════════════════════════
export default function Profil() {
  const navigate = useNavigate();
  const { utilisateur, deconnecter, estPecheur, estAcheteur, estLivreur } = useAuth();
  const [confirmDeconnexion, setConfirmDeconnexion] = useState(false);

  if (!utilisateur) return null;

  // ─── Détermine le rôle ───
  const role = estPecheur()
    ? 'pecheur'
    : estLivreur()
    ? 'livreur'
    : estAcheteur()
    ? 'acheteur'
    : 'utilisateur';

  // ─── Détermine si Premium ───
  const estPremium =
    utilisateur?.status_premium?.statut === 'actif' ||
    utilisateur?.est_premium === true;

  // ─── Labels selon le rôle ───
  const roleLabels = {
    pecheur: { label: 'Pêcheur', emoji: '🎣' },
    acheteur: { label: 'Acheteur', emoji: '🛒' },
    livreur: { label: 'Livreur', emoji: '🛵' },
    utilisateur: { label: 'Utilisateur', emoji: '👤' },
  };
  const c = roleLabels[role];

  const handleDeconnexion = () => {
    deconnecter();
    navigate('/connexion');
  };

  return (
    <div className="min-h-screen bg-stone-300 font-sans antialiased sm:flex sm:items-center sm:justify-center sm:py-6">
      <div className="relative flex h-screen w-full max-w-md flex-col overflow-hidden bg-[#FAF6F0] sm:h-[880px] sm:max-h-[92vh] sm:rounded-[40px] sm:border-8 sm:border-stone-300 sm:shadow-2xl">

        {/* ═══════════ HEADER ═══════════ */}
        <header className="shrink-0 bg-[#0C3B4A] px-5 pb-5 pt-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
              aria-label="Retour"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="font-display text-lg font-black text-white">
              Mon profil
            </h1>
          </div>
        </header>

        <main className="no-scrollbar flex-1 overflow-y-auto pb-8">

          {/* ═══════════ CARTE PROFIL ═══════════ */}
          <div className="px-5 pt-5">
            <div className="relative overflow-hidden rounded-3xl bg-white p-5 shadow-sm">
              {/* Badge Premium en haut à droite */}
              {estPremium && (
                <div className="absolute right-4 top-4 flex items-center gap-1 rounded-full bg-amber-500 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-white shadow-sm">
                  <Crown size={11} />
                  Premium
                </div>
              )}

              <div className="flex items-start gap-4">
                <UserMenu
                  photo={utilisateur?.photo}
                  prenom={utilisateur?.prenom}
                  nom={utilisateur?.nom}
                  role={c.label}
                  showName={false}
                  size="large"
                />
                <div className="min-w-0 flex-1 pt-1">
                  <h2 className="font-display truncate text-xl font-black text-[#0F2A4A]">
                    {utilisateur?.prenom} {utilisateur?.nom}
                  </h2>
                  <p className="mt-0.5 flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-stone-400">
                    {c.emoji} {c.label}
                  </p>
                  {estPremium && (
                    <p className="mt-1 flex items-center gap-1 text-[11px] font-medium text-amber-600">
                      <ShieldCheck size={11} />
                      Compte vérifié
                    </p>
                  )}
                </div>
              </div>

              {/* Contact */}
              <div className="mt-4 space-y-2 border-t border-stone-100 pt-4">
                {utilisateur?.telephone && (
                  <InfoRow
                    icon={Phone}
                    label="Téléphone"
                    value={utilisateur.telephone}
                  />
                )}
                {utilisateur?.email && (
                  <InfoRow
                    icon={Mail}
                    label="Email"
                    value={utilisateur.email}
                  />
                )}
                {utilisateur?.adresse && (
                  <InfoRow
                    icon={MapPin}
                    label="Adresse"
                    value={utilisateur.adresse}
                  />
                )}
                {utilisateur?.date_inscription && (
                  <InfoRow
                    icon={Calendar}
                    label="Inscrit depuis"
                    value={new Date(utilisateur.date_inscription).toLocaleDateString(
                      'fr-FR',
                      { day: 'numeric', month: 'long', year: 'numeric' }
                    )}
                  />
                )}
              </div>
            </div>
          </div>

          {/* ═══════════ SECTION SPÉCIFIQUE AU RÔLE ═══════════ */}
          <div className="px-5 pt-6">
            <SectionTitle>
              {role === 'pecheur' && 'Informations de pêche'}
              {role === 'livreur' && 'Informations de livraison'}
              {role === 'acheteur' && 'Informations acheteur'}
            </SectionTitle>

            <div className="mt-3 space-y-3">

              {/* ─── PROFIL PÊCHEUR ─── */}
              {role === 'pecheur' && (
                <>
                  <StatCard
                    icon={Fish}
                    color="#0C3B4A"
                    label="Vérification"
                    value={
                      utilisateur?.profil_pecheur?.est_verifie
                        ? 'Pêcheur vérifié'
                        : 'En attente de validation'
                    }
                    sub={
                      utilisateur?.profil_pecheur?.est_verifie
                        ? 'Vos documents sont validés'
                        : 'Vos documents sont en cours de vérification'
                    }
                    badge={
                      utilisateur?.profil_pecheur?.est_verifie
                        ? { type: 'success', label: 'Vérifié' }
                        : { type: 'warning', label: 'En attente' }
                    }
                  />
                  <StatCard
                    icon={Package}
                    color="#FF6B4A"
                    label="Zone de pêche"
                    value={utilisateur?.adresse || 'Soumbédioune'}
                    sub="Votre zone principale de débarquement"
                  />
                  <StatCard
                    icon={Award}
                    color="#0A8A5F"
                    label="Réputation"
                    value="Nouveau pêcheur"
                    sub="Vos premières ventes arrivent"
                  />
                </>
              )}

              {/* ─── PROFIL ACHETEUR ─── */}
              {role === 'acheteur' && (
                <>
                  <StatCard
                    icon={ShoppingBag}
                    color="#0F2A4A"
                    label="Commandes"
                    value="Total commandes"
                    sub="Consultez votre historique"
                    action={{ label: 'Voir', onClick: () => navigate('/acheteur/commandes') }}
                  />
                  <StatCard
                    icon={Star}
                    color="#FF6B4A"
                    label="Alertes poisson"
                    value={
                      estPremium ? 'Alertes activées' : 'Premium requis'
                    }
                    sub={
                      estPremium
                        ? 'Vous recevez des notifications en temps réel'
                        : 'Passez Premium pour activer les alertes'
                    }
                    action={
                      !estPremium
                        ? { label: 'Premium', onClick: () => navigate('/acheteur/premium') }
                        : null
                    }
                  />
                  <StatCard
                    icon={MapPin}
                    color="#0A8A5F"
                    label="Zone préférée"
                    value={utilisateur?.adresse || 'Dakar, Plateau'}
                    sub="Zone d'achat principale"
                  />
                </>
              )}

              {/* ─── PROFIL LIVREUR ─── */}
              {role === 'livreur' && (
                <>
                  <StatCard
                    icon={Shield}
                    color="#0A8A5F"
                    label="Vérification"
                    value={
                      utilisateur?.profil_livreur?.est_verifie
                        ? 'Livreur vérifié'
                        : 'En attente de validation'
                    }
                    sub={
                      utilisateur?.profil_livreur?.est_verifie
                        ? 'Vos documents sont validés'
                        : 'Vos documents sont en cours de vérification'
                    }
                    badge={
                      utilisateur?.profil_livreur?.est_verifie
                        ? { type: 'success', label: 'Vérifié' }
                        : { type: 'warning', label: 'En attente' }
                    }
                  />
                  <StatCard
                    icon={Bike}
                    color="#FF6B4A"
                    label="Véhicule"
                    value={
                      utilisateur?.profil_livreur?.vehicule?.immatriculation ||
                      'Non renseigné'
                    }
                    sub={
                      utilisateur?.profil_livreur?.vehicule?.type_vehicule
                        ? `${utilisateur.profil_livreur.vehicule.type_vehicule}${
                            utilisateur?.profil_livreur?.vehicule?.est_frigorifie
                              ? ' · Frigorifié'
                              : ''
                          }`
                        : 'Type non précisé'
                    }
                  />
                  <StatCard
                    icon={
                      utilisateur?.profil_livreur?.disponible
                        ? CheckCircle2
                        : XCircle
                    }
                    color={
                      utilisateur?.profil_livreur?.disponible
                        ? '#0A8A5F'
                        : '#A0AEC0'
                    }
                    label="Disponibilité"
                    value={
                      utilisateur?.profil_livreur?.disponible
                        ? 'En ligne'
                        : 'Hors ligne'
                    }
                    sub="Changez votre statut depuis l'accueil"
                  />
                  <StatCard
                    icon={Wallet}
                    color="#0F2A4A"
                    label="Gains"
                    value="Voir mes revenus"
                    sub="Historique et solde total"
                    action={{ label: 'Voir', onClick: () => navigate('/livreur/gains') }}
                  />
                </>
              )}
            </div>
          </div>

          {/* ═══════════ SECTION PREMIUM ═══════════ */}
          {estPremium && (
            <div className="px-5 pt-6">
              <SectionTitle>Avantages Premium</SectionTitle>
              <div className="mt-3 overflow-hidden rounded-3xl bg-[#0C3B4A] p-5 text-white shadow-sm">
                <div className="flex items-center gap-2">
                  <Crown size={20} className="text-amber-400" />
                  <h3 className="font-display text-base font-black">
                    Compte Premium actif
                  </h3>
                </div>
                <p className="mt-2 text-xs text-white/80">
                  Profitez de tous vos avantages exclusifs.
                </p>

                <ul className="mt-4 space-y-2">
                  {role === 'acheteur' && (
                    <>
                      <PremiumItem>Alertes personnalisées par poisson</PremiumItem>
                      <PremiumItem>Accès prioritaire aux arrivages rares</PremiumItem>
                      <PremiumItem>Frais de livraison réduits</PremiumItem>
                    </>
                  )}
                  {role === 'pecheur' && (
                    <>
                      <PremiumItem>Badge « Pêcheur vérifié » visible par les acheteurs</PremiumItem>
                      <PremiumItem>Mise en avant dans les résultats</PremiumItem>
                      <PremiumItem>Confiance des acheteurs</PremiumItem>
                    </>
                  )}
                  {role === 'livreur' && (
                    <>
                      <PremiumItem>Accès prioritaire aux livraisons</PremiumItem>
                      <PremiumItem>Badge « Livreur vérifié »</PremiumItem>
                      <PremiumItem>Meilleures courses proposées</PremiumItem>
                    </>
                  )}
                </ul>
              </div>
            </div>
          )}

          {/* ═══════════ ACTIONS ═══════════ */}
          <div className="px-5 pt-6 pb-8">
            <SectionTitle>Actions</SectionTitle>

            <div className="mt-3 space-y-2">
              <ActionButton
                icon={Settings}
                label="Modifier mes informations"
                onClick={() => alert('Page d\'édition à venir')}
              />

              {!estPremium  && (
                <ActionButton
                  icon={Crown}
                  label="Passer à Premium"
                  onClick={() =>
                    navigate(
                      role === 'acheteur' ? '/acheteur/premium' : '/premium'
                    )
                  }
                  primary
                />
              )}

              <ActionButton
                icon={LogOut}
                label="Se déconnecter"
                onClick={() => setConfirmDeconnexion(true)}
                danger
              />
            </div>

            <p className="mt-6 text-center text-[10px] text-stone-400">
              Lebougui · Version 1.0.0
            </p>
          </div>
        </main>

        {/* ─── MODAL CONFIRMATION DÉCONNEXION ─── */}
        {confirmDeconnexion && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 p-6 backdrop-blur-sm">
            <div className="w-full max-w-xs rounded-3xl bg-white p-6 text-center shadow-2xl">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-rose-100">
                <LogOut size={24} className="text-rose-600" />
              </div>
              <h3 className="font-display text-base font-black text-[#0F2A4A]">
                Se déconnecter ?
              </h3>
              <p className="mt-1.5 text-xs text-stone-500">
                Vous devrez vous reconnecter pour accéder à votre compte.
              </p>
              <div className="mt-5 flex gap-2">
                <button
                  onClick={() => setConfirmDeconnexion(false)}
                  className="flex-1 rounded-2xl bg-stone-100 py-3 text-xs font-bold text-stone-700 transition hover:bg-stone-200"
                >
                  Annuler
                </button>
                <button
                  onClick={handleDeconnexion}
                  className="flex-1 rounded-2xl bg-rose-500 py-3 text-xs font-black text-white shadow-md transition hover:bg-rose-600"
                >
                  Déconnexion
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// SOUS-COMPOSANTS
// ═══════════════════════════════════════════════════════════
function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-stone-100">
        <Icon size={14} className="text-stone-500" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[9px] font-bold uppercase tracking-wider text-stone-400">
          {label}
        </p>
        <p className="truncate text-sm font-semibold text-stone-800">
          {value}
        </p>
      </div>
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <h3 className="px-1 text-[10px] font-bold uppercase tracking-[0.15em] text-stone-400">
      {children}
    </h3>
  );
}

function StatCard({ icon: Icon, color, label, value, sub, badge, action }) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
          style={{ backgroundColor: `${color}15`, color }}
        >
          <Icon size={18} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
              {label}
            </p>
            {badge && (
              <span
                className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${
                  badge.type === 'success'
                    ? 'bg-emerald-100 text-emerald-700'
                    : badge.type === 'warning'
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-stone-100 text-stone-600'
                }`}
              >
                {badge.label}
              </span>
            )}
          </div>
          <p className="mt-0.5 truncate text-sm font-black text-[#0F2A4A]">
            {value}
          </p>
          {sub && (
            <p className="mt-0.5 text-[10px] leading-tight text-stone-500">
              {sub}
            </p>
          )}
        </div>
        {action && (
          <button
            onClick={action.onClick}
            className="shrink-0 self-center rounded-full bg-stone-100 px-3 py-1.5 text-[10px] font-bold text-stone-700 transition hover:bg-stone-200"
          >
            {action.label}
          </button>
        )}
      </div>
    </div>
  );
}

function PremiumItem({ children }) {
  return (
    <li className="flex items-start gap-2 text-xs text-white/95">
      <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-amber-400" />
      <span>{children}</span>
    </li>
  );
}

function ActionButton({ icon: Icon, label, onClick, primary, danger }) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-2xl p-4 text-left transition ${
        danger
          ? 'bg-rose-50 text-rose-600 hover:bg-rose-100'
          : primary
          ? 'bg-[#FF6B4A] text-white shadow-sm hover:bg-[#E85A39]'
          : 'bg-white text-stone-800 shadow-sm hover:bg-stone-50'
      }`}
    >
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
          danger
            ? 'bg-rose-100 text-rose-600'
            : primary
            ? 'bg-white/15 text-white'
            : 'bg-stone-100 text-stone-600'
        }`}
      >
        <Icon size={16} />
      </div>
      <span className="flex-1 text-sm font-bold">{label}</span>
      <ChevronRight size={16} className="opacity-60" />
    </button>
  );
}