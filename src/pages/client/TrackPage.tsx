import { useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Check, Circle, Phone, Wallet, SearchX } from 'lucide-react';
import { PortalLayout, PortalSection } from '@/components/layout/PortalLayout';
import { CLIENT_NAV } from './ClientDashboardPage';
import { useClientAccess } from '@/context/ClientAccessContext';
import { useAppStore } from '@/store/useAppStore';
import type { OrderStatus } from '@/types';
import { formatFCFA, formatDateTime, ORDER_STATUS_LABELS, formatDate } from '@/lib/format';

const STEPS: { status: OrderStatus; description: string }[] = [
  { status: 'recu', description: 'Nous avons bien reçu vos vêtements' },
  { status: 'traitement', description: 'Vos vêtements sont en cours de nettoyage' },
  { status: 'pret', description: 'Vous pouvez venir les récupérer' },
  { status: 'livre', description: 'Commande récupérée. Merci de votre confiance !' }
];

const FLOW: OrderStatus[] = ['recu', 'traitement', 'pret', 'livre'];

export default function TrackPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { data, clear } = useClientAccess();
  const settings = useAppStore((s) => s.settings);

  const order = useMemo(
    () => (data?.orders ?? []).find((o) => o.id === id || o.ticket.toLowerCase() === id.toLowerCase()),
    [data?.orders, id]
  );

  if (!order) {
    return (
      <PortalLayout title="Suivi de commande" nav={CLIENT_NAV}>
        <div className="card mx-auto mt-8 max-w-md p-8 text-center">
          <SearchX size={36} className="mx-auto text-slate-300" aria-hidden="true" />
          <p className="mt-4 text-sm font-semibold text-charcoal">Commande introuvable</p>
          <p className="mt-1 text-xs text-slate-500">Vérifiez le numéro de ticket reçu par SMS.</p>
        </div>
      </PortalLayout>
    );
  }

  const currentIdx = FLOW.indexOf(order.status);
  const balance = order.total - order.paidAmount;

  return (
    <PortalLayout
      title={`Suivi ${order.ticket}`}
      nav={CLIENT_NAV}
      identity={data ? { name: data.name, sub: data.phone } : undefined}
      onExit={() => {
        clear();
        navigate('/client/access', { replace: true });
      }}
      exitLabel="Quitter l'espace"
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
        {/* ── Colonne principale ── */}
        <div>
          {/* Barre de progression */}
          <div className="card mb-5 p-5" role="progressbar" aria-valuenow={currentIdx + 1} aria-valuemin={1} aria-valuemax={4} aria-label="Progression de la commande">
            <div className="flex justify-between">
              {STEPS.map((s, i) => (
                <div key={s.status} className="flex flex-col items-center">
                  <span
                    className={`flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold transition-colors ${
                      i <= currentIdx ? 'bg-primary text-white' : 'bg-slate-200 text-slate-400'
                    }`}
                  >
                    {i + 1}
                  </span>
                  <span className={`mt-1.5 text-center text-[10px] font-medium ${i <= currentIdx ? 'text-primary' : 'text-slate-400'}`}>
                    {ORDER_STATUS_LABELS[s.status]}
                  </span>
                </div>
              ))}
            </div>
            <div className="relative mt-3 h-1.5 rounded-full bg-slate-200">
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-primary transition-all"
                style={{ width: `${((currentIdx + 1) / 4) * 100}%` }}
              />
            </div>
          </div>

          {/* Timeline verticale */}
          <PortalSection title="Étapes">
            <div className="card p-5">
              <ol className="relative">
                {STEPS.map((s, i) => {
                  const event = order.statusHistory.find((h) => h.status === s.status);
                  const done = !!event;
                  return (
                    <li key={s.status} className="relative flex gap-4 pb-6 last:pb-0">
                      {i < STEPS.length - 1 && (
                        <span
                          className={`absolute top-8 left-[15px] h-[calc(100%-30px)] w-0.5 ${done && i < currentIdx ? 'bg-green-400' : 'bg-slate-200'}`}
                          aria-hidden="true"
                        />
                      )}
                      <span
                        className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 ${
                          done ? 'border-green-400 bg-green-400 text-white' : 'border-slate-200 bg-white text-slate-300'
                        }`}
                        aria-hidden="true"
                      >
                        {done ? <Check size={14} /> : <Circle size={10} />}
                      </span>
                      <div className="pt-1">
                        <p className={`text-sm font-semibold ${done ? 'text-charcoal' : 'text-slate-400'}`}>{ORDER_STATUS_LABELS[s.status]}</p>
                        <p className="mt-0.5 text-xs text-slate-400">{s.description}</p>
                        {event && <p className="mt-1 text-xs font-medium text-primary">{formatDateTime(event.date)}</p>}
                      </div>
                    </li>
                  );
                })}
              </ol>
            </div>
          </PortalSection>

          {/* Articles */}
          <PortalSection title="Vos articles">
            <div className="card divide-y divide-slate-50">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between px-4 py-3">
                  <p className="text-sm font-medium">
                    {item.type} <span className="text-slate-400">× {item.quantity}</span>
                  </p>
                  <p className="text-sm font-semibold">{formatFCFA(item.unitPrice * item.quantity)}</p>
                </div>
              ))}
              <div className="flex items-center justify-between bg-slate-50/60 px-4 py-3">
                <p className="text-sm font-semibold">Total</p>
                <p className="text-base font-bold text-primary">{formatFCFA(order.total)}</p>
              </div>
            </div>
          </PortalSection>
        </div>

        {/* ── Colonne latérale (résumé + actions) ── */}
        <aside className="space-y-5">
          <section className="card p-5" aria-label="Résumé de la commande">
            <h2 className="card-title mb-4">Résumé</h2>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-500">Ticket</dt>
                <dd className="font-bold text-charcoal">{order.ticket}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Commandée le</dt>
                <dd className="font-medium">{formatDate(order.createdAt)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Montant total</dt>
                <dd className="font-semibold">{formatFCFA(order.total)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Déjà payé</dt>
                <dd className="font-semibold text-green-600">{formatFCFA(order.paidAmount)}</dd>
              </div>
              <div className="border-t border-dashed border-slate-200 pt-3">
                <div className="flex justify-between">
                  <dt className="font-semibold text-slate-600">Solde dû</dt>
                  <dd className={`text-lg font-bold ${balance > 0 ? 'text-red-500' : 'text-green-600'}`}>{formatFCFA(balance)}</dd>
                </div>
              </div>
            </dl>

            {/* Actions (desktop) */}
            <div className="mt-5 hidden space-y-2.5 md:block">
              {balance > 0 && (
                <Link to={`/client/pay/${order.id}`} className="btn-primary w-full">
                  <Wallet size={17} aria-hidden="true" />
                  Payer le solde — {formatFCFA(balance)}
                </Link>
              )}
              <a
                href={`tel:${(settings?.phone ?? '+22625304455').replace(/\s/g, '')}`}
                className="btn-secondary w-full"
              >
                <Phone size={17} aria-hidden="true" />
                Contacter le pressing
              </a>
            </div>
          </section>
        </aside>
      </div>

      {/* Actions (mobile) */}
      <div className="fixed inset-x-0 bottom-0 z-20 mx-auto max-w-lg space-y-2.5 border-t border-slate-200 bg-white/95 p-4 backdrop-blur md:hidden">
        {balance > 0 && (
          <Link to={`/client/pay/${order.id}`} className="btn-primary w-full !py-3">
            <Wallet size={17} aria-hidden="true" />
            Payer le solde — {formatFCFA(balance)}
          </Link>
        )}
        <a href={`tel:${(settings?.phone ?? '+22625304455').replace(/\s/g, '')}`} className="btn-secondary w-full !py-3">
          <Phone size={17} aria-hidden="true" />
          Contacter le pressing
        </a>
      </div>
    </PortalLayout>
  );
}
