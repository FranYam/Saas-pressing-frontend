import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Send,
  History,
  PackageOpen,
  Wallet,
  CheckCircle2,
  ChevronRight,
  Phone,
  Clock3,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { PortalHero } from '@/components/layout/PortalHero';
import { useClientAccess } from '@/context/ClientAccessContext';
import { useAppStore } from '@/store/useAppStore';
import { StatCard } from '@/components/ui/StatCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import type { Order, OrderStatus } from '@/types';
import { formatFCFA, formatDateShort, ORDER_STATUS_LABELS } from '@/lib/format';

export const CLIENT_NAV = [
  { to: '/client/dashboard', label: 'Mes commandes', icon: LayoutDashboard },
  { to: '/client/collect', label: 'Demande de collecte', icon: Send },
  { to: '/client/history', label: 'Historique', icon: History }
];

const FLOW: OrderStatus[] = ['recu', 'traitement', 'pret', 'livre'];

/** Bouton d'actualisation discret */
function RefreshButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="btn-ghost !px-2" title="Rafraîchir" aria-label="Rafraîchir">
      <RefreshCw size={15} aria-hidden="true" />
    </button>
  );
}

export default function ClientDashboardPage() {
  const navigate = useNavigate();
  const { data, loading, error, refresh, clear } = useClientAccess();
  const settings = useAppStore((s) => s.settings);

  const orders = useMemo(
    () => [...(data?.orders ?? [])].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [data?.orders]
  );

  const active = orders.filter((o) => o.status !== 'livre');
  const done = orders.filter((o) => o.status === 'livre');
  const balance = orders.reduce((sum, o) => sum + Math.max(0, o.total - o.paidAmount), 0);
  const recent = orders.slice(0, 4);
  const firstName = (data?.name ?? '').split(' ')[0] || 'cher client';

  const exitClientSpace = () => {
    clear();
    navigate('/client/access', { replace: true });
  };

  return (
    <PortalLayout
      title="Mes commandes"
      nav={CLIENT_NAV}
      showBack={false}
      identity={data ? { name: data.name, sub: data.phone } : undefined}
      onExit={exitClientSpace}
      exitLabel="Quitter l'espace"
    >
      {loading && !data ? (
        <div className="flex min-h-[50vh] items-center justify-center">
          <LoadingSpinner label="Chargement de vos commandes…" />
        </div>
      ) : error ? (
        <div className="card p-8 text-center">
          <EmptyState
            icon={RefreshCw}
            title="Impossible de charger vos commandes"
            message={error}
            action={
              <button type="button" className="btn-primary" onClick={() => void refresh()}>
                <RefreshCw size={16} aria-hidden="true" />
                Réessayer
              </button>
            }
          />
        </div>
      ) : (
        <>
          {/* Bandeau d'accueil */}
          <PortalHero
            icon={Sparkles}
            title={`Bonjour ${firstName}`}
            subtitle={
              active.length > 0
                ? `Vous avez ${active.length} commande${active.length > 1 ? 's' : ''} en cours${balance > 0 ? ` et un solde de ${formatFCFA(balance)} à régler.` : '.'}`
                : 'Aucune commande en cours. Envoyez votre linge, on s\'occupe du reste.'
            }
            action={
              <Link to="/client/collect" className="btn-primary shrink-0">
                <Send size={16} aria-hidden="true" />
                Demander une collecte
              </Link>
            }
          />

          {/* KPIs */}
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard icon={PackageOpen} label="Commandes en cours" value={String(active.length)} accent="orange" />
            <StatCard icon={Wallet} label="Solde à payer" value={formatFCFA(balance)} accent={balance > 0 ? 'red' : 'green'} />
            <StatCard icon={CheckCircle2} label="Commandes terminées" value={String(done.length)} accent="green" />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
            {/* Commandes en cours */}
            <section aria-label="Commandes en cours">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="card-title">Commandes en cours</h2>
                <div className="flex items-center gap-1">
                  <RefreshButton onClick={() => void refresh()} />
                  <Link to="/client/history" className="flex items-center text-xs font-semibold text-primary hover:underline">
                    Tout l'historique <ChevronRight size={14} aria-hidden="true" />
                  </Link>
                </div>
              </div>

              {active.length === 0 ? (
                <div className="card">
                  <EmptyState
                    icon={PackageOpen}
                    title="Aucune commande en cours"
                    message="Demandez une collecte, un coursier passe chez vous."
                    action={
                      <Link to="/client/collect" className="btn-primary">
                        <Send size={16} aria-hidden="true" />
                        Demander une collecte
                      </Link>
                    }
                  />
                </div>
              ) : (
                <ul className="space-y-3">
                  {active.map((order) => (
                    <ActiveOrderCard key={order.id} order={order} />
                  ))}
                </ul>
              )}
            </section>

            {/* Colonne latérale */}
            <div className="space-y-6">
              <section className="card overflow-hidden" aria-label="Dernières commandes">
                <div className="border-b border-slate-100 px-5 py-4">
                  <h2 className="card-title">Dernières commandes</h2>
                </div>
                <ul className="divide-y divide-slate-50">
                  {recent.map((o) => (
                    <li key={o.id}>
                      <button
                        type="button"
                        onClick={() => navigate(`/client/track/${o.id}`)}
                        className="flex w-full items-center gap-3 px-5 py-3 text-left transition-colors hover:bg-primary-50/40"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-charcoal">{o.ticket || 'Commande'}</p>
                          <p className="text-xs text-slate-400">
                            {formatDateShort(o.createdAt)} · {formatFCFA(o.total)}
                          </p>
                        </div>
                        <StatusBadge variant={o.status} />
                      </button>
                    </li>
                  ))}
                  {recent.length === 0 && <li className="px-5 py-6 text-center text-sm text-slate-400">Aucune commande</li>}
                </ul>
              </section>

              <section className="card p-5" aria-label="Contact pressing">
                <h2 className="card-title mb-3">Besoin d'aide ?</h2>
                <p className="text-xs leading-relaxed text-slate-500">
                  {settings?.name ?? 'Votre pressing'} · {settings?.openingHours ?? 'Lun – Sam : 07h30 – 19h00'}
                </p>
                <a href={`tel:${(settings?.phone ?? '+22625304455').replace(/\s/g, '')}`} className="btn-secondary mt-4 w-full">
                  <Phone size={16} aria-hidden="true" />
                  Appeler le pressing
                </a>
              </section>
            </div>
          </div>
        </>
      )}
    </PortalLayout>
  );
}

/** Carte commande active avec barre de progression */
function ActiveOrderCard({ order }: { order: Order }) {
  const idx = FLOW.indexOf(order.status);
  const balance = order.total - order.paidAmount;

  return (
    <li className="card p-5">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1">
          <p className="text-sm font-bold text-charcoal">{order.ticket || 'Commande'}</p>
          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-400">
            <Clock3 size={12} aria-hidden="true" />
            Reçu le {formatDateShort(order.createdAt)} · {order.items.reduce((n, i) => n + i.quantity, 0)} article(s)
          </p>
        </div>
        <StatusBadge variant={order.status} />
      </div>

      {/* Progression */}
      <div className="mt-4" role="progressbar" aria-valuenow={idx + 1} aria-valuemin={1} aria-valuemax={4} aria-label={`Progression ${order.ticket}`}>
        <div className="flex justify-between">
          {FLOW.map((s, i) => (
            <span key={s} className={`text-[10px] font-medium ${i <= idx ? 'text-primary' : 'text-slate-400'}`}>
              {ORDER_STATUS_LABELS[s]}
            </span>
          ))}
        </div>
        <div className="relative mt-1.5 h-1.5 rounded-full bg-slate-200">
          <div className="absolute inset-y-0 left-0 rounded-full bg-primary transition-all" style={{ width: `${((idx + 1) / 4) * 100}%` }} />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-50 pt-4">
        <p className="text-sm">
          <span className="text-slate-500">Montant : </span>
          <span className="font-semibold text-charcoal">{formatFCFA(order.total)}</span>
          {balance > 0 && <span className="ml-2 font-semibold text-red-500">Solde : {formatFCFA(balance)}</span>}
        </p>
        <div className="flex gap-2">
          {balance > 0 && (
            <Link to={`/client/pay/${order.id}`} className="btn-secondary !py-2 text-xs">
              Payer le solde
            </Link>
          )}
          <Link to={`/client/track/${order.id}`} className="btn-primary !py-2 text-xs">
            Suivre
            <ChevronRight size={14} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </li>
  );
}
