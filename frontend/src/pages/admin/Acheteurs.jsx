import React, { useState, useEffect, useMemo } from 'react';
import {
  Search, Users, Crown, ShoppingBag, Phone, MapPin, Eye, X, Mail,
} from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import { AdminService } from '../../services/adminService';

export default function AdminAcheteurs() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filtrePremium, setFiltrePremium] = useState('tous');
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await AdminService.getUtilisateurs('acheteur');
        setUsers(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    let list = users;
    if (filtrePremium === 'premium') list = list.filter((u) => u.premium_actif);
    else if (filtrePremium === 'simple') list = list.filter((u) => !u.premium_actif);

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
  }, [users, filtrePremium, search]);

  const compteurs = useMemo(
    () => ({
      tous: users.length,
      premium: users.filter((u) => u.premium_actif).length,
      simple: users.filter((u) => !u.premium_actif).length,
    }),
    [users]
  );

  return (
    <AdminLayout title="Acheteurs" subtitle="Gestion des acheteurs de la plateforme">

      {/* TABS + RECHERCHE */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex gap-1 rounded-xl border border-slate-200 bg-white p-1">
          {[
            { id: 'tous', label: 'Tous', count: compteurs.tous },
            { id: 'premium', label: 'Premium', count: compteurs.premium },
            { id: 'simple', label: 'Simples', count: compteurs.simple },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setFiltrePremium(t.id)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition ${
                filtrePremium === t.id
                  ? 'bg-[#0C3B4A] text-white'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              {t.label}
              <span
                className={`flex h-4 min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-black ${
                  filtrePremium === t.id
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                {t.count}
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
            placeholder="Rechercher un acheteur…"
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
              <Users size={22} className="text-slate-400" />
            </div>
            <p className="text-sm font-bold text-slate-700">Aucun acheteur à afficher</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 text-left">
                <th className="px-6 py-3 text-[10px] font-black uppercase tracking-wider text-slate-500">
                  Acheteur
                </th>
                <th className="px-6 py-3 text-[10px] font-black uppercase tracking-wider text-slate-500">
                  Téléphone
                </th>
                <th className="px-6 py-3 text-[10px] font-black uppercase tracking-wider text-slate-500">
                  Adresse
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
                <tr key={u.id} className="transition hover:bg-slate-50/60">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#0A8A5F] text-xs font-bold text-white">
                        {u.prenom?.charAt(0)?.toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-xs font-bold text-slate-900">
                          {u.prenom} {u.nom}
                        </p>
                        <p className="truncate text-[10px] text-slate-500">
                          Depuis le{' '}
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
                    {u.premium_actif ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-700">
                        <Crown size={11} /> Premium
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-500">
                        Simple
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => setSelected(u)}
                      className="flex h-8 items-center gap-1.5 rounded-lg bg-slate-100 px-3 text-[11px] font-bold text-slate-700 transition hover:bg-slate-200"
                    >
                      <Eye size={12} />
                      Détail
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* MODAL DÉTAIL */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6 backdrop-blur-sm">
          <div className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#0A8A5F] text-base font-bold text-white">
                  {selected.prenom?.charAt(0)}
                </div>
                <div>
                  <h2 className="text-base font-black text-slate-900">
                    {selected.prenom} {selected.nom}
                  </h2>
                  {selected.premium_actif && (
                    <span className="mt-0.5 inline-flex items-center gap-1 text-[10px] font-bold text-amber-600">
                      <Crown size={10} /> Compte Premium
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Téléphone
                  </p>
                  <p className="mt-1 flex items-center gap-1.5 text-sm font-bold text-slate-900">
                    <Phone size={12} className="text-slate-400" />
                    {selected.telephone}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Inscription
                  </p>
                  <p className="mt-1 text-sm font-bold text-slate-900">
                    {new Date(selected.date_inscription).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                {selected.email && (
                  <div className="col-span-2">
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                      Email
                    </p>
                    <p className="mt-1 flex items-center gap-1.5 text-sm font-bold text-slate-900">
                      <Mail size={12} className="text-slate-400" />
                      {selected.email}
                    </p>
                  </div>
                )}
                <div className="col-span-2">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Adresse
                  </p>
                  <p className="mt-1 text-sm font-bold text-slate-900">
                    {selected.adresse || '—'}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end border-t border-slate-100 bg-slate-50/60 px-6 py-4">
              <button
                onClick={() => setSelected(null)}
                className="rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-100"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}