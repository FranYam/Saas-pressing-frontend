import { useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Phone, MapPin, CalendarDays, Wallet, ShoppingCart, AlertCircle, UserX, MessageSquareText, Tag } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { Avatar } from '@/components/ui/Avatar';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatFCFA, formatDate, formatDateShort } from '@/lib/format';

export default function ClientDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const clients = useAppStore((s) => s.clients);
  const orders = useAppStore((s) => s.orders);
  const payments = useAppStore((s) => s.payments);

  const client = clients.find((c) => c.id === id);

  const data = useMemo(() => {
    if (!client) return null;
    const clientOrders = orders
      .filter((o) => o.clientId === client.id)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const totalSpent = clientOrders.reduce((sum, o) => sum + o.paidAmount, 0);
    const creance = clientOrders.reduce((sum, o) => sum + Math.max(0, o.total - o.paidAmount), 0);
    const clientPayments = payments.filter((p) => p.clientId === client.id).slice(0, 6);
    return { clientOrders, totalSpent, creance, clientPayments };
  }, [client, orders, payments]);

  if (!client || !data) {
    return (
      <div className="card">
        <EmptyState
          icon={UserX}
          title="Client introuvable"
          message="Ce client n'existe pas."
          action={
            <Link to="/clients" className="btn-primary">
              Retour aux clients
            </Link>
          }
        />
      </div>
    );
  }

  const totalAllOrders = data.clientOrders.reduce((sum, o) => sum + o.total, 0);

  return (
    <div className="space-y-5">
      <PageHeader title="Fiche client" backTo="/clients" />

      {/* Carte identité */}
      <section className="card p-6" aria-label="Informations du client">
        <div className="flex flex-wrap items-center gap-5">
          <Avatar firstName={client.firstName} lastName={client.lastName} size={64} className="ring-4 ring-slate-100" />
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-semibold text-charcoal">
              {client.firstName} {client.lastName}
            </h2>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
              <a href={`tel:${client.phone.replace(/\s/g, '')}`} className="inline-flex items-center gap-1.5 hover:text-primary">
                <Phone size={14} aria-hidden="true" /> {client.phone}
              </a>
              <span className="inline-flex items-center gap-1.5">
                <MapPin size={14} aria-hidden="true" /> {client.address || client.sector}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays size={14} aria-hidden="true" /> Inscrit le {formatDate(client.registeredAt)}
              </span>
            </div>
          </div>
          {data.creance > 0 && (
            <div className="rounded-xl border border-orange-200 bg-orange-50 px-5 py-3 text-center">
              <p className="flex items-center justify-center gap-1.5 text-xs font-semibold text-orange-600">
                <AlertCircle size={13} aria-hidden="true" />
                Créance actuelle
              </p>
              <p className="mt-0.5 text-xl font-bold text-red-500 tabular-nums">{formatFCFA(data.creance)}</p>
            </div>
          )}
        </div>

        {/* Mini stats */}
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StatCard icon={Wallet} label="Total payé" value={formatFCFA(data.totalSpent)} accent="green" />
          <StatCard icon={ShoppingCart} label="Commandes" value={String(data.clientOrders.length)} accent="blue" />
          <StatCard
            icon={Tag}
            label="Panier moyen"
            value={formatFCFA(data.clientOrders.length ? Math.round(totalAllOrders / data.clientOrders.length) : 0)}
            accent="violet"
          />
        </div>
      </section>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        {/* Historique commandes */}
        <section className="card overflow-hidden xl:col-span-2" aria-label="Historique des commandes">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="card-title">Historique des commandes</h2>
          </div>
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full min-w-[540px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60">
                  {['Ticket', 'Date', 'Montant', 'Solde', 'Statut'].map((h) => (
                    <th key={h} scope="col" className="px-5 py-3 text-xs font-semibold tracking-wide text-slate-500 uppercase">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {data.clientOrders.map((o) => {
                  const balance = o.total - o.paidAmount;
                  return (
                    <tr key={o.id} className="cursor-pointer transition-colors hover:bg-primary-50/40" onClick={() => navigate(`/orders/${o.id}`)}>
                      <td className="px-5 py-3.5">
                        <span className="font-semibold text-primary">{o.ticket}</span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-500">{formatDateShort(o.createdAt)}</td>
                      <td className="px-5 py-3.5 font-medium">{formatFCFA(o.total)}</td>
                      <td className="px-5 py-3.5">
                        {balance > 0 ? <span className="font-semibold text-red-500">{formatFCFA(balance)}</span> : <span className="text-green-600">Payé</span>}
                      </td>
                      <td className="px-5 py-3.5">
                        <StatusBadge variant={o.status} />
                      </td>
                    </tr>
                  );
                })}
                {data.clientOrders.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-sm text-slate-400">
                      Aucune commande pour ce client.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Historique paiements */}
        <section className="card h-fit overflow-hidden" aria-label="Historique des paiements">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="card-title">Derniers paiements</h2>
          </div>
          <ul className="divide-y divide-slate-50">
            {data.clientPayments.map((p) => (
              <li key={p.id} className="px-5 py-3.5">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold">{formatFCFA(p.amount)}</p>
                    <p className="mt-0.5 text-xs text-slate-400">
                      {p.ticket} · {formatDateShort(p.date)}
                    </p>
                  </div>
                  <div className="text-right">
                    <StatusBadge variant={p.method} />
                    <p className="mt-1 text-[11px] font-medium text-green-600">Réussi</p>
                  </div>
                </div>
              </li>
            ))}
            {data.clientPayments.length === 0 && <li className="px-5 py-8 text-center text-sm text-slate-400">Aucun paiement</li>}
          </ul>
          {data.creance > 0 && (
            <div className="border-t border-slate-100 p-4">
              <button type="button" className="btn-secondary w-full text-xs" title="Envoyer un rappel de paiement par SMS">
                <MessageSquareText size={14} aria-hidden="true" />
                Envoyer un rappel SMS
              </button>
            </div>
          )}
        </section>
      </div>

      {/* Note créance */}
      {data.creance > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-orange-200 bg-orange-50 p-4 text-sm text-orange-700" role="status">
          <AlertCircle size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
          <p>
            <span className="font-semibold">Créance de {formatFCFA(data.creance)} en cours.</span> Un rappel SMS peut être envoyé
            depuis l'onglet « Créances » de la page Paiements.
          </p>
        </div>
      )}
    </div>
  );
}
