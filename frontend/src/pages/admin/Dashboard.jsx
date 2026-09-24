import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp, Users, ShoppingBag, Fish, Truck, AlertTriangle,
  Crown, Wallet, ArrowRight, Star,
} from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import { AdminService } from '../../services/adminService';

const formatPrice = (p) =>
  `${new Intl.NumberFormat('fr-FR').format(Number(p) || 0)} FCFA`;

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [aRevoquer, setARevoquer] = useState([]);
  const [signalements, setSignalements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [statsData, revoquerData, signalementsData] = await Promise.all([
          AdminService.getStats(),
          AdminService.getUtilisateursARevoquer(),
          AdminService.getSignalements(),
        ]);
        setStats(statsData);
        setARevoquer(revoquerData);
        setSignalements(signalementsData.slice(0, 5));
      } catch (err) {
        console.error('Erreur chargement admin:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <AdminLayout title="Tableau de bord">
        <div className="flex h-96 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#FF6B4A] border-t-transparent" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title="Tableau de bord"
      subtitle="Vue d'ensemble de la plateforme"
    >

      {/* ═══════════ SECTION 1 — KPI PRINCIPAUX (4 cartes) ═══════════ */}
      <Section title="Vue d'ensemble">
        <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
          <KpiCard
            label="Chiffre d'affaires"
            value={formatPrice(stats.chiffre_affaires)}
            sub="Total livré"
            icon={TrendingUp}
            color="#FF6B4A"
          />
          <KpiCard
            label="Commandes"
            value={stats.total_commandes}
            sub={`${stats.commandes_mois} ce mois`}
            icon={ShoppingBag}
            color="#0C3B4A"
          />
          <KpiCard
            label="Utilisateurs"
            value={stats.total_utilisateurs}
            sub="Comptes actifs"
            icon={Users}
            color="#0A8A5F"
          />
          <KpiCard
            label="Premium"
            value={stats.premium_actifs}
            sub={`${stats.premium_en_attente} en attente`}
            icon={Crown}
            color="#F59E0B"
          />
        </div>
      </Section>

      {/* ═══════════ SECTION 2 — SIGNALEMENTS (mise en avant) ═══════════ */}
      {aRevoquer.length > 0 && (
        <Section
          title="Signalements à traiter"
          subtitle={`${aRevoquer.length} utilisateur${aRevoquer.length > 1 ? 's' : ''} avec 2+ signalements`}
          action={{
            label: 'Tout voir',
            onClick: () => navigate('/admin/signalements'),
          }}
          highlight
        >
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* Utilisateurs à révoquer */}
            <div className="overflow-hidden rounded-2xl border border-rose-200/50 bg-white/80 backdrop-blur-md shadow-sm">
              <div className="flex items-center gap-2 border-b border-rose-100 bg-rose-50/70 px-5 py-3 backdrop-blur-sm">
                <AlertTriangle size={14} className="text-rose-600" />
                <p className="text-[11px] font-black uppercase tracking-wider text-rose-700">
                  Badges à révoquer
                </p>
              </div>
              <div className="divide-y divide-rose-50/60">
                {aRevoquer.slice(0, 3).map((user) => (
                  <button
                    key={user.id}
                    onClick={() => navigate('/admin/signalements')}
                    className="flex w-full items-center gap-3 px-5 py-3 text-left transition hover:bg-rose-50/40"
                  >
                    <div
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white shadow-sm"
                      style={{
                        backgroundColor: user.role === 'pecheur' ? '#0C3B4A' : '#7C3AED',
                      }}
                    >
                      {user.prenom?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-bold text-slate-900">
                        {user.prenom} {user.nom}
                      </p>
                      <p className="truncate text-[10px] text-slate-500">
                        {user.role === 'pecheur' ? '🎣 Pêcheur' : '🛵 Livreur'} · {user.telephone}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-rose-100 px-2.5 py-1 text-[10px] font-black text-rose-700 shadow-2xs">
                      {user.signalements} ⚠
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Derniers signalements */}
            <div className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white/80 backdrop-blur-md shadow-sm">
              <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50/50 px-5 py-3 backdrop-blur-sm">
                <Star size={14} className="text-amber-500" />
                <p className="text-[11px] font-black uppercase tracking-wider text-slate-700">
                  Derniers avis négatifs
                </p>
              </div>
              <div className="divide-y divide-slate-50/60">
                {signalements.slice(0, 3).map((s) => (
                  <div
                    key={s.id}
                    className="flex items-start gap-3 px-5 py-3"
                  >
                    <div className="flex shrink-0 items-center gap-0.5 pt-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span
                          key={i}
                          className={`text-[10px] ${
                            i < s.etoile ? 'text-amber-500' : 'text-slate-200'
                          }`}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-bold text-slate-900">
                        {s.cible_detail?.nom || 'Inconnu'}
                      </p>
                      <p className="line-clamp-1 text-[10px] italic text-slate-500">
                        « {s.commentaire || 'Aucun commentaire'} »
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Section>
      )}

      {/* ═══════════ SECTION 3 — VALIDATIONS EN ATTENTE ═══════════ */}
      {(stats.pecheurs_en_attente > 0 || stats.livreurs_en_attente > 0) && (
        <Section
          title="Validations en attente"
          subtitle="Documents à vérifier"
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {stats.pecheurs_en_attente > 0 && (
              <ValidationCard
                icon={Fish}
                color="#0C3B4A"
                label="Pêcheurs"
                count={stats.pecheurs_en_attente}
                onClick={() => navigate('/admin/pecheurs')}
              />
            )}
            {stats.livreurs_en_attente > 0 && (
              <ValidationCard
                icon={Truck}
                color="#7C3AED"
                label="Livreurs"
                count={stats.livreurs_en_attente}
                onClick={() => navigate('/admin/livreurs')}
              />
            )}
          </div>
        </Section>
      )}

      {/* ═══════════ SECTION 4 — RÉPARTITION + MONÉTISATION ═══════════ */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">

        <div className="lg:col-span-3">
          <Section title="Utilisateurs">
            <div className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white/80 backdrop-blur-md shadow-sm">
              <RoleRow
                icon={Fish}
                color="#0C3B4A"
                label="Pêcheurs"
                value={stats.total_pecheurs}
                onClick={() => navigate('/admin/pecheurs')}
              />
              <RoleRow
                icon={Users}
                color="#0A8A5F"
                label="Acheteurs"
                value={stats.total_acheteurs}
                onClick={() => navigate('/admin/acheteurs')}
              />
              <RoleRow
                icon={Truck}
                color="#7C3AED"
                label="Livreurs"
                value={stats.total_livreurs}
                onClick={() => navigate('/admin/livreurs')}
              />
            </div>
          </Section>
        </div>

        <div className="lg:col-span-2">
          <Section title="Monétisation">
            <div className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white/80 backdrop-blur-md shadow-sm">
              <MoneyRow
                icon={Wallet}
                color="#FF6B4A"
                label="Acheteurs Premium"
                value={stats.abonnements_acheteur}
              />
              <MoneyRow
                icon={Fish}
                color="#0C3B4A"
                label="Badges pêcheur"
                value={stats.badges_pecheur}
              />
              <MoneyRow
                icon={Truck}
                color="#7C3AED"
                label="Badges livreur"
                value={stats.badges_livreur}
              />
            </div>
          </Section>
        </div>
      </div>

      <div className="h-12" />
    </AdminLayout>
  );
}

// ═══════════════════════════════════════════════════════════
// SOUS-COMPOSANTS (Avec Glassmorphism intégré)
// ═══════════════════════════════════════════════════════════

function Section({ title, subtitle, action, children, highlight }) {
  return (
    <section className="mb-8">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <h2 className={`text-base font-black tracking-tight ${
            highlight ? 'text-rose-700' : 'text-slate-900'
          }`}>
            {title}
          </h2>
          {subtitle && (
            <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>
          )}
        </div>
        {action && (
          <button
            onClick={action.onClick}
            className="flex shrink-0 items-center gap-1 rounded-lg px-3 py-1.5 text-[11px] font-bold text-slate-600 transition hover:bg-white/60 backdrop-blur-xs"
          >
            {action.label}
            <ArrowRight size={12} />
          </button>
        )}
      </div>
      {children}
    </section>
  );
}

function KpiCard({ label, value, sub, icon: Icon, color }) {
  return (
    <div className="rounded-2xl border border-slate-200/60 bg-white/80 backdrop-blur-md p-5 shadow-sm transition hover:shadow-md hover:bg-white/90">
      <div
        className="flex h-10 w-10 items-center justify-center rounded-xl shadow-2xs"
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

function ValidationCard({ icon: Icon, color, label, count, onClick }) {
  return (
    <button
      onClick={onClick}
      className="group flex items-center gap-4 rounded-2xl border border-slate-200/60 bg-white/80 backdrop-blur-md p-5 text-left shadow-sm transition hover:border-slate-300 hover:shadow-md hover:bg-white/90"
    >
      <div
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl shadow-2xs"
        style={{ backgroundColor: `${color}12`, color }}
      >
        <Icon size={20} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
          {label}
        </p>
        <p className="mt-0.5 text-2xl font-black leading-none text-slate-900">
          {count}
        </p>
        <p className="mt-1 text-[11px] font-medium text-amber-600">
          Documents à valider
        </p>
      </div>
      <ArrowRight
        size={16}
        className="shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-slate-500"
      />
    </button>
  );
}

function RoleRow({ icon: Icon, color, label, value, onClick }) {
  return (
    <button
      onClick={onClick}
      className="group flex w-full items-center gap-4 border-b border-slate-100/80 px-5 py-4 text-left transition last:border-b-0 hover:bg-white/50"
    >
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-2xs"
        style={{ backgroundColor: `${color}12`, color }}
      >
        <Icon size={17} />
      </div>
      <p className="min-w-0 flex-1 truncate text-sm font-bold text-slate-800">
        {label}
      </p>
      <p className="text-lg font-black text-slate-900">{value}</p>
      <ArrowRight
        size={14}
        className="shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-slate-500"
      />
    </button>
  );
}

function MoneyRow({ icon: Icon, color, label, value }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100/80 px-5 py-4 last:border-b-0">
      <div className="flex items-center gap-3">
        <div
          className="flex h-9 w-9 items-center justify-center rounded-xl shadow-2xs"
          style={{ backgroundColor: `${color}12`, color }}
        >
          <Icon size={15} />
        </div>
        <p className="text-xs font-bold text-slate-700">{label}</p>
      </div>
      <p className="text-lg font-black text-slate-900">{value}</p>
    </div>
  );
}