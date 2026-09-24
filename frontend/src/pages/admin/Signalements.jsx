import React, { useState, useEffect, useMemo } from 'react';
import {
  AlertTriangle, Star, ShieldOff, Fish, Truck, Search,
  CheckCircle2, X, Phone, Check, Flag, Clock, User,
} from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import { AdminService } from '../../services/adminService';

// ─── Configuration ───
const MOTIFS_PAR_ETOILE = {
  1: { label: 'Très mauvais', color: '#E11D48' },
  2: { label: 'Mauvais', color: '#F59E0B' },
};

const TABS = [
  { id: 'a_traiter', label: 'À traiter' },
  { id: 'a_revoquer', label: 'À révoquer' },
  { id: 'traites', label: 'Traités' },
  { id: 'tous', label: 'Tous' },
];

const formatDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const formatDateTime = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function Signalements() {
  const [signalements, setSignalements] = useState([]);
  const [aRevoquer, setARevoquer] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('a_traiter');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  const load = async () => {
    try {
      setLoading(true);
      const [sigs, revoq] = await Promise.all([
        AdminService.getSignalements(),
        AdminService.getUtilisateursARevoquer(),
      ]);
      setSignalements(Array.isArray(sigs) ? sigs : []);
      setARevoquer(Array.isArray(revoq) ? revoq : []);
    } catch (err) {
      console.error('Erreur chargement signalements:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    let list = signalements;

    if (tab === 'a_traiter') list = list.filter((s) => !s.traite);
    else if (tab === 'traites') list = list.filter((s) => s.traite);

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (s) =>
          s.auteur_detail?.nom?.toLowerCase().includes(q) ||
          s.cible_detail?.nom?.toLowerCase().includes(q) ||
          s.commande_numero?.toLowerCase().includes(q) ||
          s.commentaire?.toLowerCase().includes(q)
      );
    }

    return list;
  }, [signalements, tab, search]);

  const compteurs = useMemo(
    () => ({
      a_traiter: signalements.filter((s) => !s.traite).length,
      a_revoquer: aRevoquer.length,
      traites: signalements.filter((s) => s.traite).length,
      tous: signalements.length,
    }),
    [signalements, aRevoquer]
  );

  const handleMarquerTraite = async (sig, action) => {
    setActionLoading(sig.id);
    try {
      await AdminService.traiterSignalement(sig.id, action);
      await load();
      setSelected(null);
    } catch (err) {
      alert('Erreur lors du traitement');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRevoquerBadges = async (user) => {
    if (
      !window.confirm(
        `Révoquer tous les badges de ${user.prenom} ${user.nom} ?\n\n${user.signalements} signalements reçus.`
      )
    )
      return;

    setActionLoading(user.id);
    try {
      await AdminService.revoquerTousBadges(user.id, {
        motif: `${user.signalements} signalements clients`,
      });
      await load();
    } catch (err) {
      alert('Erreur lors de la révocation');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <AdminLayout
      title="Signalements"
      subtitle="Modération des avis clients"
    >
      {/* Bandeau alerte */}
      {aRevoquer.length > 0 && (
        <div className="mb-6 flex items-start gap-4 rounded-2xl border border-rose-200 bg-rose-50/60 p-5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
            <ShieldOff size={20} />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-black text-rose-900">
              {aRevoquer.length} utilisateur{aRevoquer.length > 1 ? 's' : ''} avec 2+ signalements
            </h3>
            <p className="mt-0.5 text-xs text-rose-700">
              Ces comptes atteignent le seuil de révocation automatique.
            </p>
          </div>
          <button
            onClick={() => setTab('a_revoquer')}
            className="shrink-0 rounded-lg bg-rose-500 px-3 py-2 text-[11px] font-black text-white transition hover:bg-rose-600"
          >
            Voir
          </button>
        </div>
      )}

      {/* Tabs + Recherche */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex gap-1 rounded-xl border border-slate-200 bg-white p-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition ${
                tab === t.id
                  ? 'bg-[#0C3B4A] text-white'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              {t.label}
              <span
                className={`flex h-4 min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-black ${
                  tab === t.id
                    ? 'bg-white/20 text-white'
                    : t.id === 'a_revoquer'
                    ? 'bg-rose-100 text-rose-700'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                {compteurs[t.id]}
              </span>
            </button>
          ))}
        </div>

        <div className="relative">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            placeholder="Rechercher…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-72 rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-xs text-slate-800 outline-none transition focus:border-[#FF6B4A]"
          />
        </div>
      </div>

      {/* Contenu */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#FF6B4A] border-t-transparent" />
        </div>
      ) : tab === 'a_revoquer' ? (
        <ToRevoquerList
          users={aRevoquer}
          onRevoquer={handleRevoquerBadges}
          loading={actionLoading}
        />
      ) : filtered.length === 0 ? (
        <EmptyState tab={tab} />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="divide-y divide-slate-100">
            {filtered.map((s) => (
              <SignalementRow
                key={s.id}
                signalement={s}
                onClick={() => setSelected(s)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Modal */}
      {selected && (
        <SignalementModal
          signalement={selected}
          onClose={() => setSelected(null)}
          onTraiter={(action) => handleMarquerTraite(selected, action)}
          loading={actionLoading === selected.id}
        />
      )}
    </AdminLayout>
  );
}

// ═══════════════════════════════════════════════════════════
// SOUS-COMPOSANTS
// ═══════════════════════════════════════════════════════════

function Stars({ value = 0 }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={12}
          className={
            i <= value ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
          }
        />
      ))}
    </div>
  );
}

function SignalementRow({ signalement, onClick }) {
  const roleConfig =
    signalement.cible_detail?.role === 'livreur'
      ? { color: '#7C3AED', icon: Truck, label: 'Livreur' }
      : { color: '#0C3B4A', icon: Fish, label: 'Pêcheur' };
  const CibleIcon = roleConfig.icon;

  return (
    <button
      onClick={onClick}
      className="flex w-full items-start gap-4 px-6 py-5 text-left transition hover:bg-slate-50/60"
    >
      <div
        className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${
          signalement.traite ? 'bg-slate-200' : 'bg-rose-500'
        }`}
      />

      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
        style={{ backgroundColor: `${roleConfig.color}15`, color: roleConfig.color }}
      >
        <CibleIcon size={17} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-bold text-slate-900">
            {signalement.cible_detail?.nom || 'Inconnu'}
          </p>
          <span
            className="rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider"
            style={{ backgroundColor: `${roleConfig.color}15`, color: roleConfig.color }}
          >
            {roleConfig.label}
          </span>
          <Stars value={signalement.etoile} />
        </div>

        {signalement.commentaire && (
          <p className="mt-1 line-clamp-2 text-xs italic text-slate-600">
            « {signalement.commentaire} »
          </p>
        )}

        <div className="mt-2 flex flex-wrap items-center gap-3 text-[10px] text-slate-400">
          <span>Commande #{signalement.commande_numero || '—'}</span>
          <span>·</span>
          <span>Par {signalement.auteur_detail?.nom || '—'}</span>
          <span>·</span>
          <span>{formatDate(signalement.date)}</span>
        </div>
      </div>

      {signalement.traite ? (
        <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700">
          Traité
        </span>
      ) : (
        <span className="shrink-0 rounded-full bg-rose-50 px-2.5 py-1 text-[10px] font-bold text-rose-700">
          À traiter
        </span>
      )}
    </button>
  );
}

function ToRevoquerList({ users, onRevoquer, loading }) {
  if (users.length === 0) {
    return (
      <div className="flex h-56 flex-col items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
          <CheckCircle2 size={22} className="text-emerald-600" />
        </div>
        <p className="text-sm font-bold text-slate-700">
          Aucun utilisateur à révoquer
        </p>
        <p className="text-xs text-slate-500">Tous les badges sont conformes.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {users.map((user) => {
        const roleConfig =
          user.role === 'pecheur'
            ? { color: '#0C3B4A', icon: Fish, label: 'Pêcheur' }
            : { color: '#7C3AED', icon: Truck, label: 'Livreur' };
        const RoleIcon = roleConfig.icon;

        return (
          <div
            key={user.id}
            className="overflow-hidden rounded-2xl border border-rose-100 bg-white"
          >
            <div className="flex items-center gap-3 border-b border-rose-50 bg-rose-50/40 px-5 py-4">
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                style={{ backgroundColor: roleConfig.color }}
              >
                {user.prenom?.charAt(0)?.toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-black text-slate-900">
                  {user.prenom} {user.nom}
                </p>
                <p className="flex items-center gap-1 truncate text-[11px] text-slate-500">
                  <RoleIcon size={10} />
                  {roleConfig.label} · {user.telephone}
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-rose-500 px-3 py-1 text-[10px] font-black text-white">
                {user.signalements} signalements
              </span>
            </div>

            <div className="flex items-center justify-between gap-3 px-5 py-4">
              <p className="text-[11px] leading-relaxed text-slate-500">
                Ce compte a atteint le seuil de révocation automatique.
              </p>
              <button
                onClick={() => onRevoquer(user)}
                disabled={loading === user.id}
                className="flex shrink-0 items-center gap-1.5 rounded-lg bg-rose-500 px-3 py-2 text-[11px] font-black text-white transition hover:bg-rose-600 disabled:opacity-60"
              >
                <ShieldOff size={12} />
                {loading === user.id ? 'Révocation...' : 'Révoquer'}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function EmptyState({ tab }) {
  const config = {
    a_traiter: { icon: CheckCircle2, text: 'Aucun signalement en attente' },
    traites: { icon: CheckCircle2, text: 'Aucun signalement traité' },
    tous: { icon: Flag, text: 'Aucun signalement enregistré' },
  };
  const c = config[tab] || config.tous;
  const Icon = c.icon;

  return (
    <div className="flex h-56 flex-col items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
        <Icon size={22} className="text-slate-400" />
      </div>
      <p className="text-sm font-bold text-slate-700">{c.text}</p>
    </div>
  );
}

function SignalementModal({ signalement, onClose, onTraiter, loading }) {
  const [actionChoisie, setActionChoisie] = useState('');

  const actions = [
    'Signalement pris en compte',
    'Avertissement envoyé',
    'Badge révoqué',
    'Aucune action nécessaire',
    'Autre',
  ];

  const roleConfig =
    signalement.cible_detail?.role === 'livreur'
      ? { color: '#7C3AED', icon: Truck, label: 'Livreur' }
      : { color: '#0C3B4A', icon: Fish, label: 'Pêcheur' };
  const CibleIcon = roleConfig.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
          <div className="flex items-center gap-4">
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
              style={{ backgroundColor: `${roleConfig.color}15`, color: roleConfig.color }}
            >
              <AlertTriangle size={22} />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900">
                Signalement #{signalement.id}
              </h2>
              <p className="text-xs text-slate-500">
                Commande #{signalement.commande_numero || '—'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="no-scrollbar flex-1 space-y-6 overflow-y-auto p-6">
          {/* Auteur */}
          <div>
            <p className="mb-2 text-[10px] font-black uppercase tracking-wider text-slate-400">
              Signalé par
            </p>
            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-700 text-xs font-bold text-white">
                {signalement.auteur_detail?.nom?.charAt(0) || '?'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-slate-900">
                  {signalement.auteur_detail?.nom || 'Anonyme'}
                </p>
                <p className="flex items-center gap-1 text-[11px] text-slate-500">
                  <Phone size={10} />
                  {signalement.auteur_detail?.telephone || '—'}
                </p>
              </div>
              <span className="text-[10px] text-slate-400">
                {formatDate(signalement.date)}
              </span>
            </div>
          </div>

          {/* Cible */}
          <div>
            <p className="mb-2 text-[10px] font-black uppercase tracking-wider text-slate-400">
              Utilisateur visé
            </p>
            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4">
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white"
                style={{ backgroundColor: roleConfig.color }}
              >
                {signalement.cible_detail?.nom?.charAt(0) || '?'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-slate-900">
                  {signalement.cible_detail?.nom || 'Inconnu'}
                </p>
                <p className="flex items-center gap-1 text-[11px] text-slate-500">
                  <CibleIcon size={10} />
                  {roleConfig.label} · {signalement.cible_detail?.telephone || '—'}
                </p>
              </div>
            </div>
          </div>

          {/* Note */}
          <div>
            <p className="mb-2 text-[10px] font-black uppercase tracking-wider text-slate-400">
              Note donnée
            </p>
            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-amber-50/50 p-4">
              <Stars value={signalement.etoile} />
              <span className="text-sm font-black text-amber-700">
                {signalement.etoile}/5
              </span>
            </div>
          </div>

          {/* Commentaire */}
          {signalement.commentaire && (
            <div>
              <p className="mb-2 text-[10px] font-black uppercase tracking-wider text-slate-400">
                Commentaire du client
              </p>
              <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
                <p className="text-sm italic leading-relaxed text-slate-700">
                  « {signalement.commentaire} »
                </p>
              </div>
            </div>
          )}

          {/* Actions (si pas traité) */}
          {!signalement.traite && (
            <div>
              <p className="mb-2 text-[10px] font-black uppercase tracking-wider text-slate-400">
                Action à prendre
              </p>
              <div className="space-y-2">
                {actions.map((a) => (
                  <button
                    key={a}
                    onClick={() => setActionChoisie(a)}
                    className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-xs font-bold transition ${
                      actionChoisie === a
                        ? 'border-[#FF6B4A] bg-orange-50 text-[#FF6B4A]'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <div
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                        actionChoisie === a
                          ? 'border-[#FF6B4A] bg-[#FF6B4A]'
                          : 'border-slate-300'
                      }`}
                    >
                      {actionChoisie === a && (
                        <Check size={11} className="text-white" strokeWidth={3} />
                      )}
                    </div>
                    {a}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Déjà traité */}
          {signalement.traite && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-600" />
                <p className="text-sm font-bold text-emerald-800">
                  Signalement traité
                </p>
              </div>
              {signalement.action_prise && (
                <p className="mt-1 text-xs text-emerald-700">
                  <strong>Action :</strong> {signalement.action_prise}
                </p>
              )}
              {signalement.date_traitement && (
                <p className="mt-0.5 flex items-center gap-1 text-[10px] text-emerald-600">
                  <Clock size={9} />
                  Le {formatDateTime(signalement.date_traitement)}
                </p>
              )}
              {signalement.traite_par_detail && (
                <p className="mt-0.5 flex items-center gap-1 text-[10px] text-emerald-600">
                  <User size={9} />
                  Par {signalement.traite_par_detail.nom}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {!signalement.traite && (
          <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50/60 px-6 py-4">
            <button
              onClick={onClose}
              className="rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-100"
            >
              Annuler
            </button>
            <button
              onClick={() =>
                onTraiter(actionChoisie || 'Signalement pris en compte')
              }
              disabled={loading}
              className="flex items-center gap-2 rounded-xl bg-[#FF6B4A] px-5 py-2.5 text-xs font-black text-white transition hover:bg-[#E85A39] disabled:opacity-60"
            >
              {loading ? (
                <>
                  <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Traitement...
                </>
              ) : (
                <>
                  <Check size={13} />
                  Marquer comme traité
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}