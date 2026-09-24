import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, Fish, ShoppingBag, Truck, TrendingUp,
  Bell, LogOut, Menu, Search, ChevronDown, Shield, AlertTriangle,
  BarChart3, Crown,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
  {
    section: 'Vue d\'ensemble',
    items: [
      { id: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard, path: '/admin/dashboard' },
      { id: 'statistiques', label: 'Statistiques', icon: BarChart3, path: '/admin/statistiques' },
    ],
  },
  {
    section: 'Utilisateurs',
    items: [
      { id: 'pecheurs', label: 'Pêcheurs', icon: Fish, path: '/admin/pecheurs' },
      { id: 'acheteurs', label: 'Acheteurs', icon: Users, path: '/admin/acheteurs' },
      { id: 'livreurs', label: 'Livreurs', icon: Truck, path: '/admin/livreurs' },
    ],
  },
  {
    section: 'Modération',
    items: [
      {
        id: 'signalements',
        label: 'Signalements',
        icon: AlertTriangle,
        path: '/admin/signalements',
        badgeKey: 'signalements',
      },
    ],
  },
  {
    section: 'Monétisation',
    items: [
      { id: 'premium', label: 'Abonnements Premium', icon: Crown, path: '/admin/premium' },
    ],
  },
];

export default function AdminLayout({
  children,
  title = 'Tableau de bord',
  subtitle = '',
  badges = {},
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { utilisateur } = useAuth();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (path) =>
    location.pathname === path || location.pathname.startsWith(`${path}/`);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('access_token');
    localStorage.removeItem('utilisateur');
    window.location.href = '/admin/connexion';
  };

  // ═══════════════════════════════════════════════════════════
  // INFOS UTILISATEUR CONNECTÉ (avec fallbacks intelligents)
  // ═══════════════════════════════════════════════════════════
  const initiale = (
    utilisateur?.prenom?.charAt(0) ||
    utilisateur?.email?.charAt(0) ||
    'A'
  ).toUpperCase();

  const nomComplet =
    [utilisateur?.prenom, utilisateur?.nom].filter(Boolean).join(' ') ||
    utilisateur?.email ||
    'Administrateur';

  const sousTitre =
    utilisateur?.is_superuser
      ? 'Super admin'
      : utilisateur?.is_staff
      ? 'Administrateur'
      : 'Admin';

  const email = utilisateur?.email || utilisateur?.telephone || '—';

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#FAF6F0] font-sans antialiased">

      {/* ═══════════ SIDEBAR ═══════════ */}
      <aside
        className={`relative z-30 flex shrink-0 flex-col bg-[#0F172A] transition-all duration-300 ${
          collapsed ? 'w-[76px]' : 'w-[260px]'
        } ${mobileOpen ? 'fixed inset-y-0 left-0 w-[260px]' : 'hidden lg:flex'}`}
      >
        {/* Logo */}
        <div className="flex h-[76px] shrink-0 items-center gap-3 border-b border-white/5 px-5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FF6B4A] shadow-lg shadow-orange-500/20">
            <span className="text-base font-black text-white">L</span>
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <h1 className="truncate text-sm font-black tracking-tight text-white">
                Lebougui
              </h1>
              <p className="truncate text-[10px] font-semibold tracking-widest text-slate-500">
                ADMINISTRATION
              </p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="no-scrollbar flex-1 overflow-y-auto px-3 py-4">
          {NAV_ITEMS.map((group) => (
            <div key={group.section} className="mb-6">
              {!collapsed && (
                <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-widest text-slate-500/80">
                  {group.section}
                </p>
              )}
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.path);
                  const badgeCount = item.badgeKey ? badges[item.badgeKey] : 0;

                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        navigate(item.path);
                        setMobileOpen(false);
                      }}
                      title={collapsed ? item.label : undefined}
                      className={`group relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                        active
                          ? 'bg-white/[0.06] text-white'
                          : 'text-slate-400 hover:bg-white/[0.03] hover:text-white'
                      }`}
                    >
                      {active && (
                        <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-[#FF6B4A]" />
                      )}
                      <Icon size={17} className={active ? 'text-[#FF6B4A]' : ''} />
                      {!collapsed && (
                        <span className="flex-1 truncate text-left">{item.label}</span>
                      )}

                      {badgeCount > 0 && !collapsed && (
                        <span
                          className={`flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-black ${
                            item.badgeKey === 'signalements'
                              ? 'bg-rose-500/20 text-rose-300'
                              : 'bg-white/10 text-slate-300'
                          }`}
                        >
                          {badgeCount}
                        </span>
                      )}

                      {badgeCount > 0 && collapsed && (
                        <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-rose-500" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Bas de sidebar — profil admin */}
        <div className="shrink-0 border-t border-white/5 p-3">
          <div
            className={`flex items-center gap-3 rounded-xl bg-white/[0.03] p-3 ${
              collapsed ? 'justify-center' : ''
            }`}
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-700 text-xs font-bold text-white">
              {initiale}
            </div>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold text-white">{nomComplet}</p>
                <p className="truncate text-[10px] text-slate-500">{email}</p>
              </div>
            )}
            {!collapsed && (
              <button
                onClick={handleLogout}
                title="Déconnexion"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-white/10 hover:text-white"
              >
                <LogOut size={14} />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Overlay mobile */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ═══════════ ZONE PRINCIPALE ═══════════ */}
      <div className="flex min-w-0 flex-1 flex-col">

        {/* TOPBAR */}
        <header className="flex h-[76px] shrink-0 items-center justify-between gap-4 border-b border-slate-200/70 bg-white/70 px-6 backdrop-blur-xl">

          {/* Gauche : toggle + titre */}
          <div className="flex min-w-0 items-center gap-4">
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="hidden h-10 w-10 items-center justify-center rounded-xl text-slate-600 transition hover:bg-slate-100 lg:flex"
              aria-label="Réduire la sidebar"
            >
              <Menu size={20} />
            </button>
            <button
              onClick={() => setMobileOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-600 transition hover:bg-slate-100 lg:hidden"
              aria-label="Menu"
            >
              <Menu size={20} />
            </button>

            <div className="min-w-0">
              <h1 className="truncate text-lg font-black tracking-tight text-slate-900">
                {title}
              </h1>
              {subtitle && (
                <p className="truncate text-xs text-slate-500">{subtitle}</p>
              )}
            </div>
          </div>

          {/* Droite : recherche + notifs + profil */}
          <div className="flex shrink-0 items-center gap-2">

            {/* Recherche */}
            <div className="relative hidden md:block">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                placeholder="Rechercher…"
                className="w-56 rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-xs text-slate-800 outline-none transition focus:border-[#FF6B4A] focus:bg-white"
              />
            </div>

            {/* Notifications */}
            <button
              className="relative flex h-10 w-10 items-center justify-center rounded-xl text-slate-600 transition hover:bg-slate-100"
              aria-label="Notifications"
            >
              <Bell size={18} />
              <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-[#FF6B4A] ring-2 ring-white" />
            </button>

            {/* Profil */}
            <button className="flex items-center gap-2 rounded-xl px-2 py-1.5 transition hover:bg-slate-100">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0C3B4A] text-xs font-bold text-white">
                {initiale}
              </div>
              <div className="hidden text-left lg:block">
                <p className="truncate text-xs font-bold leading-tight text-slate-900">
                  {nomComplet}
                </p>
                <p className="truncate text-[10px] leading-tight text-slate-500">
                  {sousTitre}
                </p>
              </div>
              <ChevronDown size={14} className="hidden text-slate-400 lg:block" />
            </button>
          </div>
        </header>

        {/* CONTENU */}
        <main className="no-scrollbar flex-1 overflow-y-auto px-6 py-6">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}