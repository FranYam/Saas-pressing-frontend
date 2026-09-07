// ─── Rôles & utilisateurs ────────────────────────────────────────────────────

export type Role = 'gerant' | 'employe' | 'coursier' | 'client';

export interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: Role;
  pressingName: string;
  avatarColor?: string;
  /** Pour le rôle Client : identifiant de la fiche client liée */
  linkedClientId?: string;
}

// ─── Commandes ───────────────────────────────────────────────────────────────

export type OrderStatus = 'recu' | 'traitement' | 'pret' | 'livre';

export type OrderChannel = 'comptoir' | 'en_ligne';

export type PaymentType = 'integral' | 'partiel' | 'credit';

export interface OrderItem {
  id: string;
  type: string;
  quantity: number;
  unitPrice: number;
}

export interface StatusEvent {
  status: OrderStatus;
  date: string;
  note?: string;
}

export interface Order {
  id: string;
  ticket: string;
  clientId: string;
  items: OrderItem[];
  status: OrderStatus;
  channel: OrderChannel;
  paymentType: PaymentType;
  paymentMethod: PaymentMethod | null;
  total: number;
  paidAmount: number;
  claimed: boolean;
  deliveryRequested: boolean;
  createdAt: string;
  dueDate: string;
  statusHistory: StatusEvent[];
}

// ─── Clients ─────────────────────────────────────────────────────────────────

export interface Client {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  sector: string;
  address: string;
  registeredAt: string;
  notes?: string;
}

// ─── Paiements ───────────────────────────────────────────────────────────────

export type PaymentMethod = 'especes' | 'orange_money' | 'moov_money';

export interface Payment {
  id: string;
  orderId: string;
  ticket: string;
  clientId: string;
  method: PaymentMethod;
  amount: number;
  date: string;
  status: 'reussi' | 'en_attente';
}

// ─── Équipe ──────────────────────────────────────────────────────────────────

export interface Employee {
  id: string;
  fullName: string;
  role: Exclude<Role, 'client'>;
  phone: string;
  email: string;
  lastLogin: string;
  active: boolean;
}

// ─── Livraisons & missions coursier ──────────────────────────────────────────

export type MissionType = 'collecte' | 'livraison';

export type MissionStatus = 'a_faire' | 'en_cours' | 'terminee';

export interface Mission {
  id: string;
  orderId: string;
  ticket: string;
  type: MissionType;
  clientId: string;
  sector: string;
  address: string;
  slot: string;
  status: MissionStatus;
  courierId: string | null;
  itemsCount: number;
  notes?: string;
  createdAt: string;
}

// ─── Tarification & paramètres ───────────────────────────────────────────────

export interface PriceItem {
  id: string;
  name: string;
  price: number;
  category: string;
}

export interface PressingSettings {
  name: string;
  phone: string;
  email: string;
  city: string;
  address: string;
  openingHours: string;
  primaryColor: string;
  smsNotifications: boolean;
  emailNotifications: boolean;
  orderReadySms: boolean;
  paymentReminderSms: boolean;
  plan: 'gratuit' | 'standard' | 'pro';
}

// ─── Notifications ───────────────────────────────────────────────────────────

export interface Notification {
  id: string;
  title: string;
  message: string;
  date: string;
  read: boolean;
  type: 'commande' | 'paiement' | 'livraison' | 'systeme';
}

// ─── Suivi / tracking public ─────────────────────────────────────────────────

export interface TrackStep {
  status: OrderStatus;
  label: string;
  date: string | null;
  description: string;
}
