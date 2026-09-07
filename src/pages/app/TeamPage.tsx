import { useState } from 'react';
import { Pencil, Power, UserPlus, Phone, UsersRound, ShieldCheck, WashingMachine, Bike } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { useAuth } from '@/context/AuthContext';
import type { Employee } from '@/types';
import { PageHeader } from '@/components/ui/PageHeader';
import { Avatar } from '@/components/ui/Avatar';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ROLE_LABELS, formatRelative } from '@/lib/format';

const ROLE_META: Record<Employee['role'], { icon: typeof ShieldCheck; badge: string }> = {
  gerant: { icon: ShieldCheck, badge: 'bg-primary-50 text-primary-600' },
  employe: { icon: WashingMachine, badge: 'bg-blue-50 text-blue-500' },
  coursier: { icon: Bike, badge: 'bg-green-50 text-green-500' }
};

export default function TeamPage() {
  const employees = useAppStore((s) => s.employees);
  const toggleActive = useAppStore((s) => s.toggleEmployeeActive);
  const { user } = useAuth();

  const [confirmTarget, setConfirmTarget] = useState<Employee | null>(null);
  const [busy, setBusy] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);

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

  return (
    <div className="space-y-5">
      <PageHeader
        title="Gestion de l'équipe"
        subtitle="Gérez les accès des employés et coursiers du pressing."
        actions={
          <button type="button" className="btn-primary" onClick={() => setInviteOpen(true)}>
            <UserPlus size={17} aria-hidden="true" />
            Inviter un employé
          </button>
        }
      />

      {employees.length === 0 ? (
        <div className="card">
          <EmptyState icon={UsersRound} title="Aucun membre" message="Invitez votre équipe pour répartir le travail." />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {employees.map((e) => {
            const [first, ...rest] = e.fullName.split(' ');
            const roleMeta = ROLE_META[e.role];
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
                      {e.phone}
                    </a>
                  </div>
                  <p className="truncate text-xs text-slate-400">{e.email}</p>
                  <p className="text-xs text-slate-400">
                    Dernière connexion : <span className="font-medium text-slate-500">{formatRelative(e.lastLogin)}</span>
                  </p>
                </dl>

                <div className="mt-4 flex gap-2 border-t border-slate-50 pt-4">
                  <button type="button" className="btn-secondary flex-1 !py-2 text-xs" onClick={() => setInviteOpen(true)}>
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

      {/* Modal confirmation activation */}
      <Modal
        open={!!confirmTarget}
        onClose={() => setConfirmTarget(null)}
        title={confirmTarget?.active ? 'Désactiver cet employé ?' : 'Réactiver cet employé ?'}
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

      {/* Modal invitation (simulation) */}
      <Modal open={inviteOpen} onClose={() => setInviteOpen(false)} title="Inviter un employé" size="sm">
        <div className="space-y-4">
          <p className="text-sm leading-relaxed text-slate-500">
            L'invitation par email sera disponible avec le backend. En attendant, partagez ce lien d'inscription à votre équipe :
          </p>
          <div className="rounded-lg border border-dashed border-primary-300 bg-primary-50 px-4 py-3 text-center">
            <p className="text-sm font-semibold break-all text-primary">pressnet.bf/invite/FASO-2026</p>
          </div>
          <p className="text-xs text-slate-400">
            Ce lien unique permet de créer un compte rattaché à votre pressing avec le rôle de votre choix.
          </p>
        </div>
      </Modal>
    </div>
  );
}
