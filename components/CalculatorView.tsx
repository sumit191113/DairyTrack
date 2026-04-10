
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Delete, Equal, Minus, Plus, X, Divide, Percent, Minimize2 } from 'lucide-react';

interface CalculatorViewProps {
  onBack: () => void;
  onMinimize?: () => void;
  initialValue?: string;
  onValueChange?: (val: string) => void;
}

export const CalculatorView: React.FC<CalculatorViewProps> = ({ onBack, onMinimize, initialValue = '0', onValueChange }) => {
  const [display, setDisplay] = useState(initialValue);
  const [equation, setEquation] = useState('');
  const [shouldResetDisplay, setShouldResetDisplay] = useState(false);

  useEffect(() => {
    if (onValueChange) onValueChange(display);
  }, [display, onValueChange]);

  const handleNumber = (num: string) => {
    if (display === '0' || shouldResetDisplay) {
      setDisplay(num);
      setShouldResetDisplay(false);
    } else {
      if (display.length < 12) {
        setDisplay(display + num);
      }
    }
  };

  const handleOperator = (op: string) => {
    setShouldResetDisplay(true);
    setEquation(display + ' ' + op + ' ');
  };

  const handleEqual = () => {
    try {
      const fullEquation = equation + display;
      const jsEquation = fullEquation.replace(/×/g, '*').replace(/÷/g, '/');
      const result = eval(jsEquation);
      let finalResult = String(Number(result.toFixed(4)));
      if (finalResult.length > 12) finalResult = Number(result).toExponential(4);
      setDisplay(finalResult);
      setEquation('');
      setShouldResetDisplay(true);
    } catch (e) {
      setDisplay('Error');
      setShouldResetDisplay(true);
    }
  };

  const handleClear = () => {
    setDisplay('0');
    setEquation('');
    setShouldResetDisplay(false);
  };

  const handleBackspace = () => {
    if (display.length === 1 || display === 'Error') {
      setDisplay('0');
    } else {
      setDisplay(display.slice(0, -1));
    }
  };

  const handlePercent = () => {
    const val = parseFloat(display);
    setDisplay((val / 100).toString());
  };

  const handleDot = () => {
    if (!display.includes('.')) {
      setDisplay(display + '.');
      setShouldResetDisplay(false);
    }
  };

  const Button = ({ 
    label, 
    type = 'default', 
    onClick,
    colSpan = 1
  }: { 
    label: React.ReactNode, 
    type?: 'default' | 'operator' | 'action' | 'primary', 
    onClick: () => void,
    colSpan?: number
  }) => {
    const baseStyles = "relative flex items-center justify-center h-16 sm:h-20 rounded-[1.8rem] text-2xl font-black transition-all active:scale-95 active:brightness-95 shadow-sm overflow-hidden";
    const variants = {
      default: "bg-white text-gray-800 border border-gray-100 hover:bg-gray-50 shadow-gray-200/50",
      operator: "bg-blue-50 text-blue-600 border border-blue-100 hover:bg-blue-100 shadow-blue-100/30",
      action: "bg-gray-100 text-gray-500 border border-gray-200 hover:bg-gray-200",
      primary: "bg-[#0A58EE] text-white shadow-lg shadow-blue-500/30 hover:bg-blue-700"
    };
    return (
      <button onClick={onClick} className={`${baseStyles} ${variants[type]} ${colSpan === 2 ? 'col-span-2' : ''}`}>
        <span className="relative z-10">{label}</span>
      </button>
    );
  };

  return (
    <div className="flex flex-col bg-[#F8FAFC] animate-in slide-in-from-bottom-10 duration-500 h-[calc(100%-90px)] rounded-b-[3rem] shadow-2xl overflow-hidden border-b border-gray-200 relative z-0">
      <div className="flex items-center justify-between p-6 bg-white/80 backdrop-blur-md z-10 sticky top-0 pt-safe border-b border-gray-100/50">
        <div className="flex items-center space-x-4">
            <button onClick={onBack} className="p-3 bg-gray-100 rounded-2xl hover:bg-gray-200 shadow-sm transition-all active:scale-90">
                <ArrowLeft size={24} className="text-gray-700" />
            </button>
            <h2 className="text-xl font-black text-gray-800 tracking-tight">Calculator</h2>
        </div>
        <div className="flex items-center gap-2">
            <button 
                onClick={onMinimize}
                className="p-3 bg-blue-50 text-blue-600 rounded-2xl hover:bg-blue-100 shadow-sm transition-all active:scale-90"
                title="Minimize"
            >
                <Minimize2 size={20} />
            </button>
            <div className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                Tools
            </div>
        </div>
      </div>

      <div className="flex-1 bg-white px-8 py-10 flex flex-col items-end justify-end relative">
        <div className="absolute top-6 left-8 right-8">
            <div className="h-px bg-gradient-to-r from-transparent via-gray-100 to-transparent w-full mb-4"></div>
        </div>
        <div className="text-gray-400 text-lg font-bold h-8 mb-2 tracking-tight overflow-hidden text-right w-full font-mono opacity-60">
            {equation || ' '}
        </div>
        <div className="text-6xl sm:text-7xl font-black text-gray-900 break-all leading-none animate-in fade-in duration-300">
            {display}
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-gray-50/50 to-transparent pointer-events-none"></div>
      </div>

      <div className="p-6 grid grid-cols-4 gap-4 bg-[#F8FAFC]">
        <Button label="AC" type="action" onClick={handleClear} />
        <Button label={<Delete size={22} />} type="action" onClick={handleBackspace} />
        <Button label={<Percent size={22} />} type="operator" onClick={handlePercent} />
        <Button label={<Divide size={24} />} type="operator" onClick={() => handleOperator('÷')} />
        <Button label="7" onClick={() => handleNumber('7')} />
        <Button label="8" onClick={() => handleNumber('8')} />
        <Button label="9" onClick={() => handleNumber('9')} />
        <Button label={<X size={22} />} type="operator" onClick={() => handleOperator('×')} />
        <Button label="4" onClick={() => handleNumber('4')} />
        <Button label="5" onClick={() => handleNumber('5')} />
        <Button label="6" onClick={() => handleNumber('6')} />
        <Button label={<Minus size={24} />} type="operator" onClick={() => handleOperator('-')} />
        <Button label="1" onClick={() => handleNumber('1')} />
        <Button label="2" onClick={() => handleNumber('2')} />
        <Button label="3" onClick={() => handleNumber('3')} />
        <Button label={<Plus size={24} />} type="operator" onClick={() => handleOperator('+')} />
        <Button label="0" onClick={() => handleNumber('0')} />
        <Button label="." onClick={handleDot} />
        <Button label={<Equal size={28} strokeWidth={3} />} type="primary" colSpan={2} onClick={handleEqual} />
      </div>
      <div className="h-4 bg-[#F8FAFC]"></div>
    </div>
  );
};
