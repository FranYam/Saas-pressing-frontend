import axios from 'axios';
import type {
  Client,
  Employee,
  Mission,
  Notification,
  Order,
  OrderStatus,
  Payment,
  PriceItem,
  PressingSettings,
  User
} from '@/types';
import {
  DEMO_USERS,
  MOCK_CLIENTS,
  MOCK_EMPLOYEES,
  MOCK_MISSIONS,
  MOCK_NOTIFICATIONS,
  MOCK_ORDERS,
  MOCK_PAYMENTS,
  MOCK_PRICES,
  MOCK_SETTINGS
} from '@/data/mocks';

/**
 * Service API centralisé.
 * Les appels sont actuellement simulés (mocks) : chaque fonction renvoie une
 * promesse résolue après un léger délai, imitant une connexion 2G/3G burkinabè.
 * Le jour où le backend existe, il suffira de remplacer les corps par de vrais
 * appels `api.get/post/...`.
 */
export const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' }
});

function delayed<T>(data: T, ms = 250): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(structuredClone(data)), ms));
}

// ─── Auth ────────────────────────────────────────────────────────────────────

export interface LoginResponse {
  user: User;
}

export async function login(email: string, _password: string): Promise<LoginResponse> {
  const found = DEMO_USERS.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (!found) {
    throw new Error('Aucun compte trouvé avec cet email.');
  }
  // Démo sans backend : le mot de passe n'est pas vérifié.
  // La validation côté formulaire (longueur minimale) reste active.
  return delayed({ user: found }, 400);
}

export async function register(payload: {
  pressingName: string;
  city: string;
  phone: string;
  address: string;
  fullName: string;
  email: string;
  password: string;
  primaryColor: string;
}): Promise<LoginResponse> {
  const user: User = {
    id: `u-${Date.now()}`,
    fullName: payload.fullName,
    email: payload.email,
    phone: payload.phone,
    role: 'gerant',
    pressingName: payload.pressingName,
    avatarColor: payload.primaryColor
  };
  return delayed({ user }, 600);
}

// ─── Commandes ───────────────────────────────────────────────────────────────

export async function fetchOrders(): Promise<Order[]> {
  return delayed(MOCK_ORDERS);
}

export async function fetchOrderById(id: string): Promise<Order> {
  const order = MOCK_ORDERS.find((o) => o.id === id || o.ticket.toLowerCase() === id.toLowerCase());
  if (!order) throw new Error('Commande introuvable.');
  return delayed(order);
}

export async function updateOrderStatus(orderId: string, status: OrderStatus): Promise<Order> {
  const order = MOCK_ORDERS.find((o) => o.id === orderId);
  if (!order) throw new Error('Commande introuvable.');
  order.status = status;
  order.statusHistory = [...order.statusHistory, { status, date: new Date().toISOString() }];
  if (status === 'livre') order.claimed = true;
  return delayed(order, 300);
}

export async function createOrder(payload: Omit<Order, 'id' | 'ticket' | 'statusHistory' | 'createdAt' | 'dueDate' | 'claimed'>): Promise<Order> {
  const ticket = `PR-${String(MOCK_ORDERS.length + 1).padStart(4, '0')}`;
  const order: Order = {
    ...payload,
    id: `o-${Date.now()}`,
    ticket,
    status: 'recu',
    claimed: false,
    createdAt: new Date().toISOString(),
    dueDate: new Date(Date.now() + 2 * 86400000).toISOString(),
    statusHistory: [{ status: 'recu', date: new Date().toISOString() }]
  };
  MOCK_ORDERS.unshift(order);
  return delayed(order, 500);
}

// ─── Clients ─────────────────────────────────────────────────────────────────

export async function fetchClients(): Promise<Client[]> {
  return delayed(MOCK_CLIENTS);
}

export async function fetchClientById(id: string): Promise<Client> {
  const client = MOCK_CLIENTS.find((c) => c.id === id);
  if (!client) throw new Error('Client introuvable.');
  return delayed(client);
}

export async function searchClientsByPhone(phone: string): Promise<Client[]> {
  const q = phone.replace(/\s/g, '').toLowerCase();
  return delayed(MOCK_CLIENTS.filter((c) => c.phone.replace(/\s/g, '').toLowerCase().includes(q) && q.length >= 4), 300);
}

// ─── Paiements ───────────────────────────────────────────────────────────────

export async function fetchPayments(): Promise<Payment[]> {
  return delayed(MOCK_PAYMENTS);
}

export async function recordPayment(orderId: string, method: Payment['method'], amount: number): Promise<Payment> {
  const order = MOCK_ORDERS.find((o) => o.id === orderId);
  if (!order) throw new Error('Commande introuvable.');
  order.paidAmount += amount;
  if (order.paidAmount >= order.total) {
    order.paymentType = 'integral';
    order.paymentMethod = method;
  }
  const payment: Payment = {
    id: `p-${Date.now()}`,
    orderId,
    ticket: order.ticket,
    clientId: order.clientId,
    method,
    amount,
    date: new Date().toISOString(),
    status: 'reussi'
  };
  MOCK_PAYMENTS.unshift(payment);
  return delayed(payment, 600);
}

// ─── Équipe ──────────────────────────────────────────────────────────────────

export async function fetchEmployees(): Promise<Employee[]> {
  return delayed(MOCK_EMPLOYEES);
}

export async function toggleEmployeeActive(employeeId: string): Promise<Employee> {
  const emp = MOCK_EMPLOYEES.find((e) => e.id === employeeId);
  if (!emp) throw new Error('Employé introuvable.');
  emp.active = !emp.active;
  return delayed(emp, 250);
}

// ─── Livraisons / missions ───────────────────────────────────────────────────

export async function fetchMissions(): Promise<Mission[]> {
  return delayed(MOCK_MISSIONS);
}

export async function assignCourier(missionId: string, courierId: string): Promise<Mission> {
  const mission = MOCK_MISSIONS.find((m) => m.id === missionId);
  if (!mission) throw new Error('Mission introuvable.');
  mission.courierId = courierId;
  return delayed(mission, 300);
}

export async function updateMissionStatus(missionId: string, status: Mission['status']): Promise<Mission> {
  const mission = MOCK_MISSIONS.find((m) => m.id === missionId);
  if (!mission) throw new Error('Mission introuvable.');
  mission.status = status;
  return delayed(mission, 300);
}

// ─── Paramètres ──────────────────────────────────────────────────────────────

export async function fetchSettings(): Promise<PressingSettings> {
  return delayed(MOCK_SETTINGS);
}

export async function saveSettings(settings: PressingSettings): Promise<PressingSettings> {
  Object.assign(MOCK_SETTINGS, settings);
  return delayed(MOCK_SETTINGS, 400);
}

export async function fetchPrices(): Promise<PriceItem[]> {
  return delayed(MOCK_PRICES);
}

export async function savePrices(prices: PriceItem[]): Promise<PriceItem[]> {
  MOCK_PRICES.length = 0;
  MOCK_PRICES.push(...prices);
  return delayed(MOCK_PRICES, 400);
}

// ─── Notifications ───────────────────────────────────────────────────────────

export async function fetchNotifications(): Promise<Notification[]> {
  return delayed(MOCK_NOTIFICATIONS);
}

// ─── Divers ──────────────────────────────────────────────────────────────────

export async function sendSms(_to: string, _message: string): Promise<{ success: boolean }> {
  // Simulation de l'envoi SMS via une passerelle locale
  return delayed({ success: true }, 700);
}
