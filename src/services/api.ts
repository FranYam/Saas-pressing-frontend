/**
 * Service API centralisé — SaaS Pressing
 *
 * Connexion au backend Django via axios avec :
 *  - JWT Bearer token injecté automatiquement (intercepteur de requête)
 *  - Refresh automatique du token si 401 (intercepteur de réponse)
 *  - Mapping snake_case (API) ↔ camelCase (frontend)
 *
 * URL base : https://saas-pressing.onrender.com
 */

import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import type {
  Client,
  Employee,
  Mission,
  Notification,
  Order,
  OrderItem,
  OrderStatus,
  Payment,
  PaymentMethod,
  PriceItem,
  PressingSettings,
  User,
} from '@/types';
import type {
  ApiClient,
  ApiClientRequest,
  ApiCommande,
  ApiCommandeRequest,
  ApiCourier,
  ApiDashboardSummary,
  ApiEmployeeCreateRequest,
  ApiEmployeeUpdateRequest,
  ApiInitiateMobileMoneyRequest,
  ApiLoginRequest,
  ApiMobileMoneyRequest,
  ApiOrderItemRequest,
  ApiPaginated,
  ApiPaiement,
  ApiPaiementRequest,
  ApiPressing,
  ApiPressingRequest,
  ApiRegisterPressingRequest,
  ApiTokenRefreshResponse,
  ApiUser,
} from '@/types/apiTypes';
import {
  MOCK_MISSIONS,
  MOCK_NOTIFICATIONS,
  MOCK_PRICES,
  MOCK_SETTINGS,
} from '@/data/mocks';

// ─── Constantes ───────────────────────────────────────────────────────────────

const BASE_URL = 'https://saas-pressing.onrender.com';
const ACCESS_TOKEN_KEY = 'pressnet_access';
const REFRESH_TOKEN_KEY = 'pressnet_refresh';

// ─── Instance Axios ───────────────────────────────────────────────────────────

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 20000,
  headers: { 'Content-Type': 'application/json' },
});

// ─── Helpers tokens ───────────────────────────────────────────────────────────

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setTokens(access: string, refresh: string): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, access);
  localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
}

export function clearTokens(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

// ─── Intercepteur de requête — injection du token ────────────────────────────

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccessToken();
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── Intercepteur de réponse — refresh automatique 401 ───────────────────────

let isRefreshing = false;
let refreshQueue: Array<(token: string) => void> = [];

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      const refresh = getRefreshToken();

      if (!refresh) {
        clearTokens();
        window.dispatchEvent(new CustomEvent('auth:logout'));
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // Mettre la requête en attente pendant le refresh
        return new Promise((resolve) => {
          refreshQueue.push((newToken: string) => {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            resolve(api(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.post<ApiTokenRefreshResponse>(
          `${BASE_URL}/api/v1/accounts/login/refresh/`,
          { refresh }
        );
        setTokens(data.access, data.refresh ?? refresh);
        refreshQueue.forEach((cb) => cb(data.access));
        refreshQueue = [];
        originalRequest.headers.Authorization = `Bearer ${data.access}`;
        return api(originalRequest);
      } catch {
        clearTokens();
        refreshQueue = [];
        window.dispatchEvent(new CustomEvent('auth:logout'));
        return Promise.reject(error);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// ─── Fonctions de mapping API → Frontend ─────────────────────────────────────

function mapApiUser(u: ApiUser): User {
  return {
    id: u.id,
    fullName: [u.first_name, u.last_name].filter(Boolean).join(' ') || u.username,
    email: u.username, // Le username est le téléphone/identifiant
    phone: u.phone_number ?? u.username,
    role: u.role.toLowerCase() as User['role'],
    pressingName: '', // Sera enrichi via tenants/profile
    avatarColor: undefined,
  };
}

function mapApiClient(c: ApiClient): Client {
  const parts = c.name.split(' ');
  return {
    id: c.id,
    firstName: parts[0] ?? c.name,
    lastName: parts.slice(1).join(' ') || '',
    phone: c.phone_number,
    sector: '',
    address: '',
    registeredAt: c.created_at,
  };
}

function mapApiOrderItem(item: { id: string; clothing_type: string; quantity: number; unit_price: string }): OrderItem {
  return {
    id: item.id,
    type: item.clothing_type,
    quantity: item.quantity,
    unitPrice: parseFloat(item.unit_price),
  };
}

function mapApiStatusToFrontend(status: string): OrderStatus {
  const map: Record<string, OrderStatus> = {
    RECU: 'recu',
    EN_TRAITEMENT: 'traitement',
    PRET: 'pret',
    LIVRE: 'livre',
  };
  return map[status] ?? 'recu';
}

function mapFrontendStatusToApi(status: OrderStatus): string {
  const map: Record<OrderStatus, string> = {
    recu: 'RECU',
    traitement: 'EN_TRAITEMENT',
    pret: 'PRET',
    livre: 'LIVRE',
  };
  return map[status];
}

function mapApiOrder(cmd: ApiCommande): Order {
  const paymentTypeMap: Record<string, Order['paymentType']> = {
    PAYE: 'integral',
    PARTIEL: 'partiel',
    CREDIT: 'credit',
  };

  const paymentMethodMap: Record<string, PaymentMethod | null> = {
    ESPECES: 'especes',
    MOBILE_MONEY: 'orange_money',
    CREDIT: null,
  };

  return {
    id: cmd.id,
    ticket: cmd.ticket_number ?? '',
    clientId: cmd.client,
    items: cmd.articles.map(mapApiOrderItem),
    status: mapApiStatusToFrontend(cmd.status),
    channel: cmd.canal?.toLowerCase().replace('_', '_') === 'en_ligne' ? 'en_ligne' : 'comptoir',
    paymentType: paymentTypeMap[cmd.payment_status] ?? 'credit',
    paymentMethod: paymentMethodMap['ESPECES'] ?? null,
    total: parseFloat(cmd.total_price),
    paidAmount: 0, // Calculé côté serveur
    claimed: cmd.status === 'LIVRE',
    deliveryRequested: !!cmd.delivery_status,
    createdAt: cmd.created_at,
    dueDate: cmd.date_retrait_prevue,
    statusHistory: [{ status: mapApiStatusToFrontend(cmd.status), date: cmd.created_at }],
  };
}

function mapApiEmployee(u: ApiUser): Employee {
  return {
    id: u.id,
    fullName: [u.first_name, u.last_name].filter(Boolean).join(' ') || u.username,
    role: (u.role?.toLowerCase() ?? 'employe') as Employee['role'],
    phone: u.phone_number ?? '',
    email: u.username,
    lastLogin: u.created_at,
    active: u.is_active,
  };
}

function mapApiPayment(p: ApiPaiement): Payment {
  const methodMap: Record<string, PaymentMethod> = {
    ESPECES: 'especes',
    MOBILE_MONEY: 'orange_money',
    CREDIT: 'especes',
  };
  return {
    id: p.id,
    orderId: p.commande,
    ticket: '',
    clientId: '',
    method: methodMap[p.mode ?? 'ESPECES'] ?? 'especes',
    amount: parseFloat(p.amount),
    date: p.date_paiement ?? p.created_at,
    status: p.status === 'PAYE' ? 'reussi' : 'en_attente',
  };
}

// ─── Auth ────────────────────────────────────────────────────────────────────

export interface LoginResponse {
  user: User;
  pressing?: { name: string; primaryColor?: string };
}

/**
 * POST /api/v1/accounts/login/
 * Retourne la paire JWT et le profil utilisateur.
 */
export async function login(username: string, password: string): Promise<LoginResponse> {
  const payload: ApiLoginRequest = { username, password };
  const { data } = await api.post<{ access: string; refresh: string }>(
    '/api/v1/accounts/login/',
    payload
  );
  setTokens(data.access, data.refresh);

  // Décoder le payload JWT pour extraire role + pressing_id
  const jwtPayload = JSON.parse(atob(data.access.split('.')[1]));
  const role: string = jwtPayload.role ?? 'EMPLOYE';
  const pressing_id: string | undefined = jwtPayload.pressing_id;

  // Récupérer le profil utilisateur
  const meRes = await api.get<ApiUser>('/api/v1/accounts/me/');
  const user = mapApiUser({ ...meRes.data, role: role as ApiUser['role'] });

  // Récupérer le nom du pressing si disponible
  let pressingName = '';
  let primaryColor: string | undefined;
  if (pressing_id) {
    try {
      const profileRes = await api.get<ApiPressing>('/api/v1/tenants/profile/');
      pressingName = profileRes.data.name;
      primaryColor = profileRes.data.primary_color;
    } catch {
      // Non critique
    }
  }

  user.pressingName = pressingName;

  return { user, pressing: pressingName ? { name: pressingName, primaryColor } : undefined };
}

/**
 * POST /api/v1/tenants/register/
 * Crée un pressing + son gérant en une requête atomique.
 */
export async function register(payload: {
  pressingName: string;
  city: string;
  phone: string;
  address: string;
  fullName: string;
  username: string;
  password: string;
  primaryColor: string;
}): Promise<LoginResponse> {
  const [firstName, ...rest] = payload.fullName.split(' ');
  const reqBody: ApiRegisterPressingRequest = {
    name: payload.pressingName,
    address: `${payload.city} — ${payload.address}`,
    phone: payload.phone,
    primary_color: payload.primaryColor,
    gerant: {
      username: payload.username,
      password: payload.password,
      first_name: firstName,
      last_name: rest.join(' '),
    },
  };

  await api.post<ApiPressing>('/api/v1/tenants/register/', reqBody);

  // Login automatique après inscription
  return login(payload.username, payload.password);
}

/**
 * Déconnexion locale (suppression des tokens).
 */
export function logout(): void {
  clearTokens();
}

// ─── Portail Client (accès public par ticket + téléphone) ───────────────────

export interface ClientPortalData {
  name: string;
  phone: string;
  orders: Order[];
}

/**
 * GET /api/v1/portal/orders/?ticket=...&phone=...
 * Endpoint public : valide le couple (n° de ticket, téléphone) et retourne
 * la fiche client + toutes ses commandes. À ajouter côté Django (voir README).
 */
export async function fetchClientPortal(ticket: string, phone: string): Promise<ClientPortalData> {
  const { data } = await api.get<{ name: string; phone: string; orders: ApiCommande[] }>(
    '/api/v1/portal/orders/',
    { params: { ticket, phone } }
  );

  const normalizePhone = (p: string) => p.replace(/\D/g, '');
  const orders = data.orders.map((cmd) => {
    const order = mapApiOrder(cmd);
    const withPaid = cmd as ApiCommande & { amount_paid?: string };
    order.paidAmount = parseFloat(withPaid.amount_paid ?? '0');

    // Reconstitue un historique lisible : étapes passées datées à la création (approx.)
    const flow: OrderStatus[] = ['recu', 'traitement', 'pret', 'livre'];
    const idx = flow.indexOf(order.status);
    order.statusHistory = flow.slice(0, idx + 1).map((status) => ({ status, date: cmd.created_at }));
    return order;
  });

  return {
    name: data.name,
    phone: normalizePhone(data.phone) === normalizePhone(phone) ? data.phone : phone,
    orders,
  };
}

// ─── Profil utilisateur ───────────────────────────────────────────────────────

/** GET /api/v1/accounts/me/ */
export async function fetchMe(): Promise<User> {
  const { data } = await api.get<ApiUser>('/api/v1/accounts/me/');
  return mapApiUser(data);
}

// ─── Pressing (Tenant) ───────────────────────────────────────────────────────

/** GET /api/v1/tenants/profile/ */
export async function fetchPressingProfile(): Promise<ApiPressing> {
  const { data } = await api.get<ApiPressing>('/api/v1/tenants/profile/');
  return data;
}

/** PATCH /api/v1/tenants/profile/ */
export async function updatePressingProfile(patch: Partial<ApiPressingRequest>): Promise<ApiPressing> {
  const { data } = await api.patch<ApiPressing>('/api/v1/tenants/profile/', patch);
  return data;
}

// ─── Dashboard ───────────────────────────────────────────────────────────────

/** GET /api/v1/dashboard/summary/ */
export async function fetchDashboard(): Promise<ApiDashboardSummary> {
  const { data } = await api.get<ApiDashboardSummary>('/api/v1/dashboard/summary/');
  return data;
}

// ─── Commandes ───────────────────────────────────────────────────────────────

/** GET /api/v1/orders/ — paginé (retourne toutes les pages) */
export async function fetchOrders(): Promise<Order[]> {
  const { data } = await api.get<ApiPaginated<ApiCommande>>('/api/v1/orders/');
  return data.results.map(mapApiOrder);
}

/** GET /api/v1/orders/{id}/ */
export async function fetchOrderById(id: string): Promise<Order> {
  const { data } = await api.get<ApiCommande>(`/api/v1/orders/${id}/`);
  return mapApiOrder(data);
}

/** POST /api/v1/orders/ */
export async function createOrder(
  payload: Omit<Order, 'id' | 'ticket' | 'statusHistory' | 'createdAt' | 'dueDate' | 'claimed'>
): Promise<Order> {
  const dueDate = new Date(Date.now() + 2 * 86400000).toISOString();

  const articles: ApiOrderItemRequest[] = payload.items.map((item) => ({
    clothing_type: item.type,
    quantity: item.quantity,
    unit_price: item.unitPrice.toFixed(2),
  }));

  const body: ApiCommandeRequest = {
    client: payload.clientId,
    canal: payload.channel === 'en_ligne' ? 'EN_LIGNE' : 'COMPTOIR',
    date_retrait_prevue: dueDate,
    articles,
  };

  const { data } = await api.post<ApiCommande>('/api/v1/orders/', body);
  return mapApiOrder(data);
}

/** PATCH /api/v1/orders/{id}/update_status/ */
export async function updateOrderStatus(orderId: string, status: OrderStatus): Promise<Order> {
  const { data } = await api.patch<ApiCommande>(`/api/v1/orders/${orderId}/update_status/`, {
    status: mapFrontendStatusToApi(status),
  });
  return mapApiOrder(data);
}

/** PATCH /api/v1/orders/{id}/assign-courier/ */
export async function assignCourierToOrder(orderId: string, courierId: string): Promise<Order> {
  const { data } = await api.patch<ApiCommande>(`/api/v1/orders/${orderId}/assign-courier/`, {
    courier: courierId,
  });
  return mapApiOrder(data);
}

/** GET /api/v1/orders/my-deliveries/ — pour les coursiers */
export async function fetchMyDeliveries(): Promise<Order[]> {
  const { data } = await api.get<ApiCommande | ApiPaginated<ApiCommande>>('/api/v1/orders/my-deliveries/');
  if (Array.isArray((data as ApiPaginated<ApiCommande>).results)) {
    return (data as ApiPaginated<ApiCommande>).results.map(mapApiOrder);
  }
  return [mapApiOrder(data as ApiCommande)];
}

// ─── Clients ─────────────────────────────────────────────────────────────────

/** GET /api/v1/clients/ */
export async function fetchClients(): Promise<Client[]> {
  const { data } = await api.get<ApiPaginated<ApiClient>>('/api/v1/clients/');
  return data.results.map(mapApiClient);
}

/** GET /api/v1/clients/{id}/ */
export async function fetchClientById(id: string): Promise<Client> {
  const { data } = await api.get<ApiClient>(`/api/v1/clients/${id}/`);
  return mapApiClient(data);
}

/** Recherche locale par téléphone après chargement de la liste */
export async function searchClientsByPhone(phone: string): Promise<Client[]> {
  const clients = await fetchClients();
  const q = phone.replace(/\s/g, '').toLowerCase();
  if (q.length < 4) return [];
  return clients.filter((c) => c.phone.replace(/\s/g, '').toLowerCase().includes(q));
}

/** POST /api/v1/clients/ */
export async function createClient(payload: { name: string; phone_number: string }): Promise<Client> {
  const body: ApiClientRequest = { name: payload.name, phone_number: payload.phone_number };
  const { data } = await api.post<ApiClient>('/api/v1/clients/', body);
  return mapApiClient(data);
}

/** PATCH /api/v1/clients/{id}/ */
export async function updateClient(id: string, patch: Partial<ApiClientRequest>): Promise<Client> {
  const { data } = await api.patch<ApiClient>(`/api/v1/clients/${id}/`, patch);
  return mapApiClient(data);
}

/** DELETE /api/v1/clients/{id}/ */
export async function deleteClient(id: string): Promise<void> {
  await api.delete(`/api/v1/clients/${id}/`);
}

// ─── Paiements ───────────────────────────────────────────────────────────────

/** GET /api/v1/payments/ */
export async function fetchPayments(): Promise<Payment[]> {
  const { data } = await api.get<ApiPaginated<ApiPaiement>>('/api/v1/payments/');
  return data.results.map(mapApiPayment);
}

/** POST /api/v1/payments/ */
export async function recordPayment(
  orderId: string,
  method: Payment['method'],
  amount: number
): Promise<Payment> {
  const modeMap: Record<string, string> = {
    especes: 'ESPECES',
    orange_money: 'MOBILE_MONEY',
    moov_money: 'MOBILE_MONEY',
  };

  const body: ApiPaiementRequest = {
    commande: orderId,
    amount: amount.toFixed(2),
    mode: modeMap[method] as ApiPaiementRequest['mode'],
    date_paiement: new Date().toISOString(),
  };

  const { data } = await api.post<ApiPaiement>('/api/v1/payments/', body);
  return mapApiPayment(data);
}

/** GET /api/v1/payments/debtors/ */
export async function fetchDebtors(): Promise<Payment[]> {
  const { data } = await api.get<ApiPaiement | ApiPaginated<ApiPaiement>>('/api/v1/payments/debtors/');
  if ((data as ApiPaginated<ApiPaiement>).results) {
    return (data as ApiPaginated<ApiPaiement>).results.map(mapApiPayment);
  }
  return [mapApiPayment(data as ApiPaiement)];
}

// ─── Mobile Money ─────────────────────────────────────────────────────────────

/** POST /api/v1/payments-gateway/initiate/ */
export async function initiateMobileMoney(
  payload: ApiInitiateMobileMoneyRequest
): Promise<ApiMobileMoneyRequest> {
  const { data } = await api.post<ApiMobileMoneyRequest>('/api/v1/payments-gateway/initiate/', payload);
  return data;
}

/** GET /api/v1/payments-gateway/requests/ */
export async function fetchMobileMoneyRequests(): Promise<ApiMobileMoneyRequest[]> {
  const { data } = await api.get<ApiPaginated<ApiMobileMoneyRequest>>('/api/v1/payments-gateway/requests/');
  return data.results;
}

// ─── Équipe (Employés) ───────────────────────────────────────────────────────

/** GET /api/v1/accounts/employees/ */
export async function fetchEmployees(): Promise<Employee[]> {
  const { data } = await api.get<ApiPaginated<ApiUser>>('/api/v1/accounts/employees/');
  return data.results.map(mapApiEmployee);
}

/** POST /api/v1/accounts/employees/ — crée un compte employé ou coursier du pressing */
export async function createEmployee(
  payload: ApiEmployeeCreateRequest & { role?: 'EMPLOYE' | 'COURSIER' }
): Promise<Employee> {
  const { data } = await api.post<ApiUser>('/api/v1/accounts/employees/', payload);
  return mapApiEmployee(data);
}

/** PATCH /api/v1/accounts/employees/{id}/ — modifie un membre (nom, mot de passe) */
export async function updateEmployee(id: string, patch: ApiEmployeeUpdateRequest): Promise<Employee> {
  const { data } = await api.patch<ApiUser>(`/api/v1/accounts/employees/${id}/`, patch);
  return mapApiEmployee(data);
}

/** PATCH /api/v1/accounts/employees/{id}/ — toggle actif/inactif */
export async function toggleEmployeeActive(employeeId: string): Promise<Employee> {
  // On récupère l'employé d'abord pour connaître son état actuel
  const { data: current } = await api.get<ApiUser>(`/api/v1/accounts/employees/${employeeId}/`);
  const patch: ApiEmployeeUpdateRequest = { is_active: !current.is_active };
  const { data } = await api.patch<ApiUser>(`/api/v1/accounts/employees/${employeeId}/`, patch);
  return mapApiEmployee(data);
}

/** DELETE /api/v1/accounts/employees/{id}/ (désactivation côté serveur) */
export async function deleteEmployee(employeeId: string): Promise<void> {
  await api.delete(`/api/v1/accounts/employees/${employeeId}/`);
}

// ─── Coursiers ───────────────────────────────────────────────────────────────

/** GET /api/v1/deliveries/couriers/ */
export async function fetchCouriers(): Promise<ApiCourier[]> {
  const { data } = await api.get<ApiPaginated<ApiCourier>>('/api/v1/deliveries/couriers/');
  return data.results;
}

/** DELETE /api/v1/deliveries/couriers/{id}/ (désactivation) */
export async function deleteCourier(id: string): Promise<void> {
  await api.delete(`/api/v1/deliveries/couriers/${id}/`);
}

// ─── Missions (simulées — non disponibles dans l'API) ────────────────────────

/**
 * Les missions de livraison sont représentées dans l'API via les commandes
 * avec un statut de livraison (`delivery_status`).
 * On les reconstruit depuis les commandes réelles.
 */
export async function fetchMissions(): Promise<Mission[]> {
  try {
    const orders = await fetchOrders();
    return orders
      .filter((o) => o.deliveryRequested)
      .map((o): Mission => ({
        id: `mission-${o.id}`,
        orderId: o.id,
        ticket: o.ticket,
        type: 'livraison',
        clientId: o.clientId,
        sector: '',
        address: '',
        slot: o.dueDate,
        status: o.status === 'livre' ? 'terminee' : 'a_faire',
        courierId: null,
        itemsCount: o.items.reduce((sum, i) => sum + i.quantity, 0),
        createdAt: o.createdAt,
      }));
  } catch {
    return [...MOCK_MISSIONS];
  }
}

/** PATCH /api/v1/orders/{id}/assign-courier/ */
export async function assignCourier(missionId: string, courierId: string): Promise<Mission> {
  const orderId = missionId.replace('mission-', '');
  const updated = await assignCourierToOrder(orderId, courierId);
  return {
    id: missionId,
    orderId: updated.id,
    ticket: updated.ticket,
    type: 'livraison',
    clientId: updated.clientId,
    sector: '',
    address: '',
    slot: updated.dueDate,
    status: 'a_faire',
    courierId,
    itemsCount: updated.items.reduce((sum, i) => sum + i.quantity, 0),
    createdAt: updated.createdAt,
  };
}

/** PATCH /api/v1/orders/{id}/update-delivery/ */
export async function updateMissionStatus(missionId: string, status: Mission['status']): Promise<Mission> {
  const orderId = missionId.replace('mission-', '');
  const deliveryStatusMap: Record<Mission['status'], string | null> = {
    a_faire: 'A_COLLECTER',
    en_cours: 'COLLECTE',
    terminee: 'LIVRE',
  };

  const { data } = await api.patch<ApiCommande>(`/api/v1/orders/${orderId}/update-delivery/`, {
    delivery_status: deliveryStatusMap[status],
  });

  return {
    id: missionId,
    orderId: data.id,
    ticket: data.ticket_number ?? '',
    type: 'livraison',
    clientId: data.client,
    sector: '',
    address: '',
    slot: data.date_retrait_prevue,
    status,
    courierId: data.assigned_courier,
    itemsCount: data.articles.reduce((sum, a) => sum + a.quantity, 0),
    createdAt: data.created_at,
  };
}

// ─── Paramètres pressing ─────────────────────────────────────────────────────

/** Récupère les paramètres du pressing depuis l'API tenant */
export async function fetchSettings(): Promise<PressingSettings> {
  try {
    const profile = await fetchPressingProfile();
    return {
      name: profile.name,
      phone: profile.phone ?? '',
      email: '',
      city: '',
      address: profile.address ?? '',
      openingHours: '',
      primaryColor: profile.primary_color ?? '#C75B39',
      smsNotifications: false,
      emailNotifications: false,
      orderReadySms: false,
      paymentReminderSms: false,
      plan: 'standard',
    };
  } catch {
    return { ...MOCK_SETTINGS };
  }
}

/** Sauvegarde les paramètres du pressing via l'API tenant */
export async function saveSettings(settings: PressingSettings): Promise<PressingSettings> {
  await updatePressingProfile({
    name: settings.name,
    phone: settings.phone,
    address: settings.address,
    primary_color: settings.primaryColor,
  });
  return settings;
}

// ─── Tarification (non disponible dans l'API — mocks maintenus) ──────────────

export async function fetchPrices(): Promise<PriceItem[]> {
  return [...MOCK_PRICES];
}

export async function savePrices(prices: PriceItem[]): Promise<PriceItem[]> {
  MOCK_PRICES.length = 0;
  MOCK_PRICES.push(...prices);
  return [...MOCK_PRICES];
}

// ─── Notifications (non disponibles dans l'API — mocks maintenus) ─────────────

export async function fetchNotifications(): Promise<Notification[]> {
  return [...MOCK_NOTIFICATIONS];
}

// ─── SMS (non disponible dans l'API publique) ─────────────────────────────────

export async function sendSms(_to: string, _message: string): Promise<{ success: boolean }> {
  // À implémenter quand un endpoint SMS sera disponible
  return { success: true };
}
