
import React, { useState, useEffect, useRef } from 'react';
import { Maximize2, X, Plus, Minus, Equal, X as CloseIcon } from 'lucide-react';

interface FloatingCalculatorProps {
  initialValue: string;
  onClose: () => void;
  onExpand: () => void;
  onValueChange: (val: string) => void;
}

export const FloatingCalculator: React.FC<FloatingCalculatorProps> = ({ 
  initialValue, 
  onClose, 
  onExpand,
  onValueChange
}) => {
  const [display, setDisplay] = useState(initialValue);
  const [position, setPosition] = useState({ x: 20, y: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    onValueChange(display);
  }, [display, onValueChange]);

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    dragStart.current = {
      x: clientX - position.x,
      y: clientY - position.y
    };
    setIsDragging(true);
  };

  useEffect(() => {
    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging) return;
      
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      
      let newX = clientX - dragStart.current.x;
      let newY = clientY - dragStart.current.y;

      // Boundaries
      const maxX = window.innerWidth - 180;
      const maxY = window.innerHeight - 260;
      newX = Math.max(0, Math.min(newX, maxX));
      newY = Math.max(0, Math.min(newY, maxY));

      setPosition({ x: newX, y: newY });
    };

    const handleEnd = () => setIsDragging(false);

    if (isDragging) {
      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleEnd);
      window.addEventListener('touchmove', handleMove);
      window.addEventListener('touchend', handleEnd);
    }

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging]);

  const handleKey = (key: string) => {
    if (display === '0') setDisplay(key);
    else setDisplay(display + key);
  };

  const handleClear = () => setDisplay('0');

  const handleCalculate = () => {
    try {
        // Simple evaluator for floating mode
        const result = eval(display.replace(/×/g, '*').replace(/÷/g, '/'));
        setDisplay(String(Number(result.toFixed(2))));
    } catch {
        setDisplay('Err');
    }
  };

  return (
    <div 
      ref={containerRef}
      style={{ 
        transform: `translate(${position.x}px, ${position.y}px)`,
        zIndex: 9999
      }}
      className="fixed top-0 left-0 w-[170px] bg-white/80 backdrop-blur-xl rounded-[2rem] shadow-2xl border border-white/50 overflow-hidden select-none animate-in fade-in zoom-in duration-300 touch-none"
    >
      {/* Header (Drag Area) */}
      <div 
        onMouseDown={handleMouseDown}
        onTouchStart={handleMouseDown}
        className="h-10 bg-blue-600/10 flex items-center justify-between px-3 cursor-move active:bg-blue-600/20 transition-colors"
      >
        <div className="flex gap-1.5">
            <button onClick={onClose} className="w-5 h-5 bg-red-100 text-red-600 rounded-full flex items-center justify-center hover:bg-red-200 transition-colors">
                <X size={12} strokeWidth={3} />
            </button>
            <button onClick={onExpand} className="w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center hover:bg-blue-200 transition-colors">
                <Maximize2 size={12} strokeWidth={3} />
            </button>
        </div>
        <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest opacity-40">Calc</span>
      </div>

      {/* Display */}
      <div className="p-4 pt-2 text-right">
        <div className="text-2xl font-black text-gray-900 truncate">
            {display}
        </div>
      </div>

      {/* Simplified Keypad */}
      <div className="p-3 grid grid-cols-4 gap-2">
        {['7','8','9','/','4','5','6','*','1','2','3','-','0','.','C','+'].map(k => (
            <button 
                key={k} 
                onClick={() => k === 'C' ? handleClear() : handleKey(k)}
                className={`h-8 rounded-lg text-xs font-bold transition-all active:scale-90 ${k === 'C' ? 'bg-rose-50 text-rose-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
                {k}
            </button>
        ))}
        <button 
            onClick={handleCalculate}
            className="col-span-4 h-10 bg-blue-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-200 active:scale-95"
        >
            <Equal size={16} strokeWidth={3} />
        </button>
      </div>
    </div>
  );
};
