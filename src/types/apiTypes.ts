/**
 * Types API — fidèles au schéma OpenAPI 3.0.3 du backend SaaS Pressing.
 * Ces types sont utilisés exclusivement dans la couche service (api.ts).
 * Les composants React utilisent les types camelCase définis dans types/index.ts.
 */

// ─── Énumérations ─────────────────────────────────────────────────────────────

export type ApiCommandeStatus = 'RECU' | 'EN_TRAITEMENT' | 'PRET' | 'LIVRE';

export type ApiPaymentStatus = 'PAYE' | 'PARTIEL' | 'CREDIT';

export type ApiDeliveryStatus = 'A_COLLECTER' | 'COLLECTE' | 'A_LIVRER' | 'LIVRE';

export type ApiCanal = 'COMPTOIR' | 'EN_LIGNE';

export type ApiPaymentMode = 'ESPECES' | 'MOBILE_MONEY' | 'CREDIT';

export type ApiRole = 'GERANT' | 'EMPLOYE' | 'COURSIER';

export type ApiMobileMoneyOperator = 'ORANGE' | 'MOOV';

export type ApiMobileMoneyStatus = 'PENDING' | 'CONFIRMED' | 'FAILED' | 'CANCELLED';

// ─── Pagination ───────────────────────────────────────────────────────────────

export interface ApiPaginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface ApiLoginRequest {
  username: string;
  password: string;
}

export interface ApiLoginResponse {
  access: string;
  refresh: string;
  /** Claims personnalisés dans le JWT — role + pressing_id */
  role?: ApiRole;
  pressing_id?: string;
}

export interface ApiTokenRefreshRequest {
  refresh: string;
}

export interface ApiTokenRefreshResponse {
  access: string;
  refresh: string;
}

// ─── Utilisateur ──────────────────────────────────────────────────────────────

export interface ApiUser {
  id: string;
  username: string;
  first_name: string;
  last_name: string;
  role: ApiRole;
  pressing: string; // UUID
  phone_number?: string;
  is_active: boolean;
  created_at: string;
}

// ─── Pressing (Tenant) ────────────────────────────────────────────────────────

export interface ApiPressing {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  owner_name?: string;
  logo: string | null;
  primary_color?: string;
  secondary_color?: string;
  created_at: string;
}

export interface ApiPressingRequest {
  name: string;
  address?: string;
  phone?: string;
  owner_name?: string;
  logo?: File | null;
  primary_color?: string;
  secondary_color?: string;
}

export interface ApiRegisterPressingRequest {
  name: string;
  address?: string;
  phone?: string;
  owner_name?: string;
  logo?: File | null;
  primary_color?: string;
  secondary_color?: string;
  gerant: {
    username: string;
    password: string;
    first_name?: string;
    last_name?: string;
  };
}

// ─── Client ───────────────────────────────────────────────────────────────────

export interface ApiClient {
  id: string;
  name: string;
  phone_number: string;
  pressing: string; // UUID
  created_at: string;
}

export interface ApiClientRequest {
  name: string;
  phone_number: string;
}

// ─── Articles de commande ─────────────────────────────────────────────────────

export interface ApiOrderItem {
  id: string;
  clothing_type: string;
  quantity: number;
  unit_price: string; // decimal string
}

export interface ApiOrderItemRequest {
  clothing_type: string;
  quantity?: number;
  unit_price: string; // decimal string
}

// ─── Commande ─────────────────────────────────────────────────────────────────

export interface ApiCommande {
  id: string;
  ticket_number: string | null;
  client: string; // UUID
  status: ApiCommandeStatus;
  payment_status: ApiPaymentStatus;
  canal?: ApiCanal;
  date_depot: string; // datetime
  date_retrait_prevue: string; // datetime
  total_price: string; // decimal string
  collect_address?: string;
  delivery_status: ApiDeliveryStatus | null | '';
  assigned_courier: string | null; // UUID
  assigned_courier_name: string | null;
  articles: ApiOrderItem[];
  receipt: string;
  created_at: string;
}

export interface ApiCommandeRequest {
  client: string; // UUID
  canal?: ApiCanal;
  date_retrait_prevue: string; // datetime ISO
  collect_address?: string;
  delivery_status?: ApiDeliveryStatus | null;
  articles: ApiOrderItemRequest[];
}

// ─── Paiement ─────────────────────────────────────────────────────────────────

export interface ApiPaiement {
  id: string;
  commande: string; // UUID
  amount: string; // decimal string
  mode?: ApiPaymentMode;
  date_paiement?: string; // datetime
  status: ApiPaymentStatus;
  pressing: string; // UUID
  created_at: string;
}

export interface ApiPaiementRequest {
  commande: string; // UUID
  amount: string; // decimal string
  mode?: ApiPaymentMode;
  date_paiement?: string; // datetime ISO
}

// ─── Employé ──────────────────────────────────────────────────────────────────

export interface ApiEmployeeCreate {
  id: string;
  username: string;
  first_name?: string;
  last_name?: string;
  created_at: string;
}

export interface ApiEmployeeCreateRequest {
  username: string;
  password: string;
  first_name?: string;
  last_name?: string;
}

export interface ApiEmployeeUpdateRequest {
  first_name?: string;
  last_name?: string;
  is_active?: boolean;
  password?: string;
}

// ─── Coursier ─────────────────────────────────────────────────────────────────

export interface ApiCourier {
  id: string;
  name: string;
  phone_number: string;
  is_active: boolean;
  created_at: string;
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export interface ApiUnclaimedOrder {
  id: string;
  ticket_number: string;
  client_name: string;
  client_phone: string;
  ready_since: string;
  days_waiting: number;
}

export interface ApiDashboardSummary {
  date: string;
  revenue_today: string; // decimal string
  revenue_month: string; // decimal string
  orders_today: number;
  orders_in_progress: number;
  orders_ready: number;
  outstanding_debts: string; // decimal string
  debtors_count: number;
  unclaimed: ApiUnclaimedOrder[];
}

// ─── Mobile Money ─────────────────────────────────────────────────────────────

export interface ApiInitiateMobileMoneyRequest {
  commande: string; // UUID
  phone_number: string;
  operator: ApiMobileMoneyOperator;
}

export interface ApiMobileMoneyRequest {
  id: string;
  commande: string; // UUID
  operator: ApiMobileMoneyOperator;
  phone_number: string;
  amount: string; // decimal string
  status: ApiMobileMoneyStatus;
  provider_ref: string;
  error_message: string;
  created_at: string;
}
