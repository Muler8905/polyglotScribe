import { useEffect, useState } from 'react';
import { Wifi, WifiOff, X } from 'lucide-react';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';

export function ConnectivityListener() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      toast.success("Internet connection restored!", {
        icon: <Wifi size={16} />,
        duration: 3000
      });
    };

    const handleOffline = () => {
      setIsOffline(true);
      toast.error("You are offline. Please check your internet connection.", {
        icon: <WifiOff size={16} />,
        duration: 10000,
        id: 'offline-toast'
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Also register with API client
    apiClient.setNetworkErrorHandler(() => {
      if (!isOffline) {
        toast.error("Network error. Please check your internet connection.", {
          icon: <WifiOff size={16} />,
          id: 'network-error-toast'
        });
      }
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isOffline]);

  return null;
}
