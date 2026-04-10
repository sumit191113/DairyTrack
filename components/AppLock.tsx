
import React, { useState, useEffect } from 'react';
import { Lock, Delete, ArrowRight, ShieldCheck, ShieldAlert } from 'lucide-react';

interface AppLockProps {
  savedPin: string;
  onUnlock: () => void;
}

export const AppLock: React.FC<AppLockProps> = ({ savedPin, onUnlock }) => {
  const [input, setInput] = useState('');
  const [error, setError] = useState(false);

  const handleNumber = (num: string) => {
    if (input.length < 4) {
      const newVal = input + num;
      setInput(newVal);
      if (newVal.length === 4) {
        if (newVal === savedPin) {
          onUnlock();
        } else {
          setError(true);
          setTimeout(() => {
            setError(false);
            setInput('');
          }, 600);
        }
      }
    }
  };

  const handleBackspace = () => {
    setInput(input.slice(0, -1));
  };

  const NumberButton = ({ val }: { val: string }) => (
    <button 
      onClick={() => handleNumber(val)}
      className="w-20 h-20 rounded-full bg-white/10 hover:bg-white/20 active:bg-white/30 transition-all border border-white/10 flex items-center justify-center text-3xl font-black text-white shadow-xl backdrop-blur-md active:scale-90"
    >
      {val}
    </button>
  );

  return (
    <div className="fixed inset-0 z-[9999] bg-[#0A58EE] flex flex-col items-center justify-center p-8 text-white overflow-hidden animate-in fade-in duration-500">
      {/* Background Decor */}
      <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-white/5 rounded-full blur-[100px]"></div>
      <div className="absolute bottom-[5%] left-[-15%] w-80 h-80 bg-blue-400/20 rounded-full blur-[100px]"></div>

      <div className="flex flex-col items-center space-y-12 w-full max-w-xs relative z-10">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className={`w-20 h-20 rounded-[2.5rem] flex items-center justify-center shadow-2xl border transition-all duration-300 ${error ? 'bg-red-500 border-red-400 animate-shake' : 'bg-white/10 border-white/20'}`}>
            {error ? <ShieldAlert size={40} /> : <Lock size={40} />}
          </div>
          <div>
            <h2 className="text-2xl font-black tracking-tight">App Locked</h2>
            <p className="text-blue-100/60 text-xs font-bold uppercase tracking-[0.2em] mt-1">
              Enter your secret PIN
            </p>
          </div>
        </div>

        {/* PIN Indicators */}
        <div className={`flex space-x-6 py-4 ${error ? 'animate-bounce' : ''}`}>
          {[0, 1, 2, 3].map((i) => (
            <div 
              key={i} 
              className={`w-4 h-4 rounded-full transition-all duration-300 shadow-lg ${
                input.length > i 
                  ? 'bg-white scale-125 shadow-white/40' 
                  : 'bg-white/20 scale-100'
              }`}
            />
          ))}
        </div>

        {/* Custom Keypad */}
        <div className="grid grid-cols-3 gap-6">
          <NumberButton val="1" />
          <NumberButton val="2" />
          <NumberButton val="3" />
          <NumberButton val="4" />
          <NumberButton val="5" />
          <NumberButton val="6" />
          <NumberButton val="7" />
          <NumberButton val="8" />
          <NumberButton val="9" />
          <div className="w-20 h-20" /> {/* Empty space */}
          <NumberButton val="0" />
          <button 
            onClick={handleBackspace}
            className="w-20 h-20 rounded-full flex items-center justify-center text-white/50 hover:text-white transition-colors active:scale-90"
          >
            <Delete size={32} />
          </button>
        </div>
      </div>

      <p className="absolute bottom-12 text-blue-100/20 text-[10px] font-black uppercase tracking-[0.4em]">
        DairyTrack Pro Secure
      </p>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-8px); }
          75% { transform: translateX(8px); }
        }
        .animate-shake {
          animation: shake 0.2s ease-in-out 0s 3;
        }
      `}</style>
    </div>
  );
};
