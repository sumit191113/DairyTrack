import React, { useState, useEffect } from 'react';
import { Menu, User, Wifi, WifiOff, CloudUpload } from 'lucide-react';
import { syncAllPendingData } from '../services/firebase';

interface HeaderProps {
  onMenuClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
        setIsOnline(true);
        setIsSyncing(true);
        // Trigger sync when back online
        syncAllPendingData().then(() => {
            setTimeout(() => setIsSyncing(false), 2000);
        });
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <header className="absolute top-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-md px-6 py-4 flex items-center justify-between border-b border-white/20 pt-safe transition-all duration-300">
      <div className="flex items-center space-x-3">
        <button 
            onClick={onMenuClick}
            className="p-2.5 text-gray-600 rounded-full hover:bg-black/5 transition-colors active:scale-95"
        >
            <Menu size={28} />
        </button>
        
        <div className="flex flex-col">
             <h1 className="text-xl font-bold text-gray-800 tracking-tight leading-none">DairyTrack</h1>
             <div className="flex items-center gap-1 mt-0.5">
                {isOnline ? (
                    isSyncing ? (
                         <span className="flex items-center text-[10px] font-bold text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded-md">
                            <CloudUpload size={10} className="mr-1 animate-bounce" /> Syncing...
                        </span>
                    ) : (
                        <span className="flex items-center text-[10px] font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded-md">
                            <Wifi size={10} className="mr-1" /> Online
                        </span>
                    )
                ) : (
                    <span className="flex items-center text-[10px] font-bold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded-md">
                        <WifiOff size={10} className="mr-1" /> Offline Mode
                    </span>
                )}
             </div>
        </div>
      </div>
      
      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-100 to-blue-50 flex items-center justify-center border border-white shadow-sm">
        <User size={20} className="text-blue-600" />
      </div>
    </header>
  );
};