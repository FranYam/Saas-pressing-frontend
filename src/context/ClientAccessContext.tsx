import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { fetchClientPortal, type ClientPortalData } from '@/services/api';

/**
 * Session légère « Espace client » : le client accède à son portail avec son
 * n° de ticket + son téléphone — sans compte ni mot de passe.
 * La session est conservée en localStorage pour ne pas ressaisir à chaque visite.
 */

interface ClientAccess {
  ticket: string;
  phone: string;
}

interface ClientAccessContextValue {
  access: ClientAccess | null;
  /** Données du portail (fiche + commandes) ; null tant que non chargées */
  data: ClientPortalData | null;
  loading: boolean;
  error: string;
  /** Valide le couple ticket + téléphone puis ouvre la session */
  login: (ticket: string, phone: string) => Promise<void>;
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
    return raw ? (JSON.parse(raw) as ClientAccess) : null;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
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
      const portal = await fetchClientPortal(a.ticket, a.phone);
      setData(portal);
    } catch (err) {
      const axiosErr = err as { response?: { status?: number; data?: { detail?: string } } };
      const status = axiosErr?.response?.status;
      setData(null);
      if (status === 404 || status === 403) {
        // Ticket/téléphone invalides : on ferme la session périmée
        localStorage.removeItem(STORAGE_KEY);
        setAccess(null);
      } else {
        setError(
          axiosErr?.response?.data?.detail ??
            "L'espace client nécessite une mise à jour du serveur. Réessayez plus tard."
        );
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (access) void load(access);
  }, [access, load]);

  const login = useCallback(async (ticket: string, phone: string) => {
    const a = { ticket: ticket.trim(), phone };
    setLoading(true);
    setError('');
    try {
      const portal = await fetchClientPortal(a.ticket, a.phone);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(a));
      setAccess(a);
      setData(portal);
    } catch (err) {
      const axiosErr = err as { response?: { status?: number; data?: { detail?: string } } };
      const status = axiosErr?.response?.status;
      if (status === 404 || status === 403) {
        throw new Error('Ticket introuvable. Vérifiez le numéro de ticket et le téléphone saisis.');
      }
      throw new Error(
        axiosErr?.response?.data?.detail ??
          "Impossible de joindre le serveur. Vérifiez votre connexion et réessayez."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    if (access) await load(access);
  }, [access, load]);

  const clear = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setAccess(null);
    setData(null);
    setError('');
  }, []);

  const value = useMemo(
    () => ({ access, data, loading, error, login, refresh, clear }),
    [access, data, loading, error, login, refresh, clear]
  );

  return <ClientAccessContext.Provider value={value}>{children}</ClientAccessContext.Provider>;
}

export function useClientAccess(): ClientAccessContextValue {
  const ctx = useContext(ClientAccessContext);
  if (!ctx) throw new Error('useClientAccess doit être utilisé dans un ClientAccessProvider');
  return ctx;
}
