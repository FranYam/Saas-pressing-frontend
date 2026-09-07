import type { OrderStatus, PaymentMethod, Role, MissionType, MissionStatus } from '@/types';

// ─── Montants & téléphone ────────────────────────────────────────────────────

/** Formate un montant avec séparateur de milliers : « 245 000 FCFA » */
export function formatFCFA(amount: number): string {
  const n = new Intl.NumberFormat('fr-FR').format(Math.round(amount));
  return `${n.replace(/[\u202F\u00A0]/g, ' ')} FCFA`;
}

/** Formate un nombre avec séparateur de milliers */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('fr-FR').format(value).replace(/[\u202F\u00A0]/g, ' ');
}

/** Masque de saisie téléphone burkinabè : +226 7X XX XX XX */
export function formatPhoneInput(raw: string): string {
  const digits = raw.replace(/\D/g, '').replace(/^226/, '').slice(0, 8);
  const parts = [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4, 6), digits.slice(6, 8)].filter(Boolean);
  return parts.length ? `+226 ${parts.join(' ')}` : '+226 ';
}

export function isValidBurkinaPhone(phone: string): boolean {
  return /^\+226\s(70|71|72|74|75|76|77|78|65|66|67|68)\s\d{2}\s\d{2}\s\d{2}$/.test(phone);
}

// ─── Dates ───────────────────────────────────────────────────────────────────

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatDateShort(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

export function formatDateTime(iso: string): string {
  return `${formatDate(iso)} à ${formatTime(iso)}`;
}

export function formatRelative(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.round(diffMs / 60000);
  if (minutes < 1) return "à l'instant";
  if (minutes < 60) return `il y a ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `il y a ${hours} h`;
  const days = Math.round(hours / 24);
  if (days === 1) return 'hier';
  if (days < 30) return `il y a ${days} jours`;
  const months = Math.round(days / 30);
  return `il y a ${months} mois`;
}

/** La date est-elle aujourd'hui ? */
export function isToday(iso: string): boolean {
  return new Date(iso).toDateString() === new Date().toDateString();
}

/** Label de regroupement par jour : « Aujourd'hui », « Hier », « Lun 12 mai » */
export function dayLabel(iso: string): string {
  const d = new Date(iso);
  if (isToday(iso)) return "Aujourd'hui";
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return 'Hier';
  return d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'long' });
}

/** Initiales pour avatar : « Aïcha Ouédraogo » → « AO » */
export function initials(firstNameOrName: string, lastName?: string): string {
  if (lastName) return `${firstNameOrName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  const parts = firstNameOrName.trim().split(/\s+/);
  return parts.slice(0, 2).map((p) => p.charAt(0)).join('').toUpperCase();
}

// ─── Libellés métier ─────────────────────────────────────────────────────────

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  recu: 'Reçu',
  traitement: 'En traitement',
  pret: 'Prêt',
  livre: 'Livré'
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  especes: 'Espèces',
  orange_money: 'Orange Money',
  moov_money: 'Moov Money'
};

export const ROLE_LABELS: Record<Role, string> = {
  gerant: 'Gérant',
  employe: 'Employé',
  coursier: 'Coursier',
  client: 'Client'
};

export const PAYMENT_TYPE_LABELS: Record<string, string> = {
  integral: 'Paiement intégral',
  partiel: 'Acompte partiel',
  credit: 'À crédit'
};

export const MISSION_TYPE_LABELS: Record<MissionType, string> = {
  collecte: 'Collecte',
  livraison: 'Livraison'
};

export const MISSION_STATUS_LABELS: Record<MissionStatus, string> = {
  a_faire: 'À faire',
  en_cours: 'En cours',
  terminee: 'Terminée'
};
