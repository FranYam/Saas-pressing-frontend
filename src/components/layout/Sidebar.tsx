import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingCart,
  Users,
  CreditCard,
  Truck,
  UsersRound,
  Settings,
  LogOut,
  X
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import type { Role } from '@/types';
import { Logo } from './Logo';
import { Avatar } from '@/components/ui/Avatar';
import { ROLE_LABELS } from '@/lib/format';

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  roles: Role[];
}

/** Groupes de navigation : « Pilotage » (tous) puis « Administration » (gérant) */
const NAV_GROUPS: { label: string; items: NavItem[] }[] = [
  {
    label: 'Pilotage',
    items: [
      { to: '/dashboard', label: 'Tableau de bord', icon: LayoutDashboard, roles: ['gerant', 'employe'] },
      { to: '/orders', label: 'Commandes', icon: ShoppingCart, roles: ['gerant', 'employe'] },
      { to: '/clients', label: 'Clients', icon: Users, roles: ['gerant', 'employe'] }
    ]
  },
  {
    label: 'Administration',
    items: [
      { to: '/payments', label: 'Paiements', icon: CreditCard, roles: ['gerant'] },
      { to: '/deliveries', label: 'Livraisons', icon: Truck, roles: ['gerant'] },
      { to: '/team', label: 'Équipe', icon: UsersRound, roles: ['gerant'] },
      { to: '/settings', label: 'Paramètres', icon: Settings, roles: ['gerant'] }
    ]
  }
];

interface SidebarProps {
  /** Menu mobile ouvert */
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

/**
 * Navigation principale de l'application :
 * - Mobile (< md) : menu coulissant via hamburger
 * - Tablette (md – lg) : rail d'icônes seules
 * - Desktop (≥ lg) : sidebar complète avec libellés et sections
 */
export function Sidebar({ mobileOpen, onCloseMobile }: SidebarProps) {
  const { user, logout } = useAuth();
  if (!user) return null;

  const groups = NAV_GROUPS.map((g) => ({ ...g, items: g.items.filter((item) => item.roles.includes(user.role)) })).filter(
    (g) => g.items.length > 0
  );

  const [firstName, ...rest] = user.fullName.split(' ');

  return (
    <>
      {/* Overlay mobile */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-charcoal/60 backdrop-blur-[2px] md:hidden" onClick={onCloseMobile} aria-hidden="true" />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-gradient-to-b from-charcoal to-charcoal-dark transition-transform duration-200 md:translate-x-0 ${
          mobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        } md:w-[76px] lg:w-64`}
        aria-label="Navigation principale"
      >
        <div className="flex h-[65px] items-center justify-between border-b border-white/5 px-4 lg:px-5">
          {/* Mobile : logo complet · Tablette : icône seule · Desktop : logo complet */}
          <span className="md:hidden">
            <Logo size="md" />
          </span>
          <span className="hidden md:block lg:hidden" aria-hidden="true">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary-400 to-primary-600 text-sm font-bold text-white">
              P
            </span>
          </span>
          <span className="hidden lg:block">
            <Logo size="md" />
          </span>
          <button
            type="button"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white md:hidden"
            onClick={onCloseMobile}
            aria-label="Fermer le menu"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="mt-3 flex-1 space-y-5 overflow-y-auto px-3 scrollbar-thin" aria-label="Sections">
          {groups.map((group) => (
            <div key={group.label}>
              <p className="mb-1.5 hidden px-3 text-[10px] font-semibold tracking-[0.15em] text-slate-500 uppercase lg:block">{group.label}</p>
              <ul className="space-y-1">
                {group.items.map(({ to, label, icon: Icon }) => (
                  <li key={to}>
                    <NavLink
                      to={to}
                      onClick={onCloseMobile}
                      title={label}
                      className={({ isActive }) =>
                        `group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors md:justify-center lg:justify-start ${
                          isActive ? 'bg-primary text-white shadow-sm shadow-primary/30' : 'text-slate-300 hover:bg-white/10 hover:text-white'
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <Icon size={19} className={isActive ? 'text-white' : 'text-slate-400 group-hover:text-primary-300'} aria-hidden="true" />
                          <span className="md:hidden lg:inline">{label}</span>
                        </>
                      )}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        {/* Utilisateur en bas */}
        <div className="border-t border-white/5 p-3 lg:p-4">
          <div className="flex items-center gap-3 md:flex-col lg:flex-row">
            <Avatar firstName={firstName} lastName={rest.join(' ')} size={38} className="ring-2 ring-white/10" />
            <div className="min-w-0 flex-1 md:hidden lg:block">
              <p className="truncate text-sm font-semibold text-white">{user.fullName}</p>
              <p className="truncate text-xs text-slate-400">{ROLE_LABELS[user.role]}</p>
            </div>
            <button
              type="button"
              onClick={logout}
              className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-white/10 hover:text-white md:w-full md:py-1.5 lg:w-auto"
              aria-label="Se déconnecter"
              title="Se déconnecter"
            >
              <LogOut size={17} className="mx-auto lg:mx-0" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
