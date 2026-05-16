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

  if (!isOffline) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[9999] animate-in slide-in-from-bottom-4 duration-300">
      <div className="bg-rose-500 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-rose-400/50 backdrop-blur-md">
        <div className="bg-white/20 p-2 rounded-full animate-pulse">
          <WifiOff size={18} />
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-sm leading-none">Connection Lost</span>
          <span className="text-[11px] opacity-90 mt-1">Please check your internet settings</span>
        </div>
        <button 
          onClick={() => setIsOffline(false)}
          className="ml-2 hover:bg-white/10 p-1 rounded-lg transition-colors"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
