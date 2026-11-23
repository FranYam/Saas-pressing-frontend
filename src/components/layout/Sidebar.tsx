import { NavLink, Link } from 'react-router-dom';
import {
  LayoutDashboard, ShoppingCart, Users, CreditCard,
  Truck, UsersRound, Settings, LogOut, X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import type { Role } from '@/types';
import { Avatar } from '@/components/ui/Avatar';
import { ROLE_LABELS } from '@/lib/format';

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  roles: Role[];
}

const NAV_GROUPS: { label: string; items: NavItem[] }[] = [
  {
    label: 'Opérations',
    items: [
      { to: '/dashboard', label: 'Tableau de bord', icon: LayoutDashboard, roles: ['gerant', 'employe'] },
      { to: '/orders',    label: 'Commandes',        icon: ShoppingCart,    roles: ['gerant', 'employe'] },
      { to: '/clients',   label: 'Clients',           icon: Users,           roles: ['gerant', 'employe'] },
    ],
  },
  {
    label: 'Administration',
    items: [
      { to: '/payments',   label: 'Paiements',  icon: CreditCard,  roles: ['gerant'] },
      { to: '/deliveries', label: 'Livraisons', icon: Truck,       roles: ['gerant'] },
      { to: '/team',       label: 'Équipe',     icon: UsersRound,  roles: ['gerant'] },
      { to: '/settings',   label: 'Paramètres', icon: Settings,    roles: ['gerant'] },
    ],
  },
];

interface SidebarProps {
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export function Sidebar({ mobileOpen, onCloseMobile }: SidebarProps) {
  const { user, logout } = useAuth();
  if (!user) return null;

  const groups = NAV_GROUPS
    .map((g) => ({ ...g, items: g.items.filter((i) => i.roles.includes(user.role)) }))
    .filter((g) => g.items.length > 0);

  const [firstName, ...rest] = user.fullName.split(' ');

  return (
    <>
      {/* Overlay mobile */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-navy-deep/70 backdrop-blur-sm md:hidden"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-navy-gradient shadow-nav
          transition-transform duration-200 ease-out
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0 md:w-[72px] lg:w-64`}
        aria-label="Navigation principale"
      >
        {/* Logo */}
        <div className="flex h-[64px] shrink-0 items-center justify-between border-b border-white/10 px-4 lg:px-5">
          <Link to="/dashboard" className="flex items-center gap-2.5" aria-label="PressNet — Tableau de bord">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 md:mx-auto lg:mx-0">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M3 6h18M3 12h18M3 18h12" stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
              </svg>
            </span>
            <span className="hidden text-base font-bold tracking-tight text-white lg:block">
              Press<span className="text-primary-300">Net</span>
            </span>
          </Link>

          <button
            type="button"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white md:hidden"
            onClick={onCloseMobile}
            aria-label="Fermer le menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-2.5 py-4 scrollbar-thin" aria-label="Sections">
          {groups.map((group) => (
            <div key={group.label} className="mb-6">
              <p className="section-label mb-2 hidden px-2 lg:block">{group.label}</p>
              <ul className="space-y-0.5">
                {group.items.map(({ to, label, icon: Icon }) => (
                  <li key={to}>
                    <NavLink
                      to={to}
                      onClick={onCloseMobile}
                      title={label}
                      className={({ isActive }) =>
                        `group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium
                         transition-colors duration-150 md:justify-center lg:justify-start
                         ${isActive
                           ? 'bg-white/15 text-white shadow-sm'
                           : 'text-slate-300 hover:bg-white/10 hover:text-white'
                         }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <span className={`shrink-0 transition-colors ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`}>
                            <Icon size={18} aria-hidden="true" />
                          </span>
                          <span className="hidden truncate lg:block">{label}</span>
                          <span className="pointer-events-none absolute left-[76px] z-50 hidden whitespace-nowrap rounded-md bg-navy-deep px-2.5 py-1.5 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 md:block lg:hidden">
                            {label}
                          </span>
                        </>
                      )}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        {/* Pied de sidebar — utilisateur + déconnexion */}
        <div className="shrink-0 border-t border-white/10 p-3">
          <div className="flex items-center gap-3 rounded-lg p-2 md:justify-center lg:justify-start">
            <Avatar firstName={firstName} lastName={rest.join(' ')} size={34} className="shrink-0 ring-2 ring-white/20" />
            <div className="hidden min-w-0 flex-1 leading-tight lg:block">
              <p className="truncate text-sm font-semibold text-white">{user.fullName}</p>
              <p className="truncate text-xs text-slate-400">{ROLE_LABELS[user.role]}</p>
            </div>
            <button
              type="button"
              onClick={logout}
              title="Déconnexion"
              aria-label="Se déconnecter"
              className="hidden shrink-0 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-white/10 hover:text-red-300 lg:block"
            >
              <LogOut size={16} aria-hidden="true" />
            </button>
          </div>

          {/* Déconnexion mobile */}
          <button
            type="button"
            onClick={logout}
            className="mt-1.5 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-400 transition-colors hover:bg-white/10 hover:text-red-300 lg:hidden"
          >
            <LogOut size={16} aria-hidden="true" />
            <span className="hidden lg:block">Déconnexion</span>
          </button>
        </div>
      </aside>
    </>
  );
}
