import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: number;
  label?: string;
  className?: string;
}

export function LoadingSpinner({ size = 24, label, className = '' }: LoadingSpinnerProps) {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`} role="status" aria-live="polite">
      <Loader2 size={size} className="animate-spin text-primary" aria-hidden="true" />
      {label && <p className="text-sm text-slate-500">{label}</p>}
      <span className="sr-only">{label ?? 'Chargement en cours'}</span>
    </div>
  );
}
