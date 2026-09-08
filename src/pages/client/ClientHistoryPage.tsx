import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { History, ChevronRight, Wallet } from 'lucide-react';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { CLIENT_NAV } from './ClientDashboardPage';
import { useClientAccess } from '@/context/ClientAccessContext';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { formatFCFA, formatDate, formatNumber } from '@/lib/format';

type Tab = 'toutes' | 'en_cours' | 'terminees';

const TABS: { value: Tab; label: string }[] = [
  { value: 'toutes', label: 'Toutes' },
  { value: 'en_cours', label: 'En cours' },
  { value: 'terminees', label: 'Terminées' }
];

export default function ClientHistoryPage() {
  const navigate = useNavigate();
  const { data, loading } = useClientAccess();
  const [tab, setTab] = useState<Tab>('toutes');

  const myOrders = useMemo(
    () => [...(data?.orders ?? [])].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [data?.orders]
  );

  const filtered = myOrders.filter((o) =>
    tab === 'toutes' ? true : tab === 'en_cours' ? o.status !== 'livre' : o.status === 'livre'
  );

  const totalSpent = myOrders.reduce((s, o) => s + o.total, 0);
  const counts = {
    toutes: myOrders.length,
    en_cours: myOrders.filter((o) => o.status !== 'livre').length,
    terminees: myOrders.filter((o) => o.status === 'livre').length
  };

  if (loading && !data) {
    return (
      <PortalLayout title="Historique" nav={CLIENT_NAV} showBack={false}>
        <div className="flex min-h-[50vh] items-center justify-center">
          <LoadingSpinner label="Chargement de l'historique…" />
        </div>
      </PortalLayout>
    );
  }

  return (
    <PortalLayout
      title="Historique"
      nav={CLIENT_NAV}
      showBack={false}
      identity={data ? { name: data.name, sub: data.phone } : undefined}
      onExit={() => navigate('/client/access')}
      exitLabel="Quitter l'espace"
    >
      <div className="mb-5">
        <h1 className="text-2xl font-semibold text-charcoal">Historique de mes commandes</h1>
        <p className="page-subtitle">
          {formatNumber(myOrders.length)} commande{myOrders.length > 1 ? 's' : ''} · {formatFCFA(totalSpent)} au total
        </p>
      </div>

      {/* Onglets */}
      <div className="mb-4 flex flex-wrap gap-2" role="tablist" aria-label="Filtrer l'historique">
        {TABS.map((t) => (
          <button
            key={t.value}
            role="tab"
            aria-selected={tab === t.value}
            onClick={() => setTab(t.value)}
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
              tab === t.value
                ? 'border-primary bg-primary text-white shadow-sm'
                : 'border-slate-200 bg-white text-slate-600 hover:border-primary-300 hover:text-primary'
            }`}
          >
            {t.label}
            <span className={`rounded-full px-1.5 py-0.5 text-[11px] font-bold ${tab === t.value ? 'bg-white/20' : 'bg-slate-100 text-slate-500'}`}>
              {counts[t.value]}
            </span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card">
          <EmptyState icon={History} title="Aucune commande" message="Vos commandes passées apparaîtront ici." />
        </div>
      ) : (
        <>
          {/* Tableau desktop */}
          <div className="card hidden overflow-hidden md:block">
            <table className="w-full text-left text-sm" aria-label="Historique des commandes">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60">
                  {['Ticket', 'Date', 'Articles', 'Montant', 'Payé', 'Solde', 'Statut', ''].map((h) => (
                    <th key={h} scope="col" className="px-4 py-3 text-xs font-semibold tracking-wide text-slate-500 uppercase">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((o) => {
                  const balance = o.total - o.paidAmount;
                  return (
                    <tr key={o.id} className="cursor-pointer transition-colors hover:bg-primary-50/40" onClick={() => navigate(`/client/track/${o.id}`)}>
                      <td className="px-4 py-3.5 font-semibold text-primary">{o.ticket || 'Commande'}</td>
                      <td className="px-4 py-3.5 text-slate-500">{formatDate(o.createdAt)}</td>
                      <td className="px-4 py-3.5 text-slate-500">{o.items.reduce((n, i) => n + i.quantity, 0)}</td>
                      <td className="px-4 py-3.5 font-medium tabular-nums">{formatFCFA(o.total)}</td>
                      <td className="px-4 py-3.5 text-green-600 tabular-nums">{formatFCFA(o.paidAmount)}</td>
                      <td className="px-4 py-3.5">
                        {balance > 0 ? <span className="font-semibold text-red-500 tabular-nums">{formatFCFA(balance)}</span> : <span className="text-slate-400">—</span>}
                      </td>
                      <td className="px-4 py-3.5">
                        <StatusBadge variant={o.status} />
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <ChevronRight size={16} className="ml-auto text-slate-300" aria-hidden="true" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Cartes mobile */}
          <ul className="space-y-3 md:hidden">
            {filtered.map((o) => {
              const balance = o.total - o.paidAmount;
              return (
                <li key={o.id}>
                  <button
                    type="button"
                    onClick={() => navigate(`/client/track/${o.id}`)}
                    className="card card-hover w-full p-4 text-left"
                    aria-label={`Commande ${o.ticket}`}
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold text-charcoal">{o.ticket || 'Commande'}</p>
                      <StatusBadge variant={o.status} />
                    </div>
                    <p className="mt-1 text-xs text-slate-400">{formatDate(o.createdAt)}</p>
                    <div className="mt-3 flex items-center justify-between border-t border-slate-50 pt-3">
                      <span className="text-sm font-semibold tabular-nums">{formatFCFA(o.total)}</span>
                      {balance > 0 ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-500">
                          <Wallet size={12} aria-hidden="true" />
                          Solde : {formatFCFA(balance)}
                        </span>
                      ) : (
                        <span className="text-xs font-semibold text-green-600">Payé</span>
                      )}
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </PortalLayout>
  );
}
