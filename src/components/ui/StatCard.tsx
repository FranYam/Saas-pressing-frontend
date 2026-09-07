import type { LucideIcon } from 'lucide-react';
import { IconBadge, type Accent } from './IconBadge';

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  accent?: Accent;
}

/** Carte statistique compacte (icône + valeur + libellé) pour les tableaux de bord et listes */
export function StatCard({ icon, label, value, accent = 'primary' }: StatCardProps) {
  return (
    <div className="card flex items-center gap-4 p-4 md:p-5">
      <IconBadge icon={icon} accent={accent} size="lg" />
      <div className="min-w-0">
        <p className="truncate text-xl font-bold text-charcoal tabular-nums md:text-2xl">{value}</p>
        <p className="truncate text-xs font-medium text-slate-500">{label}</p>
      </div>
    </div>
  );
}
