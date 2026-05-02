import { ReactNode, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Header from './Header';
import ParallaxBackground from './ParallaxBackground';
import OfflineSyncStatus from './OfflineSyncStatus';
import { offlineSync } from '@/lib/offlineBiometricSync';

const Layout = ({ children }: { children: ReactNode }) => {
  const location = useLocation();

  useEffect(() => {
    offlineSync.init().then(() => offlineSync.startAutoSync());
    return () => offlineSync.stopAutoSync();
  }, []);

  return (
    <>
      <ParallaxBackground />
      <Header />

      <main className="main-content">
        <div
          className="erp-container"
          key={location.pathname}
          style={{ animation: 'fadeIn 0.18s ease-in-out' }}
        >
          {children}
        </div>
      </main>

      <OfflineSyncStatus />
    </>
  );
};

export default Layout;