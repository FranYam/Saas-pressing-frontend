import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, LogIn, Smartphone, TrendingUp, BellRing, ShieldCheck, Quote, Ticket, ArrowRight } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Logo } from '@/components/layout/Logo';
import { TextField } from '@/components/forms/FormFields';
import { formatFCFA } from '@/lib/format';

const loginSchema = z.object({
  username: z.string().min(1, `Veuillez saisir votre identifiant (téléphone ou nom d'utilisateur).`),
  password: z.string().min(1, 'Veuillez saisir votre mot de passe.')
});

type LoginForm = z.infer<typeof loginSchema>;

const FEATURES = [
  {
    icon: Smartphone,
    title: 'Paiements mobile money',
    text: 'Orange Money et Moov Money intégrés pour encaisser sans stress.'
  },
  {
    icon: TrendingUp,
    title: 'Suivi en temps réel',
    text: 'Chiffre d’affaires, créances et commandes visibles en un coup d’œil.'
  },
  {
    icon: BellRing,
    title: 'SMS automatiques',
    text: 'Vos clients sont prévenus dès que leurs vêtements sont prêts.'
  }
];

const DEMO_ACCOUNTS = [
  { label: 'Gérant', username: 'gerant', detail: 'Accès complet' },
  { label: 'Employé', username: 'employe', detail: 'Comptoir & clients' },
  { label: 'Coursier', username: 'coursier', detail: 'Missions & itinéraires' },
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
    formState: { errors }
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: '', password: '' }
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
      const msg = axiosErr?.response?.data?.detail
        ?? (err instanceof Error ? err.message : 'Identifiant ou mot de passe incorrect.');
      setServerError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const fillDemo = (username: string) => {
    setValue('username', username);
  };

  return (
    <div className="flex min-h-screen">
      {/* ── Panneau marque (gauche) ── */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-charcoal p-12 lg:flex">
        {/* Photo d'arrière-plan : atelier de pressing (recadrée au ratio du panneau) */}
        <img
          src="/images/hero-pressing-hd.jpg"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
        {/* Voile dégradé garantissant la lisibilité du texte */}
        <div className="absolute inset-0 bg-gradient-to-br from-charcoal/95 via-charcoal/80 to-charcoal/45" aria-hidden="true" />
        <div className="bg-grid-dark pointer-events-none absolute inset-0 opacity-60" aria-hidden="true" />
        <div className="pointer-events-none absolute -top-24 -right-24 h-96 w-96 rounded-full bg-primary/20 blur-3xl" aria-hidden="true" />
        <div className="pointer-events-none absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-primary/10 blur-3xl" aria-hidden="true" />

        <Link to="/" className="relative w-fit" aria-label="PressNet — retour à l'accueil">
          <Logo />
        </Link>

        <div className="relative">
          <h2 className="max-w-md text-3xl leading-tight font-bold text-white">
            La gestion de votre pressing, <span className="text-primary-300">simplifiée</span>.
          </h2>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-slate-200">
            Commandes, clients, paiements et livraisons : tout est réuni dans une application pensée pour les pressings du Burkina Faso.
          </p>

          <ul className="mt-10 space-y-6">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex items-start gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/10 backdrop-blur-sm">
                  <Icon size={18} className="text-primary-300" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-white">{title}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-slate-300">{text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <figure className="relative rounded-xl border border-white/10 bg-charcoal/40 p-5 backdrop-blur-sm">
          <Quote size={18} className="text-primary-300" aria-hidden="true" />
          <blockquote className="mt-2 text-sm leading-relaxed text-slate-200">
            « Depuis PressNet, je connais mes créances du jour en un regard. Mes clientes reçoivent le SMS avant même que je rappelle. »
          </blockquote>
          <figcaption className="mt-3 text-xs font-medium text-slate-400">
            Aminata Compaoré — Gérante, Pressing Wend Panga (Secteur 15)
          </figcaption>
        </figure>
      </div>

      {/* ── Formulaire (droite) ── */}
      <div className="flex w-full items-center justify-center bg-sand px-4 py-10 lg:w-1/2">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <Logo variant="dark" />
          </div>

          <h1 className="text-2xl font-semibold text-charcoal">Connexion</h1>
          <p className="page-subtitle">Heureux de vous revoir ! Connectez-vous à votre espace pressing.</p>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5" noValidate>
            {serverError && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600" role="alert">
                {serverError}
              </div>
            )}

            <TextField
              label="Identifiant (téléphone ou nom d'utilisateur)"
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
                  className="absolute top-[34px] right-3 rounded p-1 text-slate-400 hover:text-charcoal"
                  aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <div className="mt-2 text-right">
                <a href="#" className="text-xs font-medium text-primary hover:underline" onClick={(e) => e.preventDefault()}>
                  Mot de passe oublié ?
                </a>
              </div>
            </div>

            <button type="submit" className="btn-primary w-full !py-3" disabled={submitting}>
              <LogIn size={17} aria-hidden="true" />
              {submitting ? 'Connexion en cours…' : 'Se connecter'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Pas encore de compte ?{' '}
            <Link to="/register" className="font-semibold text-primary hover:underline">
              Inscrire mon pressing
            </Link>
          </p>

          {/* Espace client */}
          <Link
            to="/client/access"
            className="card card-hover mt-4 flex items-center gap-3 p-4 no-underline"
            aria-label="Accéder à l'espace client"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-50">
              <Ticket size={18} className="text-primary" aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-charcoal">Vous êtes client ?</span>
              <span className="block text-xs text-slate-500">Suivez vos commandes avec votre n° de ticket — sans inscription.</span>
            </span>
            <ArrowRight size={16} className="shrink-0 text-slate-400" aria-hidden="true" />
          </Link>

          {/* Comptes de démonstration */}
          <div className="card mt-8 p-4">
            <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
              <ShieldCheck size={14} className="text-primary" aria-hidden="true" />
              Comptes de test — cliquez pour remplir l'identifiant
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {DEMO_ACCOUNTS.map((d) => (
                <button
                  key={d.username}
                  type="button"
                  onClick={() => fillDemo(d.username)}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-left text-xs transition-colors hover:border-primary hover:bg-primary-50"
                >
                  <span className="block font-semibold text-charcoal">{d.label}</span>
                  <span className="block truncate text-slate-500">{d.detail}</span>
                </button>
              ))}
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-slate-400">
            Abonnement Pro — {formatFCFA(15000)} / mois · Sans engagement
          </p>
        </div>
      </div>
    </div>
  );
}
