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

// ─── Constantes ───────────────────────────────────────────────────────────────

const BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? (import.meta.env.DEV ? '' : 'https://saas-pressing.onrender.com');
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
          `${BASE_URL}/api/accounts/login/refresh/`,
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

  const total = parseFloat(cmd.total_price);
  const rawPaid = (cmd as { amount_paid?: string | number }).amount_paid;
  const paidAmount = rawPaid !== undefined ? parseFloat(String(rawPaid)) : (cmd.payment_status === 'PAYE' ? total : 0);

  return {
    id: cmd.id,
    ticket: cmd.ticket_number ?? '',
    clientId: cmd.client,
    items: cmd.articles.map(mapApiOrderItem),
    status: mapApiStatusToFrontend(cmd.status),
    channel: cmd.canal?.toLowerCase().replace('_', '_') === 'en_ligne' ? 'en_ligne' : 'comptoir',
    paymentType: paymentTypeMap[cmd.payment_status] ?? 'credit',
    paymentMethod: paymentMethodMap['ESPECES'] ?? null,
    total,
    paidAmount,
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
 * POST /api/accounts/login/
 * Retourne la paire JWT et le profil utilisateur.
 */
export async function login(username: string, password: string): Promise<LoginResponse> {
  const payload: ApiLoginRequest = { username, password };
  const { data } = await api.post<{ access: string; refresh: string }>(
    '/api/accounts/login/',
    payload
  );
  setTokens(data.access, data.refresh);

  // Décoder le payload JWT pour extraire role + pressing_id
  const jwtPayload = JSON.parse(atob(data.access.split('.')[1]));
  const role: string = jwtPayload.role ?? 'EMPLOYE';
  const pressing_id: string | undefined = jwtPayload.pressing_id;

  // Récupérer le profil utilisateur
  const meRes = await api.get<ApiUser>('/api/accounts/me/');
  const user = mapApiUser({ ...meRes.data, role: role as ApiUser['role'] });

  // Récupérer le nom du pressing si disponible
  let pressingName = '';
  let primaryColor: string | undefined;
  if (pressing_id) {
    try {
      const profileRes = await api.get<ApiPressing>('/api/tenants/profile/');
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
 * POST /api/tenants/register/
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

  await api.post<ApiPressing>('/api/tenants/register/', reqBody);

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
  pressing: string;
  pressing_id?: string;
  orders: Order[];
}

/** Session obtenue à l'inscription / connexion d'un compte client */
export type ClientPortalSession = ClientPortalData & { token: string };

export interface PortalPressing {
  id: string;
  name: string;
  phone: string;
}

export interface PortalCatalogItem {
  id: string;
  name: string;
  category: string;
  price: string;
}

/** GET /api/portal/pressings/ — liste publique (choix à l'inscription) */
export async function fetchPortalPressings(): Promise<PortalPressing[]> {
  const { data } = await api.get<PortalPressing[]>('/api/portal/pressings/');
  return data;
}

/** POST /api/portal/register/ — crée un compte client (ou promeut la fiche comptoir) */
export async function portalRegister(payload: {
  pressing: string;
  name: string;
  phone: string;
  password: string;
}): Promise<ClientPortalSession> {
  const { data } = await api.post<RawPortalPayload & { token: string }>('/api/portal/register/', payload);
  return { ...toPortalData(data), token: data.token };
}

/** POST /api/portal/login/ — téléphone + mot de passe */
export async function portalLogin(phone: string, password: string): Promise<ClientPortalSession> {
  const { data } = await api.post<RawPortalPayload & { token: string }>('/api/portal/login/', { phone, password });
  return { ...toPortalData(data), token: data.token };
}

/** GET /api/portal/me/ — session courante (en-tête X-Portal-Token) */
export async function fetchPortalMe(token: string): Promise<ClientPortalData> {
  const { data } = await api.get<RawPortalPayload>('/api/portal/me/', {
    headers: { 'X-Portal-Token': token }
  });
  return toPortalData(data);
}

/** DELETE /api/portal/me/ — déconnexion (révoque le jeton) */
export async function portalLogout(token: string): Promise<void> {
  await api.delete('/api/portal/me/', { headers: { 'X-Portal-Token': token } });
}

/** GET /api/portal/catalog/ — tarifs actifs du pressing */
export async function fetchPortalCatalog(token?: string, pressingId?: string): Promise<PortalCatalogItem[]> {
  const { data } = await api.get<PortalCatalogItem[]>('/api/portal/catalog/', {
    headers: token ? { 'X-Portal-Token': token } : undefined,
    params: token ? undefined : { pressing: pressingId }
  });
  return data;
}

/** POST /api/portal/collectes/ — initie une collecte (vraie commande EN_LIGNE) */
export async function createPortalCollecte(
  token: string,
  payload: {
    collect_address: string;
    creneau?: string;
    notes?: string;
    articles: { clothing_type: string; quantity: number }[];
  }
): Promise<{ id: string; ticket_number: string; total_price: string }> {
  const { data } = await api.post('/api/portal/collectes/', payload, {
    headers: { 'X-Portal-Token': token }
  });
  return data;
}

/** Complète les commandes du portail : montant payé + historique lisible */
function mapPortalOrder(cmd: ApiCommande & { amount_paid?: string }): Order {
  const order = mapApiOrder(cmd);
  order.paidAmount = parseFloat(cmd.amount_paid ?? '0');
  const flow: OrderStatus[] = ['recu', 'traitement', 'pret', 'livre'];
  const idx = flow.indexOf(order.status);
  order.statusHistory = flow.slice(0, idx + 1).map((status) => ({ status, date: cmd.created_at }));
  return order;
}

/** Réponse brute du portail (commandes au format API) */
type RawPortalPayload = Omit<ClientPortalData, 'orders'> & {
  orders: (ApiCommande & { amount_paid?: string })[];
};

function toPortalData(raw: RawPortalPayload): ClientPortalData {
  return { ...raw, orders: raw.orders.map(mapPortalOrder) };
}

/**
 * GET /api/portal/orders/?ticket=...&phone=...
 * Endpoint public : valide le couple (n° de ticket, téléphone) et retourne
 * la fiche client + toutes ses commandes (accès rapide sans compte).
 */
export async function fetchClientPortal(ticket: string, phone: string): Promise<ClientPortalData> {
  const { data } = await api.get<RawPortalPayload>('/api/portal/orders/', {
    params: { ticket, phone }
  });
  return toPortalData(data);
}

// ─── Profil utilisateur ───────────────────────────────────────────────────────

/** GET /api/accounts/me/ */
export async function fetchMe(): Promise<User> {
  const { data } = await api.get<ApiUser>('/api/accounts/me/');
  return mapApiUser(data);
}

// ─── Pressing (Tenant) ───────────────────────────────────────────────────────

/** GET /api/tenants/profile/ */
export async function fetchPressingProfile(): Promise<ApiPressing> {
  const { data } = await api.get<ApiPressing>('/api/tenants/profile/');
  return data;
}

/** PATCH /api/tenants/profile/ */
export async function updatePressingProfile(patch: Partial<ApiPressingRequest>): Promise<ApiPressing> {
  const { data } = await api.patch<ApiPressing>('/api/tenants/profile/', patch);
  return data;
}

// ─── Dashboard ───────────────────────────────────────────────────────────────

/** GET /api/dashboard/summary/ */
export async function fetchDashboard(): Promise<ApiDashboardSummary> {
  const { data } = await api.get<ApiDashboardSummary>('/api/dashboard/summary/');
  return data;
}

// ─── Commandes ───────────────────────────────────────────────────────────────

/** GET /api/orders/ — paginé (retourne toutes les pages) */
export async function fetchOrders(): Promise<Order[]> {
  const { data } = await api.get<ApiPaginated<ApiCommande>>('/api/orders/');
  return data.results.map(mapApiOrder);
}

/** GET /api/orders/{id}/ */
export async function fetchOrderById(id: string): Promise<Order> {
  const { data } = await api.get<ApiCommande>(`/api/orders/${id}/`);
  return mapApiOrder(data);
}

/** POST /api/orders/ */
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

  const { data } = await api.post<ApiCommande>('/api/orders/', body);
  return mapApiOrder(data);
}

/** PATCH /api/orders/{id}/update_status/ */
export async function updateOrderStatus(orderId: string, status: OrderStatus): Promise<Order> {
  const { data } = await api.patch<ApiCommande>(`/api/orders/${orderId}/update_status/`, {
    status: mapFrontendStatusToApi(status),
  });
  return mapApiOrder(data);
}

/** PATCH /api/orders/{id}/assign-courier/ */
export async function assignCourierToOrder(orderId: string, courierId: string): Promise<Order> {
  const { data } = await api.patch<ApiCommande>(`/api/orders/${orderId}/assign-courier/`, {
    courier: courierId,
  });
  return mapApiOrder(data);
}

/** GET /api/orders/my-deliveries/ — pour les coursiers */
export async function fetchMyDeliveries(): Promise<Order[]> {
  const { data } = await api.get<ApiCommande | ApiPaginated<ApiCommande>>('/api/orders/my-deliveries/');
  if (Array.isArray((data as ApiPaginated<ApiCommande>).results)) {
    return (data as ApiPaginated<ApiCommande>).results.map(mapApiOrder);
  }
  return [mapApiOrder(data as ApiCommande)];
}

// ─── Clients ─────────────────────────────────────────────────────────────────

/** GET /api/clients/ */
export async function fetchClients(): Promise<Client[]> {
  const { data } = await api.get<ApiPaginated<ApiClient>>('/api/clients/');
  return data.results.map(mapApiClient);
}

/** GET /api/clients/{id}/ */
export async function fetchClientById(id: string): Promise<Client> {
  const { data } = await api.get<ApiClient>(`/api/clients/${id}/`);
  return mapApiClient(data);
}

/** Recherche locale par téléphone après chargement de la liste */
export async function searchClientsByPhone(phone: string): Promise<Client[]> {
  const clients = await fetchClients();
  const q = phone.replace(/\s/g, '').toLowerCase();
  if (q.length < 4) return [];
  return clients.filter((c) => c.phone.replace(/\s/g, '').toLowerCase().includes(q));
}

/** POST /api/clients/ */
export async function createClient(payload: { name: string; phone_number: string }): Promise<Client> {
  const body: ApiClientRequest = { name: payload.name, phone_number: payload.phone_number };
  const { data } = await api.post<ApiClient>('/api/clients/', body);
  return mapApiClient(data);
}

/** PATCH /api/clients/{id}/ */
export async function updateClient(id: string, patch: Partial<ApiClientRequest>): Promise<Client> {
  const { data } = await api.patch<ApiClient>(`/api/clients/${id}/`, patch);
  return mapApiClient(data);
}

/** DELETE /api/clients/{id}/ */
export async function deleteClient(id: string): Promise<void> {
  await api.delete(`/api/clients/${id}/`);
}

// ─── Paiements ───────────────────────────────────────────────────────────────

/** GET /api/payments/ */
export async function fetchPayments(): Promise<Payment[]> {
  const { data } = await api.get<ApiPaginated<ApiPaiement>>('/api/payments/');
  return data.results.map(mapApiPayment);
}

/** POST /api/payments/ */
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

  const { data } = await api.post<ApiPaiement>('/api/payments/', body);
  return mapApiPayment(data);
}

/** GET /api/payments/debtors/ */
export async function fetchDebtors(): Promise<Payment[]> {
  const { data } = await api.get<ApiPaiement | ApiPaginated<ApiPaiement>>('/api/payments/debtors/');
  if ((data as ApiPaginated<ApiPaiement>).results) {
    return (data as ApiPaginated<ApiPaiement>).results.map(mapApiPayment);
  }
  return [mapApiPayment(data as ApiPaiement)];
}

// ─── Mobile Money ─────────────────────────────────────────────────────────────

/** POST /api/payments-gateway/initiate/ */
export async function initiateMobileMoney(
  payload: ApiInitiateMobileMoneyRequest
): Promise<ApiMobileMoneyRequest> {
  const { data } = await api.post<ApiMobileMoneyRequest>('/api/payments-gateway/initiate/', payload);
  return data;
}

/** GET /api/payments-gateway/requests/ */
export async function fetchMobileMoneyRequests(): Promise<ApiMobileMoneyRequest[]> {
  const { data } = await api.get<ApiPaginated<ApiMobileMoneyRequest>>('/api/payments-gateway/requests/');
  return data.results;
}

// ─── Équipe (Employés) ───────────────────────────────────────────────────────

/** GET /api/accounts/employees/ */
export async function fetchEmployees(): Promise<Employee[]> {
  const { data } = await api.get<ApiPaginated<ApiUser>>('/api/accounts/employees/');
  return data.results.map(mapApiEmployee);
}

/** POST /api/accounts/employees/ — crée un compte employé ou coursier du pressing */
export async function createEmployee(
  payload: ApiEmployeeCreateRequest & { role?: 'EMPLOYE' | 'COURSIER' }
): Promise<Employee> {
  const { data } = await api.post<ApiUser>('/api/accounts/employees/', payload);
  return mapApiEmployee(data);
}

/** PATCH /api/accounts/employees/{id}/ — modifie un membre (nom, mot de passe) */
export async function updateEmployee(id: string, patch: ApiEmployeeUpdateRequest): Promise<Employee> {
  const { data } = await api.patch<ApiUser>(`/api/accounts/employees/${id}/`, patch);
  return mapApiEmployee(data);
}

/** PATCH /api/accounts/employees/{id}/ — toggle actif/inactif */
export async function toggleEmployeeActive(employeeId: string): Promise<Employee> {
  // On récupère l'employé d'abord pour connaître son état actuel
  const { data: current } = await api.get<ApiUser>(`/api/accounts/employees/${employeeId}/`);
  const patch: ApiEmployeeUpdateRequest = { is_active: !current.is_active };
  const { data } = await api.patch<ApiUser>(`/api/accounts/employees/${employeeId}/`, patch);
  return mapApiEmployee(data);
}

/** DELETE /api/accounts/employees/{id}/ (désactivation côté serveur) */
export async function deleteEmployee(employeeId: string): Promise<void> {
  await api.delete(`/api/accounts/employees/${employeeId}/`);
}

// ─── Coursiers ───────────────────────────────────────────────────────────────

/** GET /api/deliveries/couriers/ */
export async function fetchCouriers(): Promise<ApiCourier[]> {
  const { data } = await api.get<ApiPaginated<ApiCourier>>('/api/deliveries/couriers/');
  return data.results;
}

/** DELETE /api/deliveries/couriers/{id}/ (désactivation) */
export async function deleteCourier(id: string): Promise<void> {
  await api.delete(`/api/deliveries/couriers/${id}/`);
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
    return [];
  }
}

/** PATCH /api/orders/{id}/assign-courier/ */
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

/** PATCH /api/orders/{id}/update-delivery/ */
export async function updateMissionStatus(missionId: string, status: Mission['status']): Promise<Mission> {
  const orderId = missionId.replace('mission-', '');
  const deliveryStatusMap: Record<Mission['status'], string | null> = {
    a_faire: 'A_COLLECTER',
    en_cours: 'COLLECTE',
    terminee: 'LIVRE',
  };

  const { data } = await api.patch<ApiCommande>(`/api/orders/${orderId}/update-delivery/`, {
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
      primaryColor: profile.primary_color ?? '#142B4A',
      smsNotifications: false,
      emailNotifications: false,
      orderReadySms: false,
      paymentReminderSms: false,
      plan: 'standard',
    };
  } catch {
    return {
      name: 'PressNet',
      phone: '',
      email: '',
      city: '',
      address: '',
      openingHours: '08h00 - 19h00',
      primaryColor: '#142B4A',
      smsNotifications: false,
      emailNotifications: false,
      orderReadySms: false,
      paymentReminderSms: false,
      plan: 'standard',
    };
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

// ─── Tarification ─────────────────────────────────────────────────────────────

/** GET /api/catalog/ — catalogue du pressing (staff JWT) */
export async function fetchPrices(): Promise<PriceItem[]> {
  try {
    const { data } = await api.get<ApiPaginated<{ id: string; name: string; category: string; price: string; is_active: boolean }>>(
      '/api/catalog/'
    );
    return data.results
      .filter((t) => t.is_active)
      .map((t) => ({ id: t.id, name: t.name, category: t.category || 'Vêtements', price: parseFloat(t.price) }));
  } catch {
    return [];
  }
}

/** PUT /api/catalog/bulk/ — remplace tout le catalogue (staff JWT) */
export async function savePrices(prices: PriceItem[]): Promise<PriceItem[]> {
  await api.put(
    '/api/catalog/bulk/',
    {
      items: prices.map((p) => ({
        name: p.name,
        category: p.category,
        price: p.price.toFixed(2),
        is_active: true
      }))
    }
  );
  return fetchPrices();
}

// ─── Notifications (générées dynamiquement à partir des commandes réelles) ───

export async function fetchNotifications(): Promise<Notification[]> {
  try {
    const orders = await fetchOrders();
    const readyOrders = orders.filter((o) => o.status === 'pret' && !o.claimed);
    return readyOrders.slice(0, 5).map((o) => ({
      id: `notif-ready-${o.id}`,
      title: `Commande ${o.ticket} prête`,
      message: `La commande ${o.ticket} est prête pour retrait client.`,
      date: o.createdAt,
      read: false,
      type: 'commande' as const,
    }));
  } catch {
    return [];
  }
}

// ─── SMS (non disponible dans l'API publique) ─────────────────────────────────

export async function sendSms(_to: string, _message: string): Promise<{ success: boolean }> {
  // À implémenter quand un endpoint SMS sera disponible
  return { success: true };
}
