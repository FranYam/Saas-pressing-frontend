import { useEffect, useState, type ReactNode } from 'react';
import { Outlet } from 'react-router-dom';
import { WifiOff } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useAppStore } from '@/store/useAppStore';
import { useOnlineStatus } from '@/lib/pwa';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export function AppLayout({ children }: { children?: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const hydrate = useAppStore((s) => s.hydrate);
  const initialized = useAppStore((s) => s.initialized);
  const online = useOnlineStatus();

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  return (
    <div className="min-h-screen bg-sand">
      <Sidebar mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />
      <div className="flex min-h-screen flex-col md:pl-[76px] lg:pl-64">
        <Header onOpenMobileMenu={() => setMobileOpen(true)} />
        {!online && (
          <div className="flex items-center justify-center gap-2 bg-orange-500 px-4 py-2 text-center text-xs font-medium text-white" role="status">
            <WifiOff size={14} aria-hidden="true" />
            Vous êtes hors ligne — les données affichées peuvent être obsolètes.
          </div>
        )}
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
          {initialized ? (
            (children ?? <Outlet />)
          ) : (
            <div className="flex min-h-[50vh] items-center justify-center">
              <LoadingSpinner label="Chargement des données…" />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
