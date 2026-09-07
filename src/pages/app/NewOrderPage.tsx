import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Plus,
  Trash2,
  UserRound,
  UserPlus,
  Search,
  Check,
  Store,
  Globe,
  Banknote,
  Wallet,
  Clock3,
  ShoppingBasket,
  CircleCheckBig
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import type { Client, OrderChannel, OrderItem, PaymentType, PaymentMethod } from '@/types';
import { PhoneInput, TextField, SelectField } from '@/components/forms/FormFields';
import { PageHeader } from '@/components/ui/PageHeader';
import { IconBadge } from '@/components/ui/IconBadge';
import { Avatar } from '@/components/ui/Avatar';
import { Modal } from '@/components/ui/Modal';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { isValidBurkinaPhone, formatFCFA } from '@/lib/format';

/** En-tête de section numéroté avec pastille d'icône */
function SectionTitle({ step, icon, title }: { step: number; icon: typeof UserRound; title: string }) {
  return (
    <h2 className="card-title mb-4 flex items-center gap-3">
      <IconBadge icon={icon} size="sm" />
      <span>
        <span className="mr-1.5 text-slate-300">{step}.</span>
        {title}
      </span>
    </h2>
  );
}

interface ArticleRow {
  key: number;
  type: string;
  quantity: number;
  unitPrice: number;
}

export default function NewOrderPage() {
  const navigate = useNavigate();
  const clients = useAppStore((s) => s.clients);
  const prices = useAppStore((s) => s.prices);
  const createOrder = useAppStore((s) => s.createOrder);

  // ── Client ──
  const [phone, setPhone] = useState('+226 ');
  const [searchResults, setSearchResults] = useState<Client[] | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [newClientModal, setNewClientModal] = useState(false);
  const [newFirstName, setNewFirstName] = useState('');
  const [newLastName, setNewLastName] = useState('');
  const [formError, setFormError] = useState('');

  // ── Articles ──
  const [rows, setRows] = useState<ArticleRow[]>([{ key: 1, type: 'Chemise', quantity: 1, unitPrice: 500 }]);

  // ── Paiement / canal ──
  const [paymentType, setPaymentType] = useState<PaymentType>('integral');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('especes');
  const [advance, setAdvance] = useState(0);
  const [channel, setChannel] = useState<OrderChannel>('comptoir');
  const [deliveryRequested, setDeliveryRequested] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successTicket, setSuccessTicket] = useState<string | null>(null);

  const total = rows.reduce((sum, r) => sum + r.quantity * r.unitPrice, 0);
  const articlesCount = rows.reduce((n, r) => n + r.quantity, 0);
  const paidNow = paymentType === 'integral' ? total : paymentType === 'partiel' ? Math.min(advance, total) : 0;

  const onPhoneSearch = (value: string) => {
    setPhone(value);
    setSelectedClient(null);
    setSuccessTicket(null);
    if (value.replace(/\D/g, '').length >= 10) {
      const digits = value.replace(/\D/g, '').replace('226', '');
      setSearchResults(clients.filter((c) => c.phone.replace(/\D/g, '').endsWith(digits)));
    } else {
      setSearchResults(null);
    }
  };

  const updateRow = (key: number, patch: Partial<ArticleRow>) => {
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  };

  const onTypeChange = (key: number, type: string) => {
    const price = prices.find((p) => p.name === type);
    updateRow(key, { type, unitPrice: price?.price ?? 500 });
  };

  const createNewClient = () => {
    if (!newFirstName.trim() || !newLastName.trim()) {
      setFormError('Le prénom et le nom du client sont requis.');
      return;
    }
    const client: Client = {
      id: `c-${Date.now()}`,
      firstName: newFirstName.trim(),
      lastName: newLastName.trim(),
      phone,
      sector: 'À compléter',
      address: '',
      registeredAt: new Date().toISOString()
    };
    useAppStore.setState((s) => ({ clients: [client, ...s.clients] }));
    setSelectedClient(client);
    setNewClientModal(false);
    setNewFirstName('');
    setNewLastName('');
    setFormError('');
  };

  const submit = async () => {
    setFormError('');
    if (!selectedClient) {
      setFormError('Veuillez sélectionner ou créer un client via son numéro de téléphone.');
      return;
    }
    if (rows.length === 0 || articlesCount === 0) {
      setFormError('Ajoutez au moins un article à la commande.');
      return;
    }
    if (paymentType === 'partiel' && advance <= 0) {
      setFormError('Indiquez le montant de l’acompte versé.');
      return;
    }
    setSubmitting(true);
    try {
      const items: OrderItem[] = rows.map((r, i) => ({
        id: `tmp-${i}`,
        type: r.type,
        quantity: r.quantity,
        unitPrice: r.unitPrice
      }));
      const order = await createOrder({
        clientId: selectedClient.id,
        items,
        status: 'recu',
        channel,
        paymentType,
        paymentMethod: paidNow > 0 ? paymentMethod : null,
        total,
        paidAmount: paidNow,
        deliveryRequested
      });
      setSuccessTicket(order.ticket);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader title="Nouvelle commande" subtitle="Enregistrez une commande au comptoir en moins d'une minute." backTo="/orders" />

      {formError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600" role="alert">
          {formError}
        </div>
      )}

      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-3">
        {/* ── Colonne formulaire ── */}
        <div className="space-y-5 lg:col-span-2">
          {/* Client */}
          <section className="card p-5" aria-label="Recherche client">
            <SectionTitle step={1} icon={UserRound} title="Client" />
            {selectedClient ? (
              <div className="flex items-center gap-4 rounded-xl border border-green-200 bg-green-50/60 p-4">
                <Avatar firstName={selectedClient.firstName} lastName={selectedClient.lastName} size={44} />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-charcoal">{selectedClient.firstName} {selectedClient.lastName}</p>
                  <p className="text-xs text-slate-500">{selectedClient.phone} · {selectedClient.sector}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedClient(null);
                    setSearchResults(null);
                    setPhone('+226 ');
                  }}
                  className="btn-secondary !py-2 text-xs"
                >
                  Changer
                </button>
              </div>
            ) : (
              <>
                <PhoneInput
                  label="Rechercher par numéro de téléphone"
                  value={phone}
                  onValueChange={onPhoneSearch}
                  required
                />
                {searchResults && (
                  <div className="mt-3 space-y-2" role="listbox" aria-label="Résultats de recherche">
                    {searchResults.length > 0 ? (
                      searchResults.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          role="option"
                          aria-selected={false}
                          onClick={() => setSelectedClient(c)}
                          className="flex w-full items-center gap-3 rounded-lg border border-slate-200 px-4 py-3 text-left transition-colors hover:border-primary hover:bg-primary-50/50"
                        >
                          <Avatar firstName={c.firstName} lastName={c.lastName} size={36} />
                          <span className="flex-1">
                            <span className="block text-sm font-medium text-charcoal">{c.firstName} {c.lastName}</span>
                            <span className="block text-xs text-slate-400">{c.phone} · {c.sector}</span>
                          </span>
                          <Search size={15} className="text-slate-300" aria-hidden="true" />
                        </button>
                      ))
                    ) : (
                      <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50/50 p-4 text-center">
                        <p className="text-sm text-slate-500">Aucun client enregistré avec ce numéro.</p>
                        <button
                          type="button"
                          onClick={() => (isValidBurkinaPhone(phone) ? setNewClientModal(true) : setFormError('Numéro de téléphone invalide.'))}
                          className="btn-primary mt-3 !py-2 text-xs"
                        >
                          <UserPlus size={14} aria-hidden="true" />
                          Créer ce client
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </section>

          {/* Articles */}
          <section className="card p-5" aria-label="Articles">
            <div className="mb-4 flex items-center justify-between">
              <SectionTitle step={2} icon={ShoppingBasket} title="Articles" />
              {rows.length > 1 && (
                <span className="mb-4 text-xs text-slate-400">{articlesCount} article{articlesCount > 1 ? 's' : ''}</span>
              )}
            </div>
            <div className="space-y-3">
              {rows.map((row, idx) => (
                <div key={row.key} className="grid grid-cols-[1fr_auto] items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/40 p-3 sm:grid-cols-[24px_1fr_88px_110px_auto] sm:items-center">
                  <span className="hidden self-center text-xs font-semibold text-slate-400 sm:block">{idx + 1}.</span>
                  <div>
                    <label className="sr-only" htmlFor={`type-${row.key}`}>Type d'article</label>
                    <select
                      id={`type-${row.key}`}
                      value={row.type}
                      onChange={(e) => onTypeChange(row.key, e.target.value)}
                      className="input-base !py-2"
                    >
                      {prices.map((p) => (
                        <option key={p.id} value={p.name}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="sr-only" htmlFor={`qty-${row.key}`}>Quantité</label>
                    <input
                      id={`qty-${row.key}`}
                      type="number"
                      min={1}
                      max={50}
                      value={row.quantity}
                      onChange={(e) => updateRow(row.key, { quantity: Math.max(1, Number(e.target.value) || 1) })}
                      className="input-base !py-2 text-center"
                      aria-label="Quantité"
                    />
                  </div>
                  <div>
                    <label className="sr-only" htmlFor={`price-${row.key}`}>Prix unitaire (FCFA)</label>
                    <input
                      id={`price-${row.key}`}
                      type="number"
                      min={0}
                      step={50}
                      value={row.unitPrice}
                      onChange={(e) => updateRow(row.key, { unitPrice: Math.max(0, Number(e.target.value) || 0) })}
                      className="input-base !py-2 text-right"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="min-w-20 text-right text-sm font-semibold">{formatFCFA(row.quantity * row.unitPrice)}</span>
                    <button
                      type="button"
                      onClick={() => setRows((rs) => rs.filter((r) => r.key !== row.key))}
                      disabled={rows.length === 1}
                      className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500 disabled:opacity-30"
                      aria-label={`Supprimer l'article ${row.type}`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setRows((rs) => [...rs, { key: Date.now(), type: 'Chemise', quantity: 1, unitPrice: 500 }])}
              className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
            >
              <Plus size={15} aria-hidden="true" />
              Ajouter un article
            </button>
          </section>

          {/* Paiement & canal */}
          <section className="card p-5" aria-label="Paiement et canal">
            <SectionTitle step={3} icon={Wallet} title="Paiement & canal" />

            <fieldset>
              <legend className="label-base">Options de paiement</legend>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                {(
                  [
                    { value: 'integral', label: 'Paiement intégral', icon: Banknote },
                    { value: 'partiel', label: 'Acompte partiel', icon: Wallet },
                    { value: 'credit', label: 'À crédit', icon: Clock3 }
                  ] as const
                ).map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setPaymentType(value)}
                    aria-pressed={paymentType === value}
                    className={`flex items-center gap-2.5 rounded-lg border px-4 py-3 text-sm font-medium transition-colors ${
                      paymentType === value ? 'border-primary bg-primary-50 text-primary' : 'border-slate-200 text-slate-600 hover:border-primary-300'
                    }`}
                  >
                    <Icon size={16} aria-hidden="true" />
                    {label}
                    {paymentType === value && <Check size={15} className="ml-auto" aria-hidden="true" />}
                  </button>
                ))}
              </div>
            </fieldset>

            {paymentType !== 'credit' && (
              <fieldset className="mt-4">
                <legend className="label-base">Mode de paiement</legend>
                <div className="flex flex-wrap gap-2">
                  {(
                    [
                      { value: 'especes', label: 'Espèces' },
                      { value: 'orange_money', label: 'Orange Money' },
                      { value: 'moov_money', label: 'Moov Money' }
                    ] as const
                  ).map((m) => (
                    <button
                      key={m.value}
                      type="button"
                      onClick={() => setPaymentMethod(m.value)}
                      aria-pressed={paymentMethod === m.value}
                      className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                        paymentMethod === m.value ? 'border-primary bg-primary text-white' : 'border-slate-200 text-slate-600 hover:border-primary-300'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </fieldset>
            )}

            {paymentType === 'partiel' && (
              <div className="mt-4 max-w-xs">
                <TextField
                  label={`Montant de l'acompte (max ${formatFCFA(total)})`}
                  type="number"
                  min={0}
                  max={total}
                  step={100}
                  value={advance || ''}
                  onChange={(e) => setAdvance(Math.max(0, Number(e.target.value) || 0))}
                  placeholder="Ex : 2000"
                />
              </div>
            )}

            <fieldset className="mt-5">
              <legend className="label-base">Canal de la commande</legend>
              <div className="grid max-w-md grid-cols-2 gap-2">
                {(
                  [
                    { value: 'comptoir', label: 'Au comptoir', icon: Store },
                    { value: 'en_ligne', label: 'Demande en ligne', icon: Globe }
                  ] as const
                ).map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setChannel(value)}
                    aria-pressed={channel === value}
                    className={`flex items-center gap-2 rounded-lg border px-4 py-3 text-sm font-medium transition-colors ${
                      channel === value ? 'border-primary bg-primary-50 text-primary' : 'border-slate-200 text-slate-600 hover:border-primary-300'
                    }`}
                  >
                    <Icon size={16} aria-hidden="true" />
                    {label}
                  </button>
                ))}
              </div>
              {channel === 'en_ligne' && (
                <label className="mt-3 flex items-center gap-2 text-sm text-slate-600">
                  <input
                    type="checkbox"
                    checked={deliveryRequested}
                    onChange={(e) => setDeliveryRequested(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 accent-primary"
                  />
                  Livraison / collecte à domicile demandée
                </label>
              )}
            </fieldset>
          </section>
        </div>

        {/* ── Récapitulatif ── */}
        <aside className="card sticky top-24 p-5" aria-label="Récapitulatif de la commande">
          <h2 className="card-title mb-4">Récapitulatif</h2>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-500">Client</dt>
              <dd className="font-medium">{selectedClient ? `${selectedClient.firstName} ${selectedClient.lastName}` : '—'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Articles</dt>
              <dd className="font-medium">{articlesCount}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Canal</dt>
              <dd className="font-medium">{channel === 'comptoir' ? 'Comptoir' : 'En ligne'}</dd>
            </div>
            <div className="border-t border-slate-100 pt-3">
              <div className="flex justify-between text-base">
                <dt className="font-semibold text-slate-600">Total</dt>
                <dd className="font-bold text-primary">{formatFCFA(total)}</dd>
              </div>
            </div>
            {paymentType === 'partiel' && (
              <>
                <div className="flex justify-between text-green-600">
                  <dt>Acompte</dt>
                  <dd className="font-semibold">{formatFCFA(paidNow)}</dd>
                </div>
                <div className="flex justify-between text-red-500">
                  <dt>Reste à payer</dt>
                  <dd className="font-semibold">{formatFCFA(total - paidNow)}</dd>
                </div>
              </>
            )}
            {paymentType === 'credit' && (
              <p className="rounded-lg bg-orange-50 px-3 py-2 text-xs font-medium text-orange-600">
                Commande à crédit — la totalité ({formatFCFA(total)}) sera suivie en créance.
              </p>
            )}
          </dl>
          <button type="button" onClick={submit} className="btn-primary mt-6 w-full" disabled={submitting}>
            {submitting ? <LoadingSpinner size={16} /> : <Check size={17} aria-hidden="true" />}
            {submitting ? 'Enregistrement…' : 'Enregistrer la commande'}
          </button>
          <p className="mt-3 text-center text-xs text-slate-400">Un ticket avec numéro unique sera généré.</p>
        </aside>
      </div>

      {/* Modal nouveau client */}
      <Modal
        open={newClientModal}
        onClose={() => setNewClientModal(false)}
        title="Nouveau client"
        size="sm"
        footer={
          <>
            <button type="button" className="btn-secondary" onClick={() => setNewClientModal(false)}>
              Annuler
            </button>
            <button type="button" className="btn-primary" onClick={createNewClient}>
              <UserRound size={16} aria-hidden="true" />
              Créer le client
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-500">
            Numéro : <span className="font-semibold text-charcoal">{phone}</span>
          </p>
          <TextField label="Prénom" value={newFirstName} onChange={(e) => setNewFirstName(e.target.value)} placeholder="Ex : Amina" required />
          <TextField label="Nom" value={newLastName} onChange={(e) => setNewLastName(e.target.value)} placeholder="Ex : Ouédraogo" required />
          <SelectField
            label="Secteur"
            value=""
            onChange={() => undefined}
            placeholder="Sélectionner…"
            options={['Secteur 4', 'Secteur 15', 'Secteur 22', 'Gounghin', '1200 Logements', 'Karpala', 'Pissy'].map((s) => ({ value: s, label: s }))}
          />
        </div>
      </Modal>

      {/* Modal succès */}
      <Modal open={!!successTicket} onClose={() => navigate('/orders')} title="Commande enregistrée" size="sm">
        <div className="py-2 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-50">
            <CircleCheckBig size={30} className="text-green-500" aria-hidden="true" />
          </div>
          <p className="text-sm text-slate-500">Le ticket de la commande a été généré :</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-primary">{successTicket}</p>
          <p className="mt-3 text-xs text-slate-400">Pensez à imprimer le ticket et à le remettre au client.</p>
          <div className="mt-6 grid grid-cols-2 gap-2">
            <Link to="/orders" className="btn-secondary">
              Voir les commandes
            </Link>
            <Link to="/orders" className="btn-primary">
              Terminé
            </Link>
          </div>
        </div>
      </Modal>
    </div>
  );
}
