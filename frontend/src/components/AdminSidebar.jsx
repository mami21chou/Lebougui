import React, { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp, Crown, Wallet, ShoppingBag, Fish, Truck,
  Users, Award, ArrowUpRight, Percent, Calendar,
} from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import { AdminService } from '../../services/adminService';

const formatPrice = (p) =>
  `${new Intl.NumberFormat('fr-FR').format(Math.round(Number(p) || 0))} FCFA`;

export default function Statistiques() {
  const [stats, setStats] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [periode, setPeriode] = useState(30);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [fin, chart] = await Promise.all([
          AdminService.getStatsFinancieres(),
          AdminService.getStatsChart(periode),
        ]);
        setStats(fin);
        setChartData(chart);
      } catch (err) {
        console.error('Erreur chargement stats:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [periode]);

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

  return (
    <AdminLayout
      title="Statistiques"
      subtitle="Revenus et performance de la plateforme"
    >
      {/* ═══════════ 4 KPI PRINCIPAUX ═══════════ */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Revenus totaux"
          value={formatPrice(stats.total_global)}
          sub="Depuis le lancement"
          icon={TrendingUp}
          color="#FF6B4A"
        />
        <KpiCard
          label="Revenus ce mois"
          value={formatPrice(stats.total_mois)}
          sub="Toutes sources confondues"
          icon={Calendar}
          color="#0C3B4A"
        />
        <KpiCard
          label="Commissions livraison"
          value={formatPrice(stats.commissions_livraison.total)}
          sub={`${stats.commissions_livraison.nb_livraisons} livraisons`}
          icon={Wallet}
          color="#0A8A5F"
        />
        <KpiCard
          label="Premium actifs"
          value={stats.premium_actifs.total}
          sub="Comptes abonnés"
          icon={Crown}
          color="#F59E0B"
        />
      </div>

      {/* ═══════════ SECTION REVENUS DÉTAILLÉS ═══════════ */}
      <div className="mt-8">
        <SectionHeader
          title="Revenus par source"
          subtitle="Détail des revenus mensuels"
        />

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          {/* Commissions livraison */}
          <RevenueCard
            icon={Truck}
            color="#0A8A5F"
            title="Commissions livraison"
            value={stats.commissions_livraison.mois}
            total={stats.commissions_livraison.total}
            detail={`${(stats.commissions_livraison.taux * 100).toFixed(0)} % du tarif`}
            nb={stats.commissions_livraison.nb_livraisons}
            nbLabel="livraisons"
          />

          {/* Abonnements acheteur */}
          <RevenueCard
            icon={ShoppingBag}
            color="#FF6B4A"
            title="Abonnements acheteur"
            value={stats.revenus_premium_mois.abonnements}
            total={
              stats.premium_actifs.acheteurs *
              stats.prix_reference.abonnement_acheteur
            }
            detail={`${formatPrice(stats.prix_reference.abonnement_acheteur)} / mois`}
            nb={stats.premium_actifs.acheteurs}
            nbLabel="abonnés actifs"
          />

          {/* Badges professionnels */}
          <RevenueCard
            icon={Award}
            color="#7C3AED"
            title="Badges professionnels"
            value={
              stats.revenus_premium_mois.badges_pecheur +
              stats.revenus_premium_mois.badges_livreur
            }
            total={
              (stats.premium_actifs.pecheurs + stats.premium_actifs.livreurs) *
              stats.prix_reference.badge_pro
            }
            detail={`${formatPrice(stats.prix_reference.badge_pro)} / mois`}
            nb={stats.premium_actifs.pecheurs + stats.premium_actifs.livreurs}
            nbLabel="badges actifs"
          />
        </div>
      </div>

      {/* ═══════════ GRAPHIQUE ÉVOLUTION ═══════════ */}
      <div className="mt-8">
        <SectionHeader
          title="Évolution des commandes"
          subtitle={`Sur les ${periode} derniers jours`}
          action={
            <div className="flex gap-1 rounded-xl border border-slate-200 bg-white p-1">
              {[7, 30, 90].map((j) => (
                <button
                  key={j}
                  onClick={() => setPeriode(j)}
                  className={`rounded-lg px-3 py-1.5 text-[11px] font-bold transition ${
                    periode === j
                      ? 'bg-[#0C3B4A] text-white'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {j}j
                </button>
              ))}
            </div>
          }
        />

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <MiniChart data={chartData?.commandes_par_jour || []} />
        </div>
      </div>

      {/* ═══════════ RÉPARTITION PREMIUM ═══════════ */}
      <div className="mt-8">
        <SectionHeader
          title="Répartition des abonnements Premium"
          subtitle="Par type de compte"
        />

        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          <PremiumTypeCard
            icon={ShoppingBag}
            color="#FF6B4A"
            label="Acheteurs"
            count={stats.premium_actifs.acheteurs}
            total={stats.premium_actifs.total}
            revenue={stats.revenus_premium_mois.abonnements}
          />
          <PremiumTypeCard
            icon={Fish}
            color="#0C3B4A"
            label="Pêcheurs"
            count={stats.premium_actifs.pecheurs}
            total={stats.premium_actifs.total}
            revenue={stats.revenus_premium_mois.badges_pecheur}
          />
          <PremiumTypeCard
            icon={Truck}
            color="#7C3AED"
            label="Livreurs"
            count={stats.premium_actifs.livreurs}
            total={stats.premium_actifs.total}
            revenue={stats.revenus_premium_mois.badges_livreur}
          />
        </div>
      </div>

      <div className="h-12" />
    </AdminLayout>
  );
}

// ═══════════════════════════════════════════════════════════
// SOUS-COMPOSANTS
// ═══════════════════════════════════════════════════════════

function SectionHeader({ title, subtitle, action }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div>
        <h2 className="text-sm font-black tracking-tight text-slate-900">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-0.5 text-[11px] text-slate-500">{subtitle}</p>
        )}
      </div>
      {action}
    </div>
  );
}

function KpiCard({ label, value, sub, icon: Icon, color }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
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

function RevenueCard({ icon: Icon, color, title, value, total, detail, nb, nbLabel }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
        <div
          className="flex h-9 w-9 items-center justify-center rounded-lg"
          style={{ backgroundColor: `${color}12`, color }}
        >
          <Icon size={16} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-bold text-slate-900">{title}</p>
          <p className="text-[10px] font-medium text-slate-500">{detail}</p>
        </div>
      </div>

      <div className="space-y-3 p-5">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Ce mois
          </p>
          <p className="mt-0.5 text-xl font-black text-slate-900">
            {formatPrice(value)}
          </p>
        </div>

        <div className="flex items-center justify-between border-t border-slate-100 pt-3">
          <span className="text-[11px] text-slate-500">
            {nb} {nbLabel}
          </span>
          <span className="text-[11px] font-bold text-slate-400">
            Total : {formatPrice(total)}
          </span>
        </div>
      </div>
    </div>
  );
}

function PremiumTypeCard({ icon: Icon, color, label, count, total, revenue }) {
  const pourcentage = total > 0 ? Math.round((count / total) * 100) : 0;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-xl"
          style={{ backgroundColor: `${color}12`, color }}
        >
          <Icon size={18} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            {label}
          </p>
          <p className="text-lg font-black text-slate-900">{count}</p>
        </div>
        <span
          className="rounded-full px-2.5 py-1 text-[10px] font-black"
          style={{ backgroundColor: `${color}12`, color }}
        >
          {pourcentage} %
        </span>
      </div>

      <div className="mt-4 border-t border-slate-100 pt-3">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Revenus ce mois
        </p>
        <p className="mt-0.5 text-sm font-black text-slate-900">
          {formatPrice(revenue)}
        </p>
      </div>
    </div>
  );
}

// ─── Graphique simple en barres ───
function MiniChart({ data }) {
  const points = useMemo(() => {
    if (!data || data.length === 0) return [];
    return data.slice(-30);
  }, [data]);

  if (points.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-xs text-slate-400">
        Aucune donnée pour cette période.
      </div>
    );
  }

  const maxValue = Math.max(...points.map((p) => p.count || 0), 1);

  return (
    <div className="space-y-4">
      <div className="flex h-40 items-end gap-1">
        {points.map((point, i) => {
          const height = ((point.count || 0) / maxValue) * 100;
          return (
            <div
              key={i}
              className="group relative flex-1"
              style={{ minWidth: 6 }}
            >
              <div
                className="rounded-t transition-all hover:opacity-80"
                style={{
                  height: `${Math.max(height, 4)}%`,
                  backgroundColor: '#0C3B4A',
                }}
              />
              <div className="pointer-events-none absolute bottom-full left-1/2 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-slate-900 px-2 py-1 text-[10px] font-bold text-white group-hover:block">
                {point.count} · {new Date(point.jour).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'short',
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between border-t border-slate-100 pt-2">
        <p className="text-[10px] font-medium text-slate-400">
          {new Date(points[0]?.jour).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'short',
          })}
        </p>
        <p className="text-[11px] font-bold text-slate-600">
          {points.reduce((sum, p) => sum + (p.count || 0), 0)} commandes
        </p>
        <p className="text-[10px] font-medium text-slate-400">
          {new Date(points[points.length - 1]?.jour).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'short',
          })}
        </p>
      </div>
    </div>
  );
}