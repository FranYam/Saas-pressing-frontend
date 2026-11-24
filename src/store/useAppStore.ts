import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Client, Employee, Mission, Notification, Order, Payment, PriceItem, PressingSettings } from '@/types';
import type { ApiDashboardSummary } from '@/types/apiTypes';
import * as api from '@/services/api';

interface AppStore {
  // Données
  orders: Order[];
  clients: Client[];
  payments: Payment[];
  employees: Employee[];
  missions: Mission[];
  prices: PriceItem[];
  settings: PressingSettings | null;
  notifications: Notification[];
  dashboardSummary: ApiDashboardSummary | null;

  // Chargement
  loading: boolean;
  initialized: boolean;
  hydrate: (force?: boolean) => Promise<void>;
  fetchDashboardSummary: () => Promise<void>;

  // Commandes
  updateOrderStatus: (orderId: string, status: Order['status']) => Promise<void>;
  createOrder: (payload: Parameters<typeof api.createOrder>[0]) => Promise<Order>;

  // Paiements
  recordPayment: (orderId: string, method: Payment['method'], amount: number) => Promise<void>;

  // Équipe
  toggleEmployeeActive: (id: string) => Promise<void>;
  createEmployee: (payload: Parameters<typeof api.createEmployee>[0]) => Promise<void>;
  updateEmployee: (id: string, patch: Parameters<typeof api.updateEmployee>[1]) => Promise<void>;

  // Missions
  assignCourier: (missionId: string, courierId: string) => Promise<void>;
  updateMissionStatus: (missionId: string, status: Mission['status']) => Promise<void>;

  // Paramètres
  saveSettings: (settings: PressingSettings) => Promise<void>;
  savePrices: (prices: PriceItem[]) => Promise<void>;

  // Clients
  createClient: (name: string, phone: string) => Promise<Client>;

  // Notifications
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
}

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      orders: [],
      clients: [],
      payments: [],
      employees: [],
      missions: [],
      prices: [],
      settings: null,
      notifications: [],
      dashboardSummary: null,

      loading: false,
      initialized: false,

      fetchDashboardSummary: async () => {
        try {
          const summary = await api.fetchDashboard();
          set({ dashboardSummary: summary });
        } catch {
          // Ignorer si non autorisé (employé / hors ligne)
        }
      },

      hydrate: async () => {
        if (get().loading || get().initialized) return;
        set({ loading: true });
        try {
          const results = await Promise.allSettled([
            api.fetchOrders(),
            api.fetchClients(),
            api.fetchPayments(),
            api.fetchEmployees(),
            api.fetchMissions(),
            api.fetchPrices(),
            api.fetchSettings(),
            api.fetchNotifications(),
            api.fetchDashboard(),
          ]);

          const [ordersRes, clientsRes, paymentsRes, employeesRes, missionsRes, pricesRes, settingsRes, notifsRes, dashRes] = results;

          set({
            orders: ordersRes.status === 'fulfilled' ? ordersRes.value : get().orders,
            clients: clientsRes.status === 'fulfilled' ? clientsRes.value : get().clients,
            payments: paymentsRes.status === 'fulfilled' ? paymentsRes.value : get().payments,
            employees: employeesRes.status === 'fulfilled' ? employeesRes.value : get().employees,
            missions: missionsRes.status === 'fulfilled' ? missionsRes.value : get().missions,
            prices: pricesRes.status === 'fulfilled' ? pricesRes.value : get().prices,
            settings: settingsRes.status === 'fulfilled' ? settingsRes.value : get().settings,
            notifications: notifsRes.status === 'fulfilled' ? notifsRes.value : get().notifications,
            dashboardSummary: dashRes.status === 'fulfilled' ? dashRes.value : get().dashboardSummary,
            initialized: true,
          });
        } finally {
          set({ loading: false });
        }
      },

      updateOrderStatus: async (orderId, status) => {
        const updated = await api.updateOrderStatus(orderId, status);
        set((s) => ({ orders: s.orders.map((o) => (o.id === orderId ? updated : o)) }));
      },

      createOrder: async (payload) => {
        const order = await api.createOrder(payload);
        set((s) => ({ orders: [order, ...s.orders] }));
        return order;
      },

      recordPayment: async (orderId, method, amount) => {
        const payment = await api.recordPayment(orderId, method, amount);
        set((s) => ({
          payments: [payment, ...s.payments],
          orders: s.orders.map((o) =>
            o.id === orderId ? { ...o, paidAmount: Math.min(o.paidAmount + amount, o.total), paymentMethod: method } : o
          ),
        }));
      },

      toggleEmployeeActive: async (id) => {
        const updated = await api.toggleEmployeeActive(id);
        set((s) => ({ employees: s.employees.map((e) => (e.id === id ? updated : e)) }));
      },

      createEmployee: async (payload) => {
        await api.createEmployee(payload);
        try {
          set({ employees: await api.fetchEmployees() });
        } catch {
          // Ignorer
        }
      },

      updateEmployee: async (id, patch) => {
        await api.updateEmployee(id, patch);
        try {
          set({ employees: await api.fetchEmployees() });
        } catch {
          // Ignorer
        }
      },

      assignCourier: async (missionId, courierId) => {
        const updated = await api.assignCourier(missionId, courierId);
        set((s) => ({ missions: s.missions.map((m) => (m.id === missionId ? updated : m)) }));
      },

      updateMissionStatus: async (missionId, status) => {
        const updated = await api.updateMissionStatus(missionId, status);
        set((s) => ({ missions: s.missions.map((m) => (m.id === missionId ? updated : m)) }));
      },

      saveSettings: async (settings) => {
        await api.saveSettings(settings);
        set({ settings });
      },

      savePrices: async (prices) => {
        await api.savePrices(prices);
        set({ prices });
      },

      createClient: async (name, phone) => {
        const created = await api.createClient({ name, phone_number: phone });
        set((s) => ({ clients: [created, ...s.clients] }));
        return created;
      },

      markNotificationRead: (id) =>
        set((s) => ({ notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)) })),

      markAllNotificationsRead: () =>
        set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, read: true })) })),
    }),
    {
      name: 'pressnet-data',
      partialize: (state) => ({
        orders: state.orders,
        clients: state.clients,
        payments: state.payments,
        employees: state.employees,
        missions: state.missions,
        prices: state.prices,
        settings: state.settings,
        notifications: state.notifications,
        dashboardSummary: state.dashboardSummary,
        initialized: state.initialized,
      }),
    }
  )
);
