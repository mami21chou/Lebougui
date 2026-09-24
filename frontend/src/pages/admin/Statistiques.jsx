import React, { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp, ShoppingBag, Fish, Truck, Clock, Wallet,
} from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import { AdminService } from '../../services/adminService';

const formatPrice = (p) =>
  `${new Intl.NumberFormat('fr-FR').format(Math.round(Number(p) || 0))} FCFA`;

// Couleurs par type
const COULEURS = {
  acheteurs: '#FF6B4A',
  pecheurs: '#0C3B4A',
  livreurs: '#7C3AED',
};

export default function Statistiques() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await AdminService.getStatsFinancieres();
        setStats(data);
      } catch (err) {
        console.error('Erreur chargement stats:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <AdminLayout title="Statistiques">
        <div className="flex h-96 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#FF6B4A] border-t-transparent" />
        </div>
      </AdminLayout>
    );
  }

  if (!stats) {
    return (
      <AdminLayout title="Statistiques">
        <div className="flex h-96 items-center justify-center text-sm text-slate-500">
          Impossible de charger les statistiques.
        </div>
      </AdminLayout>
    );
  }

  const totalActifs = stats.premium_actifs.total;

  return (
    <AdminLayout
      title="Statistiques"
      subtitle="Revenus Premium de la plateforme"
    >
      {/* ═══════════ 4 KPI ═══════════ */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Revenus ce mois"
          value={formatPrice(stats.revenus_mois.total)}
          sub={`${totalActifs} abonné${totalActifs > 1 ? 's' : ''}`}
          icon={TrendingUp}
          color="#FF6B4A"
        />
        <KpiCard
          label="Revenus cette année"
          value={formatPrice(stats.revenus_annee)}
          sub="Cumul depuis janvier"
          icon={Wallet}
          color="#0C3B4A"
        />
        <KpiCard
          label="Revenus totaux"
          value={formatPrice(stats.revenus_total)}
          sub="Depuis le lancement"
          icon={Wallet}
          color="#0A8A5F"
        />
        <KpiCard
          label="En attente"
          value={stats.premium_en_attente}
          sub={`Potentiel : ${formatPrice(stats.revenus_potentiels)}`}
          icon={Clock}
          color="#F59E0B"
        />
      </div>

      {/* ═══════════ RÉPARTITION EN GRAPHIQUE ═══════════ */}
      <div className="mt-8">
        <h2 className="mb-4 text-sm font-black tracking-tight text-slate-900">
          Répartition des abonnés
        </h2>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="grid grid-cols-1 gap-8 p-6 lg:grid-cols-5">

            {/* Donut à gauche */}
            <div className="flex items-center justify-center lg:col-span-2">
              <Donut
                data={[
                  { key: 'acheteurs', label: 'Acheteurs', value: stats.premium_actifs.acheteurs },
                  { key: 'pecheurs', label: 'Pêcheurs', value: stats.premium_actifs.pecheurs },
                  { key: 'livreurs', label: 'Livreurs', value: stats.premium_actifs.livreurs },
                ]}
                total={totalActifs}
              />
            </div>

            {/* Barres à droite */}
            <div className="flex flex-col justify-center gap-5 lg:col-span-3">
              <BarreStat
                icon={ShoppingBag}
                color={COULEURS.acheteurs}
                label="Acheteurs"
                count={stats.premium_actifs.acheteurs}
                total={totalActifs}
                revenue={stats.revenus_mois.acheteurs}
              />
              <BarreStat
                icon={Fish}
                color={COULEURS.pecheurs}
                label="Pêcheurs"
                count={stats.premium_actifs.pecheurs}
                total={totalActifs}
                revenue={stats.revenus_mois.pecheurs}
              />
              <BarreStat
                icon={Truck}
                color={COULEURS.livreurs}
                label="Livreurs"
                count={stats.premium_actifs.livreurs}
                total={totalActifs}
                revenue={stats.revenus_mois.livreurs}
              />
            </div>
          </div>

          {/* Footer info prix */}
          <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/60 px-6 py-3">
            <p className="text-[11px] text-slate-500">
              Prix unique pour tous les comptes Premium
            </p>
            <p className="text-xs font-black text-[#FF6B4A]">
              {formatPrice(stats.prix_mensuel)} / mois
            </p>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

// ═══════════════════════════════════════════════════════════
// SOUS-COMPOSANTS
// ═══════════════════════════════════════════════════════════

function KpiCard({ label, value, sub, icon: Icon, color }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div
        className="flex h-10 w-10 items-center justify-center rounded-xl"
        style={{ backgroundColor: `${color}12`, color }}
      >
        <Icon size={18} />
      </div>
      <div className="mt-5">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
          {label}
        </p>
        <p className="mt-1 truncate text-xl font-black tracking-tight text-slate-900">
          {value}
        </p>
        {sub && (
          <p className="mt-0.5 text-[11px] font-medium text-slate-500">{sub}</p>
        )}
      </div>
    </div>
  );
}

// ─── Donut SVG ───
function Donut({ data, total }) {
  const taille = 180;
  const rayon = 70;
  const epaisseur = 22;
  const circonference = 2 * Math.PI * rayon;

  // Calcul des segments
  const segments = useMemo(() => {
    if (total === 0) return [];
    let offset = 0;
    return data.map((item) => {
      const pourcentage = item.value / total;
      const longueur = circonference * pourcentage;
      const segment = {
        ...item,
        longueur,
        offset,
        pourcentage: Math.round(pourcentage * 100),
      };
      offset += longueur;
      return segment;
    });
  }, [data, total, circonference]);

  if (total === 0) {
    return (
      <div
        className="flex items-center justify-center rounded-full border-[22px] border-slate-100"
        style={{ width: taille, height: taille }}
      >
        <p className="text-center text-[11px] text-slate-400">
          Aucun
          <br />
          abonné
        </p>
      </div>
    );
  }

  return (
    <div className="relative" style={{ width: taille, height: taille }}>
      <svg
        width={taille}
        height={taille}
        viewBox={`0 0 ${taille} ${taille}`}
        className="-rotate-90"
      >
        {/* Cercle de fond */}
        <circle
          cx={taille / 2}
          cy={taille / 2}
          r={rayon}
          fill="none"
          stroke="#F1F5F9"
          strokeWidth={epaisseur}
        />

        {/* Segments */}
        {segments.map((seg) => (
          <circle
            key={seg.key}
            cx={taille / 2}
            cy={taille / 2}
            r={rayon}
            fill="none"
            stroke={COULEURS[seg.key]}
            strokeWidth={epaisseur}
            strokeDasharray={`${seg.longueur} ${circonference - seg.longueur}`}
            strokeDashoffset={-seg.offset}
            strokeLinecap="butt"
            style={{ transition: 'stroke-dasharray 0.6s ease' }}
          />
        ))}
      </svg>

      {/* Centre */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <p className="text-2xl font-black text-slate-900">{total}</p>
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Abonnés
        </p>
      </div>
    </div>
  );
}

// ─── Barre horizontale ───
function BarreStat({ icon: Icon, color, label, count, total, revenue }) {
  const pourcentage = total > 0 ? Math.round((count / total) * 100) : 0;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
            style={{ backgroundColor: `${color}12`, color }}
          >
            <Icon size={14} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-900">{label}</p>
            <p className="text-[10px] text-slate-500">
              {count} abonné{count > 1 ? 's' : ''} · {pourcentage} %
            </p>
          </div>
        </div>
        <p className="shrink-0 text-sm font-black text-slate-900">
          {formatPrice(revenue)}
        </p>
      </div>

      {/* Barre */}
      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${pourcentage}%`,
            backgroundColor: color,
          }}
        />
      </div>
    </div>
  );
}