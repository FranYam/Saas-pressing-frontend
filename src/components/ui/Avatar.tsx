import { initials } from '@/lib/format';

// Palette déterministe pour les avatars à initiales
const PALETTE = ['#C75B39', '#3B82F6', '#22C55E', '#8B5CF6', '#F59E0B', '#EC4899', '#14B8A6', '#6366F1'];

interface AvatarProps {
  firstName: string;
  lastName?: string;
  size?: number;
  className?: string;
}

export function Avatar({ firstName, lastName, size = 40, className = '' }: AvatarProps) {
  const key = `${firstName}${lastName ?? ''}`;
  const color = PALETTE[[...key].reduce((a, c) => a + c.charCodeAt(0), 0) % PALETTE.length];
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white ${className}`}
      style={{ width: size, height: size, backgroundColor: color, fontSize: Math.round(size * 0.36) }}
      aria-hidden="true"
    >
      {initials(firstName, lastName)}
    </span>
  );
}
