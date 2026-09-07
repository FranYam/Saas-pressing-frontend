import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  /** Contenu à droite (boutons d'action, badges…) */
  actions?: ReactNode;
  /** Route de retour optionnelle (affiche une flèche) */
  backTo?: string;
  /** Badges affichés sous le titre (ex. statut) */
  badges?: ReactNode;
}

/** En-tête de page standardisé : retour + titre + sous-titre + actions */
export function PageHeader({ title, subtitle, actions, backTo, badges }: PageHeaderProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
      <div className="flex min-w-0 items-start gap-2">
        {backTo && (
          <Link
            to={backTo}
            className="mt-0.5 -ml-1.5 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-charcoal"
            aria-label="Retour"
          >
            <ArrowLeft size={19} />
          </Link>
        )}
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="truncate text-2xl font-semibold text-charcoal">{title}</h1>
            {badges}
          </div>
          {subtitle && <p className="page-subtitle">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
