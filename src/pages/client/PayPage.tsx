import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Check, Smartphone, ShieldCheck, Loader2, BadgeCheck } from 'lucide-react';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { CLIENT_NAV } from './ClientDashboardPage';
import { useClientAccess } from '@/context/ClientAccessContext';
import type { PaymentMethod } from '@/types';
import { PhoneInput } from '@/components/forms/FormFields';
import { formatFCFA, isValidBurkinaPhone } from '@/lib/format';

const OPERATORS: { value: PaymentMethod; label: string; sub: string; colors: string }[] = [
  {
    value: 'orange_money',
    label: 'Orange Money',
    sub: 'Orange Burkina',
    colors: 'border-orange-400 bg-orange-50'
  },
  {
    value: 'moov_money',
    label: 'Moov Money',
    sub: 'Moov Africa',
    colors: 'border-blue-400 bg-blue-50'
  }
];

export default function PayPage() {
  const { id = '' } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { data, clear } = useClientAccess();

  const order = useMemo(
    () => (data?.orders ?? []).find((o) => o.id === id || o.ticket.toLowerCase() === id.toLowerCase()),
    [data?.orders, id]
  );

  const amount = order ? Math.max(0, order.total - order.paidAmount) : Number(searchParams.get('amount') ?? 0);
  const [operator, setOperator] = useState<PaymentMethod | null>(null);
  const [phone, setPhone] = useState('+226 ');
  const [stage, setStage] = useState<'form' | 'processing' | 'done'>('form');
  const [error, setError] = useState('');

  const submit = async () => {
    setError('');
    if (!operator) return setError('Choisissez votre opérateur mobile money.');
    if (!isValidBurkinaPhone(phone)) return setError('Numéro de téléphone burkinabè invalide.');
    setStage('processing');
    // Passerelle mobile money : le push USSD réel sera branché avec le backend
    await new Promise((r) => setTimeout(r, 1800));
    setStage('done');
  };

  return (
    <PortalLayout
      title="Paiement mobile money"
      nav={CLIENT_NAV}
      identity={data ? { name: data.name, sub: data.phone } : undefined}
      onExit={() => {
        clear();
        navigate('/client/access', { replace: true });
      }}
      exitLabel="Quitter l'espace"
    >
      <div className="mx-auto w-full max-w-md">
        {stage === 'done' ? (
          <div className="card mt-6 p-8 text-center">
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-green-50">
              <BadgeCheck size={40} className="text-green-500" aria-hidden="true" />
            </div>
            <h2 className="text-lg font-bold text-charcoal">Paiement réussi !</h2>
            <p className="mt-2 text-sm text-slate-500">
              {formatFCFA(amount)} ont été débités de votre compte {operator === 'orange_money' ? 'Orange Money' : 'Moov Money'}.
            </p>
            {order && (
              <p className="mt-1 text-xs text-slate-400">Commande {order.ticket} — solde réglé. Conservez votre ticket de retrait.</p>
            )}
            <div className="mt-6 space-y-2.5">
              {order && (
                <Link to={`/client/track/${order.id}`} className="btn-primary w-full !py-3">
                  Voir le suivi de ma commande
                </Link>
              )}
              <button type="button" onClick={() => navigate('/client/dashboard')} className="btn-secondary w-full !py-3">
                Retour au tableau de bord
              </button>
            </div>
          </div>
        ) : (
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

            {/* Montant */}
            <div className="card p-6 text-center">
              <p className="text-xs font-medium text-slate-400">
                {order ? `Solde de la commande ${order.ticket}` : 'Montant à payer'}
              </p>
              <p className="mt-2 text-4xl font-bold tracking-tight text-primary">{formatFCFA(amount)}</p>
            </div>

            {/* Opérateur */}
            <fieldset>
              <legend className="label-base">Choisissez votre opérateur</legend>
              <div className="grid grid-cols-2 gap-3">
                {OPERATORS.map((op) => (
                  <button
                    key={op.value}
                    type="button"
                    onClick={() => setOperator(op.value)}
                    aria-pressed={operator === op.value}
                    className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all ${
                      operator === op.value ? `${op.colors} shadow-card` : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <span
                      className={`flex h-10 w-10 items-center justify-center rounded-full text-white ${
                        op.value === 'orange_money' ? 'bg-orange-500' : 'bg-blue-500'
                      }`}
                      aria-hidden="true"
                    >
                      <Smartphone size={19} />
                    </span>
                    <span className="text-sm font-semibold text-charcoal">{op.label}</span>
                    <span className="text-[11px] text-slate-400">{op.sub}</span>
                  </button>
                ))}
              </div>
            </fieldset>

            {/* Numéro */}
            <div className="card p-4">
              <PhoneInput label="Numéro à débiter" value={phone} onValueChange={setPhone} required />
              <p className="mt-2 text-xs leading-relaxed text-slate-400">
                Vous recevrez une notification sur votre téléphone pour confirmer le paiement par votre code secret.
              </p>
            </div>

            <button type="submit" className="btn-primary w-full !py-3.5" disabled={stage === 'processing'}>
              {stage === 'processing' ? (
                <>
                  <Loader2 size={17} className="animate-spin" aria-hidden="true" />
                  Traitement en cours…
                </>
              ) : (
                <>
                  <Check size={17} aria-hidden="true" />
                  Confirmer le paiement
                </>
              )}
            </button>

            <p className="flex items-center justify-center gap-1.5 text-center text-xs text-slate-400">
              <ShieldCheck size={13} aria-hidden="true" />
              Paiement sécurisé via la passerelle mobile money
            </p>
          </form>
        )}
      </div>
    </PortalLayout>
  );
}
