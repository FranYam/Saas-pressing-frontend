import { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Wallet,
  PackageOpen,
  AlertCircle,
  Shirt,
  ArrowRight,
  Plus,
  Clock,
  Phone,
  CheckCircle2,
  TrendingUp,
  Receipt,
  UserCheck,
  Search,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useAppStore } from '@/store/useAppStore';
import { PageHeader } from '@/components/ui/PageHeader';
import { KPICard } from '@/components/ui/KPICard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Avatar } from '@/components/ui/Avatar';
import { formatFCFA, formatRelative } from '@/lib/format';

export default function DashboardPage() {
  const { user } = useAuth();
  const orders = useAppStore((s) => s.orders);
  const clients = useAppStore((s) => s.clients);
  const payments = useAppStore((s) => s.payments);
  const summary = useAppStore((s) => s.dashboardSummary);
  const fetchSummary = useAppStore((s) => s.fetchDashboardSummary);

  const isGerant = user?.role === 'gerant';

  useEffect(() => {
    if (isGerant) {
      void fetchSummary();
    }
  }, [isGerant, fetchSummary]);

  const clientById = useMemo(() => new Map(clients.map((c) => [c.id, c])), [clients]);

  // Calculs de secours si l'API summary n'est pas encore chargée ou pour les employés
  const localStats = useMemo(() => {
    const today = new Date().toDateString();
    const todayOrders = orders.filter((o) => new Date(o.createdAt).toDateString() === today);
    const caToday = payments
      .filter((p) => new Date(p.date).toDateString() === today && p.status === 'reussi')
      .reduce((sum, p) => sum + p.amount, 0);

    const caMonth = payments
      .filter((p) => {
        const d = new Date(p.date);
        const now = new Date();
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() && p.status === 'reussi';
      })
      .reduce((sum, p) => sum + p.amount, 0);

    const pending = orders.filter((o) => o.status === 'recu' || o.status === 'traitement').length;
    const ready = orders.filter((o) => o.status === 'pret').length;

    const totalDue = orders.reduce((sum, o) => sum + o.total, 0);
    const totalPaid = orders.reduce((sum, o) => sum + o.paidAmount, 0);
    const creances = Math.max(0, totalDue - totalPaid);

    const debtors = new Set(orders.filter((o) => o.paidAmount < o.total).map((o) => o.clientId)).size;

    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const unclaimed = orders
      .filter((o) => o.status === 'pret' && new Date(o.createdAt).getTime() < cutoff)
      .map((o) => {
        const c = clientById.get(o.clientId);
        return {
          id: o.id,
          ticket_number: o.ticket,
          client_name: c ? `${c.firstName} ${c.lastName}` : 'Client',
          client_phone: c?.phone ?? '',
          ready_since: o.createdAt,
          days_waiting: Math.floor((Date.now() - new Date(o.createdAt).getTime()) / (24 * 60 * 60 * 1000)),
        };
      });

    return {
      revenueToday: caToday,
      revenueMonth: caMonth,
      ordersToday: todayOrders.length,
      ordersInProgress: pending,
      ordersReady: ready,
      outstandingDebts: creances,
      debtorsCount: debtors,
      unclaimed,
    };
  }, [orders, payments, clientById]);

  // Valeurs consolidées prioritaires depuis le backend /api/dashboard/summary/
  const revenueToday = summary?.revenue_today ? parseFloat(summary.revenue_today) : localStats.revenueToday;
  const revenueMonth = summary?.revenue_month ? parseFloat(summary.revenue_month) : localStats.revenueMonth;
  const ordersToday = summary?.orders_today ?? localStats.ordersToday;
  const ordersInProgress = summary?.orders_in_progress ?? localStats.ordersInProgress;
  const ordersReady = summary?.orders_ready ?? localStats.ordersReady;
  const outstandingDebts = summary?.outstanding_debts ? parseFloat(summary.outstanding_debts) : localStats.outstandingDebts;
  const debtorsCount = summary?.debtors_count ?? localStats.debtorsCount;
  const unclaimedList = summary?.unclaimed && summary.unclaimed.length > 0 ? summary.unclaimed : localStats.unclaimed;

  const recentOrders = useMemo(
    () => [...orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 6),
    [orders]
  );

  const recentPayments = useMemo(
    () => [...payments].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5),
    [payments]
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tableau de bord"
        subtitle={
          isGerant
            ? `Vue d'ensemble de l'activité financière et logistique de votre pressing.`
            : `Gestion opérationnelle du comptoir et suivi des vêtements confiés.`
        }
        actions={
          <div className="flex items-center gap-2.5">
            <Link to="/orders/new" className="btn-primary">
              <Plus size={16} aria-hidden="true" />
              Nouvelle commande
            </Link>
          </div>
        }
      />

      {/* Cartes KPI */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isGerant ? (
          <>
            <KPICard
              icon={Wallet}
              label="Chiffre d'affaires (Aujourd'hui)"
              value={formatFCFA(revenueToday)}
              accent="primary"
            />
            <KPICard
              icon={TrendingUp}
              label="CA du mois en cours"
              value={formatFCFA(revenueMonth)}
              accent="green"
            />
            <KPICard
              icon={AlertCircle}
              label={`Créances impayées (${debtorsCount} client${debtorsCount > 1 ? 's' : ''})`}
              value={formatFCFA(outstandingDebts)}
              accent="red"
            />
            <KPICard
              icon={Shirt}
              label="Prêts à retirer au comptoir"
              value={String(ordersReady)}
              accent="blue"
            />
          </>
        ) : (
          <>
            <KPICard
              icon={Receipt}
              label="Dépôts aujourd'hui"
              value={String(ordersToday)}
              accent="primary"
            />
            <KPICard
              icon={CheckCircle2}
              label="Prêts pour retrait client"
              value={String(ordersReady)}
              accent="green"
            />
            <KPICard
              icon={PackageOpen}
              label="En cours de nettoyage / repassage"
              value={String(ordersInProgress)}
              accent="orange"
            />
            <KPICard
              icon={UserCheck}
              label="Clients dans le fichier"
              value={String(clients.length)}
              accent="blue"
            />
          </>
        )}
      </div>

      {/* Section Alerte Métier : Linge non réclamé (> 7 jours) */}
      {unclaimedList.length > 0 && (
        <section className="card border-amber-200/80 bg-amber-50/30 p-5" aria-label="Alertes linge non réclamé">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-200/60 pb-3">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-700">
                <Clock size={18} aria-hidden="true" />
              </span>
              <div>
                <h2 className="text-sm font-semibold text-navy">
                  Linge prêt non réclamé depuis plus de 7 jours ({unclaimedList.length})
                </h2>
                <p className="text-xs text-slate-500">
                  Ces articles encombrent les portants. Pensez à relancer les clients par téléphone ou SMS.
                </p>
              </div>
            </div>
            {isGerant && (
              <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                Priorité relance
              </span>
            )}
          </div>

          <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {unclaimedList.slice(0, 6).map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-lg border border-amber-200/80 bg-white p-3 shadow-xs"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-navy">{item.ticket_number}</span>
                    <span className="rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-700">
                      +{item.days_waiting} j
                    </span>
                  </div>
                  <p className="truncate text-xs text-slate-600">{item.client_name}</p>
                </div>
                {item.client_phone && (
                  <a
                    href={`tel:${item.client_phone}`}
                    className="ml-2 inline-flex items-center gap-1 rounded-md border border-slate-200 px-2.5 py-1 text-xs font-medium text-navy transition-colors hover:bg-slate-50"
                    title={`Appeler ${item.client_name}`}
                  >
                    <Phone size={12} aria-hidden="true" />
                    Appeler
                  </a>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Grille principale : Commandes récentes + Colonne secondaire */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Commandes récentes */}
        <section className="card overflow-hidden lg:col-span-2" aria-label="Commandes récentes">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div>
              <h2 className="card-title">Dernières commandes enregistrées</h2>
              <p className="text-xs text-slate-500">Flux d'activité récent au comptoir et en ligne</p>
            </div>
            <Link to="/orders" className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
              Tout voir <ArrowRight size={13} aria-hidden="true" />
            </Link>
          </div>

          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60">
                  <th className="table-th">Ticket</th>
                  <th className="table-th">Client</th>
                  <th className="table-th">Articles</th>
                  <th className="table-th">Statut</th>
                  <th className="table-th text-right">Montant</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-sm text-slate-400">
                      Aucune commande enregistrée pour le moment.
                    </td>
                  </tr>
                ) : (
                  recentOrders.map((o) => {
                    const c = clientById.get(o.clientId);
                    return (
                      <tr key={o.id} className="table-row-hover">
                        <td className="table-td font-semibold text-primary">
                          <Link to={`/orders/${o.id}`} className="hover:underline">
                            {o.ticket}
                          </Link>
                        </td>
                        <td className="table-td">
                          <div className="flex items-center gap-2">
                            {c && <Avatar firstName={c.firstName} lastName={c.lastName} size={26} />}
                            <span className="truncate font-medium text-navy">
                              {c ? `${c.firstName} ${c.lastName}` : 'Client'}
                            </span>
                          </div>
                        </td>
                        <td className="table-td text-slate-500">
                          {o.items.reduce((sum, i) => sum + i.quantity, 0)} pièce(s)
                        </td>
                        <td className="table-td">
                          <StatusBadge variant={o.status} />
                        </td>
                        <td className="table-td text-right font-semibold text-navy tabular-nums">
                          {formatFCFA(o.total)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Colonne latérale : Encaissements récents ou Actions rapides */}
        <div className="space-y-6">
          {/* Actions rapides */}
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-navy">Actions rapides</h3>
            <div className="mt-3 space-y-2">
              <Link
                to="/orders/new"
                className="flex items-center justify-between rounded-lg border border-slate-200/80 p-3 transition-colors hover:border-primary-300 hover:bg-primary-50/40"
              >
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50 text-primary">
                    <Plus size={16} />
                  </span>
                  <div>
                    <p className="text-sm font-medium text-navy">Nouvelle commande</p>
                    <p className="text-xs text-slate-500">Enregistrer un dépôt de linge</p>
                  </div>
                </div>
                <ArrowRight size={14} className="text-slate-400" />
              </Link>

              <Link
                to="/clients"
                className="flex items-center justify-between rounded-lg border border-slate-200/80 p-3 transition-colors hover:border-primary-300 hover:bg-primary-50/40"
              >
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50 text-primary">
                    <UserCheck size={16} />
                  </span>
                  <div>
                    <p className="text-sm font-medium text-navy">Répertoire clients</p>
                    <p className="text-xs text-slate-500">Recherche par numéro ou nom</p>
                  </div>
                </div>
                <ArrowRight size={14} className="text-slate-400" />
              </Link>

              <Link
                to="/orders"
                className="flex items-center justify-between rounded-lg border border-slate-200/80 p-3 transition-colors hover:border-primary-300 hover:bg-primary-50/40"
              >
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50 text-primary">
                    <Search size={16} />
                  </span>
                  <div>
                    <p className="text-sm font-medium text-navy">Rechercher un ticket</p>
                    <p className="text-xs text-slate-500">Retrouver une commande</p>
                  </div>
                </div>
                <ArrowRight size={14} className="text-slate-400" />
              </Link>
            </div>
          </div>

          {/* Règlements récents */}
          {isGerant && (
            <div className="card overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                <h3 className="text-sm font-semibold text-navy">Derniers règlements</h3>
                <Link to="/payments" className="text-xs font-semibold text-primary hover:underline">
                  Voir tout
                </Link>
              </div>
              <ul className="divide-y divide-slate-100">
                {recentPayments.length === 0 ? (
                  <li className="px-5 py-6 text-center text-xs text-slate-400">
                    Aucun paiement enregistré récemment
                  </li>
                ) : (
                  recentPayments.map((p) => (
                    <li key={p.id} className="flex items-center justify-between px-5 py-3">
                      <div>
                        <p className="text-sm font-semibold text-navy tabular-nums">
                          {formatFCFA(p.amount)}
                        </p>
                        <p className="text-xs text-slate-400">
                          {p.method === 'orange_money'
                            ? 'Orange Money'
                            : p.method === 'moov_money'
                            ? 'Moov Money'
                            : 'Espèces'} · {formatRelative(p.date)}
                        </p>
                      </div>
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                        Encaissé
                      </span>
                    </li>
                  ))
                )}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
