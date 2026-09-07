import type { LucideIcon } from 'lucide-react';

/** Accents de couleur disponibles pour les pastilles d'icônes */
export const ACCENTS = {
  primary: 'bg-primary-50 text-primary-600',
  green: 'bg-green-50 text-green-600',
  red: 'bg-red-50 text-red-500',
  blue: 'bg-blue-50 text-blue-500',
  orange: 'bg-orange-50 text-orange-500',
  violet: 'bg-violet-50 text-violet-500',
  slate: 'bg-slate-100 text-slate-500'
} as const;

export type Accent = keyof typeof ACCENTS;

const SIZES = {
  sm: { box: 'h-8 w-8', icon: 15 },
  md: { box: 'h-10 w-10', icon: 18 },
  lg: { box: 'h-11 w-11', icon: 21 },
  xl: { box: 'h-14 w-14', icon: 26 }
} as const;

interface IconBadgeProps {
  icon: LucideIcon;
  accent?: Accent;
  size?: keyof typeof SIZES;
  className?: string;
}

/** Pastille carrée arrondie avec icône Lucide colorée — usage universel (KPI, listes, notifications…) */
export function IconBadge({ icon: Icon, accent = 'primary', size = 'md', className = '' }: IconBadgeProps) {
  const s = SIZES[size];
  return (
    <span className={`flex shrink-0 items-center justify-center rounded-lg ${ACCENTS[accent]} ${s.box} ${className}`}>
      <Icon size={s.icon} aria-hidden="true" />
    </span>
  );
}
