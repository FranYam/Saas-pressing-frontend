import type { MissionStatus, MissionType, OrderStatus, PaymentMethod } from '@/types';
import { ORDER_STATUS_LABELS, MISSION_STATUS_LABELS, MISSION_TYPE_LABELS } from '@/lib/format';

type BadgeVariant = OrderStatus | MissionStatus | MissionType | PaymentMethod;

const STYLES: Record<BadgeVariant, string> = {
  // Statuts commande
  recu: 'bg-blue-50 text-blue-600',
  traitement: 'bg-sky-50 text-sky-700',
  pret: 'bg-emerald-50 text-emerald-700',
  livre: 'bg-slate-100 text-slate-500',
  // Statuts mission
  a_faire: 'bg-primary-50 text-primary-700',
  en_cours: 'bg-blue-50 text-blue-600',
  terminee: 'bg-emerald-50 text-emerald-700',
  // Types mission
  collecte: 'bg-primary-50 text-primary-600',
  livraison: 'bg-violet-50 text-violet-600',
  // Modes de paiement
  especes: 'bg-slate-100 text-slate-700',
  orange_money: 'bg-slate-100 text-slate-700',
  moov_money: 'bg-blue-50 text-blue-700'
};

const LABELS: Record<string, string> = {
  ...ORDER_STATUS_LABELS,
  ...MISSION_STATUS_LABELS,
  ...MISSION_TYPE_LABELS,
  especes: 'Espèces',
  orange_money: 'Orange Money',
  moov_money: 'Moov Money'
};

interface StatusBadgeProps {
  variant: BadgeVariant;
  label?: string;
  /** Affiche un point de couleur devant le libellé (défaut : true) */
  withDot?: boolean;
  className?: string;
}

export function StatusBadge({ variant, label, withDot = true, className = '' }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap ${STYLES[variant]} ${className}`}
    >
      {withDot && <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" aria-hidden="true" />}
      {label ?? LABELS[variant] ?? variant}
    </span>
  );
}
