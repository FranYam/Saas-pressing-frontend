import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, ArrowRight, Check, ImagePlus, Store, UserRound, Palette } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Logo } from '@/components/layout/Logo';
import { TextField, PhoneInput, TextArea, SelectField } from '@/components/forms/FormFields';
import { isValidBurkinaPhone } from '@/lib/format';

// ─── Schémas par étape ───────────────────────────────────────────────────────

const step1Schema = z.object({
  pressingName: z.string().min(2, 'Le nom du pressing est requis.'),
  city: z.string().min(2, 'La ville est requise.'),
  phone: z.string().refine(isValidBurkinaPhone, 'Numéro burkinabè invalide (ex : +226 70 12 34 56).'),
  address: z.string().min(4, 'L’adresse est requise.')
});

const step2Schema = z
  .object({
    fullName: z.string().min(3, 'Le nom complet est requis.'),
    username: z.string().min(3, 'L'identifiant doit contenir au moins 3 caractères (téléphone ou pseudo).'),
    password: z.string().min(6, 'Au moins 6 caractères.'),
    confirmPassword: z.string()
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas.',
    path: ['confirmPassword']
  });

const step3Schema = z.object({
  primaryColor: z.string()
});

type Step1 = z.infer<typeof step1Schema>;
type Step2 = z.infer<typeof step2Schema>;
type Step3 = z.infer<typeof step3Schema>;

const STEPS = [
  { title: 'Informations pressing', icon: Store },
  { title: 'Compte responsable', icon: UserRound },
  { title: 'Personnalisation', icon: Palette }
];

const COLOR_SWATCHES = [
  { value: '#C75B39', label: 'Terracotta' },
  { value: '#8D3B25', label: 'Brique' },
  { value: '#3B82F6', label: 'Bleu Faso' },
  { value: '#22C55E', label: 'Vert Sahel' },
  { value: '#7C3AED', label: 'Violet' },
  { value: '#1E293B', label: 'Charbon' }
];

const CITIES = ['Ouagadougou', 'Bobo-Dioulasso', 'Koudougou', 'Banfora', 'Ouahigouya', 'Fada N\'Gourma'].map((c) => ({
  value: c,
  label: c
}));

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register: registerAccount } = useAuth();
  const [step, setStep] = useState(0);
  const [logoName, setLogoName] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  const form1 = useForm<Step1>({ resolver: zodResolver(step1Schema), defaultValues: { pressingName: '', city: 'Ouagadougou', phone: '+226 ', address: '' } });
  const form2 = useForm<Step2>({ resolver: zodResolver(step2Schema), defaultValues: { fullName: '', username: '', password: '', confirmPassword: '' } });
  const form3 = useForm<Step3>({ resolver: zodResolver(step3Schema), defaultValues: { primaryColor: '#C75B39' } });

  const primaryColor = form3.watch('primaryColor');

  const nextFrom1 = form1.handleSubmit(() => setStep(1));
  const nextFrom2 = form2.handleSubmit(() => setStep(2));

  const finish = form3.handleSubmit(async (data3) => {
    const data1 = form1.getValues();
    const data2 = form2.getValues();
    setServerError('');
    setSubmitting(true);
    try {
      await registerAccount({
        pressingName: data1.pressingName,
        city: data1.city,
        phone: data1.phone,
        address: data1.address,
        fullName: data2.fullName,
        username: data2.username,
        password: data2.password,
        primaryColor: data3.primaryColor
      });
      navigate('/dashboard', { replace: true });
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: Record<string, string[]> } };
      const apiErrors = axiosErr?.response?.data;
      const firstError = apiErrors ? Object.values(apiErrors).flat()[0] : null;
      setServerError(firstError ?? (err instanceof Error ? err.message : 'Une erreur est survenue. Réessayez.'));
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-sand px-4 py-10">
      <div className="w-full max-w-xl">
        <div className="mb-8 flex flex-col items-center text-center">
          <Logo variant="dark" size="lg" />
          <h1 className="mt-6 text-2xl font-semibold text-charcoal">Inscrire mon pressing</h1>
          <p className="mt-1.5 text-sm text-slate-500">3 étapes rapides pour commencer à gérer vos commandes.</p>
        </div>

        {/* Barre de progression */}
        <ol className="mb-6 flex items-center" aria-label="Progression de l'inscription">
          {STEPS.map(({ title, icon: Icon }, i) => {
            const done = i < step;
            const current = i === step;
            return (
              <li key={title} className="flex flex-1 items-center last:flex-none">
                <div className="flex flex-col items-center gap-1.5">
                  <span
                    className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors ${
                      done
                        ? 'border-primary bg-primary text-white'
                        : current
                          ? 'border-primary bg-white text-primary'
                          : 'border-slate-200 bg-white text-slate-300'
                    }`}
                    aria-current={current ? 'step' : undefined}
                    aria-label={`Étape ${i + 1} : ${title}`}
                  >
                    {done ? <Check size={17} /> : <Icon size={17} />}
                  </span>
                  <span className={`hidden text-[11px] font-medium sm:block ${current ? 'text-charcoal' : 'text-slate-400'}`}>{title}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`mx-2 h-0.5 flex-1 rounded-full sm:mx-3 ${i < step ? 'bg-primary' : 'bg-slate-200'}`} aria-hidden="true" />
                )}
              </li>
            );
          })}
        </ol>

        <div className="card p-6 sm:p-8">
          {/* ── Étape 1 : pressing ── */}
          {step === 0 && (
            <form onSubmit={nextFrom1} className="space-y-5" noValidate>
              <TextField label="Nom du pressing" placeholder="Ex : Pressing Faso Propre" required error={form1.formState.errors.pressingName?.message} {...form1.register('pressingName')} />
              <div className="grid gap-5 sm:grid-cols-2">
                <SelectField label="Ville" options={CITIES} error={form1.formState.errors.city?.message} {...form1.register('city')} />
                <PhoneInput label="Téléphone du pressing" value={form1.watch('phone')} onValueChange={(v) => form1.setValue('phone', v, { shouldValidate: form1.formState.isSubmitted })} error={form1.formState.errors.phone?.message} required />
              </div>
              <TextArea label="Adresse" placeholder="Ex : Secteur 4, Av. Kwame N'Krumah, face à la pharmacie" required error={form1.formState.errors.address?.message} {...form1.register('address')} />
              <div className="flex justify-end pt-2">
                <button type="submit" className="btn-primary">
                  Étape suivante
                  <ArrowRight size={16} aria-hidden="true" />
                </button>
              </div>
            </form>
          )}

          {/* ── Étape 2 : responsable ── */}
          {step === 1 && (
            <form onSubmit={nextFrom2} className="space-y-5" noValidate>
              <TextField label="Nom complet du responsable" placeholder="Ex : Aïcha Ouédraogo" autoComplete="name" required error={form2.formState.errors.fullName?.message} {...form2.register('fullName')} />
              <TextField label="Identifiant du responsable (téléphone ou pseudo)" type="text" placeholder="Ex : 70123456 ou aichaouedraogo" autoComplete="username" required error={form2.formState.errors.username?.message} {...form2.register('username')} />
              <div className="grid gap-5 sm:grid-cols-2">
                <TextField label="Mot de passe" type="password" placeholder="••••••••" autoComplete="new-password" required error={form2.formState.errors.password?.message} {...form2.register('password')} />
                <TextField label="Confirmer le mot de passe" type="password" placeholder="••••••••" autoComplete="new-password" required error={form2.formState.errors.confirmPassword?.message} {...form2.register('confirmPassword')} />
              </div>
              <div className="flex justify-between pt-2">
                <button type="button" onClick={() => setStep(0)} className="btn-secondary">
                  <ArrowLeft size={16} aria-hidden="true" />
                  Retour
                </button>
                <button type="submit" className="btn-primary">
                  Étape suivante
                  <ArrowRight size={16} aria-hidden="true" />
                </button>
              </div>
            </form>
          )}

          {/* ── Étape 3 : personnalisation ── */}
          {step === 2 && (
            <form onSubmit={finish} className="space-y-6" noValidate>
              {serverError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600" role="alert">
                  {serverError}
                </div>
              )}

              {/* Logo */}
              <div>
                <span className="label-base">Logo du pressing (optionnel)</span>
                <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 px-4 py-7 text-center transition-colors hover:border-primary hover:bg-primary-50/40">
                  <ImagePlus size={26} className="text-slate-400" aria-hidden="true" />
                  <span className="text-sm font-medium text-charcoal">Téléverser un logo</span>
                  <span className="text-xs text-slate-400">PNG ou JPG, carré recommandé (max 1 Mo)</span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg"
                    className="sr-only"
                    onChange={(e) => setLogoName(e.target.files?.[0]?.name ?? null)}
                  />
                </label>
                {logoName && (
                  <p className="mt-2 flex items-center gap-1 text-xs font-medium text-green-600">
                    <Check size={13} aria-hidden="true" />
                    {logoName}
                  </p>
                )}
              </div>

              {/* Couleur */}
              <div>
                <span className="label-base">Couleur principale</span>
                <div className="flex flex-wrap gap-3">
                  {COLOR_SWATCHES.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => form3.setValue('primaryColor', c.value)}
                      className={`flex h-11 w-11 items-center justify-center rounded-full border-2 transition-transform hover:scale-110 ${
                        primaryColor === c.value ? 'border-charcoal' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: c.value }}
                      aria-label={`Couleur ${c.label}`}
                      aria-pressed={primaryColor === c.value}
                      title={c.label}
                    >
                      {primaryColor === c.value && <Check size={16} className="text-white drop-shadow" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Aperçu */}
              <div className="rounded-xl border border-slate-200 bg-sand p-4">
                <p className="mb-3 text-xs font-semibold tracking-wide text-slate-500 uppercase">Aperçu de votre espace</p>
                <div className="flex items-center gap-3 rounded-lg bg-white p-4 shadow-card">
                  <span className="flex h-11 w-11 items-center justify-center rounded-lg text-sm font-bold text-white" style={{ backgroundColor: primaryColor }}>
                    {(form1.watch('pressingName') || 'P').charAt(0).toUpperCase()}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-charcoal">{form1.watch('pressingName') || 'Nom du pressing'}</p>
                    <p className="text-xs text-slate-500">{form1.watch('city') || 'Ville'} · Burkina Faso</p>
                  </div>
                  <span className="ml-auto rounded-full px-3 py-1 text-xs font-semibold text-white" style={{ backgroundColor: primaryColor }}>
                    Nouveau
                  </span>
                </div>
              </div>

              <div className="flex justify-between pt-1">
                <button type="button" onClick={() => setStep(1)} className="btn-secondary">
                  <ArrowLeft size={16} aria-hidden="true" />
                  Retour
                </button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  <Check size={16} aria-hidden="true" />
                  {submitting ? 'Création en cours…' : 'Créer mon compte'}
                </button>
              </div>
            </form>
          )}
        </div>

        <p className="mt-6 text-center text-sm text-slate-500">
          Vous avez déjà un compte ?{' '}
          <Link to="/login" className="font-semibold text-primary hover:underline">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}
