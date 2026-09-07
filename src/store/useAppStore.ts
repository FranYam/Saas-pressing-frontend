import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Client, Employee, Mission, Notification, Order, Payment, PriceItem, PressingSettings } from '@/types';
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

  // Chargement
  loading: boolean;
  initialized: boolean;
  hydrate: () => Promise<void>;

  // Commandes
  updateOrderStatus: (orderId: string, status: Order['status']) => Promise<void>;
  createOrder: (payload: Parameters<typeof api.createOrder>[0]) => Promise<Order>;

  // Paiements
  recordPayment: (orderId: string, method: Payment['method'], amount: number) => Promise<void>;

  // Équipe
  toggleEmployeeActive: (id: string) => Promise<void>;

  // Missions
  assignCourier: (missionId: string, courierId: string) => Promise<void>;
  updateMissionStatus: (missionId: string, status: Mission['status']) => Promise<void>;

  // Paramètres
  saveSettings: (settings: PressingSettings) => Promise<void>;
  savePrices: (prices: PriceItem[]) => Promise<void>;

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

      loading: false,
      initialized: false,

      hydrate: async () => {
        if (get().loading || get().initialized) return;
        set({ loading: true });
        try {
          const [orders, clients, payments, employees, missions, prices, settings, notifications] = await Promise.all([
            api.fetchOrders(),
            api.fetchClients(),
            api.fetchPayments(),
            api.fetchEmployees(),
            api.fetchMissions(),
            api.fetchPrices(),
            api.fetchSettings(),
            api.fetchNotifications()
          ]);
          set({ orders, clients, payments, employees, missions, prices, settings, notifications, initialized: true });
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
          )
        }));
      },

      toggleEmployeeActive: async (id) => {
        const updated = await api.toggleEmployeeActive(id);
        set((s) => ({ employees: s.employees.map((e) => (e.id === id ? updated : e)) }));
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

      markNotificationRead: (id) =>
        set((s) => ({ notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)) })),

      markAllNotificationsRead: () =>
        set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, read: true })) }))
    }),
    {
      name: 'pressnet-data',
      // Mise en cache offline des données consultées (PWA)
      partialize: (state) => ({
        orders: state.orders,
        clients: state.clients,
        payments: state.payments,
        employees: state.employees,
        missions: state.missions,
        prices: state.prices,
        settings: state.settings,
        notifications: state.notifications,
        initialized: state.initialized
      })
    }
  )
);
