import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Printer,
  MessageSquareText,
  RefreshCw,
  Phone,
  MapPin,
  Check,
  Inbox,
  WashingMachine,
  PackageCheck,
  Handshake,
  Receipt,
  ArrowRight,
  Circle
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { useAuth } from '@/context/AuthContext';
import type { OrderStatus } from '@/types';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Avatar } from '@/components/ui/Avatar';
import { Modal } from '@/components/ui/Modal';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatFCFA, formatDateTime, formatDate, ORDER_STATUS_LABELS, PAYMENT_METHOD_LABELS, PAYMENT_TYPE_LABELS } from '@/lib/format';
import * as api from '@/services/api';

const STATUS_FLOW: OrderStatus[] = ['recu', 'traitement', 'pret', 'livre'];

/** Icône et description associées à chaque étape du cycle de vie */
const STEP_META: Record<OrderStatus, { icon: LucideIcon; description: string }> = {
  recu: { icon: Inbox, description: 'Vêtements reçus au comptoir' },
  traitement: { icon: WashingMachine, description: 'Nettoyage en cours' },
  pret: { icon: PackageCheck, description: 'Prêt à être retiré' },
  livre: { icon: Handshake, description: 'Remis au client' }
};

const NEXT_ACTIONS: Partial<Record<OrderStatus, { next: OrderStatus; label: string }>> = {
  recu: { next: 'traitement', label: 'Passer en traitement' },
  traitement: { next: 'pret', label: 'Marquer comme prêt' },
  pret: { next: 'livre', label: 'Marquer comme livré' }
};

export default function OrderDetailPage() {
  const { id = '' } = useParams();
  const { user } = useAuth();
  const orders = useAppStore((s) => s.orders);
  const clients = useAppStore((s) => s.clients);
  const updateOrderStatus = useAppStore((s) => s.updateOrderStatus);

  const [statusModal, setStatusModal] = useState(false);
  const [smsModal, setSmsModal] = useState(false);
  const [smsSent, setSmsSent] = useState(false);
  const [busy, setBusy] = useState(false);

  const order = orders.find((o) => o.id === id || o.ticket.toLowerCase() === id.toLowerCase());
  const client = order ? clients.find((c) => c.id === order.clientId) : undefined;

  if (!order) {
    return (
      <div className="card">
        <EmptyState
          icon={Receipt}
          title="Commande introuvable"
          message="Cette commande n'existe pas ou a été supprimée."
          action={
            <Link to="/orders" className="btn-primary">
              Retour aux commandes
            </Link>
          }
        />
      </div>
    );
  }

  const balance = order.total - order.paidAmount;
  const currentIdx = STATUS_FLOW.indexOf(order.status);
  const nextAction = NEXT_ACTIONS[order.status];
  const isGerant = user?.role === 'gerant';

  const changeStatus = async (status: OrderStatus) => {
    setBusy(true);
    try {
      await updateOrderStatus(order.id, status);
      setStatusModal(false);
    } finally {
      setBusy(false);
    }
  };

  const printTicket = () => {
    window.print();
  };

  const sendSms = async () => {
    setBusy(true);
    try {
      await api.sendSms(client?.phone ?? '', `Bonjour ${client?.firstName ?? ''}, votre commande ${order.ticket} est ${ORDER_STATUS_LABELS[order.status].toLowerCase()}. Solde : ${formatFCFA(balance)}.`);
      setSmsSent(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title={`Commande ${order.ticket}`}
        backTo="/orders"
        badges={
          <>
            <StatusBadge variant={order.status} />
            {order.channel === 'en_ligne' && <StatusBadge variant="livraison" label="Demande en ligne" />}
          </>
        }
        actions={
          <>
            <button type="button" onClick={printTicket} className="btn-secondary">
              <Printer size={16} aria-hidden="true" />
              <span className="hidden sm:inline">Imprimer le ticket</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setSmsSent(false);
                setSmsModal(true);
              }}
              className="btn-secondary"
            >
              <MessageSquareText size={16} aria-hidden="true" />
              <span className="hidden sm:inline">Envoyer SMS</span>
            </button>
            {nextAction && (
              <button type="button" onClick={() => setStatusModal(true)} className="btn-primary">
                <RefreshCw size={16} aria-hidden="true" />
                {nextAction.label}
              </button>
            )}
          </>
        }
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Colonne principale */}
        <div className="space-y-5 lg:col-span-2">
          {/* Client */}
          <section className="card p-5" aria-label="Informations client">
            <h2 className="card-title mb-4">Informations client</h2>
            {client ? (
              <div className="flex flex-wrap items-center gap-4">
                <Avatar firstName={client.firstName} lastName={client.lastName} size={52} className="ring-2 ring-slate-100" />
                <div className="min-w-0 flex-1">
                  <Link to={`/clients/${client.id}`} className="text-sm font-semibold text-charcoal hover:text-primary hover:underline">
                    {client.firstName} {client.lastName}
                  </Link>
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                    <a href={`tel:${client.phone.replace(/\s/g, '')}`} className="inline-flex items-center gap-1 hover:text-primary">
                      <Phone size={12} aria-hidden="true" /> {client.phone}
                    </a>
                    <span className="inline-flex items-center gap-1">
                      <MapPin size={12} aria-hidden="true" /> {client.sector}, Ouagadougou
                    </span>
                  </p>
                </div>
                <Link to={`/clients/${client.id}`} className="btn-secondary !py-2 text-xs">
                  Voir la fiche
                  <ArrowRight size={14} aria-hidden="true" />
                </Link>
              </div>
            ) : (
              <p className="text-sm text-slate-400">Client supprimé</p>
            )}
          </section>

          {/* Articles */}
          <section className="card overflow-hidden" aria-label="Articles de la commande">
            <div className="border-b border-slate-100 px-5 py-4">
              <h2 className="card-title">Articles ({order.items.reduce((n, i) => n + i.quantity, 0)})</h2>
            </div>
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60">
                  {['Type d\'article', 'Quantité', 'Prix unitaire', 'Total'].map((h) => (
                    <th key={h} scope="col" className="px-5 py-3 text-xs font-semibold tracking-wide text-slate-500 uppercase">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {order.items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-5 py-3.5 font-medium">{item.type}</td>
                    <td className="px-5 py-3.5 text-slate-500">× {item.quantity}</td>
                    <td className="px-5 py-3.5 text-slate-500 tabular-nums">{formatFCFA(item.unitPrice)}</td>
                    <td className="px-5 py-3.5 font-semibold tabular-nums">{formatFCFA(item.unitPrice * item.quantity)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-slate-200 bg-slate-50/60">
                  <td colSpan={3} className="px-5 py-3.5 text-right text-sm font-semibold text-slate-600">
                    Total commande
                  </td>
                  <td className="px-5 py-3.5 text-base font-bold text-primary tabular-nums">{formatFCFA(order.total)}</td>
                </tr>
              </tfoot>
            </table>
          </section>

          {/* Timeline */}
          <section className="card p-5" aria-label="Historique des statuts">
            <h2 className="card-title mb-5">Suivi de la commande</h2>
            <ol className="relative">
              {STATUS_FLOW.map((status, i) => {
                const event = order.statusHistory.find((h) => h.status === status);
                const done = !!event;
                const isCurrent = i === currentIdx;
                const StepIcon = STEP_META[status].icon;
                return (
                  <li key={status} className="relative flex gap-4 pb-7 last:pb-0">
                    {/* Ligne verticale */}
                    {i < STATUS_FLOW.length - 1 && (
                      <span
                        className={`absolute top-10 left-[19px] h-[calc(100%-40px)] w-0.5 ${done && i < currentIdx ? 'bg-green-400' : 'bg-slate-200'}`}
                        aria-hidden="true"
                      />
                    )}
                    <span
                      className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                        done ? 'border-green-400 bg-green-400 text-white' : 'border-slate-200 bg-white text-slate-300'
                      }`}
                      aria-hidden="true"
                    >
                      {done ? <StepIcon size={17} /> : <Circle size={10} />}
                    </span>
                    <div className="pt-1.5">
                      <p className={`flex items-center gap-2 text-sm font-semibold ${done ? 'text-charcoal' : 'text-slate-400'}`}>
                        {ORDER_STATUS_LABELS[status]}
                        {isCurrent && (
                          <span className="rounded-full bg-primary-50 px-2 py-0.5 text-[10px] font-bold text-primary uppercase">Actuel</span>
                        )}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-400">{STEP_META[status].description}</p>
                      <p className="mt-1 text-xs font-medium text-primary">{event ? formatDateTime(event.date) : 'En attente'}</p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </section>
        </div>

        {/* Colonne latérale : paiement */}
        <div className="space-y-5">
          <section className="card p-5" aria-label="Paiement">
            <h2 className="card-title mb-4">Paiement</h2>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-500">Montant total</dt>
                <dd className="font-semibold tabular-nums">{formatFCFA(order.total)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Déjà payé</dt>
                <dd className="font-semibold text-green-600 tabular-nums">{formatFCFA(order.paidAmount)}</dd>
              </div>
            </dl>

            {/* Progression du règlement */}
            <div className="mt-3" role="progressbar" aria-valuenow={order.paidAmount} aria-valuemin={0} aria-valuemax={order.total} aria-label="Progression du règlement">
              <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-green-500 transition-all" style={{ width: `${Math.min(100, (order.paidAmount / order.total) * 100)}%` }} />
              </div>
            </div>

            <div className="mt-4 space-y-2 border-t border-dashed border-slate-200 pt-4">
              <div className="flex items-baseline justify-between">
                <dt className="text-sm font-semibold text-slate-600">Solde dû</dt>
                <dd className={`text-lg font-bold tabular-nums ${balance > 0 ? 'text-red-500' : 'text-green-600'}`}>{formatFCFA(balance)}</dd>
              </div>
            </div>

            <div className="mt-4 space-y-2 border-t border-slate-100 pt-4 text-xs text-slate-500">
              <p className="flex justify-between">
                <span>Mode de paiement</span>
                <span className="font-medium text-charcoal">{order.paymentMethod ? PAYMENT_METHOD_LABELS[order.paymentMethod] : '—'}</span>
              </p>
              <p className="flex justify-between">
                <span>Type</span>
                <span className="font-medium text-charcoal">{PAYMENT_TYPE_LABELS[order.paymentType]}</span>
              </p>
              <p className="flex justify-between">
                <span>Créée le</span>
                <span className="font-medium text-charcoal">{formatDate(order.createdAt)}</span>
              </p>
              <p className="flex justify-between">
                <span>Retrait prévu</span>
                <span className="font-medium text-charcoal">{formatDate(order.dueDate)}</span>
              </p>
            </div>
            {balance > 0 && isGerant && (
              <Link to={`/client/pay/${order.id}?amount=${balance}`} className="btn-primary mt-5 w-full">
                Encaisser le solde
              </Link>
            )}
          </section>

          {order.deliveryRequested && (
            <section className="card p-5" aria-label="Livraison">
              <h2 className="card-title mb-2">Livraison demandée</h2>
              <p className="text-xs leading-relaxed text-slate-500">
                Ce client a demandé une livraison à domicile. Retrouvez la mission dans{' '}
                <Link to="/deliveries" className="font-medium text-primary hover:underline">
                  Gestion des livraisons
                </Link>
                .
              </p>
            </section>
          )}
        </div>
      </div>

      {/* Modal changement de statut */}
      <Modal
        open={statusModal}
        onClose={() => setStatusModal(false)}
        title="Changer le statut de la commande"
        footer={
          <>
            <button type="button" className="btn-secondary" onClick={() => setStatusModal(false)}>
              Annuler
            </button>
            {nextAction && (
              <button type="button" className="btn-primary" onClick={() => changeStatus(nextAction.next)} disabled={busy}>
                {busy ? <LoadingSpinner size={16} /> : <Check size={16} aria-hidden="true" />}
                Confirmer
              </button>
            )}
          </>
        }
      >
        <p className="mb-4 text-sm text-slate-500">
          Sélectionnez le nouveau statut de la commande <span className="font-semibold text-charcoal">{order.ticket}</span> :
        </p>
        <div className="space-y-2">
          {STATUS_FLOW.map((status) => {
            const StepIcon = STEP_META[status].icon;
            return (
              <button
                key={status}
                type="button"
                onClick={() => changeStatus(status)}
                disabled={busy || status === order.status}
                className={`flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-sm font-medium transition-colors ${
                  status === order.status
                    ? 'cursor-default border-primary bg-primary-50 text-primary'
                    : 'border-slate-200 hover:border-primary hover:bg-primary-50/50 disabled:opacity-60'
                }`}
              >
                <StepIcon size={16} aria-hidden="true" />
                {ORDER_STATUS_LABELS[status]}
                {status === order.status && <span className="ml-auto text-xs font-semibold">Statut actuel</span>}
              </button>
            );
          })}
        </div>
      </Modal>

      {/* Modal SMS */}
      <Modal
        open={smsModal}
        onClose={() => setSmsModal(false)}
        title="Envoyer un SMS au client"
        footer={
          smsSent ? (
            <button type="button" className="btn-primary" onClick={() => setSmsModal(false)}>
              Fermer
            </button>
          ) : (
            <>
              <button type="button" className="btn-secondary" onClick={() => setSmsModal(false)}>
                Annuler
              </button>
              <button type="button" className="btn-primary" onClick={sendSms} disabled={busy}>
                {busy ? <LoadingSpinner size={16} /> : <MessageSquareText size={16} aria-hidden="true" />}
                Envoyer
              </button>
            </>
          )
        }
      >
        {smsSent ? (
          <div className="py-4 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-50">
              <Check size={22} className="text-green-500" aria-hidden="true" />
            </div>
            <p className="text-sm font-semibold text-charcoal">SMS envoyé avec succès</p>
            <p className="mt-1 text-xs text-slate-500">Le client {client?.firstName} recevra le message dans quelques instants.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-slate-500">
              Destinataire : <span className="font-semibold text-charcoal">{client?.firstName} {client?.lastName}</span> ({client?.phone})
            </p>
            <div>
              <span className="label-base">Message</span>
              <p className="rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm leading-relaxed text-slate-600">
                Bonjour {client?.firstName}, votre commande {order.ticket} est {ORDER_STATUS_LABELS[order.status].toLowerCase()}.
                {balance > 0 ? ` Solde à régler : ${formatFCFA(balance)}.` : ''} — {useAppStore.getState().settings?.name ?? 'PressNet'}
              </p>
            </div>
            <p className="text-xs text-slate-400">Coût SMS : ~15 FCFA (passerelle locale)</p>
          </div>
        )}
      </Modal>
    </div>
  );
}
