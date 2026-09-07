import type { LucideIcon } from 'lucide-react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { IconBadge, type Accent } from './IconBadge';

interface KPICardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  /** Pourcentage d'évolution, ex. +12 ou -4 ; undefined = pas de badge */
  trend?: number;
  accent?: Accent;
}

/** Carte KPI du tableau de bord : pastille colorée, valeur, tendance optionnelle */
export function KPICard({ icon, label, value, trend, accent = 'primary' }: KPICardProps) {
  return (
    <div className="card card-hover p-5">
      <div className="flex items-start justify-between">
        <IconBadge icon={icon} accent={accent} size="lg" />
        {trend !== undefined && (
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold tabular-nums ${
              trend >= 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'
            }`}
          >
            {trend >= 0 ? <TrendingUp size={12} aria-hidden="true" /> : <TrendingDown size={12} aria-hidden="true" />}
            {trend >= 0 ? '+' : ''}
            {trend} %
          </span>
        )}
      </div>
      <p className="mt-4 text-[28px] leading-8 font-bold text-charcoal tabular-nums">{value}</p>
      <p className="mt-1 text-xs font-medium text-slate-500">{label}</p>
    </div>
  );
}
