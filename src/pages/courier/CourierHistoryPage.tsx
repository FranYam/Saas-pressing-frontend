import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { History, MapPin, Package2, ChevronRight } from 'lucide-react';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { COURIER_NAV } from './CourierDashboardPage';
import { useAuth } from '@/context/AuthContext';
import { useAppStore } from '@/store/useAppStore';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { dayLabel, formatTime, formatNumber } from '@/lib/format';

export default function CourierHistoryPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const missions = useAppStore((s) => s.missions);
  const clients = useAppStore((s) => s.clients);

  const doneMissions = useMemo(
    () =>
      missions
        .filter((m) => m.courierId === user?.id && m.status === 'terminee')
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [missions, user?.id]
  );

  // Regroupement par jour
  const groups = useMemo(() => {
    const map = new Map<string, typeof doneMissions>();
    for (const m of doneMissions) {
      const key = dayLabel(m.createdAt);
      const list = map.get(key) ?? [];
      list.push(m);
      map.set(key, list);
    }
    return [...map.entries()];
  }, [doneMissions]);

  const clientName = (id: string) => {
    const c = clients.find((cl) => cl.id === id);
    return c ? `${c.firstName} ${c.lastName}` : 'Client';
  };

  const totalArticles = doneMissions.reduce((s, m) => s + m.itemsCount, 0);

  return (
    <PortalLayout title="Historique" nav={COURIER_NAV} showBack={false}>
      <div className="mb-5">
        <h1 className="text-2xl font-semibold text-charcoal">Historique de mes missions</h1>
        <p className="mt-1 text-sm text-slate-500">
          {formatNumber(doneMissions.length)} mission{doneMissions.length > 1 ? 's' : ''} terminée{doneMissions.length > 1 ? 's' : ''} ·{' '}
          {formatNumber(totalArticles)} article{totalArticles > 1 ? 's' : ''} transporté{totalArticles > 1 ? 's' : ''}
        </p>
      </div>

      {doneMissions.length === 0 ? (
        <div className="card">
          <EmptyState icon={History} title="Aucune mission terminée" message="Vos missions accomplies apparaîtront ici." />
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map(([day, items]) => (
            <section key={day} aria-label={`Missions du ${day}`}>
              <h2 className="mb-3 text-xs font-semibold tracking-wide text-slate-500 uppercase">{day}</h2>
              <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                {items.map((m) => (
                  <li key={m.id}>
                    <button
                      type="button"
                      onClick={() => navigate(`/courier/missions/${m.id}`)}
                      className="card w-full p-4 text-left transition-shadow hover:shadow-card-hover"
                      aria-label={`Mission ${m.type} ${m.ticket}`}
                    >
                      <div className="flex items-center gap-2">
                        <StatusBadge variant={m.type} />
                        <span className="text-xs font-semibold text-slate-400">{m.ticket}</span>
                        <span className="ml-auto text-xs font-medium text-slate-400">{formatTime(m.createdAt)}</span>
                      </div>
                      <p className="mt-3 text-sm font-semibold text-charcoal">{clientName(m.clientId)}</p>
                      <p className="mt-1 flex items-start gap-1.5 text-xs text-slate-500">
                        <MapPin size={12} className="mt-0.5 shrink-0" aria-hidden="true" />
                        {m.address}, {m.sector}
                      </p>
                      <div className="mt-3 flex items-center justify-between border-t border-slate-50 pt-3">
                        <span className="flex items-center gap-1 text-xs text-slate-400">
                          <Package2 size={12} aria-hidden="true" />
                          {m.itemsCount} article{m.itemsCount > 1 ? 's' : ''}
                        </span>
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-600">
                          Terminée
                          <ChevronRight size={13} aria-hidden="true" />
                        </span>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </PortalLayout>
  );
}
