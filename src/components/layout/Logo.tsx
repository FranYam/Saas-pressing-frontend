import { WashingMachine } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';

interface LogoProps {
  /** « light » = sur fond sombre */
  variant?: 'light' | 'dark';
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
}

const SIZES = {
  sm: { box: 32, icon: 16, title: 'text-base', tag: 'text-[8px]' },
  md: { box: 40, icon: 20, title: 'text-lg', tag: 'text-[9px]' },
  lg: { box: 48, icon: 24, title: 'text-xl', tag: 'text-[10px]' }
} as const;

/**
 * Logo de l'application :
 * - Par défaut : marque PressNet (icône machine + wordmark bicolore)
 * - Marque blanche : si le pressing a téléversé un logo dans les paramètres,
 *   son logo et son nom remplacent la marque PressNet partout dans l'application.
 */
export function Logo({ variant = 'light', size = 'md', showTagline = true }: LogoProps) {
  const settings = useAppStore((s) => s.settings);
  const s = SIZES[size];

  const customLogo = settings?.logoUrl;
  const pressingName = settings?.name?.trim();
  const isWhiteLabel = !!customLogo && !!pressingName;

  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <span
        className="flex shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-primary-400 to-primary-600 text-white shadow-sm shadow-primary/30"
        style={{ width: s.box, height: s.box }}
        aria-hidden="true"
      >
        {customLogo ? (
          <img src={customLogo} alt="" className="h-full w-full object-cover" />
        ) : (
          <WashingMachine size={s.icon} />
        )}
      </span>
      <span className="min-w-0 leading-none">
        {isWhiteLabel ? (
          <span className={`block truncate font-bold tracking-tight ${s.title} ${variant === 'light' ? 'text-white' : 'text-charcoal'}`} title={pressingName}>
            {pressingName}
          </span>
        ) : (
          <span className={`block font-bold tracking-tight ${s.title} ${variant === 'light' ? 'text-white' : 'text-charcoal'}`}>
            Press<span className="text-primary">Net</span>
          </span>
        )}
        {showTagline && (
          <span className={`mt-1 block font-semibold tracking-[0.2em] uppercase ${s.tag} ${variant === 'light' ? 'text-primary-300' : 'text-primary'}`}>
            Burkina Faso
          </span>
        )}
      </span>
    </div>
  );
}
