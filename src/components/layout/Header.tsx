import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, Bell, CheckCheck, Download, Search, WifiOff, Package, CreditCard, Truck, Settings } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useAppStore } from '@/store/useAppStore';
import { Avatar } from '@/components/ui/Avatar';
import { IconBadge } from '@/components/ui/IconBadge';
import { ROLE_LABELS, formatRelative } from '@/lib/format';
import { useOnlineStatus, usePwaInstall } from '@/lib/pwa';
import { useClickOutside } from '@/lib/hooks';

const NOTIF_META = {
  commande: { icon: Package, accent: 'blue' as const },
  paiement: { icon: CreditCard, accent: 'green' as const },
  livraison: { icon: Truck, accent: 'blue' as const },
  systeme: { icon: Settings, accent: 'slate' as const },
};

interface HeaderProps {
  onOpenMobileMenu: () => void;
}

export function Header({ onOpenMobileMenu }: HeaderProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const online = useOnlineStatus();
  const { canInstall, promptInstall } = usePwaInstall();

  const notifications = useAppStore((s) => s.notifications);
  const markRead = useAppStore((s) => s.markNotificationRead);
  const markAllRead = useAppStore((s) => s.markAllNotificationsRead);

  const [openNotif, setOpenNotif] = useState(false);
  const [query, setQuery] = useState('');
  const notifRef = useRef<HTMLDivElement>(null);

  useClickOutside(notifRef, () => setOpenNotif(false));

  const unread = notifications.filter((n) => !n.read).length;
  const [firstName, ...rest] = (user?.fullName ?? '').split(' ');

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) navigate(`/orders?q=${encodeURIComponent(query.trim())}`);
  };

  return (
    <header className="sticky top-0 z-30 flex h-[64px] items-center gap-3 border-b border-slate-200/80 bg-white/95 px-4 shadow-sm backdrop-blur-md sm:gap-4 sm:px-6">
      {/* Hamburger mobile */}
      <button
        type="button"
        className="rounded-lg p-2 text-slate-500 hover:bg-primary-50 hover:text-primary md:hidden"
        onClick={onOpenMobileMenu}
        aria-label="Ouvrir le menu"
      >
        <Menu size={20} />
      </button>

      {/* Barre de recherche */}
      <form onSubmit={onSearch} className="relative hidden max-w-xs flex-1 md:block" role="search">
        <Search size={15} className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-slate-400" aria-hidden="true" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="input-base !border-transparent !bg-slate-100/80 pl-9 text-sm focus:!bg-white focus:!border-primary-200"
          placeholder="Rechercher un ticket ou un client…"
          aria-label="Rechercher"
        />
      </form>

      {/* Statut hors-ligne */}
      {!online && (
        <span className="hidden items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700 sm:flex">
          <WifiOff size={12} aria-hidden="true" />
          Hors ligne
        </span>
      )}

      <div className="ml-auto flex items-center gap-1.5">
        {/* Bouton installation PWA */}
        {canInstall && (
          <button
            type="button"
            onClick={promptInstall}
            className="btn-secondary hidden !py-1.5 !px-3 !text-xs sm:inline-flex"
            title="Installer PressNet"
          >
            <Download size={14} aria-hidden="true" />
            Installer
          </button>
        )}

        {/* Cloche notifications */}
        <div className="relative" ref={notifRef}>
          <button
            type="button"
            onClick={() => setOpenNotif((o) => !o)}
            className={`relative rounded-lg p-2 transition-colors ${openNotif ? 'bg-primary-50 text-primary' : 'text-slate-500 hover:bg-primary-50 hover:text-primary'
              }`}
            aria-label={`Notifications${unread > 0 ? ` (${unread} non lues)` : ''}`}
            aria-expanded={openNotif}
          >
            <Bell size={18} />
            {unread > 0 && (
              <span className="absolute top-1 right-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </button>

          {openNotif && (
            <div className="animate-slide-up absolute right-0 mt-2 w-80 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                <p className="text-sm font-semibold text-navy">Notifications</p>
                {unread > 0 && (
                  <button
                    type="button"
                    onClick={markAllRead}
                    className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                  >
                    <CheckCheck size={13} aria-hidden="true" />
                    Tout lire
                  </button>
                )}
              </div>
              <ul className="max-h-80 divide-y divide-slate-50 overflow-y-auto scrollbar-thin">
                {notifications.length === 0 && (
                  <li className="px-4 py-8 text-center text-sm text-slate-400">Aucune notification</li>
                )}
                {notifications.map((n) => {
                  const meta = NOTIF_META[n.type];
                  return (
                    <li key={n.id}>
                      <button
                        type="button"
                        onClick={() => markRead(n.id)}
                        className={`flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50 ${!n.read ? 'bg-primary-50/40' : ''}`}
                      >
                        <IconBadge icon={meta.icon} accent={meta.accent} size="sm" />
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-medium text-navy">{n.title}</span>
                          <span className="mt-0.5 block text-xs leading-relaxed text-slate-500">{n.message}</span>
                          <span className="mt-1 block text-[11px] text-slate-400">{formatRelative(n.date)}</span>
                        </span>
                        {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" aria-label="Non lue" />}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>

        {/* Profil utilisateur */}
        <Link
          to="/settings"
          className="flex items-center gap-2.5 rounded-lg py-1.5 pl-1.5 pr-3 transition-colors hover:bg-primary-50"
          title="Paramètres"
        >
          <Avatar firstName={firstName} lastName={rest.join(' ')} size={34} className="ring-2 ring-primary-100" />
          <span className="hidden text-left leading-tight lg:block">
            <span className="block text-sm font-semibold text-navy">{user?.fullName}</span>
            <span className="block text-xs text-slate-500">{user ? ROLE_LABELS[user.role] : ''}</span>
          </span>
        </Link>
      </div>
    </header>
  );
}
