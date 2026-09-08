import { useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';

/** Couleur primaire par défaut de PressNet (terracotta) */
export const DEFAULT_PRIMARY = '#C75B39';

type Rgb = [number, number, number];

function hexToRgb(hex: string): Rgb {
  const clean = hex.replace('#', '');
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16)
  ];
}

function toTriplet([r, g, b]: Rgb): string {
  return `${r} ${g} ${b}`;
}

/** Éclaircit une couleur vers le blanc (t entre 0 et 1) */
function lighten([r, g, b]: Rgb, t: number): Rgb {
  return [
    Math.round(r + (255 - r) * t),
    Math.round(g + (255 - g) * t),
    Math.round(b + (255 - b) * t)
  ];
}

/** Assombrit une couleur vers le noir (t entre 0 et 1) */
function darken([r, g, b]: Rgb, t: number): Rgb {
  return [Math.round(r * (1 - t)), Math.round(g * (1 - t)), Math.round(b * (1 - t))];
}

/** Génère les 10 nuances (50 → 900) d'une couleur de base, façon Tailwind */
function generateShades(hex: string): Record<string, string> {
  const base = hexToRgb(hex);
  return {
    50: toTriplet(lighten(base, 0.95)),
    100: toTriplet(lighten(base, 0.9)),
    200: toTriplet(lighten(base, 0.78)),
    300: toTriplet(lighten(base, 0.6)),
    400: toTriplet(lighten(base, 0.38)),
    500: toTriplet(base),
    600: toTriplet(darken(base, 0.12)),
    700: toTriplet(darken(base, 0.25)),
    800: toTriplet(darken(base, 0.38)),
    900: toTriplet(darken(base, 0.48))
  };
}

/**
 * Applique une couleur primaire à toute l'interface :
 * met à jour les variables CSS utilisées par la palette Tailwind `primary`
 * ainsi que la couleur de thème du navigateur (barre PWA).
 */
export function applyPrimaryColor(hex: string): void {
  const shades = generateShades(hex);
  const root = document.documentElement;
  for (const [shade, triplet] of Object.entries(shades)) {
    root.style.setProperty(shade === '500' ? '--pn-primary' : `--pn-primary-${shade}`, triplet);
  }
  // Compatibilité : --pn-primary-500 est aussi utilisé tel quel dans certains composants
  root.style.setProperty('--pn-primary-500', shades[500]);
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', hex);
}

/**
 * Synchronise le thème de l'application avec la couleur
 * personnalisée du pressing (persistée dans le store).
 * À monter une seule fois à la racine de l'application.
 */
export function useBrandTheme(): void {
  const primaryColor = useAppStore((s) => s.settings?.primaryColor);
  useEffect(() => {
    applyPrimaryColor(primaryColor ?? DEFAULT_PRIMARY);
  }, [primaryColor]);
}
