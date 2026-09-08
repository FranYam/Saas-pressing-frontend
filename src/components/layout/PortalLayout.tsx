import { useState, type ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { ArrowLeft, LogOut, Menu, X, Home } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Logo } from './Logo';

export interface PortalNavLink {
  to: string;
  label: string;
  icon: LucideIcon;
}

interface PortalLayoutProps {
  /** Titre affiché dans l'en-tête mobile */
  title: string;
  /** Liens de navigation du portail (dépend du rôle) */
  nav: PortalNavLink[];
  children: ReactNode;
  /** Affiche le bouton retour mobile (défaut : true) */
  showBack?: boolean;
  /** Identité affichée en mode public (ex. Espace client) ; sinon utilisateur connecté */
  identity?: { name: string; sub: string };
  /** Action de sortie en mode public ; sinon déconnexion classique */
  onExit?: () => void;
  exitLabel?: string;
}

/**
 * Layout portail responsive pour les vues Client et Coursier :
 * - Mobile : flèche retour + titre + menu hamburger
 * - Desktop (≥ md) : barre de navigation avec logo, liens et utilisateur
 */
export function PortalLayout({ title, nav, children, showBack = true, identity, onExit, exitLabel = 'Déconnexion' }: PortalLayoutProps) {
  const navigate = useNavigate();
  const { user, logout: authLogout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const displayName = identity?.name ?? user?.fullName ?? '';
  const displaySub = identity?.sub ?? user?.email ?? '';
  const handleExit = onExit ?? authLogout;

  const navLinks = (onClickItem?: () => void) => (
    <>
      {nav.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          onClick={onClickItem}
          className={({ isActive }) =>
            `flex items-center gap-2.5 rounded-lg px-3.5 py-2.5 text-sm font-medium transition-colors ${
              isActive ? 'bg-primary text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100 hover:text-charcoal'
            }`
          }
        >
          <Icon size={17} aria-hidden="true" />
          {label}
        </NavLink>
      ))}
    </>
  );

  return (
    <div className="min-h-screen bg-sand">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        {/* ── Barre desktop ── */}
        <div className="mx-auto hidden h-16 max-w-6xl items-center gap-4 px-6 md:flex">
          <NavLink to="/" aria-label="PressNet — accueil">
            <Logo variant="dark" size="sm" />
          </NavLink>
          <nav className="ml-8 flex items-center gap-1" aria-label="Navigation du portail">
            {navLinks()}
          </nav>
          <div className="ml-auto flex items-center gap-3">
            <div className="text-right leading-tight">
              <p className="text-sm font-semibold text-charcoal">{displayName}</p>
              <p className="text-xs text-slate-500">{displaySub}</p>
            </div>
            <button
              type="button"
              onClick={handleExit}
              className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-500"
              aria-label="Se déconnecter"
            >
              <LogOut size={14} aria-hidden="true" />
              {exitLabel}
            </button>
          </div>
        </div>

        {/* ── Barre mobile ── */}
        <div className="mx-auto flex h-14 max-w-lg items-center gap-2 px-4 md:hidden">
          {showBack ? (
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="-ml-2 rounded-full p-2 text-charcoal transition-colors hover:bg-slate-100"
              aria-label="Retour"
            >
              <ArrowLeft size={20} />
            </button>
          ) : (
            <NavLink to="/" aria-label="PressNet — accueil">
              <Logo size="sm" showTagline={false} />
            </NavLink>
          )}
          <h1 className="flex-1 truncate text-center text-base font-semibold text-charcoal">{title}</h1>
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            className="-mr-2 rounded-full p-2 text-charcoal transition-colors hover:bg-slate-100"
            aria-label="Menu"
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* ── Menu hamburger mobile ── */}
        {menuOpen && (
          <div className="border-t border-slate-100 bg-white px-4 py-3 md:hidden">
            <div className="mx-auto max-w-lg space-y-1">
              <div className="border-b border-slate-100 px-2 pb-3">
                <p className="text-sm font-semibold text-charcoal">{displayName}</p>
                <p className="text-xs text-slate-500">{displaySub}</p>
              </div>
              {navLinks(() => setMenuOpen(false))}
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  navigate('/');
                }}
                className="flex w-full items-center gap-2.5 rounded-lg px-3.5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                <Home size={17} aria-hidden="true" />
                Accueil
              </button>
              <button
                type="button"
                onClick={handleExit}
                className="flex w-full items-center gap-2.5 rounded-lg px-3.5 py-2.5 text-sm font-medium text-red-500 hover:bg-red-50"
              >
                <LogOut size={17} aria-hidden="true" />
                {exitLabel}
              </button>
            </div>
          </div>
        )}
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 pt-5 pb-24 md:px-6 md:pt-8 md:pb-12">{children}</main>
    </div>
  );
}

/** Titre de section dans les pages portail */
export function PortalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mb-5">
      <h2 className="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">{title}</h2>
      {children}
    </section>
  );
}
