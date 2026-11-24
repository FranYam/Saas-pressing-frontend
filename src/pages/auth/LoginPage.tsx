import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, LogIn, ShieldCheck, Ticket, ArrowLeft, ArrowRight } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { TextField } from '@/components/forms/FormFields';

const loginSchema = z.object({
  username: z.string().min(1, `Veuillez saisir votre identifiant (téléphone ou nom d'utilisateur).`),
  password: z.string().min(1, 'Veuillez saisir votre mot de passe.'),
});

type LoginForm = z.infer<typeof loginSchema>;

const DEMO_ACCOUNTS = [
  { label: 'Gérant', username: 'gerant', detail: 'Accès complet & finances' },
  { label: 'Employé', username: 'employe', detail: 'Comptoir & clients' },
  { label: 'Coursier', username: 'coursier', detail: 'Missions & livraisons' },
];

export default function LoginPage() {
  const { login, homeForRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: '', password: '' },
  });

  const onSubmit = async (data: LoginForm) => {
    setServerError('');
    setSubmitting(true);
    try {
      const loggedIn = await login(data.username, data.password);
      const from = (location.state as { from?: string } | null)?.from;
      navigate(from ?? homeForRole(loggedIn.role), { replace: true });
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } } };
      const msg =
        axiosErr?.response?.data?.detail ??
        (err instanceof Error ? err.message : 'Identifiant ou mot de passe incorrect.');
      setServerError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const fillDemo = (username: string) => {
    setValue('username', username);
    setValue('password', 'password123');
  };

  return (
    <div className="flex min-h-screen flex-col justify-center bg-surface px-4 py-12 sm:px-6 lg:px-8">
      {/* Lien retour accueil */}
      <div className="mx-auto w-full max-w-md mb-4">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-navy transition-colors"
        >
          <ArrowLeft size={14} />
          Retour à l'accueil
        </Link>
      </div>

      <div className="mx-auto w-full max-w-md">
        {/* En-tête de marque */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-3" aria-label="PressNet">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-navy text-white shadow-md shadow-navy/20">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M3 6h18M3 12h18M3 18h12" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
              </svg>
            </span>
            <span className="text-2xl font-bold tracking-tight text-navy">
              Press<span className="text-slate-500 font-medium">Net</span>
            </span>
          </Link>
          <h1 className="mt-6 text-2xl font-bold tracking-tight text-navy">
            Connexion à votre pressing
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Espace gérant, employé de comptoir et coursier.
          </p>
        </div>

        {/* Carte de connexion */}
        <div className="card p-6 sm:p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
            {serverError && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600" role="alert">
                {serverError}
              </div>
            )}

            <TextField
              label="Identifiant (Téléphone ou pseudo)"
              type="text"
              placeholder="Ex : 70123456 ou admin"
              autoComplete="username"
              required
              error={errors.username?.message}
              {...register('username')}
            />

            <div>
              <div className="relative">
                <TextField
                  label="Mot de passe"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                  error={errors.password?.message}
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute top-[32px] right-3 rounded p-1 text-slate-400 hover:text-navy"
                  aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" className="btn-primary w-full !py-3 font-bold" disabled={submitting}>
              <LogIn size={17} aria-hidden="true" />
              {submitting ? 'Connexion en cours…' : 'Accéder à mon espace'}
            </button>
          </form>

          {/* Raccourcis comptes de test */}
          <div className="mt-8 border-t border-slate-100 pt-6">
            <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
              <ShieldCheck size={14} className="text-navy" aria-hidden="true" />
              Comptes de test rapide
            </p>
            <div className="mt-2.5 grid grid-cols-3 gap-2">
              {DEMO_ACCOUNTS.map((d) => (
                <button
                  key={d.username}
                  type="button"
                  onClick={() => fillDemo(d.username)}
                  className="rounded-lg border border-slate-200/80 bg-slate-50/60 p-2 text-left text-xs transition-colors hover:border-navy hover:bg-white"
                >
                  <span className="block font-bold text-navy">{d.label}</span>
                  <span className="block truncate text-[10px] text-slate-400">{d.username}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Liens secondaires : Espace client & Inscription */}
        <div className="mt-6 space-y-3">
          <Link
            to="/client/access"
            className="card flex items-center justify-between p-4 transition-colors hover:border-primary-300 hover:bg-white"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-navy text-white">
                <Ticket size={17} />
              </span>
              <div>
                <p className="text-sm font-semibold text-navy">Vous êtes client ?</p>
                <p className="text-xs text-slate-500">Suivez l'état de votre linge avec votre n° de ticket</p>
              </div>
            </div>
            <ArrowRight size={15} className="text-slate-400" />
          </Link>

          <p className="text-center text-sm text-slate-500">
            Nouveau pressing ?{' '}
            <Link to="/register" className="font-bold text-navy hover:underline">
              Inscrire mon établissement
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
