import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Phone, MessageSquareText, MapPin, Package2, StickyNote, Play, CheckCircle2, SearchX, ArrowLeft } from 'lucide-react';
import { PortalLayout, PortalSection } from '@/components/layout/PortalLayout';
import { COURIER_NAV } from './CourierDashboardPage';
import { useAppStore } from '@/store/useAppStore';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import type { MissionStatus } from '@/types';
import { formatDateTime } from '@/lib/format';

export default function MissionDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const missions = useAppStore((s) => s.missions);
  const clients = useAppStore((s) => s.clients);
  const orders = useAppStore((s) => s.orders);
  const updateMissionStatus = useAppStore((s) => s.updateMissionStatus);

  const [busy, setBusy] = useState(false);

  const mission = missions.find((m) => m.id === id);
  const client = mission ? clients.find((c) => c.id === mission.clientId) : undefined;
  const order = mission ? orders.find((o) => o.id === mission.orderId) : undefined;

  const articles = useMemo(() => {
    if (!mission || !order) return mission ? [{ name: 'Vêtements', quantity: mission.itemsCount }] : [];
    return order.items.map((i) => ({ name: i.type, quantity: i.quantity }));
  }, [mission, order]);

  if (!mission) {
    return (
      <PortalLayout title="Mission" nav={COURIER_NAV}>
        <div className="card mx-auto mt-8 max-w-md p-8 text-center">
          <SearchX size={36} className="mx-auto text-slate-300" aria-hidden="true" />
          <p className="mt-4 text-sm font-semibold text-charcoal">Mission introuvable</p>
        </div>
      </PortalLayout>
    );
  }

  const nextStatus: Record<MissionStatus, { next: MissionStatus | null; label: string }> = {
    a_faire: { next: 'en_cours', label: mission.type === 'collecte' ? 'Démarrer la collecte' : 'Démarrer la livraison' },
    en_cours: { next: 'terminee', label: mission.type === 'collecte' ? 'Confirmer la collecte' : 'Confirmer la livraison' },
    terminee: { next: null, label: 'Mission terminée' }
  };
  const action = nextStatus[mission.status];

  const advance = async () => {
    if (!action.next) return;
    setBusy(true);
    try {
      await updateMissionStatus(mission.id, action.next);
    } finally {
      setBusy(false);
    }
  };

  const actionButtons = action.next ? (
    <>
      <button type="button" onClick={advance} className="btn-primary w-full !py-3.5" disabled={busy}>
        {busy ? (
          <LoadingSpinner size={17} />
        ) : mission.status === 'a_faire' ? (
          <Play size={17} aria-hidden="true" />
        ) : (
          <CheckCircle2 size={17} aria-hidden="true" />
        )}
        {busy ? 'Mise à jour…' : action.label}
      </button>
      <button type="button" onClick={() => navigate('/courier/missions')} className="btn-ghost mt-1 w-full justify-center">
        <ArrowLeft size={15} aria-hidden="true" />
        Retour aux missions
      </button>
    </>
  ) : (
    <div className="space-y-2">
      <div className="flex items-center justify-center gap-2 rounded-lg bg-green-50 py-3.5 text-sm font-semibold text-green-600">
        <CheckCircle2 size={17} aria-hidden="true" />
        Mission terminée — merci !
      </div>
      <p className="text-center text-xs text-slate-400">Terminée le {formatDateTime(mission.createdAt)}</p>
    </div>
  );

  return (
    <PortalLayout title={`Mission ${mission.ticket}`} nav={COURIER_NAV}>
      <div className="mb-4 flex items-center gap-2">
        <StatusBadge variant={mission.type} />
        <StatusBadge variant={mission.status} />
        <span className="ml-auto text-xs font-semibold text-slate-400">{mission.slot}</span>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Colonne gauche : client + itinéraire */}
        <div>
          <PortalSection title="Client">
            <div className="card p-4">
              <div className="flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-charcoal">
                    {client ? `${client.firstName} ${client.lastName}` : 'Client'}
                  </p>
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
                    <MapPin size={12} aria-hidden="true" /> {mission.address}, {mission.sector}
                  </p>
                </div>
                <div className="flex gap-2">
                  <a
                    href={`tel:${(client?.phone ?? '').replace(/\s/g, '')}`}
                    className="flex h-11 w-11 items-center justify-center rounded-full bg-green-50 text-green-600 transition-colors hover:bg-green-100"
                    aria-label="Appeler le client"
                  >
                    <Phone size={18} />
                  </a>
                  <a
                    href={`sms:${(client?.phone ?? '').replace(/\s/g, '')}`}
                    className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-50 text-primary transition-colors hover:bg-primary-100"
                    aria-label="Envoyer un SMS au client"
                  >
                    <MessageSquareText size={18} />
                  </a>
                </div>
              </div>
            </div>
          </PortalSection>

          <PortalSection title="Itinéraire">
            <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-charcoal">
              <div className="pointer-events-none absolute -top-10 -right-10 h-40 w-40 rounded-full bg-primary/20 blur-2xl" aria-hidden="true" />
              <div className="relative p-4">
                <p className="flex items-center gap-2 text-sm font-semibold text-white">
                  <MapPin size={15} className="text-primary-300" aria-hidden="true" />
                  {mission.sector}, Ouagadougou
                </p>
                <p className="mt-1 text-xs text-slate-300">{mission.address}</p>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${mission.address}, ${mission.sector}, Ouagadougou`)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-primary mt-4 w-full !py-2.5 text-xs"
                >
                  <MapPin size={14} aria-hidden="true" />
                  Ouvrir dans Google Maps
                </a>
              </div>
            </div>
          </PortalSection>
        </div>

        {/* Colonne droite : articles + notes + action desktop */}
        <div>
          <PortalSection title="Articles">
            <div className="card divide-y divide-slate-50">
              {articles.map((a, i) => (
                <div key={`${a.name}-${i}`} className="flex items-center gap-3 px-4 py-3">
                  <Package2 size={16} className="text-slate-400" aria-hidden="true" />
                  <p className="flex-1 text-sm font-medium">{a.name}</p>
                  <p className="text-sm text-slate-500">× {a.quantity}</p>
                </div>
              ))}
              {order && (
                <div className="flex items-center justify-between bg-slate-50/60 px-4 py-3">
                  <p className="text-xs text-slate-500">Montant de la commande</p>
                  <p className="text-sm font-bold text-primary">
                    {new Intl.NumberFormat('fr-FR').format(order.total)} FCFA
                  </p>
                </div>
              )}
            </div>
          </PortalSection>

          {mission.notes && (
            <PortalSection title="Note du client">
              <div className="card flex items-start gap-3 p-4">
                <StickyNote size={16} className="mt-0.5 shrink-0 text-orange-400" aria-hidden="true" />
                <p className="text-sm leading-relaxed text-slate-600">{mission.notes}</p>
              </div>
            </PortalSection>
          )}

          {/* Action (desktop) */}
          <div className="mt-6 hidden md:block">{actionButtons}</div>
        </div>
      </div>

      {/* Action (mobile) */}
      <div className="fixed inset-x-0 bottom-0 z-20 mx-auto max-w-lg space-y-1 border-t border-slate-200 bg-white/95 p-4 backdrop-blur md:hidden">
        {actionButtons}
      </div>
    </PortalLayout>
  );
}
