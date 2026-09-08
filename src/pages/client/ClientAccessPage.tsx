import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Ticket, Loader2, LockKeyhole, Smartphone } from 'lucide-react';
import { Logo } from '@/components/layout/Logo';
import { TextField, PhoneInput } from '@/components/forms/FormFields';
import { useClientAccess } from '@/context/ClientAccessContext';
import { isValidBurkinaPhone } from '@/lib/format';

/**
 * Accès public à l'Espace client : le client saisit le n° de ticket figurant
 * sur son reçu (ou reçu par SMS) et son numéro de téléphone. Aucun compte requis.
 */
export default function ClientAccessPage() {
  const navigate = useNavigate();
  const { login } = useClientAccess();
  const [ticket, setTicket] = useState('');
  const [phone, setPhone] = useState('+226 ');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    setError('');
    if (!ticket.trim()) return setError('Veuillez saisir le numéro de ticket figurant sur votre reçu.');
    if (!isValidBurkinaPhone(phone)) return setError('Numéro de téléphone burkinabè invalide.');
    setSubmitting(true);
    try {
      await login(ticket, phone);
      navigate('/client/dashboard', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue. Réessayez.');
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
          <p className="page-subtitle">Suivez vos commandes et réglez votre solde — sans créer de compte.</p>
        </div>

        <div className="card p-6 sm:p-8">
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

            <TextField
              label="Numéro de ticket"
              placeholder="Ex : PR-0001"
              required
              value={ticket}
              onChange={(e) => setTicket(e.target.value.toUpperCase())}
              hint="Il figure sur le reçu remis au comptoir (ou envoyé par SMS)."
            />

            <PhoneInput
              label="Votre numéro de téléphone"
              value={phone}
              onValueChange={setPhone}
              required
            />

            <button type="submit" className="btn-primary w-full !py-3" disabled={submitting}>
              {submitting ? <Loader2 size={17} className="animate-spin" aria-hidden="true" /> : <ArrowRight size={17} aria-hidden="true" />}
              {submitting ? 'Vérification…' : 'Accéder à mes commandes'}
            </button>
          </form>

          <div className="mt-6 flex items-start gap-3 rounded-lg bg-slate-50 p-4">
            <LockKeyhole size={16} className="mt-0.5 shrink-0 text-slate-400" aria-hidden="true" />
            <p className="text-xs leading-relaxed text-slate-500">
              Vos données sont protégées : l'accès nécessite à la fois votre ticket <strong>et</strong> votre numéro
              de téléphone.
            </p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-center gap-2 text-center text-sm text-slate-500">
          <Smartphone size={15} className="text-slate-400" aria-hidden="true" />
          Pas encore de ticket ? Passez au pressing ou demandez une collecte.
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
