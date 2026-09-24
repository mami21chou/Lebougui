import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Filter, CheckCircle2, Clock, MapPin, Phone,
  FileText, X, Check, Shield, Eye,
} from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import { AdminService } from '../../services/adminService';

const TABS = [
  { id: 'attente', label: 'En attente' },
  { id: 'verifie', label: 'Vérifiés' },
  { id: 'tous', label: 'Tous' },
];

export default function AdminPecheurs() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('attente');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const data = await AdminService.getUtilisateurs('pecheur');
      setUsers(data);
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
    let list = users;

    if (tab === 'attente') {
      list = list.filter((u) => !u.profil_pecheur?.est_verifie);
    } else if (tab === 'verifie') {
      list = list.filter((u) => u.profil_pecheur?.est_verifie);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (u) =>
          u.prenom?.toLowerCase().includes(q) ||
          u.nom?.toLowerCase().includes(q) ||
          u.telephone?.includes(q)
      );
    }

    return list;
  }, [users, tab, search]);

  const compteurs = useMemo(
    () => ({
      attente: users.filter((u) => !u.profil_pecheur?.est_verifie).length,
      verifie: users.filter((u) => u.profil_pecheur?.est_verifie).length,
      tous: users.length,
    }),
    [users]
  );

  const handleValider = async (user) => {
    setActionLoading(true);
    try {
      await AdminService.validerDocument(user.id);
      await load();
      setSelected(null);
    } catch (err) {
      alert('Erreur lors de la validation');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRevoquer = async (user) => {
    if (!window.confirm(`Révoquer la validation de ${user.prenom} ${user.nom} ?`)) return;
    setActionLoading(true);
    try {
      await AdminService.revoquerDocument(user.id);
      await load();
      setSelected(null);
    } catch (err) {
      alert('Erreur lors de la révocation');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <AdminLayout title="Pêcheurs" subtitle="Gestion des pêcheurs inscrits">

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
                  tab === t.id
                    ? 'bg-white/20 text-white'
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
            placeholder="Rechercher un pêcheur…"
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
              <Shield size={22} className="text-slate-400" />
            </div>
            <p className="text-sm font-bold text-slate-700">
              Aucun pêcheur {tab === 'attente' ? 'en attente' : 'à afficher'}
            </p>
            <p className="text-xs text-slate-500">
              {tab === 'attente'
                ? 'Tous les documents ont été traités.'
                : 'Aucun résultat trouvé.'}
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 text-left">
                <th className="px-6 py-3 text-[10px] font-black uppercase tracking-wider text-slate-500">
                  Pêcheur
                </th>
                <th className="px-6 py-3 text-[10px] font-black uppercase tracking-wider text-slate-500">
                  Téléphone
                </th>
                <th className="px-6 py-3 text-[10px] font-black uppercase tracking-wider text-slate-500">
                  Zone
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
              {filtered.map((u) => (
                <tr
                  key={u.id}
                  className="transition hover:bg-slate-50/60"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#0C3B4A] text-xs font-bold text-white">
                        {u.prenom?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-xs font-bold text-slate-900">
                          {u.prenom} {u.nom}
                        </p>
                        <p className="truncate text-[10px] text-slate-500">
                          Inscrit le{' '}
                          {new Date(u.date_inscription).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-medium text-slate-700">
                      {u.telephone}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1 text-xs text-slate-600">
                      <MapPin size={11} className="text-slate-400" />
                      {u.adresse || '—'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {u.profil_pecheur?.est_verifie ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700">
                        <CheckCircle2 size={11} /> Vérifié
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-700">
                        <Clock size={11} /> En attente
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setSelected(u)}
                        className="flex h-8 items-center gap-1.5 rounded-lg bg-slate-100 px-3 text-[11px] font-bold text-slate-700 transition hover:bg-slate-200"
                      >
                        <Eye size={12} />
                        Détail
                      </button>
                      {!u.profil_pecheur?.est_verifie && (
                        <button
                          onClick={() => handleValider(u)}
                          disabled={actionLoading}
                          className="flex h-8 items-center gap-1.5 rounded-lg bg-[#FF6B4A] px-3 text-[11px] font-bold text-white transition hover:bg-[#E85A39] disabled:opacity-60"
                        >
                          <Check size={12} />
                          Valider
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* MODAL DÉTAIL */}
      {selected && (
        <UserDetailModal
          user={selected}
          onClose={() => setSelected(null)}
          onValider={() => handleValider(selected)}
          onRevoquer={() => handleRevoquer(selected)}
          loading={actionLoading}
        />
      )}
    </AdminLayout>
  );
}

// ═══════════════════════════════════════════════════════════
// MODAL DE DÉTAIL
// ═══════════════════════════════════════════════════════════

function UserDetailModal({ user, onClose, onValider, onRevoquer, loading }) {
  const doc = user.profil_pecheur?.documents_pecheur;
  const estVerifie = user.profil_pecheur?.est_verifie;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">

        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#0C3B4A] text-base font-bold text-white">
              {user.prenom?.charAt(0)?.toUpperCase()}
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900">
                {user.prenom} {user.nom}
              </h2>
              <p className="flex items-center gap-1 text-xs text-slate-500">
                <Phone size={11} />
                {user.telephone}
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
        <div className="no-scrollbar flex-1 overflow-y-auto p-6 space-y-6">

          {/* Infos */}
          <div className="grid grid-cols-2 gap-4">
            <InfoBlock label="Adresse" value={user.adresse || '—'} />
            <InfoBlock
              label="Inscription"
              value={new Date(user.date_inscription).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            />
            {user.email && <InfoBlock label="Email" value={user.email} />}
            <InfoBlock
              label="Statut"
              value={estVerifie ? 'Vérifié' : 'En attente'}
              badge={estVerifie ? 'success' : 'warning'}
            />
          </div>

          {/* Document */}
          <div>
            <p className="mb-3 text-[10px] font-black uppercase tracking-wider text-slate-400">
              Document de vérification
            </p>
            {doc ? (
              <div className="overflow-hidden rounded-2xl border border-slate-200">
                {doc.match(/\.(jpg|jpeg|png|webp)$/i) ? (
                  <img
                    src={doc}
                    alt="Document"
                    className="max-h-96 w-full object-contain bg-slate-50"
                  />
                ) : (
                  <a
                    href={doc}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-4 transition hover:bg-slate-50"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                      <FileText size={18} />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-bold text-slate-900">
                        Document PDF
                      </p>
                      <p className="text-[10px] text-slate-500">
                        Cliquez pour ouvrir
                      </p>
                    </div>
                  </a>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 py-10 text-center">
                <FileText size={24} className="text-slate-300" />
                <p className="mt-2 text-xs font-medium text-slate-500">
                  Aucun document fourni
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50/60 px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-100"
          >
            Fermer
          </button>
          {estVerifie ? (
            <button
              onClick={onRevoquer}
              disabled={loading}
              className="rounded-xl bg-rose-500 px-4 py-2.5 text-xs font-black text-white transition hover:bg-rose-600 disabled:opacity-60"
            >
              Révoquer la validation
            </button>
          ) : (
            <button
              onClick={onValider}
              disabled={loading}
              className="rounded-xl bg-[#FF6B4A] px-4 py-2.5 text-xs font-black text-white transition hover:bg-[#E85A39] disabled:opacity-60"
            >
              {loading ? 'Validation...' : 'Valider les documents'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoBlock({ label, value, badge }) {
  return (
    <div>
      <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
        {label}
      </p>
      <p
        className={`mt-1 text-sm font-bold ${
          badge === 'success'
            ? 'text-emerald-600'
            : badge === 'warning'
            ? 'text-amber-600'
            : 'text-slate-900'
        }`}
      >
        {value}
      </p>
    </div>
  );
}