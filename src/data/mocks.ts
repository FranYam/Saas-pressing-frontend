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

// ─── Helpers de dates (données toujours « fraîches ») ────────────────────────

const now = new Date();

/** Date ISO il y a `d` jours, à `h`h`m` */
export function daysAgo(d: number, h = 10, m = 0): string {
  const date = new Date(now);
  date.setDate(date.getDate() - d);
  date.setHours(h, m, 0, 0);
  return date.toISOString();
}

export function daysAhead(d: number, h = 17, m = 0): string {
  const date = new Date(now);
  date.setDate(date.getDate() + d);
  date.setHours(h, m, 0, 0);
  return date.toISOString();
}

// ─── Utilisateurs de démonstration ───────────────────────────────────────────
// Démo sans backend : aucun mot de passe réel n'est stocké ici.
// La connexion de démonstration accepte n'importe quel mot de passe (voir services/api.ts).

export const DEMO_USERS: User[] = [
  {
    id: 'u-001',
    fullName: 'Aïcha Ouédraogo',
    email: 'gerant@pressnet.bf',
    phone: '+226 70 12 34 56',
    role: 'gerant',
    pressingName: 'Pressing Faso Propre',
    avatarColor: '#C75B39'
  },
  {
    id: 'u-002',
    fullName: 'Ibrahim Kaboré',
    email: 'employe@pressnet.bf',
    phone: '+226 76 45 78 90',
    role: 'employe',
    pressingName: 'Pressing Faso Propre',
    avatarColor: '#3B82F6'
  },
  {
    id: 'u-003',
    fullName: 'Moussa Sawadogo',
    email: 'coursier@pressnet.bf',
    phone: '+226 77 23 45 67',
    role: 'coursier',
    pressingName: 'Pressing Faso Propre',
    avatarColor: '#22C55E'
  },
  {
    id: 'u-004',
    fullName: 'Mariam Traoré',
    email: 'client@pressnet.bf',
    phone: '+226 70 88 99 00',
    role: 'client',
    pressingName: 'Pressing Faso Propre',
    avatarColor: '#8B5CF6',
    linkedClientId: 'c-001'
  }
];

// ─── Clients ─────────────────────────────────────────────────────────────────

export const MOCK_CLIENTS: Client[] = [
  { id: 'c-001', firstName: 'Mariam', lastName: 'Traoré', phone: '+226 70 88 99 00', sector: 'Secteur 4', address: 'Cité Aziz, Secteur 4', registeredAt: daysAgo(210) },
  { id: 'c-002', firstName: 'Salif', lastName: 'Compaoré', phone: '+226 76 11 22 33', sector: 'Secteur 15', address: 'Rue 15.245, Secteur 15', registeredAt: daysAgo(180) },
  { id: 'c-003', firstName: 'Amina', lastName: 'Zongo', phone: '+226 70 45 67 89', sector: 'Gounghin', address: 'Gounghin, derrière le marché', registeredAt: daysAgo(150) },
  { id: 'c-004', firstName: 'Paul', lastName: 'Belem', phone: '+226 78 90 12 34', sector: '1200 Logements', address: 'Bloc C, 1200 Logements', registeredAt: daysAgo(120) },
  { id: 'c-005', firstName: 'Fatima', lastName: 'Kaboré', phone: '+226 71 34 56 78', sector: 'Secteur 22', address: 'Cité Nabayius, Secteur 22', registeredAt: daysAgo(95) },
  { id: 'c-006', firstName: 'Adama', lastName: 'Sawadogo', phone: '+226 76 78 90 12', sector: 'Karpala', address: 'Karpala, non loin de la mosquée', registeredAt: daysAgo(80) },
  { id: 'c-007', firstName: 'Marie', lastName: 'Tapsoba', phone: '+226 70 23 45 67', sector: 'Pissy', address: 'Pissy, zone du bois', registeredAt: daysAgo(60) },
  { id: 'c-008', firstName: 'Hamidou', lastName: 'Kinda', phone: '+226 77 56 78 90', sector: 'Secteur 4', address: 'Av. de la Nation, Secteur 4', registeredAt: daysAgo(45) },
  { id: 'c-009', firstName: 'Aïcha', lastName: 'Sanogo', phone: '+226 76 90 12 34', sector: 'Secteur 15', address: 'Cité Anfida, Secteur 15', registeredAt: daysAgo(30) },
  { id: 'c-010', firstName: 'Moussa', lastName: 'Ouédraogo', phone: '+226 70 67 89 01', sector: 'Gounghin', address: 'Gounghin, Cité Damas', registeredAt: daysAgo(20) },
  { id: 'c-011', firstName: 'Ibrahim', lastName: 'Traoré', phone: '+226 78 12 34 56', sector: '1200 Logements', address: 'Bloc A, 1200 Logements', registeredAt: daysAgo(12) },
  { id: 'c-012', firstName: 'Rasmané', lastName: 'Zongo', phone: '+226 71 78 90 12', sector: 'Karpala', address: 'Karpala École, portail bleu', registeredAt: daysAgo(5) }
];

// ─── Commandes ───────────────────────────────────────────────────────────────

type OrderSpec = {
  id: string;
  ticket: string;
  clientId: string;
  status: OrderStatus;
  channel: 'comptoir' | 'en_ligne';
  paymentType: 'integral' | 'partiel' | 'credit';
  paymentMethod: Payment['method'] | null;
  items: [string, number, number][]; // [type, quantité, prix unitaire]
  createdAtDays: number;
  hour: number;
  claimed: boolean;
  deliveryRequested: boolean;
  advance?: number; // montant payé si partiel
};

const ORDER_SPECS: OrderSpec[] = [
  { id: 'o-001', ticket: 'PR-0001', clientId: 'c-001', status: 'livre', channel: 'comptoir', paymentType: 'integral', paymentMethod: 'especes', items: [['Chemise', 3, 500], ['Pantalon', 2, 750]], createdAtDays: 9, hour: 9, claimed: true, deliveryRequested: false },
  { id: 'o-002', ticket: 'PR-0002', clientId: 'c-002', status: 'livre', channel: 'comptoir', paymentType: 'integral', paymentMethod: 'orange_money', items: [['Costume', 1, 3000]], createdAtDays: 8, hour: 11, claimed: true, deliveryRequested: true },
  { id: 'o-003', ticket: 'PR-0003', clientId: 'c-003', status: 'livre', channel: 'en_ligne', paymentType: 'partiel', paymentMethod: 'moov_money', items: [['Robe', 2, 1000], ['Drap', 1, 1500]], createdAtDays: 8, hour: 15, claimed: true, deliveryRequested: true, advance: 2000 },
  { id: 'o-004', ticket: 'PR-0004', clientId: 'c-004', status: 'livre', channel: 'comptoir', paymentType: 'credit', paymentMethod: null, items: [['Rideau', 2, 2000]], createdAtDays: 7, hour: 10, claimed: false, deliveryRequested: false },
  { id: 'o-005', ticket: 'PR-0005', clientId: 'c-005', status: 'livre', channel: 'comptoir', paymentType: 'integral', paymentMethod: 'especes', items: [['Chemise', 5, 500], ['Pantalon', 3, 750]], createdAtDays: 7, hour: 14, claimed: true, deliveryRequested: false },
  { id: 'o-006', ticket: 'PR-0006', clientId: 'c-001', status: 'pret', channel: 'comptoir', paymentType: 'integral', paymentMethod: 'orange_money', items: [['Robe', 1, 1000]], createdAtDays: 5, hour: 9, claimed: false, deliveryRequested: false },
  { id: 'o-007', ticket: 'PR-0007', clientId: 'c-006', status: 'pret', channel: 'en_ligne', paymentType: 'partiel', paymentMethod: 'especes', items: [['Costume', 2, 3000], ['Chemise', 2, 500]], createdAtDays: 5, hour: 16, claimed: false, deliveryRequested: true, advance: 3000 },
  { id: 'o-008', ticket: 'PR-0008', clientId: 'c-007', status: 'pret', channel: 'comptoir', paymentType: 'credit', paymentMethod: null, items: [['Drap', 2, 1500], ['Rideau', 1, 2000]], createdAtDays: 4, hour: 11, claimed: false, deliveryRequested: false },
  { id: 'o-009', ticket: 'PR-0009', clientId: 'c-008', status: 'traitement', channel: 'comptoir', paymentType: 'partiel', paymentMethod: 'moov_money', items: [['Chemise', 4, 500], ['Pantalon', 4, 750]], createdAtDays: 3, hour: 8, claimed: false, deliveryRequested: false, advance: 1500 },
  { id: 'o-010', ticket: 'PR-0010', clientId: 'c-009', status: 'traitement', channel: 'comptoir', paymentType: 'integral', paymentMethod: 'especes', items: [['Robe', 3, 1000]], createdAtDays: 3, hour: 13, claimed: false, deliveryRequested: false },
  { id: 'o-011', ticket: 'PR-0011', clientId: 'c-003', status: 'traitement', channel: 'en_ligne', paymentType: 'partiel', paymentMethod: 'orange_money', items: [['Drap', 1, 1500], ['Rideau', 2, 2000]], createdAtDays: 2, hour: 10, claimed: false, deliveryRequested: true, advance: 3000 },
  { id: 'o-012', ticket: 'PR-0012', clientId: 'c-010', status: 'traitement', channel: 'comptoir', paymentType: 'credit', paymentMethod: null, items: [['Costume', 1, 3000], ['Chemise', 2, 500]], createdAtDays: 2, hour: 15, claimed: false, deliveryRequested: false },
  { id: 'o-013', ticket: 'PR-0013', clientId: 'c-002', status: 'recu', channel: 'comptoir', paymentType: 'partiel', paymentMethod: 'especes', items: [['Pantalon', 2, 750], ['Chemise', 2, 500]], createdAtDays: 1, hour: 9, claimed: false, deliveryRequested: false, advance: 1000 },
  { id: 'o-014', ticket: 'PR-0014', clientId: 'c-011', status: 'recu', channel: 'en_ligne', paymentType: 'partiel', paymentMethod: 'orange_money', items: [['Robe', 2, 1000], ['Drap', 1, 1500]], createdAtDays: 1, hour: 12, claimed: false, deliveryRequested: true, advance: 2500 },
  { id: 'o-015', ticket: 'PR-0015', clientId: 'c-004', status: 'recu', channel: 'comptoir', paymentType: 'integral', paymentMethod: 'especes', items: [['Costume', 1, 3000], ['Pantalon', 1, 750], ['Chemise', 1, 500]], createdAtDays: 1, hour: 16, claimed: false, deliveryRequested: false },
  { id: 'o-016', ticket: 'PR-0016', clientId: 'c-012', status: 'recu', channel: 'comptoir', paymentType: 'credit', paymentMethod: null, items: [['Rideau', 3, 2000]], createdAtDays: 0, hour: 8, claimed: false, deliveryRequested: false },
  { id: 'o-017', ticket: 'PR-0017', clientId: 'c-005', status: 'recu', channel: 'comptoir', paymentType: 'integral', paymentMethod: 'moov_money', items: [['Chemise', 6, 500], ['Pantalon', 2, 750]], createdAtDays: 0, hour: 10, claimed: false, deliveryRequested: false },
  { id: 'o-018', ticket: 'PR-0018', clientId: 'c-007', status: 'recu', channel: 'en_ligne', paymentType: 'partiel', paymentMethod: 'orange_money', items: [['Robe', 1, 1000], ['Chemise', 3, 500]], createdAtDays: 0, hour: 11, claimed: false, deliveryRequested: true, advance: 1500 },
  { id: 'o-019', ticket: 'PR-0019', clientId: 'c-001', status: 'recu', channel: 'comptoir', paymentType: 'integral', paymentMethod: 'especes', items: [['Drap', 2, 1500]], createdAtDays: 0, hour: 14, claimed: false, deliveryRequested: false },
  { id: 'o-020', ticket: 'PR-0020', clientId: 'c-006', status: 'traitement', channel: 'comptoir', paymentType: 'integral', paymentMethod: 'especes', items: [['Costume', 1, 3000], ['Rideau', 1, 2000]], createdAtDays: 0, hour: 15, claimed: false, deliveryRequested: false }
];

const STATUS_FLOW: OrderStatus[] = ['recu', 'traitement', 'pret', 'livre'];

function buildOrder(spec: OrderSpec): Order {
  const total = spec.items.reduce((sum, [, qty, price]) => sum + qty * price, 0);
  const paidAmount =
    spec.paymentType === 'integral' ? total : spec.paymentType === 'partiel' ? spec.advance ?? 0 : 0;
  const currentIdx = STATUS_FLOW.indexOf(spec.status);
  const statusHistory = STATUS_FLOW.slice(0, currentIdx + 1).map((status, i) => ({
    status,
    date: daysAgo(Math.max(spec.createdAtDays - i, 0), spec.hour + i * 4, 30)
  }));
  return {
    id: spec.id,
    ticket: spec.ticket,
    clientId: spec.clientId,
    items: spec.items.map(([type, quantity, unitPrice], i) => ({
      id: `${spec.id}-i${i + 1}`,
      type,
      quantity,
      unitPrice
    })),
    status: spec.status,
    channel: spec.channel,
    paymentType: spec.paymentType,
    paymentMethod: spec.paymentMethod,
    total,
    paidAmount,
    claimed: spec.claimed,
    deliveryRequested: spec.deliveryRequested,
    createdAt: daysAgo(spec.createdAtDays, spec.hour, 15),
    dueDate: daysAhead(spec.status === 'livre' ? -1 : Math.max(2 - spec.createdAtDays, 1)),
    statusHistory
  };
}

export const MOCK_ORDERS: Order[] = ORDER_SPECS.map(buildOrder);

// ─── Paiements (dérivés des commandes) ───────────────────────────────────────

export const MOCK_PAYMENTS: Payment[] = MOCK_ORDERS.filter((o) => o.paidAmount > 0)
  .flatMap((o) => {
    const main: Payment = {
      id: `p-${o.id}`,
      orderId: o.id,
      ticket: o.ticket,
      clientId: o.clientId,
      method: o.paymentMethod ?? 'especes',
      amount: o.paidAmount,
      date: o.createdAt,
      status: 'reussi'
    };
    // Une commande livrée partiellement payée a souvent été soldée au retrait
    if (o.status === 'livre' && o.paidAmount < o.total) {
      const solde: Payment = {
        id: `p-${o.id}-solde`,
        orderId: o.id,
        ticket: o.ticket,
        clientId: o.clientId,
        method: 'especes',
        amount: o.total - o.paidAmount,
        date: o.statusHistory[o.statusHistory.length - 1].date,
        status: 'reussi'
      };
      return [main, solde];
    }
    return [main];
  })
  .sort((a, b) => b.date.localeCompare(a.date));

// ─── Équipe ──────────────────────────────────────────────────────────────────

export const MOCK_EMPLOYEES: Employee[] = [
  { id: 'u-001', fullName: 'Aïcha Ouédraogo', role: 'gerant', phone: '+226 70 12 34 56', email: 'gerant@pressnet.bf', lastLogin: daysAgo(0, 7, 45), active: true },
  { id: 'u-002', fullName: 'Ibrahim Kaboré', role: 'employe', phone: '+226 76 45 78 90', email: 'employe@pressnet.bf', lastLogin: daysAgo(0, 8, 10), active: true },
  { id: 'u-005', fullName: 'Fatima Sawadogo', role: 'employe', phone: '+226 71 22 33 44', email: 'fatima@pressnet.bf', lastLogin: daysAgo(1, 17, 30), active: true },
  { id: 'u-003', fullName: 'Moussa Sawadogo', role: 'coursier', phone: '+226 77 23 45 67', email: 'coursier@pressnet.bf', lastLogin: daysAgo(0, 7, 55), active: true },
  { id: 'u-006', fullName: 'Salif Belem', role: 'coursier', phone: '+226 78 56 78 90', email: 'salif@pressnet.bf', lastLogin: daysAgo(3, 12, 0), active: false }
];

// ─── Missions coursier ───────────────────────────────────────────────────────

export const MOCK_MISSIONS: Mission[] = [
  // Missions du jour
  { id: 'm-001', orderId: 'o-014', ticket: 'PR-0014', type: 'collecte', clientId: 'c-011', sector: '1200 Logements', address: 'Bloc A, 1200 Logements', slot: "Aujourd'hui · 12h00 – 14h00", status: 'terminee', courierId: 'u-003', itemsCount: 3, createdAt: daysAgo(0, 7, 30), notes: 'Appeler en arrivant au portail' },
  { id: 'm-002', orderId: 'o-018', ticket: 'PR-0018', type: 'collecte', clientId: 'c-007', sector: 'Pissy', address: 'Pissy, zone du bois', slot: "Aujourd'hui · 15h00 – 17h00", status: 'en_cours', courierId: 'u-003', itemsCount: 4, createdAt: daysAgo(0, 8, 0), notes: 'Client au 2e étage' },
  { id: 'm-003', orderId: 'o-011', ticket: 'PR-0011', type: 'collecte', clientId: 'c-003', sector: 'Gounghin', address: 'Gounghin, derrière le marché', slot: "Aujourd'hui · 17h00 – 19h00", status: 'a_faire', courierId: 'u-003', itemsCount: 3, createdAt: daysAgo(0, 9, 0) },
  { id: 'm-004', orderId: 'o-007', ticket: 'PR-0007', type: 'livraison', clientId: 'c-006', sector: 'Karpala', address: 'Karpala, non loin de la mosquée', slot: "Aujourd'hui · 16h00 – 18h00", status: 'a_faire', courierId: 'u-003', itemsCount: 4, notes: 'Prévoir monnaie pour rendu', createdAt: daysAgo(0, 7, 45) },

  // Historique de la semaine
  { id: 'm-005', orderId: 'o-002', ticket: 'PR-0002', type: 'livraison', clientId: 'c-002', sector: 'Secteur 15', address: 'Rue 15.245, Secteur 15', slot: '09h00 – 11h00', status: 'terminee', courierId: 'u-003', itemsCount: 1, createdAt: daysAgo(1, 10, 0) },
  { id: 'm-006', orderId: 'o-003', ticket: 'PR-0003', type: 'livraison', clientId: 'c-003', sector: 'Gounghin', address: 'Gounghin, derrière le marché', slot: '14h00 – 16h00', status: 'terminee', courierId: 'u-003', itemsCount: 3, createdAt: daysAgo(1, 15, 0) },
  { id: 'm-007', orderId: 'o-013', ticket: 'PR-0013', type: 'collecte', clientId: 'c-002', sector: 'Secteur 15', address: 'Cité Anfida, Secteur 15', slot: '08h00 – 10h00', status: 'terminee', courierId: 'u-003', itemsCount: 4, createdAt: daysAgo(2, 9, 0) },
  { id: 'm-008', orderId: 'o-005', ticket: 'PR-0005', type: 'livraison', clientId: 'c-005', sector: 'Secteur 22', address: 'Cité Nabayius, Secteur 22', slot: '10h00 – 12h00', status: 'terminee', courierId: 'u-003', itemsCount: 8, createdAt: daysAgo(3, 11, 0) },
  { id: 'm-009', orderId: 'o-016', ticket: 'PR-0016', type: 'collecte', clientId: 'c-012', sector: 'Karpala', address: 'Karpala École, portail bleu', slot: '15h00 – 17h00', status: 'terminee', courierId: 'u-003', itemsCount: 3, createdAt: daysAgo(3, 16, 0) },
  { id: 'm-010', orderId: 'o-009', ticket: 'PR-0009', type: 'collecte', clientId: 'c-008', sector: 'Secteur 4', address: 'Av. de la Nation, Secteur 4', slot: '08h00 – 10h00', status: 'terminee', courierId: 'u-003', itemsCount: 8, createdAt: daysAgo(4, 8, 0) },
  { id: 'm-011', orderId: 'o-010', ticket: 'PR-0010', type: 'livraison', clientId: 'c-009', sector: 'Secteur 15', address: 'Cité Anfida, Secteur 15', slot: '13h00 – 15h00', status: 'terminee', courierId: 'u-003', itemsCount: 3, createdAt: daysAgo(5, 14, 0), notes: 'Remis à la concierge' },
  { id: 'm-012', orderId: 'o-012', ticket: 'PR-0012', type: 'collecte', clientId: 'c-010', sector: 'Gounghin', address: 'Gounghin, Cité Damas', slot: '10h00 – 12h00', status: 'terminee', courierId: 'u-003', itemsCount: 3, createdAt: daysAgo(6, 10, 0) }
];

// ─── Tarification ────────────────────────────────────────────────────────────

export const MOCK_PRICES: PriceItem[] = [
  { id: 't-001', name: 'Chemise', price: 500, category: 'Vêtements' },
  { id: 't-002', name: 'Pantalon', price: 750, category: 'Vêtements' },
  { id: 't-003', name: 'Robe', price: 1000, category: 'Vêtements' },
  { id: 't-004', name: 'Costume (2 pièces)', price: 3000, category: 'Vêtements' },
  { id: 't-005', name: 'Veste', price: 1500, category: 'Vêtements' },
  { id: 't-006', name: 'Boubou / Grand boubou', price: 2000, category: 'Traditionnel' },
  { id: 't-007', name: 'Faso Dan Fani', price: 1500, category: 'Traditionnel' },
  { id: 't-008', name: 'Drap', price: 1500, category: 'Linge de maison' },
  { id: 't-009', name: 'Rideau', price: 2000, category: 'Linge de maison' },
  { id: 't-010', name: 'Couverture', price: 2500, category: 'Linge de maison' }
];

// ─── Paramètres pressing ─────────────────────────────────────────────────────

export const MOCK_SETTINGS: PressingSettings = {
  name: 'Pressing Faso Propre',
  phone: '+226 25 30 44 55',
  email: 'contact@fasopropre.bf',
  city: 'Ouagadougou',
  address: 'Secteur 4, Av. Kwame N\'Krumah, face à la pharmacie du centre',
  openingHours: 'Lun – Sam : 07h30 – 19h00',
  primaryColor: '#C75B39',
  smsNotifications: true,
  emailNotifications: false,
  orderReadySms: true,
  paymentReminderSms: true,
  plan: 'pro'
};

// ─── Notifications ───────────────────────────────────────────────────────────

export const MOCK_NOTIFICATIONS: Notification[] = [
  { id: 'n-001', title: 'Nouvelle commande en ligne', message: 'Commande PR-0018 de Marie Tapsoba attendue entre 15h00 et 17h00.', date: daysAgo(0, 11, 5), read: false, type: 'commande' },
  { id: 'n-002', title: 'Paiement Orange Money reçu', message: 'Fatima Kaboré a payé 5 000 FCFA pour la commande PR-0005.', date: daysAgo(0, 9, 42), read: false, type: 'paiement' },
  { id: 'n-003', title: 'Créance en retard', message: "Le solde de la commande PR-0004 (4 000 FCFA) dépasse 7 jours.", date: daysAgo(1, 16, 20), read: false, type: 'paiement' },
  { id: 'n-004', title: 'Livraison confirmée', message: 'Moussa Sawadogo a livré la commande PR-0003 à Amina Zongo.', date: daysAgo(1, 12, 10), read: true, type: 'livraison' },
  { id: 'n-005', title: 'Mise à jour PressNet', message: 'Nouvelle version disponible : tickets QR code et statistiques mensuelles.', date: daysAgo(2, 8, 0), read: true, type: 'systeme' }
];
