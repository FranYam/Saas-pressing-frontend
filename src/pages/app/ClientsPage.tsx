import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Users, Eye, UserPlus, CheckCircle2 } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import type { Client } from '@/types';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { SearchInput } from '@/components/ui/SearchInput';
import { Avatar } from '@/components/ui/Avatar';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageHeader } from '@/components/ui/PageHeader';
import { Modal } from '@/components/ui/Modal';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { TextField, PhoneInput } from '@/components/forms/FormFields';
import { formatFCFA, formatDateShort } from '@/lib/format';

// ─── Formulaire d'inscription d'un client ────────────────────────────────────

const clientSchema = z.object({
  fullName: z.string().min(3, 'Le nom complet est requis.'),
  phone: z.string().min(8, 'Numéro de téléphone invalide.')
});

type ClientForm = z.infer<typeof clientSchema>;

function ClientFormModal({ onClose }: { onClose: () => void }) {
  const createClient = useAppStore((s) => s.createClient);
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState<Client | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm<ClientForm>({
    resolver: zodResolver(clientSchema),
    defaultValues: { fullName: '', phone: '+226 ' }
  });

  const phone = watch('phone');

  const onSubmit = handleSubmit(async (values) => {
    setServerError('');
    setSubmitting(true);
    try {
      const client = await createClient(values.fullName.trim(), values.phone);
      setCreated(client);
    } catch (err) {
      const axiosErr = err as { response?: { data?: Record<string, string | string[]> } };
      const details = axiosErr?.response?.data;
      const first = details ? Object.values(details)[0] : undefined;
      setServerError(
        (Array.isArray(first) ? first[0] : first) ??
          (err instanceof Error ? err.message : 'Impossible de créer le client. Réessayez.')
      );
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <Modal
      open={true}
      onClose={onClose}
      title={created ? 'Client enregistré' : 'Inscrire un nouveau client'}
      size="sm"
      footer={
        created ? (
          <button type="button" className="btn-primary w-full" onClick={onClose}>
            Fermer
          </button>
        ) : (
          <>
            <button type="button" className="btn-secondary" onClick={onClose} disabled={submitting}>
              Annuler
            </button>
            <button type="button" className="btn-primary" onClick={() => void onSubmit()} disabled={submitting}>
              {submitting ? <LoadingSpinner size={16} /> : <UserPlus size={16} aria-hidden="true" />}
              {submitting ? 'Enregistrement…' : 'Enregistrer le client'}
            </button>
          </>
        )
      }
    >
      {created ? (
        <div className="py-2 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-green-50">
            <CheckCircle2 size={26} className="text-green-500" aria-hidden="true" />
          </div>
          <p className="text-sm font-semibold text-charcoal">
            {created.firstName} {created.lastName} a été enregistré
          </p>
          <p className="mt-1 text-xs text-slate-500">Vous pouvez dès maintenant lui créer une commande au comptoir.</p>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          {serverError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600" role="alert">
              {serverError}
            </div>
          )}
          <TextField
            label="Nom complet"
            placeholder="Ex : Mariam Traoré"
            required
            error={errors.fullName?.message}
            {...register('fullName')}
          />
          <PhoneInput
            label="Téléphone"
            value={phone}
            onValueChange={(v) => setValue('phone', v, { shouldValidate: true })}
            error={errors.phone?.message}
            required
          />
          <p className="text-xs leading-relaxed text-slate-400">
            Le numéro de téléphone permet de retrouver le client lors de la création d'une commande.
          </p>
        </form>
      )}
    </Modal>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ClientsPage() {
  const navigate = useNavigate();
  const clients = useAppStore((s) => s.clients);
  const orders = useAppStore((s) => s.orders);
  const [query, setQuery] = useState('');
  const [formOpen, setFormOpen] = useState(false);

  const stats = useMemo(() => {
    const map = new Map<string, { orders: number; creance: number; lastVisit: string | null }>();
    for (const c of clients) map.set(c.id, { orders: 0, creance: 0, lastVisit: null });
    for (const o of orders) {
      const s = map.get(o.clientId);
      if (!s) continue;
      s.orders++;
      s.creance += Math.max(0, o.total - o.paidAmount);
      if (!s.lastVisit || o.createdAt > s.lastVisit) s.lastVisit = o.createdAt;
    }
    return map;
  }, [clients, orders]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter(
      (c) =>
        `${c.firstName} ${c.lastName}`.toLowerCase().includes(q) ||
        c.phone.replace(/\s/g, '').includes(q.replace(/\s/g, ''))
    );
  }, [clients, query]);

  const columns: Column<Client>[] = [
    {
      key: 'name',
      header: 'Client',
      sortValue: (c) => c.lastName,
      render: (c) => (
        <div className="flex items-center gap-3">
          <Avatar firstName={c.firstName} lastName={c.lastName} size={38} />
          <div className="leading-tight">
            <p className="font-medium">
              {c.firstName} {c.lastName}
            </p>
            <p className="text-xs text-slate-400">{c.phone}</p>
          </div>
        </div>
      )
    },
    {
      key: 'sector',
      header: 'Secteur',
      sortValue: (c) => c.sector,
      render: (c) => <span className="text-slate-500">{c.sector}</span>
    },
    {
      key: 'orders',
      header: 'Commandes',
      sortValue: (c) => stats.get(c.id)?.orders ?? 0,
      render: (c) => {
        const n = stats.get(c.id)?.orders ?? 0;
        return <span className="font-semibold">{n}</span>;
      }
    },
    {
      key: 'creance',
      header: 'Créance en cours',
      sortValue: (c) => stats.get(c.id)?.creance ?? 0,
      render: (c) => {
        const creance = stats.get(c.id)?.creance ?? 0;
        return creance > 0 ? <span className="font-semibold text-red-500">{formatFCFA(creance)}</span> : <span className="text-xs text-slate-400">Aucune</span>;
      }
    },
    {
      key: 'lastVisit',
      header: 'Dernière visite',
      sortValue: (c) => stats.get(c.id)?.lastVisit ?? '',
      render: (c) => {
        const last = stats.get(c.id)?.lastVisit;
        return <span className="text-slate-500">{last ? formatDateShort(last) : '—'}</span>;
      }
    },
    {
      key: 'actions',
      header: '',
      headerClassName: 'text-right',
      className: 'text-right',
      render: (c) => (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/clients/${c.id}`);
          }}
          className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-primary-50 hover:text-primary"
          aria-label={`Voir la fiche de ${c.firstName} ${c.lastName}`}
          title="Voir la fiche"
        >
          <Eye size={16} />
        </button>
      )
    }
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Gestion des clients"
        subtitle="Retrouvez l'historique et les créances de chaque client."
        actions={
          <button type="button" className="btn-primary" onClick={() => setFormOpen(true)}>
            <UserPlus size={17} aria-hidden="true" />
            Nouveau client
          </button>
        }
      />

      {formOpen && <ClientFormModal onClose={() => setFormOpen(false)} />}

      <div className="card">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4">
          <SearchInput value={query} onChange={(e) => setQuery(e.target.value)} onClear={() => setQuery('')} placeholder="Rechercher un client par nom ou téléphone…" className="w-full max-w-md" />
          <p className="text-xs text-slate-400">
            {filtered.length} client{filtered.length > 1 ? 's' : ''}
          </p>
        </div>
        <DataTable
          columns={columns}
          data={filtered}
          rowKey={(c) => c.id}
          onRowClick={(c) => navigate(`/clients/${c.id}`)}
          ariaLabel="Liste des clients"
          mobileCard={(c) => {
            const s = stats.get(c.id);
            return (
              <div className="px-4 py-3.5">
                <div className="flex items-center gap-3">
                  <Avatar firstName={c.firstName} lastName={c.lastName} size={40} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-charcoal">
                      {c.firstName} {c.lastName}
                    </p>
                    <p className="text-xs text-slate-400">{c.phone}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">{s?.orders ?? 0}</p>
                    <p className="text-[10px] text-slate-400">cmd</p>
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-between text-xs">
                  <span className="text-slate-400">{c.sector}</span>
                  {(s?.creance ?? 0) > 0 ? (
                    <span className="font-semibold text-red-500">{formatFCFA(s!.creance)}</span>
                  ) : (
                    <span className="text-slate-400">Aucune créance</span>
                  )}
                </div>
              </div>
            );
          }}
          emptyState={
            <EmptyState
              icon={Users}
              title="Aucun client trouvé"
              message={query ? `Aucun résultat pour « ${query} ».` : 'Inscrivez votre premier client pour commencer.'}
              action={
                <button type="button" className="btn-primary" onClick={() => setFormOpen(true)}>
                  <UserPlus size={16} aria-hidden="true" />
                  Nouveau client
                </button>
              }
            />
          }
        />
      </div>
    </div>
  );
}
