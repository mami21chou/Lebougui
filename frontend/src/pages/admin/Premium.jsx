import React, { useState, useEffect, useMemo } from 'react';
import {
  Crown, Search, Calendar, User, Phone, Check, XCircle,
  Clock, ShieldCheck, AlertCircle, TrendingUp,
} from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import { AdminService } from '../../services/adminService';

const TABS = [
  { id: 'en_attente', label: 'En attente' },
  { id: 'actif', label: 'Actifs' },
  { id: 'revoque', label: 'Révoqués' },
  { id: 'tous', label: 'Tous' },
];

const FONCTION_LABEL = {
  badge_pecheur: '🎣 Badge Pêcheur',
  badge_livreur: '🛵 Badge Livreur',
  abonnement_acheteur: '🛒 Abonnement Acheteur',
};

export default function AdminPremium() {
  const [premiums, setPremiums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('en_attente');
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState(null);

  const load = async () => {
    try {
      setLoading(true);
      const data = await AdminService.getPremiums();
      setPremiums(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    let list = premiums;
    if (tab !== 'tous') list = list.filter((p) => p.statut === tab);

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p) =>
        p.utilisateur_detail?.nom?.toLowerCase().includes(q) ||
        p.utilisateur_detail?.telephone?.includes(q)
      );
    }
    return list;
  }, [premiums, tab, search]);

  const compteurs = useMemo(
    () => ({
      en_attente: premiums.filter((p) => p.statut === 'en_attente').length,
      actif: premiums.filter((p) => p.statut === 'actif').length,
      revoque: premiums.filter((p) => p.statut === 'revoque').length,
      tous: premiums.length,
    }),
    [premiums]
  );

  const handleValider = async (p) => {
    setActionLoading(p.id);
    try {
      await AdminService.validerPremium(p.id);
      await load();
    } catch (err) {
      alert('Erreur');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRevoquer = async (p) => {
    const motif = window.prompt('Motif de la révocation :');
    if (motif === null) return;

    setActionLoading(p.id);
    try {
      await AdminService.revoquerPremium(p.id, { motif: motif || 'Révoqué par admin' });
      await load();
    } catch (err) {
      alert('Erreur');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <AdminLayout
      title="Abonnements Premium"
      subtitle="Gestion des badges et abonnements"
    >

      {/* STATS RAPIDES */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MiniStat
          icon={Clock}
          color="#F59E0B"
          label="En attente"
          value={compteurs.en_attente}
        />
        <MiniStat
          icon={ShieldCheck}
          color="#0A8A5F"
          label="Actifs"
          value={compteurs.actif}
        />
        <MiniStat
          icon={XCircle}
          color="#E11D48"
          label="Révoqués"
          value={compteurs.revoque}
        />
        <MiniStat
          icon={TrendingUp}
          color="#FF6B4A"
          label="Total"
          value={compteurs.tous}
        />
      </div>

      {/* TABS + RECHERCHE */}
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
                  tab === t.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
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
            placeholder="Rechercher un utilisateur…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-72 rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-xs text-slate-800 outline-none transition focus:border-[#FF6B4A]"
          />
        </div>
      </div>

      {/* TABLEAU */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#FF6B4A] border-t-transparent" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center gap-3 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
              <Crown size={22} className="text-slate-400" />
            </div>
            <p className="text-sm font-bold text-slate-700">
              Aucun abonnement dans cette catégorie
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 text-left">
                <th className="px-6 py-3 text-[10px] font-black uppercase tracking-wider text-slate-500">
                  Utilisateur
                </th>
                <th className="px-6 py-3 text-[10px] font-black uppercase tracking-wider text-slate-500">
                  Type
                </th>
                <th className="px-6 py-3 text-[10px] font-black uppercase tracking-wider text-slate-500">
                  Obtention
                </th>
                <th className="px-6 py-3 text-[10px] font-black uppercase tracking-wider text-slate-500">
                  Expiration
                </th>
                <th className="px-6 py-3 text-[10px] font-black uppercase tracking-wider text-slate-500">
                  Statut
                </th>
                <th className="px-6 py-3 text-right text-[10px] font-black uppercase tracking-wider text-slate-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((p) => {
                const u = p.utilisateur_detail || {};
                const expireDans = p.date_expiration
                  ? Math.ceil(
                      (new Date(p.date_expiration) - new Date()) /
                        (1000 * 60 * 60 * 24)
                    )
                  : null;

                return (
                  <tr key={p.id} className="transition hover:bg-slate-50/60">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-700 text-xs font-bold text-white">
                          {u.nom?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-xs font-bold text-slate-900">
                            {u.nom}
                          </p>
                          <p className="truncate text-[10px] text-slate-500">
                            {u.telephone}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-bold text-slate-700">
                        {FONCTION_LABEL[p.fonction] || p.fonction}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs text-slate-600">
                        {p.date_obtention
                          ? new Date(p.date_obtention).toLocaleDateString('fr-FR')
                          : '—'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {p.date_expiration ? (
                        <div>
                          <span className="text-xs text-slate-600">
                            {new Date(p.date_expiration).toLocaleDateString('fr-FR')}
                          </span>
                          {p.statut === 'actif' && expireDans !== null && (
                            <p
                              className={`text-[10px] font-bold ${
                                expireDans <= 3
                                  ? 'text-rose-600'
                                  : expireDans <= 7
                                  ? 'text-amber-600'
                                  : 'text-slate-400'
                              }`}
                            >
                              {expireDans <= 0
                                ? 'Expiré'
                                : `Dans ${expireDans}j`}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <StatutBadge statut={p.statut} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {p.statut === 'en_attente' && (
                          <button
                            onClick={() => handleValider(p)}
                            disabled={actionLoading === p.id}
                            className="flex h-8 items-center gap-1.5 rounded-lg bg-[#FF6B4A] px-3 text-[11px] font-bold text-white transition hover:bg-[#E85A39] disabled:opacity-60"
                          >
                            <Check size={12} />
                            {actionLoading === p.id ? '...' : 'Valider'}
                          </button>
                        )}
                        {p.statut === 'actif' && (
                          <button
                            onClick={() => handleRevoquer(p)}
                            disabled={actionLoading === p.id}
                            className="flex h-8 items-center gap-1.5 rounded-lg bg-rose-50 px-3 text-[11px] font-bold text-rose-700 transition hover:bg-rose-100 disabled:opacity-60"
                          >
                            <XCircle size={12} />
                            Révoquer
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </AdminLayout>
  );
}

function MiniStat({ icon: Icon, color, label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div
        className="flex h-10 w-10 items-center justify-center rounded-xl"
        style={{ backgroundColor: `${color}12`, color }}
      >
        <Icon size={18} />
      </div>
      <p className="mt-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-2xl font-black text-slate-900">{value}</p>
    </div>
  );
}

function StatutBadge({ statut }) {
  const config = {
    en_attente: {
      label: 'En attente',
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      icon: Clock,
    },
    actif: {
      label: 'Actif',
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      icon: ShieldCheck,
    },
    revoque: {
      label: 'Révoqué',
      bg: 'bg-rose-50',
      text: 'text-rose-700',
      icon: XCircle,
    },
    rejete: {
      label: 'Rejeté',
      bg: 'bg-slate-100',
      text: 'text-slate-600',
      icon: AlertCircle,
    },
  };
  const c = config[statut] || config.en_attente;
  const Icon = c.icon;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold ${c.bg} ${c.text}`}
    >
      <Icon size={11} />
      {c.label}
    </span>
  );
}