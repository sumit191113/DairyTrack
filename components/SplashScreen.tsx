
import React, { useEffect, useState } from 'react';
import { Milk, Loader2 } from 'lucide-react';

export const SplashScreen: React.FC = () => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) return 100;
        return prev + (100 / (2500 / 50)); // Sync with 2.5s duration
      });
    }, 50);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-[1000] bg-gradient-to-b from-white via-white to-green-50 flex flex-col items-center justify-between py-20 px-10 animate-in fade-in duration-500">
      <div /> {/* Spacer for centering */}

      <div className="flex flex-col items-center space-y-6 text-center">
        {/* Animated Logo Container */}
        <div className="relative">
          <div className="absolute inset-0 bg-green-500/10 rounded-[2.5rem] blur-2xl animate-pulse"></div>
          <div className="w-24 h-24 bg-[#0D9B29] rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-green-900/20 relative animate-in zoom-in-50 slide-in-from-bottom-8 duration-700">
            <Milk size={52} className="text-white fill-white/10" />
          </div>
        </div>

        <div className="space-y-2 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-200">
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">Add Milk App</h1>
          <p className="text-[#0D9B29] text-sm font-semibold uppercase tracking-[0.15em] opacity-80 max-w-[200px] leading-relaxed">
            Smart way to manage your daily milk records
          </p>
        </div>
      </div>

      <div className="w-full max-w-xs space-y-4 animate-in fade-in duration-700 delay-500">
        <div className="space-y-2">
          <div className="flex justify-between items-end text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">
            <span>Loading...</span>
            <span className="text-[#0D9B29]">{Math.min(100, Math.round(progress))}%</span>
          </div>
          <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden shadow-inner">
            <div 
              className="h-full bg-[#0D9B29] rounded-full transition-all duration-300 ease-out shadow-[0_0_8px_rgba(13,155,41,0.4)]"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest text-center">
          Setting things up for you...
        </p>
      </div>

      {/* Trust Footer */}
      <div className="absolute bottom-10 flex flex-col items-center space-y-2 opacity-30">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-gray-400" />
            <p className="text-[9px] font-black uppercase tracking-[0.4em] text-gray-800">Professional Edition</p>
            <div className="w-1.5 h-1.5 rounded-full bg-gray-400" />
          </div>
      </div>
    </div>
  );
};
