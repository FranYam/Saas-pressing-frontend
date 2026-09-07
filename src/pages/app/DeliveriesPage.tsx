import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Truck, Timer, CheckCircle2, Inbox, MapPin, UserRound, Clock3 } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import type { Mission } from '@/types';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Avatar } from '@/components/ui/Avatar';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatFCFA } from '@/lib/format';

export default function DeliveriesPage() {
  const missions = useAppStore((s) => s.missions);
  const employees = useAppStore((s) => s.employees);
  const clients = useAppStore((s) => s.clients);
  const orders = useAppStore((s) => s.orders);
  const assignCourier = useAppStore((s) => s.assignCourier);

  const [assignTarget, setAssignTarget] = useState<Mission | null>(null);
  const [selectedCourier, setSelectedCourier] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const coursiers = useMemo(() => employees.filter((e) => e.role === 'coursier' && e.active), [employees]);

  const stats = useMemo(() => {
    const by = (s: Mission['status']) => missions.filter((m) => m.status === s).length;
    return {
      aLivrer: by('a_faire'),
      enCours: by('en_cours'),
      livrees: by('terminee'),
      enAttenteCollecte: missions.filter((m) => m.type === 'collecte' && m.status !== 'terminee').length
    };
  }, [missions]);

  const courierName = (id: string | null) => {
    if (!id) return null;
    const e = employees.find((emp) => emp.id === id);
    if (!e) return null;
    const [first, ...rest] = e.fullName.split(' ');
    return { first, last: rest.join(' '), full: e.fullName };
  };

  const confirmAssign = async () => {
    if (!assignTarget || !selectedCourier) return;
    setSaving(true);
    try {
      await assignCourier(assignTarget.id, selectedCourier);
      setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader title="Gestion des livraisons" subtitle="Attribuez les collectes et livraisons à vos coursiers." />

      {/* Stats du jour */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard icon={Truck} label="À livrer" value={String(stats.aLivrer)} accent="orange" />
        <StatCard icon={Timer} label="En cours" value={String(stats.enCours)} accent="blue" />
        <StatCard icon={CheckCircle2} label="Terminées" value={String(stats.livrees)} accent="green" />
        <StatCard icon={Inbox} label="En attente de collecte" value={String(stats.enAttenteCollecte)} accent="violet" />
      </div>

      {/* Tableau missions */}
      <div className="card overflow-hidden">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="card-title">Missions du jour</h2>
        </div>
        {missions.length === 0 ? (
          <EmptyState icon={Truck} title="Aucune mission planifiée" message="Les demandes de collecte et livraison apparaîtront ici." />
        ) : (
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full min-w-[760px] text-left text-sm" aria-label="Liste des missions">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60">
                  {['Ticket', 'Type', 'Client', 'Adresse', 'Coursier', 'Créneau', 'Statut', ''].map((h) => (
                    <th key={h} scope="col" className="px-4 py-3 text-xs font-semibold tracking-wide text-slate-500 uppercase">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {missions.map((m) => {
                  const client = clients.find((c) => c.id === m.clientId);
                  const order = orders.find((o) => o.id === m.orderId);
                  const courier = courierName(m.courierId);
                  return (
                    <tr key={m.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3.5">
                        <Link to={`/orders/${m.orderId}`} className="font-semibold text-primary hover:underline">
                          {m.ticket}
                        </Link>
                      </td>
                      <td className="px-4 py-3.5">
                        <StatusBadge variant={m.type} />
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="leading-tight">
                          <p className="font-medium">{client ? `${client.firstName} ${client.lastName}` : '—'}</p>
                          {order && <p className="text-xs text-slate-400">{formatFCFA(order.total)}</p>}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                          <MapPin size={12} aria-hidden="true" /> {m.sector}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        {courier ? (
                          <div className="flex items-center gap-2">
                            <Avatar firstName={courier.first} lastName={courier.last} size={28} />
                            <span className="text-xs font-medium">{courier.full}</span>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-orange-500">
                            <UserRound size={13} aria-hidden="true" /> Non assigné
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                          <Clock3 size={12} aria-hidden="true" /> {m.slot}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <StatusBadge variant={m.status} />
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        {!m.courierId ? (
                          <button
                            type="button"
                            onClick={() => {
                              setSaved(false);
                              setSelectedCourier('');
                              setAssignTarget(m);
                            }}
                            className="btn-primary !px-3 !py-1.5 text-xs"
                          >
                            Attribuer
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setSaved(false);
                              setSelectedCourier(m.courierId ?? '');
                              setAssignTarget(m);
                            }}
                            className="btn-secondary !px-3 !py-1.5 text-xs"
                          >
                            Modifier
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal d'assignation */}
      <Modal
        open={!!assignTarget}
        onClose={() => setAssignTarget(null)}
        title={assignTarget?.courierId ? 'Modifier le coursier' : 'Attribuer un coursier'}
        footer={
          saved ? (
            <button type="button" className="btn-primary" onClick={() => setAssignTarget(null)}>
              Fermer
            </button>
          ) : (
            <>
              <button type="button" className="btn-secondary" onClick={() => setAssignTarget(null)}>
                Annuler
              </button>
              <button type="button" className="btn-primary" onClick={confirmAssign} disabled={!selectedCourier || saving}>
                {saving ? 'Attribution…' : 'Confirmer l’attribution'}
              </button>
            </>
          )
        }
      >
        {saved ? (
          <div className="py-3 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-50">
              <CheckCircle2 size={22} className="text-green-500" aria-hidden="true" />
            </div>
            <p className="text-sm font-semibold text-charcoal">Mission {assignTarget?.type === 'collecte' ? 'de collecte' : 'de livraison'} attribuée</p>
            <p className="mt-1 text-xs text-slate-500">Le coursier verra la mission dans son application.</p>
          </div>
        ) : (
          assignTarget && (
            <div className="space-y-4">
              <div className="rounded-lg bg-slate-50 p-3.5 text-sm">
                <p className="font-semibold text-charcoal">
                  {assignTarget.type === 'collecte' ? 'Collecte' : 'Livraison'} — {assignTarget.ticket}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {assignTarget.address}, {assignTarget.sector} · {assignTarget.slot}
                </p>
              </div>
              <fieldset>
                <legend className="label-base">Sélectionner un coursier</legend>
                <div className="space-y-2">
                  {coursiers.map((c) => {
                    const [first, ...rest] = c.fullName.split(' ');
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setSelectedCourier(c.id)}
                        aria-pressed={selectedCourier === c.id}
                        className={`flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left transition-colors ${
                          selectedCourier === c.id ? 'border-primary bg-primary-50' : 'border-slate-200 hover:border-primary-300'
                        }`}
                      >
                        <Avatar firstName={first} lastName={rest.join(' ')} size={36} />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-charcoal">{c.fullName}</p>
                          <p className="text-xs text-slate-400">{c.phone}</p>
                        </div>
                        <span
                          className={`h-4 w-4 rounded-full border-2 ${selectedCourier === c.id ? 'border-primary bg-primary' : 'border-slate-300'}`}
                          aria-hidden="true"
                        />
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            </div>
          )
        )}
      </Modal>

    </div>
  );
}
