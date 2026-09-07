import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, Download, Menu, Search, ShoppingBasket, CreditCard, Bike, Settings2, CheckCheck } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useAppStore } from '@/store/useAppStore';
import { usePwaInstall } from '@/lib/pwa';
import { Avatar } from '@/components/ui/Avatar';
import { IconBadge, type Accent } from '@/components/ui/IconBadge';
import { ROLE_LABELS, formatRelative } from '@/lib/format';
import type { Notification } from '@/types';

interface HeaderProps {
  onOpenMobileMenu: () => void;
}

const NOTIF_META: Record<Notification['type'], { icon: LucideIcon; accent: Accent; label: string }> = {
  commande: { icon: ShoppingBasket, accent: 'primary', label: 'Commande' },
  paiement: { icon: CreditCard, accent: 'green', label: 'Paiement' },
  livraison: { icon: Bike, accent: 'blue', label: 'Livraison' },
  systeme: { icon: Settings2, accent: 'slate', label: 'Système' }
};

export function Header({ onOpenMobileMenu }: HeaderProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const notifications = useAppStore((s) => s.notifications);
  const markRead = useAppStore((s) => s.markNotificationRead);
  const markAllRead = useAppStore((s) => s.markAllNotificationsRead);
  const { canInstall, promptInstall } = usePwaInstall();

  const [openNotif, setOpenNotif] = useState(false);
  const [query, setQuery] = useState('');
  const notifRef = useRef<HTMLDivElement>(null);

  const unread = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setOpenNotif(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) navigate(`/orders?q=${encodeURIComponent(query.trim())}`);
  };

  if (!user) return null;
  const [firstName, ...rest] = user.fullName.split(' ');

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
        <button
          type="button"
          className="rounded-lg p-2 text-charcoal hover:bg-slate-100"
          onClick={onOpenMobileMenu}
          aria-label="Ouvrir le menu"
        >
          <Menu size={20} />
        </button>

        {/* Recherche (desktop) */}
        <form onSubmit={onSearch} className="relative hidden max-w-md flex-1 md:block" role="search">
          <Search size={16} className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="input-base !border-transparent !bg-slate-100 pl-10 focus:!bg-white"
            placeholder="Rechercher un ticket ou un client…"
            aria-label="Rechercher un ticket ou un client"
          />
        </form>

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          {canInstall && (
            <button type="button" onClick={promptInstall} className="btn-secondary hidden !py-2 sm:inline-flex" title="Installer PressNet sur votre appareil">
              <Download size={15} aria-hidden="true" />
              Installer
            </button>
          )}

          {/* Notifications */}
          <div className="relative" ref={notifRef}>
            <button
              type="button"
              onClick={() => setOpenNotif((o) => !o)}
              className={`relative rounded-lg p-2 transition-colors hover:bg-slate-100 ${openNotif ? 'bg-slate-100 text-charcoal' : 'text-slate-600'}`}
              aria-label={`Notifications (${unread} non lues)`}
              aria-expanded={openNotif}
            >
              <Bell size={19} />
              {unread > 0 && (
                <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white">
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </button>

            {openNotif && (
              <div className="animate-slide-up absolute right-0 mt-2 w-80 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                  <p className="text-sm font-semibold">Notifications</p>
                  {unread > 0 && (
                    <button type="button" onClick={markAllRead} className="flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                      <CheckCheck size={13} aria-hidden="true" />
                      Tout marquer comme lu
                    </button>
                  )}
                </div>
                <ul className="max-h-80 divide-y divide-slate-50 overflow-y-auto scrollbar-thin">
                  {notifications.length === 0 && <li className="px-4 py-6 text-center text-sm text-slate-400">Aucune notification</li>}
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
                            <span className="block text-sm font-medium text-charcoal">{n.title}</span>
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

          {/* Utilisateur */}
          <Link to="/settings" className="flex items-center gap-2.5 rounded-lg py-1.5 pr-2 pl-1.5 transition-colors hover:bg-slate-100" title="Mes paramètres">
            <Avatar firstName={firstName} lastName={rest.join(' ')} size={36} className="ring-2 ring-slate-100" />
            <span className="hidden text-left leading-tight lg:block">
              <span className="block text-sm font-semibold text-charcoal">{user.fullName}</span>
              <span className="block text-xs text-slate-500">{ROLE_LABELS[user.role]}</span>
            </span>
          </Link>
        </div>
      </div>
    </header>
  );
}
