import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

interface PortalHeroProps {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  /** Bouton d'action principal (droite) */
  action?: ReactNode;
}

/** Bandeau d'accueil des portails Client et Coursier (fond charbon + grille décorative) */
export function PortalHero({ icon: Icon, title, subtitle, action }: PortalHeroProps) {
  return (
    <section className="relative mb-6 overflow-hidden rounded-2xl bg-charcoal p-6 text-white md:p-8">
      <div className="bg-grid-dark pointer-events-none absolute inset-0" aria-hidden="true" />
      <div className="pointer-events-none absolute -top-20 -right-20 h-64 w-64 rounded-full bg-primary/25 blur-3xl" aria-hidden="true" />
      <div className="relative flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <span className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary text-white shadow-lg shadow-primary/30 sm:flex">
            <Icon size={23} aria-hidden="true" />
          </span>
          <div>
            <p className="text-base font-semibold md:text-lg">{title}</p>
            <p className="mt-1 max-w-xl text-xs leading-relaxed text-slate-300 md:text-sm">{subtitle}</p>
          </div>
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </section>
  );
}
