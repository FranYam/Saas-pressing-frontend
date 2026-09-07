import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, MapPin, Clock3, PackageOpen, Timer, CheckCircle2, Inbox } from 'lucide-react';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { COURIER_NAV } from './CourierDashboardPage';
import { useAppStore } from '@/store/useAppStore';
import { useAuth } from '@/context/AuthContext';
import { StatCard } from '@/components/ui/StatCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { isToday } from '@/lib/format';

export default function MissionsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const missions = useAppStore((s) => s.missions);

  // Missions du jour : actives + celles terminées aujourd'hui
  const todays = useMemo(
    () =>
      missions
        .filter((m) => m.courierId === user?.id && (m.status !== 'terminee' || isToday(m.createdAt)))
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    [missions, user?.id]
  );

  const stats = useMemo(
    () => ({
      aFaire: todays.filter((m) => m.status === 'a_faire').length,
      enCours: todays.filter((m) => m.status === 'en_cours').length,
      terminees: todays.filter((m) => m.status === 'terminee').length
    }),
    [todays]
  );

  return (
    <PortalLayout title="Mes missions du jour" nav={COURIER_NAV} showBack={false}>
      {/* Stats */}
      <div className="mb-5 grid grid-cols-3 gap-3 md:max-w-xl md:gap-4">
        <StatCard icon={Inbox} label="À faire" value={String(stats.aFaire)} accent="orange" />
        <StatCard icon={Timer} label="En cours" value={String(stats.enCours)} accent="blue" />
        <StatCard icon={CheckCircle2} label="Terminées" value={String(stats.terminees)} accent="green" />
      </div>

      {/* Liste missions */}
      {todays.length === 0 ? (
        <div className="card">
          <EmptyState icon={PackageOpen} title="Aucune mission" message="Les missions du jour apparaîtront ici." />
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {todays.map((m) => (
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
                  <span className="ml-auto">
                    <StatusBadge variant={m.status} />
                  </span>
                </div>

                <div className="mt-3 space-y-1.5">
                  <p className="flex items-start gap-2 text-sm font-medium text-charcoal">
                    <MapPin size={15} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
                    {m.address}
                  </p>
                  <p className="flex items-center gap-2 text-xs text-slate-500">
                    <Clock3 size={13} aria-hidden="true" />
                    {m.slot}
                  </p>
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-slate-50 pt-3">
                  <span className="text-xs text-slate-400">{m.itemsCount} article{m.itemsCount > 1 ? 's' : ''}</span>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary">
                    Détails
                    <ArrowRight size={13} aria-hidden="true" />
                  </span>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </PortalLayout>
  );
}
