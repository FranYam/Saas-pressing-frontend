import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  MapPinned,
  History,
  Inbox,
  Timer,
  CheckCircle2,
  ChevronRight,
  MapPin,
  Clock3,
  Phone,
  Bike
} from 'lucide-react';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { PortalHero } from '@/components/layout/PortalHero';
import { useAuth } from '@/context/AuthContext';
import { useAppStore } from '@/store/useAppStore';
import { StatCard } from '@/components/ui/StatCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import type { Mission } from '@/types';
import { isToday, formatRelative } from '@/lib/format';

export const COURIER_NAV = [
  { to: '/courier/dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
  { to: '/courier/missions', label: 'Missions du jour', icon: MapPinned },
  { to: '/courier/history', label: 'Historique', icon: History }
];

export default function CourierDashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const missions = useAppStore((s) => s.missions);
  const settings = useAppStore((s) => s.settings);

  const myMissions = useMemo(
    () => missions.filter((m) => m.courierId === user?.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [missions, user?.id]
  );

  const todays = myMissions.filter((m) => m.status !== 'terminee' || isToday(m.createdAt));
  const pending = todays.filter((m) => m.status !== 'terminee');
  const weekDone = myMissions.filter((m) => m.status === 'terminee').length;

  const today = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <PortalLayout title="Tableau de bord" nav={COURIER_NAV} showBack={false}>
      {/* Bandeau */}
      <PortalHero
        icon={Bike}
        title={today.charAt(0).toUpperCase() + today.slice(1)}
        subtitle={
          pending.length > 0
            ? `${pending.length} mission${pending.length > 1 ? 's' : ''} à traiter. Bonne route.`
            : 'Toutes vos missions du jour sont terminées. Beau travail.'
        }
        action={
          <Link to="/courier/missions" className="btn-primary shrink-0">
            <MapPinned size={16} aria-hidden="true" />
            Voir mes missions
          </Link>
        }
      />

      {/* KPIs */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard icon={Inbox} label="À faire aujourd'hui" value={String(todays.filter((m) => m.status === 'a_faire').length)} accent="orange" />
        <StatCard icon={Timer} label="En cours" value={String(todays.filter((m) => m.status === 'en_cours').length)} accent="blue" />
        <StatCard icon={CheckCircle2} label="Terminées cette semaine" value={String(weekDone)} accent="green" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
        {/* Missions à traiter */}
        <section aria-label="Missions à traiter">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="card-title">Missions à traiter</h2>
            <Link to="/courier/missions" className="flex items-center text-xs font-semibold text-primary hover:underline">
              Tout voir <ChevronRight size={14} aria-hidden="true" />
            </Link>
          </div>

          {pending.length === 0 ? (
            <div className="card">
              <EmptyState
                icon={CheckCircle2}
                title="Rien à traiter"
                message="Aucune mission en attente. Consultez votre historique."
                action={
                  <Link to="/courier/history" className="btn-secondary">
                    <History size={16} aria-hidden="true" />
                    Voir l'historique
                  </Link>
                }
              />
            </div>
          ) : (
            <ul className="space-y-3 md:grid md:grid-cols-2 md:gap-3 md:space-y-0 xl:grid-cols-2">
              {pending.map((m) => (
                <PendingMissionCard key={m.id} mission={m} onClick={() => navigate(`/courier/missions/${m.id}`)} />
              ))}
            </ul>
          )}
        </section>

        {/* Colonne latérale */}
        <div className="space-y-6">
          <section className="card p-5" aria-label="Résumé de journée">
            <h2 className="card-title mb-4">Votre journée</h2>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-500">Missions du jour</dt>
                <dd className="font-semibold">{todays.length}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Terminées aujourd'hui</dt>
                <dd className="font-semibold text-green-600">{todays.filter((m) => m.status === 'terminee').length}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Restantes</dt>
                <dd className="font-semibold text-orange-500">{pending.length}</dd>
              </div>
            </dl>
          </section>

          <section className="card p-5" aria-label="Contact pressing">
            <h2 className="card-title mb-3">Besoin d'aide ?</h2>
            <p className="text-xs leading-relaxed text-slate-500">{settings?.name}</p>
            <a
              href={`tel:${(settings?.phone ?? '+22625304455').replace(/\s/g, '')}`}
              className="btn-secondary mt-4 w-full"
            >
              <Phone size={16} aria-hidden="true" />
              Appeler le pressing
            </a>
          </section>
        </div>
      </div>
    </PortalLayout>
  );
}

function PendingMissionCard({ mission, onClick }: { mission: Mission; onClick: () => void }) {
  return (
    <li className="card p-4">
      <button type="button" onClick={onClick} className="w-full text-left" aria-label={`Mission ${mission.type} ${mission.ticket}`}>
        <div className="flex items-center gap-2">
          <StatusBadge variant={mission.type} />
          <span className="text-xs font-semibold text-slate-400">{mission.ticket}</span>
          <span className="ml-auto">
            <StatusBadge variant={mission.status} />
          </span>
        </div>
        <div className="mt-3 space-y-1.5">
          <p className="flex items-start gap-2 text-sm font-medium text-charcoal">
            <MapPin size={15} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
            {mission.address}
          </p>
          <p className="flex items-center gap-2 text-xs text-slate-500">
            <Clock3 size={13} aria-hidden="true" />
            {mission.slot}
          </p>
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-slate-50 pt-3">
          <span className="text-xs text-slate-400">
            {mission.itemsCount} article{mission.itemsCount > 1 ? 's' : ''} · {formatRelative(mission.createdAt)}
          </span>
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary">
            Détails <ChevronRight size={13} aria-hidden="true" />
          </span>
        </div>
      </button>
    </li>
  );
}
