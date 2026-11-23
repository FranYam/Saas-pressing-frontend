import { useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';

/** Couleur primaire par défaut de PressNet — Bleu marine */
export const DEFAULT_PRIMARY = '#142B4A';

type Rgb = [number, number, number];

function hexToRgb(hex: string): Rgb {
  const clean = hex.replace('#', '');
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
  ];
}

function toTriplet([r, g, b]: Rgb): string {
  return `${r} ${g} ${b}`;
}

function lighten([r, g, b]: Rgb, t: number): Rgb {
  return [
    Math.round(r + (255 - r) * t),
    Math.round(g + (255 - g) * t),
    Math.round(b + (255 - b) * t),
  ];
}

function darken([r, g, b]: Rgb, t: number): Rgb {
  return [Math.round(r * (1 - t)), Math.round(g * (1 - t)), Math.round(b * (1 - t))];
}

function generateShades(hex: string): Record<string, string> {
  const base = hexToRgb(hex);
  return {
    50:  toTriplet(lighten(base, 0.94)),
    100: toTriplet(lighten(base, 0.86)),
    200: toTriplet(lighten(base, 0.70)),
    300: toTriplet(lighten(base, 0.50)),
    400: toTriplet(lighten(base, 0.28)),
    500: toTriplet(base),
    600: toTriplet(darken(base, 0.14)),
    700: toTriplet(darken(base, 0.28)),
    800: toTriplet(darken(base, 0.42)),
    900: toTriplet(darken(base, 0.54)),
  };
}

/**
 * Applique une couleur primaire à toute l'interface :
 * met à jour les variables CSS utilisées par la palette Tailwind `primary`
 * et la couleur de thème du navigateur (PWA).
 */
export function applyPrimaryColor(hex: string): void {
  const shades = generateShades(hex);
  const root = document.documentElement;
  root.style.setProperty('--pn-primary', shades[500]);
  for (const [shade, triplet] of Object.entries(shades)) {
    root.style.setProperty(`--pn-primary-${shade}`, triplet);
  }
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', hex);
}

/**
 * Synchronise le thème avec la couleur personnalisée du pressing.
 * À monter une seule fois à la racine de l'application.
 */
export function useBrandTheme(): void {
  const primaryColor = useAppStore((s) => s.settings?.primaryColor);
  useEffect(() => {
    applyPrimaryColor(primaryColor ?? DEFAULT_PRIMARY);
  }, [primaryColor]);
}
