import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Check,
  Minus,
  Plus,
  MapPinned,
  Send,
  WashingMachine,
  CircleCheckBig,
  LockKeyhole,
  RefreshCw,
  Shirt,
  Layers,
  Sparkles,
  Briefcase,
  BedDouble,
  Blinds,
  Gem
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { PortalLayout, PortalSection } from '@/components/layout/PortalLayout';
import { CLIENT_NAV } from './ClientDashboardPage';
import { useClientAccess } from '@/context/ClientAccessContext';
import { createPortalCollecte, fetchPortalCatalog, type PortalCatalogItem } from '@/services/api';
import { TextField, SelectField, TextArea, PhoneInput } from '@/components/forms/FormFields';
import { IconBadge } from '@/components/ui/IconBadge';
import { Modal } from '@/components/ui/Modal';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { isValidBurkinaPhone, formatFCFA } from '@/lib/format';

const TIME_SLOTS = [
  { value: 'matin', label: 'Demain · 08h00 – 10h00' },
  { value: 'midi', label: 'Demain · 12h00 – 14h00' },
  { value: 'aprem', label: 'Demain · 15h00 – 17h00' },
  { value: 'soir', label: 'Demain · 17h00 – 19h00' }
];

/** Icône et accent selon le type d'article du catalogue */
function catalogIcon(name: string): { icon: LucideIcon; accent: 'primary' | 'blue' | 'violet' | 'orange' | 'green' | 'slate' } {
  const lower = name.toLowerCase();
  if (lower.includes('chemise')) return { icon: Shirt, accent: 'blue' };
  if (lower.includes('pantalon')) return { icon: Layers, accent: 'slate' };
  if (lower.includes('robe')) return { icon: Sparkles, accent: 'violet' };
  if (lower.includes('costume') || lower.includes('veste')) return { icon: Briefcase, accent: 'orange' };
  if (lower.includes('boubou') || lower.includes('fani')) return { icon: Gem, accent: 'violet' };
  if (lower.includes('drap') || lower.includes('couverture')) return { icon: BedDouble, accent: 'green' };
  if (lower.includes('rideau')) return { icon: Blinds, accent: 'primary' };
  return { icon: WashingMachine, accent: 'primary' };
}

export default function CollectPage() {
  const navigate = useNavigate();
  const { data, access, canRequestCollect } = useClientAccess();

  // Catalogue du pressing (API réelle)
  const [catalog, setCatalog] = useState<PortalCatalogItem[] | null>(null);
  const [catalogError, setCatalogError] = useState('');

  // Formulaire
  const [address, setAddress] = useState('');
  const [gpsInfo, setGpsInfo] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const [slot, setSlot] = useState('');
  const [notes, setNotes] = useState('');
  const [articles, setArticles] = useState<Record<string, number>>({});
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successTicket, setSuccessTicket] = useState<string | null>(null);

  // Contact pré-rempli depuis la session
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('+226 ');

  useEffect(() => {
    if (data) {
      const parts = data.name.split(' ');
      setFirstName(parts[0] ?? '');
      setLastName(parts.slice(1).join(' '));
      setPhone(`+226 ${data.phone.slice(-8, -6)} ${data.phone.slice(-6, -4)} ${data.phone.slice(-4, -2)} ${data.phone.slice(-2)}`);
    }
  }, [data]);

  const loadCatalog = () => {
    setCatalogError('');
    fetchPortalCatalog(access?.mode === 'account' ? access.token : undefined, data?.pressing_id)
      .then(setCatalog)
      .catch(() => setCatalogError('Impossible de charger le catalogue. Vérifiez votre connexion.'));
  };

  useEffect(() => {
    if (data || access?.mode === 'account') loadCatalog();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.pressing_id, access]);

  const articlesCount = Object.values(articles).reduce((a, b) => a + b, 0);

  const total = useMemo(() => {
    if (!catalog) return 0;
    return Object.entries(articles).reduce((sum, [name, qty]) => {
      const item = catalog.find((c) => c.name === name);
      return sum + (item ? qty * parseFloat(item.price) : 0);
    }, 0);
  }, [articles, catalog]);

  const setQty = (name: string, delta: number) => {
    setArticles((prev) => {
      const next = Math.max(0, (prev[name] ?? 0) + delta);
      const copy = { ...prev };
      if (next === 0) delete copy[name];
      else copy[name] = next;
      return copy;
    });
  };

  const useGps = () => {
    if (!navigator.geolocation) {
      setError('La géolocalisation n’est pas disponible sur votre appareil.');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsInfo(`${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`);
        if (!address) setAddress('Position GPS partagée');
        setLocating(false);
      },
      () => {
        setError('Impossible de récupérer votre position. Saisissez l’adresse manuellement.');
        setLocating(false);
      },
      { timeout: 8000 }
    );
  };

  const submit = async () => {
    setError('');
    if (!canRequestCollect) return;
    if (!address.trim()) return setError('Veuillez indiquer votre adresse de collecte.');
    if (articlesCount === 0) return setError('Sélectionnez au moins un article à faire laver.');
    if (!slot) return setError('Choisissez un créneau horaire.');
    if (!isValidBurkinaPhone(phone)) return setError('Numéro de téléphone burkinabè invalide.');

    setSubmitting(true);
    try {
      const commande = await createPortalCollecte((access as { token: string }).token, {
        collect_address: address.trim(),
        creneau: TIME_SLOTS.find((s) => s.value === slot)?.label,
        notes: notes.trim() || undefined,
        articles: Object.entries(articles).map(([clothing_type, quantity]) => ({ clothing_type, quantity }))
      });
      setSuccessTicket(commande.ticket_number);
    } catch (err) {
      const axiosErr = err as { response?: { data?: { detail?: string } } };
      setError(axiosErr?.response?.data?.detail ?? 'Impossible d’envoyer la demande. Réessayez.');
    } finally {
      setSubmitting(false);
    }
  };

  // Sans compte client : la collecte en ligne nécessite un compte
  if (!canRequestCollect) {
    return (
      <PortalLayout
        title="Demande de collecte"
        nav={CLIENT_NAV}
        identity={data ? { name: data.name, sub: data.phone } : { name: 'Espace client', sub: 'Sans inscription' }}
        onExit={() => navigate('/client/access', { replace: true })}
        exitLabel="Quitter l'espace"
      >
        <div className="card mx-auto max-w-md p-8 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-50">
            <LockKeyhole size={26} className="text-primary" aria-hidden="true" />
          </span>
          <h2 className="mt-4 text-lg font-semibold text-charcoal">Un compte client est requis</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-500">
            La demande de collecte à domicile nécessite un compte client — c'est ce qui permet au pressing de
            retrouver votre adresse et votre historique.
          </p>
          <Link to="/client/access" className="btn-primary mt-6 w-full">
            Créer mon compte (1 minute)
          </Link>
          <button type="button" onClick={() => navigate(-1)} className="btn-ghost mt-2 w-full justify-center">
            Retour
          </button>
        </div>
      </PortalLayout>
    );
  }

  return (
    <PortalLayout
      title="Demande de collecte"
      nav={CLIENT_NAV}
      identity={data ? { name: data.name, sub: data.phone } : undefined}
      onExit={() => navigate('/client/access', { replace: true })}
      exitLabel="Quitter l'espace"
    >
      {/* Intro */}
      <div className="mb-5 flex items-start gap-4 rounded-2xl bg-charcoal p-5 text-white md:p-6">
        <IconBadge icon={WashingMachine} size="lg" className="shrink-0" />
        <div>
          <p className="text-sm font-semibold">Laver et plier, sans bouger de chez vous</p>
          <p className="mt-1 text-xs leading-relaxed text-slate-300">
            Choisissez vos articles dans le catalogue de {data?.pressing ?? 'votre pressing'}, un coursier passe les récupérer.
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600" role="alert">
          {error}
        </div>
      )}

      <form
        className="grid grid-cols-1 gap-5 lg:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
        noValidate
      >
        <div className="space-y-5">
          <PortalSection title="Vos coordonnées">
            <div className="card space-y-4 p-4 md:p-5">
              <div className="grid grid-cols-2 gap-3">
                <TextField label="Prénom" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
                <TextField label="Nom" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
              </div>
              <PhoneInput label="Téléphone" value={phone} onValueChange={setPhone} required />
            </div>
          </PortalSection>

          <PortalSection title="Adresse de collecte">
            <div className="card space-y-3 p-4 md:p-5">
              <TextArea
                label="Adresse complète"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Ex : Cité Aziz, Secteur 4, portail vert"
                required
              />
              <button
                type="button"
                onClick={useGps}
                className="btn-secondary w-full !py-2.5 text-xs"
                disabled={locating}
                aria-label="Utiliser ma position GPS"
              >
                {locating ? <LoadingSpinner size={14} /> : <MapPinned size={15} aria-hidden="true" />}
                {gpsInfo ? `Position enregistrée (${gpsInfo})` : 'Utiliser ma position GPS'}
              </button>
            </div>
          </PortalSection>

          <PortalSection title="Créneau horaire">
            <div className="card p-4 md:p-5">
              <SelectField
                label="Quand passer ?"
                value={slot}
                onChange={(e) => setSlot(e.target.value)}
                placeholder="Choisir un créneau…"
                options={TIME_SLOTS}
                required
              />
            </div>
          </PortalSection>
        </div>

        <div className="space-y-5">
          <PortalSection title="Articles à laver — catalogue">
            <div className="card p-4 md:p-5">
              {catalog === null && !catalogError && (
                <div className="flex items-center justify-center gap-2 py-6 text-sm text-slate-400">
                  <LoadingSpinner size={16} /> Chargement du catalogue…
                </div>
              )}
              {catalogError && (
                <div className="py-4 text-center">
                  <p className="text-sm text-slate-500">{catalogError}</p>
                  <button type="button" onClick={loadCatalog} className="btn-secondary mt-3 !py-2 text-xs">
                    <RefreshCw size={13} aria-hidden="true" /> Réessayer
                  </button>
                </div>
              )}
              {catalog && catalog.length === 0 && (
                <p className="py-4 text-center text-sm text-slate-400">
                  Votre pressing n'a pas encore publié son catalogue. Contactez-le directement.
                </p>
              )}
              {catalog && catalog.length > 0 && (
                <ul className="divide-y divide-slate-50">
                  {catalog.map((item) => {
                    const qty = articles[item.name] ?? 0;
                    const { icon: Icon, accent } = catalogIcon(item.name);
                    return (
                      <li key={item.id} className="flex items-center gap-3 py-3">
                        <IconBadge icon={Icon} accent={accent} size="sm" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{item.name}</p>
                          <p className="text-xs text-slate-400">{formatFCFA(parseFloat(item.price))} / pièce</p>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <button
                            type="button"
                            onClick={() => setQty(item.name, -1)}
                            disabled={qty === 0}
                            className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 disabled:opacity-30"
                            aria-label={`Retirer ${item.name}`}
                          >
                            <Minus size={14} />
                          </button>
                          <span className="w-5 text-center text-sm font-bold" aria-live="polite">
                            {qty}
                          </span>
                          <button
                            type="button"
                            onClick={() => setQty(item.name, 1)}
                            className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white"
                            aria-label={`Ajouter ${item.name}`}
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
              {articlesCount > 0 && (
                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-sm">
                  <span className="text-slate-500">
                    {articlesCount} article{articlesCount > 1 ? 's' : ''} — total estimé
                  </span>
                  <span className="font-bold text-charcoal tabular-nums">{formatFCFA(total)}</span>
                </div>
              )}
              <p className="mt-2 text-xs text-slate-400">
                Tarifs du catalogue officiel du pressing — le total est confirmé à la collecte.
              </p>
            </div>
          </PortalSection>

          <PortalSection title="Notes (optionnel)">
            <div className="card p-4 md:p-5">
              <TextArea
                label="Instructions pour le coursier"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex : Appeler en arrivant, vêtements délicats…"
              />
            </div>
          </PortalSection>
        </div>

        <div className="lg:col-span-2">
          <button type="submit" className="btn-primary w-full !py-3.5 md:w-auto md:px-10" disabled={submitting}>
            {submitting ? <LoadingSpinner size={17} /> : <Send size={17} aria-hidden="true" />}
            {submitting ? 'Envoi en cours…' : 'Envoyer la demande de collecte'}
          </button>
        </div>
      </form>

      {/* Modal succès */}
      <Modal open={!!successTicket} onClose={() => navigate('/client/dashboard')} title="Demande enregistrée" size="sm">
        <div className="py-2 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-50">
            <CircleCheckBig size={28} className="text-green-500" aria-hidden="true" />
          </div>
          <p className="text-sm leading-relaxed text-slate-600">
            Votre demande de collecte a bien été transmise à <span className="font-semibold">{data?.pressing ?? 'votre pressing'}</span>.
            Votre numéro de ticket :
          </p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-primary">{successTicket}</p>
          <p className="mt-3 text-xs text-slate-400">Le pressing vous contactera pour confirmer le passage du coursier.</p>
          <button type="button" className="btn-primary mt-5 w-full" onClick={() => navigate('/client/dashboard')}>
            <Check size={16} aria-hidden="true" />
            Voir mes commandes
          </button>
        </div>
      </Modal>
    </PortalLayout>
  );
}
