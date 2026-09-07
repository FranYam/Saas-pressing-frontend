import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Banknote, Smartphone, AlertCircle, Wallet, MessageSquareText, Check, CreditCard } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import type { Payment } from '@/types';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { KPICard } from '@/components/ui/KPICard';
import { PageHeader } from '@/components/ui/PageHeader';
import { Modal } from '@/components/ui/Modal';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatFCFA, formatDateShort, formatRelative } from '@/lib/format';
import * as api from '@/services/api';

export default function PaymentsPage() {
  const payments = useAppStore((s) => s.payments);
  const orders = useAppStore((s) => s.orders);
  const clients = useAppStore((s) => s.clients);
  const [tab, setTab] = useState<'paiements' | 'creances'>('paiements');
  const [smsTarget, setSmsTarget] = useState<{ name: string; ticket: string; amount: number; phone: string } | null>(null);
  const [smsSending, setSmsSending] = useState(false);
  const [smsSent, setSmsSent] = useState(false);

  const stats = useMemo(() => {
    const totalEncaisse = payments.reduce((s, p) => s + p.amount, 0);
    const mobileMoney = payments.filter((p) => p.method !== 'especes').reduce((s, p) => s + p.amount, 0);
    const especes = payments.filter((p) => p.method === 'especes').reduce((s, p) => s + p.amount, 0);
    const creances = orders.filter((o) => o.paidAmount < o.total).reduce((s, o) => s + (o.total - o.paidAmount), 0);
    return { totalEncaisse, mobileMoney, especes, creances };
  }, [payments, orders]);

  const clientName = (id: string) => {
    const c = clients.find((cl) => cl.id === id);
    return c ? `${c.firstName} ${c.lastName}` : 'Client';
  };

  const creances = useMemo(
    () =>
      orders
        .filter((o) => o.paidAmount < o.total)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    [orders]
  );

  const columns: Column<Payment>[] = [
    {
      key: 'date',
      header: 'Date',
      sortValue: (p) => p.date,
      render: (p) => (
        <div className="leading-tight">
          <p className="font-medium">{formatDateShort(p.date)}</p>
          <p className="text-xs text-slate-400">{formatRelative(p.date)}</p>
        </div>
      )
    },
    {
      key: 'ticket',
      header: 'Ticket',
      sortValue: (p) => p.ticket,
      render: (p) => (
        <Link to={`/orders/${p.orderId}`} className="font-semibold text-primary hover:underline">
          {p.ticket}
        </Link>
      )
    },
    {
      key: 'client',
      header: 'Client',
      sortValue: (p) => clientName(p.clientId),
      render: (p) => <span className="font-medium">{clientName(p.clientId)}</span>
    },
    {
      key: 'method',
      header: 'Mode',
      sortValue: (p) => p.method,
      render: (p) => <StatusBadge variant={p.method} />
    },
    {
      key: 'amount',
      header: 'Montant',
      sortValue: (p) => p.amount,
      render: (p) => <span className="font-semibold">{formatFCFA(p.amount)}</span>
    },
    {
      key: 'status',
      header: 'Statut',
      render: (p) =>
        p.status === 'reussi' ? (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-600">
            <Check size={13} aria-hidden="true" /> Réussi
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-orange-500">
            <span className="h-1.5 w-1.5 rounded-full bg-orange-500" aria-hidden="true" /> En attente
          </span>
        )
    }
  ];

  const sendRappel = async () => {
    if (!smsTarget) return;
    setSmsSending(true);
    try {
      await api.sendSms(smsTarget.phone, `Rappel : solde de ${formatFCFA(smsTarget.amount)} pour la commande ${smsTarget.ticket}. Merci de passer au pressing.`);
      setSmsSent(true);
    } finally {
      setSmsSending(false);
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader title="Paiements & créances" subtitle="Suivez vos encaissements et relancez les créances en un clic." />

      {/* Statistiques */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KPICard icon={Wallet} label="Total encaissé" value={formatFCFA(stats.totalEncaisse)} trend={8} accent="green" />
        <KPICard icon={Smartphone} label="Mobile money" value={formatFCFA(stats.mobileMoney)} accent="orange" />
        <KPICard icon={Banknote} label="Espèces" value={formatFCFA(stats.especes)} accent="blue" />
        <KPICard icon={AlertCircle} label="Créances" value={formatFCFA(stats.creances)} accent="red" />
      </div>

      {/* Onglets */}
      <div className="card">
        <div className="flex gap-1 border-b border-slate-100 px-4" role="tablist" aria-label="Sections de paiements">
          {(
            [
              { value: 'paiements', label: 'Paiements', icon: CreditCard },
              { value: 'creances', label: `Créances (${creances.length})`, icon: AlertCircle }
            ] as const
          ).map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              role="tab"
              aria-selected={tab === value}
              onClick={() => setTab(value)}
              className={`-mb-px inline-flex items-center gap-2 border-b-2 px-4 py-3.5 text-sm font-semibold transition-colors ${
                tab === value ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-charcoal'
              }`}
            >
              <Icon size={15} aria-hidden="true" />
              {label}
            </button>
          ))}
        </div>

        {tab === 'paiements' ? (
          <DataTable
            columns={columns}
            data={payments}
            rowKey={(p) => p.id}
            ariaLabel="Historique des paiements"
            mobileCard={(p) => (
              <div className="px-4 py-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-primary">{p.ticket}</span>
                  <StatusBadge variant={p.method} />
                </div>
                <p className="mt-1 text-sm font-medium text-charcoal">{clientName(p.clientId)}</p>
                <div className="mt-2 flex items-center justify-between text-xs">
                  <span className="text-slate-400">{formatDateShort(p.date)}</span>
                  <span className="font-semibold text-charcoal">{formatFCFA(p.amount)}</span>
                </div>
              </div>
            )}
            emptyState={<EmptyState icon={CreditCard} title="Aucun paiement" message="Les paiements encaissés apparaîtront ici." />}
          />
        ) : (
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full min-w-[640px] text-left text-sm" aria-label="Liste des créances">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60">
                  {['Ticket', 'Client', 'Total', 'Payé', 'Solde dû', 'Ancienneté', ''].map((h) => (
                    <th key={h} scope="col" className="px-4 py-3 text-xs font-semibold tracking-wide text-slate-500 uppercase">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {creances.map((o) => {
                  const balance = o.total - o.paidAmount;
                  const c = clients.find((cl) => cl.id === o.clientId);
                  return (
                    <tr key={o.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3.5">
                        <Link to={`/orders/${o.id}`} className="font-semibold text-primary hover:underline">
                          {o.ticket}
                        </Link>
                      </td>
                      <td className="px-4 py-3.5 font-medium">{c ? `${c.firstName} ${c.lastName}` : '—'}</td>
                      <td className="px-4 py-3.5 text-slate-500">{formatFCFA(o.total)}</td>
                      <td className="px-4 py-3.5 text-green-600">{formatFCFA(o.paidAmount)}</td>
                      <td className="px-4 py-3.5 font-semibold text-red-500">{formatFCFA(balance)}</td>
                      <td className="px-4 py-3.5 text-slate-500">{formatRelative(o.createdAt)}</td>
                      <td className="px-4 py-3.5 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            setSmsSent(false);
                            setSmsTarget({
                              name: c ? `${c.firstName} ${c.lastName}` : 'Client',
                              ticket: o.ticket,
                              amount: balance,
                              phone: c?.phone ?? ''
                            });
                          }}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-orange-200 bg-orange-50 px-3 py-1.5 text-xs font-semibold text-orange-600 transition-colors hover:bg-orange-100"
                        >
                          <MessageSquareText size={13} aria-hidden="true" />
                          Rappel SMS
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {creances.length === 0 && (
                  <tr>
                    <td colSpan={7}>
                      <EmptyState icon={Check} title="Aucune créance" message="Toutes les commandes ont été soldées. Félicitations !" />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal rappel SMS */}
      <Modal
        open={!!smsTarget}
        onClose={() => setSmsTarget(null)}
        title="Envoyer un rappel de paiement"
        size="sm"
        footer={
          smsSent ? (
            <button type="button" className="btn-primary" onClick={() => setSmsTarget(null)}>
              Fermer
            </button>
          ) : (
            <>
              <button type="button" className="btn-secondary" onClick={() => setSmsTarget(null)}>
                Annuler
              </button>
              <button type="button" className="btn-primary" onClick={sendRappel} disabled={smsSending}>
                {smsSending ? <LoadingSpinner size={16} /> : <MessageSquareText size={16} aria-hidden="true" />}
                Envoyer le SMS
              </button>
            </>
          )
        }
      >
        {smsSent ? (
          <div className="py-3 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-50">
              <Check size={22} className="text-green-500" aria-hidden="true" />
            </div>
            <p className="text-sm font-semibold text-charcoal">Rappel envoyé à {smsTarget?.name}</p>
          </div>
        ) : (
          smsTarget && (
            <div className="space-y-4">
              <p className="text-sm text-slate-500">
                Un SMS de rappel sera envoyé à <span className="font-semibold text-charcoal">{smsTarget.name}</span> pour la commande{' '}
                <span className="font-semibold text-charcoal">{smsTarget.ticket}</span>.
              </p>
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm leading-relaxed text-slate-600">
                Rappel : solde de {formatFCFA(smsTarget.amount)} pour la commande {smsTarget.ticket}. Merci de passer au pressing régler votre facture. — PressNet
              </div>
            </div>
          )
        )}
      </Modal>
    </div>
  );
}
