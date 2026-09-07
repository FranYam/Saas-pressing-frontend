import { useEffect, useState } from 'react';
import {
  Building2,
  Palette,
  Tags,
  BellRing,
  CreditCard,
  Check,
  ImagePlus,
  Save
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import type { PriceItem, PressingSettings } from '@/types';
import { PageHeader } from '@/components/ui/PageHeader';
import { TextField, TextArea, SelectField } from '@/components/forms/FormFields';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { formatFCFA } from '@/lib/format';

type Section = 'infos' | 'personnalisation' | 'tarification' | 'notifications' | 'abonnement';

const SECTIONS: { value: Section; label: string; icon: typeof Building2; description: string }[] = [
  { value: 'infos', label: 'Infos générales', icon: Building2, description: 'Nom, coordonnées et horaires' },
  { value: 'personnalisation', label: 'Personnalisation', icon: Palette, description: 'Logo et couleurs' },
  { value: 'tarification', label: 'Tarification', icon: Tags, description: 'Prix des articles' },
  { value: 'notifications', label: 'Notifications', icon: BellRing, description: 'SMS et alertes' },
  { value: 'abonnement', label: 'Abonnement', icon: CreditCard, description: 'Plan et facturation' }
];

const COLOR_SWATCHES = ['#C75B39', '#8D3B25', '#3B82F6', '#22C55E', '#7C3AED', '#1E293B'];

export default function SettingsPage() {
  const settings = useAppStore((s) => s.settings);
  const prices = useAppStore((s) => s.prices);
  const saveSettings = useAppStore((s) => s.saveSettings);
  const savePrices = useAppStore((s) => s.savePrices);

  const [section, setSection] = useState<Section>('infos');
  const [draft, setDraft] = useState<PressingSettings | null>(settings);
  const [priceDraft, setPriceDraft] = useState<PriceItem[]>(prices);
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);

  useEffect(() => {
    if (settings && !draft) setDraft(settings);
  }, [settings, draft]);

  useEffect(() => {
    setPriceDraft(prices);
  }, [prices]);

  if (!draft) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <LoadingSpinner label="Chargement des paramètres…" />
      </div>
    );
  }

  const update = (patch: Partial<PressingSettings>) => setDraft((d) => (d ? { ...d, ...patch } : d));

  const onSave = async () => {
    setSaving(true);
    try {
      if (section === 'tarification') {
        await savePrices(priceDraft);
      } else {
        await saveSettings(draft);
      }
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 2500);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader title="Paramètres du pressing" subtitle="Configurez votre espace PressNet." />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[260px_1fr]">
        {/* Sous-navigation */}
        <nav className="card h-fit overflow-hidden p-2" aria-label="Sections des paramètres">
          <ul className="space-y-1">
            {SECTIONS.map(({ value, label, icon: Icon, description }) => (
              <li key={value}>
                <button
                  type="button"
                  onClick={() => setSection(value)}
                  aria-current={section === value ? 'true' : undefined}
                  className={`flex w-full items-center gap-3 rounded-lg px-3.5 py-3 text-left transition-colors ${
                    section === value ? 'bg-primary text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Icon size={18} className={section === value ? 'text-white' : 'text-slate-400'} aria-hidden="true" />
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold">{label}</span>
                    <span className={`block truncate text-xs ${section === value ? 'text-white/70' : 'text-slate-400'}`}>{description}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Contenu */}
        <div className="space-y-5">
          {section === 'infos' && (
            <section className="card p-6" aria-label="Informations générales">
              <h2 className="card-title mb-5">Informations générales</h2>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <TextField label="Nom du pressing" value={draft.name} onChange={(e) => update({ name: e.target.value })} required />
                <TextField label="Téléphone" value={draft.phone} onChange={(e) => update({ phone: e.target.value })} required />
                <TextField label="Email" type="email" value={draft.email} onChange={(e) => update({ email: e.target.value })} />
                <TextField label="Ville" value={draft.city} onChange={(e) => update({ city: e.target.value })} />
                <div className="sm:col-span-2">
                  <TextArea label="Adresse" value={draft.address} onChange={(e) => update({ address: e.target.value })} />
                </div>
                <div className="sm:col-span-2">
                  <TextField label="Horaires d'ouverture" value={draft.openingHours} onChange={(e) => update({ openingHours: e.target.value })} placeholder="Ex : Lun – Sam : 07h30 – 19h00" />
                </div>
              </div>
            </section>
          )}

          {section === 'personnalisation' && (
            <>
              <section className="card p-6" aria-label="Personnalisation">
                <h2 className="card-title mb-5">Personnalisation</h2>

                <div className="mb-6">
                  <span className="label-base">Logo du pressing</span>
                  <div className="flex flex-wrap items-center gap-4">
                    <span className="flex h-16 w-16 items-center justify-center rounded-xl text-xl font-bold text-white" style={{ backgroundColor: draft.primaryColor }}>
                      {draft.name.charAt(0).toUpperCase()}
                    </span>
                    <label className="btn-secondary cursor-pointer">
                      <ImagePlus size={16} aria-hidden="true" />
                      Changer le logo
                      <input type="file" accept="image/png,image/jpeg" className="sr-only" />
                    </label>
                  </div>
                  <p className="mt-2 text-xs text-slate-400">PNG carré, 256×256 minimum. Le logo apparaît sur les tickets et l'application client.</p>
                </div>

                <div>
                  <span className="label-base">Couleur principale</span>
                  <div className="flex flex-wrap gap-3">
                    {COLOR_SWATCHES.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => update({ primaryColor: color })}
                        className={`flex h-11 w-11 items-center justify-center rounded-full border-2 transition-transform hover:scale-110 ${
                          draft.primaryColor === color ? 'border-charcoal' : 'border-transparent'
                        }`}
                        style={{ backgroundColor: color }}
                        aria-label={`Couleur ${color}`}
                        aria-pressed={draft.primaryColor === color}
                      >
                        {draft.primaryColor === color && <Check size={16} className="text-white drop-shadow" />}
                      </button>
                    ))}
                  </div>
                </div>
              </section>

              <section className="card p-6" aria-label="Aperçu">
                <h2 className="card-title mb-4">Aperçu</h2>
                <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-sand p-4">
                  <span className="flex h-11 w-11 items-center justify-center rounded-lg font-bold text-white" style={{ backgroundColor: draft.primaryColor }}>
                    {draft.name.charAt(0).toUpperCase()}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-charcoal">{draft.name}</p>
                    <p className="text-xs text-slate-500">{draft.city} · Burkina Faso</p>
                  </div>
                  <span className="ml-auto rounded-full px-3 py-1 text-xs font-semibold text-white" style={{ backgroundColor: draft.primaryColor }}>
                    Ticket
                  </span>
                </div>
              </section>
            </>
          )}

          {section === 'tarification' && (
            <section className="card p-6" aria-label="Tarification">
              <h2 className="card-title mb-1">Tarification des articles</h2>
              <p className="mb-5 text-sm text-slate-500">Ces prix sont proposés automatiquement lors de la création d'une commande.</p>
              <div className="space-y-2">
                {priceDraft.map((p) => (
                  <div key={p.id} className="flex items-center gap-3 rounded-lg border border-slate-100 bg-slate-50/40 p-3">
                    <span className="flex-1 text-sm font-medium text-charcoal">{p.name}</span>
                    <span className="hidden text-xs text-slate-400 sm:block">{p.category}</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={0}
                        step={50}
                        value={p.price}
                        onChange={(e) =>
                          setPriceDraft((ds) => ds.map((d) => (d.id === p.id ? { ...d, price: Math.max(0, Number(e.target.value) || 0) } : d)))
                        }
                        className="input-base !w-28 !py-2 text-right"
                        aria-label={`Prix de ${p.name} en FCFA`}
                      />
                      <span className="text-xs font-semibold text-slate-500">FCFA</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {section === 'notifications' && (
            <section className="card p-6" aria-label="Notifications">
              <h2 className="card-title mb-1">Notifications</h2>
              <p className="mb-5 text-sm text-slate-500">Choisissez quand vos clients sont contactés automatiquement.</p>
              <ul className="divide-y divide-slate-100">
                {(
                  [
                    { key: 'orderReadySms' as const, label: 'SMS « Commande prête »', hint: 'Envoyé au client dès qu’une commande passe au statut Prêt.' },
                    { key: 'paymentReminderSms' as const, label: 'SMS « Rappel de créance »', hint: 'Rappel automatique après 7 jours sans règlement du solde.' },
                    { key: 'smsNotifications' as const, label: 'Notifications SMS générales', hint: 'Confimations de commande et de livraison.' },
                    { key: 'emailNotifications' as const, label: 'Rapports par email', hint: 'Résumé hebdomadaire du chiffre d’affaires.' }
                  ] as const
                ).map((item) => (
                  <li key={item.key} className="flex items-center justify-between gap-4 py-4">
                    <div>
                      <p className="text-sm font-medium text-charcoal">{item.label}</p>
                      <p className="mt-0.5 text-xs text-slate-400">{item.hint}</p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={draft[item.key]}
                      onClick={() => update({ [item.key]: !draft[item.key] } as Partial<PressingSettings>)}
                      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${draft[item.key] ? 'bg-primary' : 'bg-slate-200'}`}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${draft[item.key] ? 'translate-x-5' : ''}`}
                        aria-hidden="true"
                      />
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {section === 'abonnement' && (
            <>
              <section className="card p-6" aria-label="Abonnement actuel">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold tracking-wide text-slate-400 uppercase">Plan actuel</p>
                    <div className="mt-1 flex items-baseline gap-2">
                      <h2 className="text-2xl font-bold text-primary">Pro</h2>
                      <span className="text-sm text-slate-500">— {formatFCFA(15000)} / mois</span>
                    </div>
                    <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-green-600">
                      <Check size={13} aria-hidden="true" />
                      Renouvellement le 1er de chaque mois
                    </p>
                  </div>
                  <span className="rounded-full bg-green-50 px-4 py-1.5 text-xs font-bold text-green-600">ACTIF</span>
                </div>
                <ul className="mt-5 grid grid-cols-1 gap-2 border-t border-slate-100 pt-5 text-sm text-slate-600 sm:grid-cols-2">
                  {[
                    'Commandes illimitées',
                    '3 comptes employés inclus',
                    'SMS automatiques (100/mois)',
                    'Paiements mobile money',
                    'Suivi et tracking client',
                    'Support prioritaire WhatsApp'
                  ].map((f) => (
                    <li key={f} className="flex items-center gap-2">
                      <Check size={14} className="text-green-500" aria-hidden="true" />
                      {f}
                    </li>
                  ))}
                </ul>
              </section>

              <section className="card p-6" aria-label="Facturation">
                <h2 className="card-title mb-4">Facturation</h2>
                <SelectField
                  label="Moyen de paiement"
                  value="orange_money"
                  onChange={() => undefined}
                  options={[
                    { value: 'orange_money', label: 'Orange Money (+226 70 12 34 56)' },
                    { value: 'moov_money', label: 'Moov Money (+226 70 12 34 56)' }
                  ]}
                />
                <div className="mt-4 rounded-lg bg-slate-50 p-4 text-xs leading-relaxed text-slate-500">
                  Factures disponibles chaque mois dans votre espace. Le paiement est automatiquement prélevé sur votre compte mobile money.
                </div>
              </section>
            </>
          )}

          {section !== 'abonnement' && section !== 'notifications' && (
            <div className="flex justify-end">
              <button type="button" onClick={onSave} className="btn-primary" disabled={saving}>
                {saving ? (
                  <LoadingSpinner size={16} />
                ) : savedFlash ? (
                  <Check size={16} aria-hidden="true" />
                ) : (
                  <Save size={16} aria-hidden="true" />
                )}
                {savedFlash ? 'Enregistré' : saving ? 'Enregistrement…' : 'Enregistrer les modifications'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
