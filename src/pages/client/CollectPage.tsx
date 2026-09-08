import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Check,
  Minus,
  Plus,
  MapPinned,
  Send,
  WashingMachine,
  Shirt,
  Layers,
  Sparkles,
  Briefcase,
  BedDouble,
  Blinds,
  CircleCheckBig
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { PortalLayout, PortalSection } from '@/components/layout/PortalLayout';
import { CLIENT_NAV } from './ClientDashboardPage';
import { useClientAccess } from '@/context/ClientAccessContext';
import { TextField, SelectField, TextArea, PhoneInput } from '@/components/forms/FormFields';
import { IconBadge } from '@/components/ui/IconBadge';
import { Modal } from '@/components/ui/Modal';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { isValidBurkinaPhone } from '@/lib/format';

const ARTICLE_TYPES: { name: string; icon: LucideIcon; accent: 'primary' | 'blue' | 'violet' | 'orange' | 'green' | 'slate' }[] = [
  { name: 'Chemise', icon: Shirt, accent: 'blue' },
  { name: 'Pantalon', icon: Layers, accent: 'slate' },
  { name: 'Robe', icon: Sparkles, accent: 'violet' },
  { name: 'Costume', icon: Briefcase, accent: 'orange' },
  { name: 'Drap', icon: BedDouble, accent: 'green' },
  { name: 'Rideau', icon: Blinds, accent: 'primary' }
];

const TIME_SLOTS = [
  { value: 'matin', label: 'Demain · 08h00 – 10h00' },
  { value: 'midi', label: 'Demain · 12h00 – 14h00' },
  { value: 'aprem', label: 'Demain · 15h00 – 17h00' },
  { value: 'soir', label: 'Demain · 17h00 – 19h00' }
];

export default function CollectPage() {
  const navigate = useNavigate();
  const { data, clear } = useClientAccess();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('+226 ');
  const [address, setAddress] = useState('');
  const [gpsInfo, setGpsInfo] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const [slot, setSlot] = useState('');
  const [notes, setNotes] = useState('');
  const [articles, setArticles] = useState<Record<string, number>>({});
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const articlesCount = Object.values(articles).reduce((a, b) => a + b, 0);

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
    if (!firstName.trim() || !lastName.trim()) return setError('Veuillez saisir votre nom complet.');
    if (!isValidBurkinaPhone(phone)) return setError('Numéro de téléphone burkinabè invalide.');
    if (!address.trim()) return setError('Veuillez indiquer votre adresse de collecte.');
    if (articlesCount === 0) return setError('Sélectionnez au moins un article à faire laver.');
    if (!slot) return setError('Choisissez un créneau horaire.');
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 800));
    setSubmitting(false);
    setSuccess(true);
  };

  return (
    <PortalLayout
      title="Demande de collecte"
      nav={CLIENT_NAV}
      identity={data ? { name: data.name, sub: data.phone } : { name: 'Espace client', sub: 'Sans inscription' }}
      onExit={() => {
        clear();
        navigate('/client/access', { replace: true });
      }}
      exitLabel="Quitter l'espace"
    >
      {/* Intro */}
      <div className="mb-5 flex items-start gap-4 rounded-2xl bg-charcoal p-5 text-white md:p-6">
        <IconBadge icon={WashingMachine} size="lg" className="shrink-0" />
        <div>
          <p className="text-sm font-semibold">Laver et plier, sans bouger de chez vous</p>
          <p className="mt-1 text-xs leading-relaxed text-slate-300">
            Remplissez le formulaire, un coursier passe récupérer vos vêtements à l'heure que vous choisissez.
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
                <TextField label="Prénom" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Ex : Mariam" required />
                <TextField label="Nom" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Ex : Traoré" required />
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
          <PortalSection title="Articles à laver">
            <div className="card divide-y divide-slate-50 p-2 md:p-3">
              {ARTICLE_TYPES.map(({ name, icon: Icon, accent }) => {
                const qty = articles[name] ?? 0;
                return (
                  <div key={name} className="flex items-center gap-3 px-2 py-3">
                    <IconBadge icon={Icon} accent={accent} size="sm" />
                    <span className="flex-1 text-sm font-medium">{name}</span>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setQty(name, -1)}
                        disabled={qty === 0}
                        className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 disabled:opacity-30"
                        aria-label={`Retirer un ${name.toLowerCase()}`}
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-5 text-center text-sm font-bold" aria-live="polite">
                        {qty}
                      </span>
                      <button
                        type="button"
                        onClick={() => setQty(name, 1)}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white"
                        aria-label={`Ajouter un ${name.toLowerCase()}`}
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            {articlesCount > 0 && (
              <p className="mt-2 text-right text-xs font-semibold text-slate-500">
                {articlesCount} article{articlesCount > 1 ? 's' : ''} sélectionné{articlesCount > 1 ? 's' : ''}
              </p>
            )}
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
            {submitting ? 'Envoi en cours…' : 'Envoyer la demande'}
          </button>
        </div>
      </form>

      {/* Modal succès */}
      <Modal open={success} onClose={() => navigate('/client/dashboard')} title="Demande envoyée" size="sm">
        <div className="py-2 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-50">
            <CircleCheckBig size={28} className="text-green-500" aria-hidden="true" />
          </div>
          <p className="text-sm leading-relaxed text-slate-600">
            Votre demande de collecte a bien été reçue. Le pressing vous contactera au <span className="font-semibold">{phone}</span> pour
            confirmer le passage du coursier.
          </p>
          <button type="button" className="btn-primary mt-5 w-full" onClick={() => navigate('/client/dashboard')}>
            <Check size={16} aria-hidden="true" />
            Retour au tableau de bord
          </button>
        </div>
      </Modal>
    </PortalLayout>
  );
}
