import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import {
  Wallet,
  PackageOpen,
  AlertCircle,
  Shirt,
  ArrowRight,
  ChevronRight,
  Plus,
  CalendarDays
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useAppStore } from '@/store/useAppStore';
import { PageHeader } from '@/components/ui/PageHeader';
import { KPICard } from '@/components/ui/KPICard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Avatar } from '@/components/ui/Avatar';
import { IconBadge } from '@/components/ui/IconBadge';
import { formatFCFA, formatDateShort, formatRelative } from '@/lib/format';

const SHORT_DAYS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

export default function DashboardPage() {
  const { user } = useAuth();
  const orders = useAppStore((s) => s.orders);
  const clients = useAppStore((s) => s.clients);

  const isGerant = user?.role === 'gerant';

  const stats = useMemo(() => {
    const today = new Date().toDateString();
    const todayOrders = orders.filter((o) => new Date(o.createdAt).toDateString() === today);
    const caToday = todayOrders.reduce((sum, o) => sum + o.paidAmount, 0);
    const pending = orders.filter((o) => o.status === 'recu' || o.status === 'traitement').length;
    const creances = orders
      .filter((o) => o.paidAmount < o.total)
      .reduce((sum, o) => sum + (o.total - o.paidAmount), 0);
    const unclaimed = orders
      .filter((o) => o.status === 'pret' && !o.claimed)
      .reduce((sum, o) => sum + o.items.reduce((n, i) => n + i.quantity, 0), 0);

    // CA des 7 derniers jours
    const chart = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const key = d.toDateString();
      const amount = orders
        .filter((o) => new Date(o.createdAt).toDateString() === key)
        .reduce((sum, o) => sum + o.paidAmount, 0);
      return { jour: SHORT_DAYS[d.getDay()], ca: amount };
    });

    const recent = [...orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5);

    const creanceList = orders
      .filter((o) => o.paidAmount < o.total)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      .slice(0, 4);

    return { caToday, pending, creances, unclaimed, chart, recent, creanceList };
  }, [orders]);

  const clientName = (id: string) => clients.find((c) => c.id === id);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tableau de bord"
        subtitle={
          isGerant
            ? `Bonjour ${user?.fullName.split(' ')[0]}, voici l'activité de votre pressing aujourd'hui.`
            : `Bonjour ${user?.fullName.split(' ')[0]}, voici l'activité de l'équipe aujourd'hui.`
        }
        actions={
          isGerant && (
            <Link to="/orders/new" className="btn-primary">
              <Plus size={17} aria-hidden="true" />
              Nouvelle commande
            </Link>
          )
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {isGerant && <KPICard icon={Wallet} label="CA du jour" value={formatFCFA(stats.caToday)} trend={12} accent="green" />}
        {isGerant && <KPICard icon={AlertCircle} label="Créances en cours" value={formatFCFA(stats.creances)} trend={-4} accent="red" />}
        <KPICard icon={PackageOpen} label="Commandes en attente" value={String(stats.pending)} accent="blue" />
        <KPICard icon={Shirt} label="Vêtements non réclamés" value={String(stats.unclaimed)} accent="orange" />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Graphique CA */}
        {isGerant && (
          <section className="card xl:col-span-2" aria-label="Chiffre d'affaires des 7 derniers jours">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-5 py-4">
              <h2 className="card-title">Chiffre d'affaires</h2>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary">
                <CalendarDays size={13} aria-hidden="true" />
                7 derniers jours
              </span>
            </div>
            <div className="h-72 px-4 py-5">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.chart} margin={{ top: 5, right: 5, left: 5, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="jour" tickLine={false} axisLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: '#64748B', fontSize: 11 }}
                    tickFormatter={(v: number) => (v >= 1000 ? `${Math.round(v / 1000)}k` : String(v))}
                    width={36}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(199, 91, 57, 0.06)' }}
                    formatter={(value) => [formatFCFA(Number(value)), 'Encaissé']}
                    labelStyle={{ fontWeight: 600, color: '#1E293B' }}
                    contentStyle={{ borderRadius: 12, border: '1px solid #E2E8F0', fontSize: 13 }}
                  />
                  <Bar dataKey="ca" fill="#C75B39" radius={[6, 6, 0, 0]} maxBarSize={44} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
        )}

        {/* Créances */}
        {isGerant && (
          <section className="card h-fit" aria-label="Créances en cours">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h2 className="card-title">Créances en cours</h2>
              <Link to="/payments" className="flex items-center text-xs font-semibold text-primary hover:underline">
                Tout voir <ChevronRight size={14} aria-hidden="true" />
              </Link>
            </div>
            <ul className="divide-y divide-slate-50">
              {stats.creanceList.map((o) => {
                const c = clientName(o.clientId);
                return (
                  <li key={o.id}>
                    <Link to={`/orders/${o.id}`} className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-primary-50/40">
                      {c && <Avatar firstName={c.firstName} lastName={c.lastName} size={36} />}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-charcoal">{c ? `${c.firstName} ${c.lastName}` : 'Client'}</p>
                        <p className="text-xs text-slate-400">
                          {o.ticket} · {formatRelative(o.createdAt)}
                        </p>
                      </div>
                      <span className="text-sm font-semibold text-red-500 tabular-nums">{formatFCFA(o.total - o.paidAmount)}</span>
                    </Link>
                  </li>
                );
              })}
              {stats.creanceList.length === 0 && (
                <li className="flex items-center gap-3 px-5 py-8 text-sm text-slate-400">
                  <IconBadge icon={AlertCircle} accent="green" size="sm" />
                  Aucune créance en cours
                </li>
              )}
            </ul>
          </section>
        )}
      </div>

      {/* Commandes récentes */}
      <section className="card overflow-hidden" aria-label="Commandes récentes">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="card-title">Commandes récentes</h2>
          <Link to="/orders" className="flex items-center text-xs font-semibold text-primary hover:underline">
            Voir toutes les commandes <ArrowRight size={14} aria-hidden="true" />
          </Link>
        </div>
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full min-w-[600px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60">
                {['Ticket', 'Client', 'Articles', 'Montant', 'Statut', 'Date'].map((h) => (
                  <th key={h} scope="col" className="px-4 py-3 text-xs font-semibold tracking-wide text-slate-500 uppercase">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {stats.recent.map((o) => {
                const c = clientName(o.clientId);
                const articles = o.items.reduce((n, i) => n + i.quantity, 0);
                return (
                  <tr key={o.id} className="transition-colors hover:bg-primary-50/40">
                    <td className="px-4 py-3.5">
                      <Link to={`/orders/${o.id}`} className="font-semibold text-primary hover:underline">
                        {o.ticket}
                      </Link>
                    </td>
                    <td className="px-4 py-3.5">
                      {c ? (
                        <div className="flex items-center gap-2.5">
                          <Avatar firstName={c.firstName} lastName={c.lastName} size={30} />
                          <span className="font-medium">
                            {c.firstName} {c.lastName}
                          </span>
                        </div>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-slate-500">
                      {articles} article{articles > 1 ? 's' : ''}
                    </td>
                    <td className="px-4 py-3.5 font-semibold tabular-nums">{formatFCFA(o.total)}</td>
                    <td className="px-4 py-3.5">
                      <StatusBadge variant={o.status} />
                    </td>
                    <td className="px-4 py-3.5 text-slate-500">{formatDateShort(o.createdAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
