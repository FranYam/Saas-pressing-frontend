import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  fetchClientPortal,
  fetchPortalMe,
  portalLogin,
  portalLogout,
  portalRegister,
  type ClientPortalData
} from '@/services/api';

/**
 * Session « Espace client » — deux modes d'accès cohabitent :
 * - account : compte client (téléphone + mot de passe, jeton X-Portal-Token)
 *   → permet de consulter, voir le catalogue et demander des collectes ;
 * - ticket  : accès rapide par n° de ticket + téléphone (lecture seule).
 * La session est conservée en localStorage pour ne pas ressaisir à chaque visite.
 */

interface AccountAccess {
  mode: 'account';
  token: string;
}

interface TicketAccess {
  mode: 'ticket';
  ticket: string;
  phone: string;
}

type ClientAccess = AccountAccess | TicketAccess;

interface ClientAccessContextValue {
  access: ClientAccess | null;
  /** Données du portail (fiche + commandes) ; null tant que non chargées */
  data: ClientPortalData | null;
  loading: boolean;
  error: string;
  /** Vrai si le client peut demander une collecte (compte requis) */
  canRequestCollect: boolean;
  /** Connexion avec un compte (téléphone + mot de passe) */
  loginAccount: (phone: string, password: string) => Promise<void>;
  /** Inscription d'un compte client (pressing + nom + téléphone + mot de passe) */
  registerAccount: (payload: { pressing: string; name: string; phone: string; password: string }) => Promise<void>;
  /** Accès rapide par ticket + téléphone */
  loginTicket: (ticket: string, phone: string) => Promise<void>;
  /** Rafraîchit les données du portail */
  refresh: () => Promise<void>;
  /** Quitte l'espace client */
  clear: () => void;
}

const STORAGE_KEY = 'pressnet-client-access';
const ClientAccessContext = createContext<ClientAccessContextValue | null>(null);

function readStoredAccess(): ClientAccess | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ClientAccess | { ticket: string; phone: string };
    if ('mode' in parsed) return parsed;
    // Ancien format (ticket seul) — migration silencieuse
    return { mode: 'ticket', ticket: parsed.ticket, phone: parsed.phone };
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

function persist(access: ClientAccess | null): void {
  if (access) localStorage.setItem(STORAGE_KEY, JSON.stringify(access));
  else localStorage.removeItem(STORAGE_KEY);
}

export function ClientAccessProvider({ children }: { children: ReactNode }) {
  const [access, setAccess] = useState<ClientAccess | null>(readStoredAccess);
  const [data, setData] = useState<ClientPortalData | null>(null);
  const [loading, setLoading] = useState(!!readStoredAccess());
  const [error, setError] = useState('');

  const load = useCallback(async (a: ClientAccess) => {
    setLoading(true);
    setError('');
    try {
      const portal =
        a.mode === 'account' ? await fetchPortalMe(a.token) : await fetchClientPortal(a.ticket, a.phone);
      setData(portal);
    } catch (err) {
      const axiosErr = err as { response?: { status?: number; data?: { detail?: string } } };
      const status = axiosErr?.response?.status;
      setData(null);
      if (status === 401 || status === 403 || status === 404) {
        // Session périmée (jeton révoqué, ticket retiré) : on la ferme
        persist(null);
        setAccess(null);
      } else {
        setError(axiosErr?.response?.data?.detail ?? 'Impossible de charger vos commandes. Réessayez plus tard.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (access) void load(access);
  }, [access, load]);

  const applySession = useCallback((session: ClientPortalData & { token: string }) => {
    const next: AccountAccess = { mode: 'account', token: session.token };
    persist(next);
    setAccess(next);
    setData({ name: session.name, phone: session.phone, pressing: session.pressing, pressing_id: session.pressing_id, orders: session.orders });
  }, []);

  const loginAccount = useCallback(
    async (phone: string, password: string) => {
      const session = await portalLogin(phone, password);
      applySession(session);
    },
    [applySession]
  );

  const registerAccount = useCallback(
    async (payload: { pressing: string; name: string; phone: string; password: string }) => {
      const session = await portalRegister(payload);
      applySession(session);
    },
    [applySession]
  );

  const loginTicket = useCallback(
    async (ticket: string, phone: string) => {
      // Valide le couple (ticket, téléphone) AVANT d'ouvrir la session :
      // une erreur 404 remonte à la page d'accès pour être affichée.
      const portal = await fetchClientPortal(ticket.trim(), phone);
      const next: TicketAccess = { mode: 'ticket', ticket: ticket.trim(), phone };
      persist(next);
      setAccess(next);
      setData(portal);
    },
    []
  );

  const refresh = useCallback(async () => {
    if (access) await load(access);
  }, [access, load]);

  const clear = useCallback(async () => {
    // Révoque le jeton côté serveur avant de fermer la session locale
    if (access?.mode === 'account') {
      try {
        await portalLogout(access.token);
      } catch {
        // Le jeton local ne vaudra plus rien de toute façon
      }
    }
    persist(null);
    setAccess(null);
    setData(null);
    setError('');
  }, [access]);

  const value = useMemo(
    () => ({
      access,
      data,
      loading,
      error,
      canRequestCollect: access?.mode === 'account',
      loginAccount,
      registerAccount,
      loginTicket,
      refresh,
      clear
    }),
    [access, data, loading, error, loginAccount, registerAccount, loginTicket, refresh, clear]
  );

  return <ClientAccessContext.Provider value={value}>{children}</ClientAccessContext.Provider>;
}

export function useClientAccess(): ClientAccessContextValue {
  const ctx = useContext(ClientAccessContext);
  if (!ctx) throw new Error('useClientAccess doit être utilisé dans un ClientAccessProvider');
  return ctx;
}
