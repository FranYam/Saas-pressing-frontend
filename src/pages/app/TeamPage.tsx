import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Pencil, Power, UserPlus, Phone, UsersRound, ShieldCheck, WashingMachine, Bike, CheckCircle2 } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { useAuth } from '@/context/AuthContext';
import type { Employee } from '@/types';
import { PageHeader } from '@/components/ui/PageHeader';
import { Avatar } from '@/components/ui/Avatar';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { TextField, PhoneInput } from '@/components/forms/FormFields';
import { ROLE_LABELS, formatRelative } from '@/lib/format';

const ROLE_META: Record<Employee['role'], { icon: typeof ShieldCheck; badge: string }> = {
  gerant: { icon: ShieldCheck, badge: 'bg-primary-50 text-primary-600' },
  employe: { icon: WashingMachine, badge: 'bg-blue-50 text-blue-500' },
  coursier: { icon: Bike, badge: 'bg-green-50 text-green-500' }
};

// ─── Formulaire d'inscription / modification d'un membre ─────────────────────

const memberSchema = z.object({
  firstName: z.string().min(2, 'Le prénom est requis.'),
  lastName: z.string().min(2, 'Le nom est requis.'),
  phone: z.string().min(6, 'Le numéro de téléphone sert d’identifiant de connexion.'),
  // Requis à la création, optionnel en édition (défini dynamiquement via superRefine)
  password: z.string(),
  role: z.enum(['EMPLOYE', 'COURSIER'])
});

type MemberForm = z.infer<typeof memberSchema>;

interface MemberFormModalProps {
  /** Membre à modifier ; null = inscription */
  employee: Employee | null;
  onClose: () => void;
  onSubmit: (values: MemberForm) => Promise<void>;
}

function MemberFormModal({ employee, onClose, onSubmit }: MemberFormModalProps) {
  const isEdit = !!employee;
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors }
  } = useForm<MemberForm>({
    resolver: zodResolver(memberSchema),
    defaultValues: { firstName: '', lastName: '', phone: '+226 ', password: '', role: 'EMPLOYE' }
  });

  // Pré-remplit le formulaire en mode édition
  useEffect(() => {
    if (employee) {
      const [firstName = '', ...rest] = employee.fullName.split(' ');
      reset({
        firstName,
        lastName: rest.join(' '),
        phone: employee.phone || employee.email,
        password: '',
        role: employee.role === 'coursier' ? 'COURSIER' : 'EMPLOYE'
      });
    } else {
      reset({ firstName: '', lastName: '', phone: '+226 ', password: '', role: 'EMPLOYE' });
    }
    setDone(false);
    setServerError('');
  }, [employee, reset]);

  const role = watch('role');
  const phone = watch('phone');

  const close = () => {
    onClose();
  };

  const submit = handleSubmit(async (values) => {
    if (!isEdit && values.password.length < 6) {
      setValue('password', values.password, { shouldValidate: true });
      return;
    }
    setServerError('');
    setSubmitting(true);
    try {
      await onSubmit(values);
      setDone(true);
    } catch (err) {
      const axiosErr = err as { response?: { data?: Record<string, string | string[]> } };
      const details = axiosErr?.response?.data;
      const first = details ? Object.values(details)[0] : undefined;
      setServerError(
        (Array.isArray(first) ? first[0] : first) ??
          (err instanceof Error ? err.message : 'Impossible d’enregistrer. Réessayez.')
      );
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <Modal
      open={true}
      onClose={close}
      title={done ? (isEdit ? 'Modifications enregistrées' : 'Compte créé') : isEdit ? 'Modifier le membre' : 'Inscrire un membre'}
      size="sm"
      footer={
        done ? (
          <button type="button" className="btn-primary w-full" onClick={close}>
            Fermer
          </button>
        ) : (
          <>
            <button type="button" className="btn-secondary" onClick={close} disabled={submitting}>
              Annuler
            </button>
            <button type="button" className="btn-primary" onClick={() => void submit()} disabled={submitting}>
              {submitting ? <LoadingSpinner size={16} /> : <UserPlus size={16} aria-hidden="true" />}
              {submitting ? 'Enregistrement…' : isEdit ? 'Enregistrer' : 'Créer le compte'}
            </button>
          </>
        )
      }
    >
      {done ? (
        <div className="py-2 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-green-50">
            <CheckCircle2 size={26} className="text-green-500" aria-hidden="true" />
          </div>
          <p className="text-sm font-semibold text-charcoal">
            {isEdit ? 'Le compte a été mis à jour' : 'Le compte a été créé avec succès'}
          </p>
          {!isEdit && (
            <p className="mt-1 text-xs leading-relaxed text-slate-500">
              La personne peut maintenant se connecter avec son numéro de téléphone et son mot de passe.
            </p>
          )}
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4" noValidate>
          {serverError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600" role="alert">
              {serverError}
            </div>
          )}

          {/* Rôle */}
          <fieldset>
            <span className="label-base">Rôle du compte</span>
            {isEdit ? (
              <p className="rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-500">
                {role === 'COURSIER' ? 'Coursier' : 'Employé'} — non modifiable
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    { value: 'EMPLOYE', label: 'Employé', icon: WashingMachine },
                    { value: 'COURSIER', label: 'Coursier', icon: Bike }
                  ] as const
                ).map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setValue('role', value)}
                    aria-pressed={role === value}
                    className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors ${
                      role === value ? 'border-primary bg-primary-50 text-primary' : 'border-slate-200 text-slate-600 hover:border-primary-300'
                    }`}
                  >
                    <Icon size={16} aria-hidden="true" />
                    {label}
                  </button>
                ))}
              </div>
            )}
          </fieldset>

          <div className="grid grid-cols-2 gap-3">
            <TextField label="Prénom" placeholder="Ex : Ibrahim" required error={errors.firstName?.message} {...register('firstName')} />
            <TextField label="Nom" placeholder="Ex : Kaboré" required error={errors.lastName?.message} {...register('lastName')} />
          </div>

          <PhoneInput
            label="Téléphone (identifiant de connexion)"
            value={phone}
            onValueChange={(v) => setValue('phone', v, { shouldValidate: true })}
            error={errors.phone?.message}
            required
          />

          <TextField
            label={isEdit ? 'Nouveau mot de passe (optionnel)' : 'Mot de passe'}
            type="password"
            placeholder="••••••••"
            autoComplete="new-password"
            required={!isEdit}
            error={!isEdit && watch('password').length > 0 && watch('password').length < 6 ? 'Au moins 6 caractères.' : undefined}
            {...register('password')}
          />

          <p className="text-xs leading-relaxed text-slate-400">
            {isEdit
              ? 'Laissez le mot de passe vide pour conserver le mot de passe actuel.'
              : "L'employé se connectera avec son numéro de téléphone et ce mot de passe."}
          </p>
        </form>
      )}
    </Modal>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TeamPage() {
  const employees = useAppStore((s) => s.employees);
  const toggleActive = useAppStore((s) => s.toggleEmployeeActive);
  const createEmployeeAction = useAppStore((s) => s.createEmployee);
  const updateEmployeeAction = useAppStore((s) => s.updateEmployee);
  const { user } = useAuth();

  const [confirmTarget, setConfirmTarget] = useState<Employee | null>(null);
  const [busy, setBusy] = useState(false);
  /** null = fermé ; 'new' = inscription ; Employee = modification */
  const [formTarget, setFormTarget] = useState<Employee | 'new' | null>(null);

  const onToggle = async () => {
    if (!confirmTarget) return;
    setBusy(true);
    try {
      await toggleActive(confirmTarget.id);
      setConfirmTarget(null);
    } finally {
      setBusy(false);
    }
  };

  const onFormSubmit = async (values: MemberForm) => {
    if (formTarget && formTarget !== 'new') {
      // Modification : mot de passe optionnel
      await updateEmployeeAction(formTarget.id, {
        first_name: values.firstName,
        last_name: values.lastName,
        ...(values.password.length >= 6 ? { password: values.password } : {})
      });
    } else {
      // Inscription d'un nouveau membre
      await createEmployeeAction({
        username: values.phone.replace(/\s/g, ''),
        password: values.password,
        first_name: values.firstName,
        last_name: values.lastName,
        role: values.role
      });
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Gestion de l'équipe"
        subtitle="Inscrivez vos employés et coursiers, gérez leurs accès."
        actions={
          <button type="button" className="btn-primary" onClick={() => setFormTarget('new')}>
            <UserPlus size={17} aria-hidden="true" />
            Inscrire un membre
          </button>
        }
      />

      {employees.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={UsersRound}
            title="Aucun membre"
            message="Inscrivez votre équipe pour répartir le travail."
            action={
              <button type="button" className="btn-primary" onClick={() => setFormTarget('new')}>
                <UserPlus size={16} aria-hidden="true" />
                Inscrire un membre
              </button>
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {employees.map((e) => {
            const [first, ...rest] = e.fullName.split(' ');
            const roleMeta = ROLE_META[e.role] ?? ROLE_META.employe;
            return (
              <article key={e.id} className="card card-hover p-5" aria-label={`Employé ${e.fullName}`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar firstName={first} lastName={rest.join(' ')} size={48} className="ring-2 ring-slate-100" />
                    <div>
                      <h2 className="text-sm font-semibold text-charcoal">{e.fullName}</h2>
                      <span className={`mt-1 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${roleMeta.badge}`}>
                        <roleMeta.icon size={11} aria-hidden="true" />
                        {ROLE_LABELS[e.role]}
                      </span>
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                      e.active ? 'bg-green-50 text-green-600' : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${e.active ? 'bg-green-500' : 'bg-slate-400'}`} aria-hidden="true" />
                    {e.active ? 'Actif' : 'Inactif'}
                  </span>
                </div>

                <dl className="mt-4 space-y-2 border-t border-slate-50 pt-4 text-sm">
                  <div className="flex items-center gap-2 text-slate-500">
                    <Phone size={13} aria-hidden="true" />
                    <a href={`tel:${e.phone.replace(/\s/g, '')}`} className="hover:text-primary">
                      {e.phone || e.email}
                    </a>
                  </div>
                  <p className="truncate text-xs text-slate-400">{e.email}</p>
                  <p className="text-xs text-slate-400">
                    Dernière connexion : <span className="font-medium text-slate-500">{formatRelative(e.lastLogin)}</span>
                  </p>
                </dl>

                <div className="mt-4 flex gap-2 border-t border-slate-50 pt-4">
                  <button
                    type="button"
                    className="btn-secondary flex-1 !py-2 text-xs"
                    onClick={() => setFormTarget(e)}
                  >
                    <Pencil size={13} aria-hidden="true" />
                    Modifier
                  </button>
                  {e.id !== user?.id && (
                    <button
                      type="button"
                      className={`btn-secondary flex-1 !py-2 text-xs ${e.active ? '!text-red-500 hover:!bg-red-50' : '!text-green-600 hover:!bg-green-50'}`}
                      onClick={() => setConfirmTarget(e)}
                    >
                      <Power size={13} aria-hidden="true" />
                      {e.active ? 'Désactiver' : 'Réactiver'}
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Formulaire d'inscription / modification */}
      {formTarget !== null && (
        <MemberFormModal
          employee={formTarget === 'new' ? null : formTarget}
          onClose={() => setFormTarget(null)}
          onSubmit={onFormSubmit}
        />
      )}

      {/* Modal confirmation activation */}
      <Modal
        open={!!confirmTarget}
        onClose={() => setConfirmTarget(null)}
        title={confirmTarget?.active ? 'Désactiver ce membre ?' : 'Réactiver ce membre ?'}
        size="sm"
        footer={
          <>
            <button type="button" className="btn-secondary" onClick={() => setConfirmTarget(null)}>
              Annuler
            </button>
            <button
              type="button"
              className={`btn-primary ${confirmTarget?.active ? '!bg-red-500 hover:!bg-red-600' : '!bg-green-500 hover:!bg-green-600'}`}
              onClick={onToggle}
              disabled={busy}
            >
              {busy ? <LoadingSpinner size={16} /> : null}
              {confirmTarget?.active ? 'Désactiver' : 'Réactiver'}
            </button>
          </>
        }
      >
        {confirmTarget && (
          <p className="text-sm leading-relaxed text-slate-500">
            {confirmTarget.active
              ? `${confirmTarget.fullName} n'aura plus accès à l'application. Son compte pourra être réactivé à tout moment.`
              : `${confirmTarget.fullName} retrouvera l'accès à l'application avec son rôle (${ROLE_LABELS[confirmTarget.role]}).`}
          </p>
        )}
      </Modal>
    </div>
  );
}
