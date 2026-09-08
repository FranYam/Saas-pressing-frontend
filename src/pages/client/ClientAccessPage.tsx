import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Loader2, LockKeyhole, Smartphone, UserPlus, LogIn, Ticket } from 'lucide-react';
import { Logo } from '@/components/layout/Logo';
import { TextField, PhoneInput, SelectField } from '@/components/forms/FormFields';
import { useClientAccess } from '@/context/ClientAccessContext';
import { fetchPortalPressings, type PortalPressing } from '@/services/api';
import { isValidBurkinaPhone } from '@/lib/format';

type Mode = 'login' | 'register' | 'ticket';

const MODES: { value: Mode; label: string; icon: typeof LogIn }[] = [
  { value: 'login', label: 'Se connecter', icon: LogIn },
  { value: 'register', label: 'Créer un compte', icon: UserPlus },
  { value: 'ticket', label: 'Ticket rapide', icon: Ticket }
];

/**
 * Accès à l'Espace client — trois modes :
 * - compte existant (téléphone + mot de passe) ;
 * - création de compte (choix du pressing + identité) — ouvre le catalogue
 *   et la demande de collecte ;
 * - ticket rapide (reçu + téléphone) — consultation seule, sans compte.
 */
export default function ClientAccessPage() {
  const navigate = useNavigate();
  const { loginAccount, registerAccount, loginTicket } = useClientAccess();

  const [mode, setMode] = useState<Mode>('login');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Champs communs
  const [phone, setPhone] = useState('+226 ');
  const [password, setPassword] = useState('');

  // Inscription
  const [name, setName] = useState('');
  const [pressings, setPressings] = useState<PortalPressing[]>([]);
  const [pressingId, setPressingId] = useState('');

  // Ticket rapide
  const [ticket, setTicket] = useState('');

  useEffect(() => {
    if (mode !== 'register' || pressings.length > 0) return;
    fetchPortalPressings()
      .then((list) => {
        setPressings(list);
        if (list.length === 1) setPressingId(list[0].id);
      })
      .catch(() => setError('Impossible de charger la liste des pressings. Réessayez.'));
  }, [mode, pressings.length]);

  const submit = async () => {
    setError('');
    if (!isValidBurkinaPhone(phone)) return setError('Numéro de téléphone burkinabè invalide.');

    setSubmitting(true);
    try {
      if (mode === 'login') {
        if (password.length < 6) throw new Error('Mot de passe : 6 caractères minimum.');
        await loginAccount(phone.replace(/\s/g, ''), password);
      } else if (mode === 'register') {
        if (name.trim().length < 3) throw new Error('Veuillez saisir votre nom complet.');
        if (!pressingId) throw new Error('Choisissez votre pressing.');
        if (password.length < 6) throw new Error('Mot de passe : 6 caractères minimum.');
        await registerAccount({ pressing: pressingId, name: name.trim(), phone: phone.replace(/\s/g, ''), password });
      } else {
        if (!ticket.trim()) throw new Error('Veuillez saisir le numéro de ticket figurant sur votre reçu.');
        await loginTicket(ticket, phone);
      }
      navigate('/client/dashboard', { replace: true });
    } catch (err) {
      const axiosErr = err as { response?: { data?: { detail?: string } } };
      setError(axiosErr?.response?.data?.detail ?? (err instanceof Error ? err.message : 'Une erreur est survenue. Réessayez.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-sand px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <Logo variant="dark" size="lg" />
          <h1 className="mt-6 text-2xl font-semibold text-charcoal">Espace client</h1>
          <p className="page-subtitle">Suivez vos commandes, réglez votre solde, demandez une collecte.</p>
        </div>

        <div className="card p-6 sm:p-8">
          {/* Onglets */}
          <div className="mb-6 grid grid-cols-3 gap-1 rounded-xl bg-slate-100 p-1" role="tablist" aria-label="Mode d'accès">
            {MODES.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                role="tab"
                aria-selected={mode === value}
                onClick={() => {
                  setMode(value);
                  setError('');
                }}
                className={`flex items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-semibold transition-colors sm:text-sm ${
                  mode === value ? 'bg-white text-charcoal shadow-sm' : 'text-slate-500 hover:text-charcoal'
                }`}
              >
                <Icon size={14} aria-hidden="true" />
                <span className="hidden sm:inline">{label}</span>
                <span className="sm:hidden">{label.split(' ')[0]}</span>
              </button>
            ))}
          </div>

          <form
            className="space-y-5"
            onSubmit={(e) => {
              e.preventDefault();
              void submit();
            }}
            noValidate
          >
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600" role="alert">
                {error}
              </div>
            )}

            {mode === 'register' && (
              <>
                <SelectField
                  label="Votre pressing"
                  value={pressingId}
                  onChange={(e) => setPressingId(e.target.value)}
                  placeholder="Choisir un pressing…"
                  options={pressings.map((p) => ({ value: p.id, label: p.name }))}
                  required
                />
                <TextField
                  label="Nom complet"
                  placeholder="Ex : Mariam Traoré"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </>
            )}

            {mode === 'ticket' && (
              <TextField
                label="Numéro de ticket"
                placeholder="Ex : TX-2609-001"
                required
                value={ticket}
                onChange={(e) => setTicket(e.target.value.toUpperCase())}
                hint="Il figure sur le reçu remis au comptoir (ou envoyé par SMS)."
              />
            )}

            {mode !== 'ticket' && (
              <PhoneInput label="Téléphone" value={phone} onValueChange={setPhone} required />
            )}

            {mode === 'ticket' && <PhoneInput label="Votre numéro de téléphone" value={phone} onValueChange={setPhone} required />}

            {mode !== 'ticket' && (
              <TextField
                label={mode === 'register' ? 'Créer un mot de passe' : 'Mot de passe'}
                type="password"
                placeholder="••••••••"
                autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                hint={mode === 'register' ? '6 caractères minimum — sert pour vos prochaines visites.' : undefined}
              />
            )}

            <button type="submit" className="btn-primary w-full !py-3" disabled={submitting}>
              {submitting ? <Loader2 size={17} className="animate-spin" aria-hidden="true" /> : <ArrowRight size={17} aria-hidden="true" />}
              {submitting
                ? 'Vérification…'
                : mode === 'login'
                  ? 'Me connecter'
                  : mode === 'register'
                    ? 'Créer mon compte'
                    : 'Accéder à mes commandes'}
            </button>
          </form>

          <div className="mt-6 flex items-start gap-3 rounded-lg bg-slate-50 p-4">
            <LockKeyhole size={16} className="mt-0.5 shrink-0 text-slate-400" aria-hidden="true" />
            <p className="text-xs leading-relaxed text-slate-500">
              {mode === 'ticket' ? (
                <>Consultation seule. Pour <strong>demander une collecte</strong> et voir le catalogue, créez un compte client.</>
              ) : (
                <>
                  Avec un compte, vous accédez au <strong>catalogue</strong> de votre pressing et pouvez <strong>demander une collecte</strong> à domicile.
                </>
              )}
            </p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-center gap-2 text-center text-sm text-slate-500">
          <Smartphone size={15} className="text-slate-400" aria-hidden="true" />
          Pas encore de ticket ? Créez un compte et demandez une collecte.
        </div>

        <p className="mt-4 text-center text-sm text-slate-500">
          Vous êtes gérant ou employé ?{' '}
          <Link to="/login" className="font-semibold text-primary hover:underline">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}
