import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, ShoppingCart, Eye } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import type { Order, OrderStatus } from '@/types';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { SearchInput } from '@/components/ui/SearchInput';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Avatar } from '@/components/ui/Avatar';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageHeader } from '@/components/ui/PageHeader';
import { formatFCFA, formatDateShort } from '@/lib/format';

type StatusFilter = 'toutes' | OrderStatus;

const FILTERS: { value: StatusFilter; label: string }[] = [
  { value: 'toutes', label: 'Toutes' },
  { value: 'recu', label: 'Reçu' },
  { value: 'traitement', label: 'En traitement' },
  { value: 'pret', label: 'Prêt' },
  { value: 'livre', label: 'Livré' }
];

export default function OrdersPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const orders = useAppStore((s) => s.orders);
  const clients = useAppStore((s) => s.clients);

  const [filter, setFilter] = useState<StatusFilter>('toutes');
  const query = searchParams.get('q') ?? '';

  const clientById = useMemo(() => new Map(clients.map((c) => [c.id, c])), [clients]);

  const counts = useMemo(() => {
    const base: Record<StatusFilter, number> = { toutes: orders.length, recu: 0, traitement: 0, pret: 0, livre: 0 };
    for (const o of orders) base[o.status]++;
    return base;
  }, [orders]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orders
      .filter((o) => filter === 'toutes' || o.status === filter)
      .filter((o) => {
        if (!q) return true;
        const c = clientById.get(o.clientId);
        return o.ticket.toLowerCase().includes(q) || (c && `${c.firstName} ${c.lastName}`.toLowerCase().includes(q));
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [orders, filter, query, clientById]);

  const columns: Column<Order>[] = [
    {
      key: 'ticket',
      header: 'Ticket',
      sortValue: (o) => o.ticket,
      render: (o) => (
        <Link to={`/orders/${o.id}`} className="font-semibold text-primary hover:underline" onClick={(e) => e.stopPropagation()}>
          {o.ticket}
        </Link>
      )
    },
    {
      key: 'client',
      header: 'Client',
      sortValue: (o) => clientById.get(o.clientId)?.lastName ?? '',
      render: (o) => {
        const c = clientById.get(o.clientId);
        if (!c) return '—';
        return (
          <div className="flex items-center gap-2.5">
            <Avatar firstName={c.firstName} lastName={c.lastName} size={30} />
            <div className="leading-tight">
              <p className="font-medium">{c.firstName} {c.lastName}</p>
              <p className="text-xs text-slate-400">{c.phone}</p>
            </div>
          </div>
        );
      }
    },
    {
      key: 'articles',
      header: 'Articles',
      sortValue: (o) => o.items.reduce((n, i) => n + i.quantity, 0),
      render: (o) => {
        const count = o.items.reduce((n, i) => n + i.quantity, 0);
        return <span className="text-slate-500">{count} article{count > 1 ? 's' : ''}</span>;
      }
    },
    {
      key: 'total',
      header: 'Montant',
      sortValue: (o) => o.total,
      render: (o) => <span className="font-semibold">{formatFCFA(o.total)}</span>
    },
    {
      key: 'status',
      header: 'Statut',
      sortValue: (o) => o.status,
      render: (o) => <StatusBadge variant={o.status} />
    },
    {
      key: 'createdAt',
      header: 'Date',
      sortValue: (o) => o.createdAt,
      render: (o) => <span className="text-slate-500">{formatDateShort(o.createdAt)}</span>
    },
    {
      key: 'actions',
      header: '',
      headerClassName: 'text-right',
      className: 'text-right',
      render: (o) => (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/orders/${o.id}`);
          }}
          className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-primary-50 hover:text-primary"
          aria-label={`Voir la commande ${o.ticket}`}
          title="Voir la commande"
        >
          <Eye size={16} />
        </button>
      )
    }
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Gestion des commandes"
        subtitle="Suivez et mettez à jour toutes les commandes du pressing."
        actions={
          <Link to="/orders/new" className="btn-primary">
            <Plus size={17} aria-hidden="true" />
            Nouvelle commande
          </Link>
        }
      />

      {/* Filtres par statut */}
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filtrer par statut">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            role="tab"
            aria-selected={filter === f.value}
            onClick={() => {
              setFilter(f.value);
            }}
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
              filter === f.value
                ? 'border-primary bg-primary text-white shadow-sm'
                : 'border-slate-200 bg-white text-slate-600 hover:border-primary-300 hover:text-primary'
            }`}
          >
            {f.label}
            <span
              className={`rounded-full px-1.5 py-0.5 text-[11px] font-bold ${filter === f.value ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}
            >
              {counts[f.value]}
            </span>
          </button>
        ))}
      </div>

      <div className="card">
        <div className="border-b border-slate-100 p-4">
          <SearchInput
            value={query}
            onChange={(e) => setSearchParams(e.target.value ? { q: e.target.value } : {})}
            onClear={() => setSearchParams({})}
            placeholder="Rechercher par ticket ou nom du client…"
            className="max-w-md"
          />
        </div>
        <DataTable
          columns={columns}
          data={filtered}
          rowKey={(o) => o.id}
          onRowClick={(o) => navigate(`/orders/${o.id}`)}
          ariaLabel="Liste des commandes"
          mobileCard={(o) => {
            const c = clientById.get(o.clientId);
            return (
              <div className="px-4 py-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-primary">{o.ticket}</span>
                  <StatusBadge variant={o.status} />
                </div>
                <p className="mt-1 text-sm font-medium text-charcoal">{c ? `${c.firstName} ${c.lastName}` : '—'}</p>
                <div className="mt-2 flex items-center justify-between text-xs">
                  <span className="text-slate-400">
                    {o.items.reduce((n, i) => n + i.quantity, 0)} article(s) · {formatDateShort(o.createdAt)}
                  </span>
                  <span className="font-semibold text-charcoal">{formatFCFA(o.total)}</span>
                </div>
              </div>
            );
          }}
          emptyState={
            <EmptyState
              icon={ShoppingCart}
              title="Aucune commande trouvée"
              message={query ? `Aucun résultat pour « ${query} ». Essayez un autre ticket ou nom.` : 'Aucune commande pour ce statut.'}
              action={
                <Link to="/orders/new" className="btn-primary">
                  <Plus size={16} aria-hidden="true" />
                  Créer une commande
                </Link>
              }
            />
          }
        />
        {filtered.length > 0 && (
          <p className="border-t border-slate-100 px-5 py-3 text-xs text-slate-400">
            {filtered.length} commande{filtered.length > 1 ? 's' : ''} au total
          </p>
        )}
      </div>
    </div>
  );
}
