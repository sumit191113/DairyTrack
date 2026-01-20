import React, { useState } from 'react';
import { ArrowLeft, Delete } from 'lucide-react';

interface CalculatorViewProps {
  onBack: () => void;
}

export const CalculatorView: React.FC<CalculatorViewProps> = ({ onBack }) => {
  const [display, setDisplay] = useState('0');
  const [equation, setEquation] = useState('');
  const [shouldResetDisplay, setShouldResetDisplay] = useState(false);

  const handleNumber = (num: string) => {
    if (display === '0' || shouldResetDisplay) {
      setDisplay(num);
      setShouldResetDisplay(false);
    } else {
      setDisplay(display + num);
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
      setDisplay(String(Number(result.toFixed(4))));
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

  const Button = ({ label, type = 'default', onClick }: { label: React.ReactNode, type?: 'default' | 'operator' | 'action', onClick: () => void }) => {
    let bgClass = 'bg-white text-gray-800 hover:bg-gray-50';
    if (type === 'operator') bgClass = 'bg-blue-100 text-blue-700 hover:bg-blue-200';
    if (type === 'action') bgClass = 'bg-orange-100 text-orange-600 hover:bg-orange-200';

    return (
      <button 
        onClick={onClick}
        className={`${bgClass} rounded-2xl text-3xl font-semibold shadow-sm border border-gray-100 flex items-center justify-center h-20 active:scale-95 transition-transform`}
      >
        {label}
      </button>
    );
  };

  return (
    <div className="h-full flex flex-col bg-gray-50 animate-in slide-in-from-bottom-10 duration-300">
      
      {/* Header */}
      <div className="flex items-center space-x-4 p-6 bg-white shadow-sm z-10 sticky top-0 pt-safe">
        <button onClick={onBack} className="p-3 bg-gray-100 rounded-2xl hover:bg-gray-200 shadow-sm transition-colors active:scale-90">
          <ArrowLeft size={28} className="text-gray-700" />
        </button>
        <h2 className="text-2xl font-bold text-gray-800">Calculator</h2>
      </div>

      {/* Display */}
      <div className="flex-1 bg-white p-8 flex flex-col items-end justify-end border-b border-gray-100">
        <div className="text-gray-400 text-xl h-8 mb-2">{equation}</div>
        <div className="text-6xl font-bold text-gray-800 break-all">{display}</div>
      </div>

      {/* Keypad */}
      <div className="p-6 grid grid-cols-4 gap-4 bg-gray-50 pb-32">
        <Button label="AC" type="action" onClick={handleClear} />
        <Button label={<Delete size={28} />} type="action" onClick={handleBackspace} />
        <Button label="%" type="action" onClick={handlePercent} />
        <Button label="÷" type="operator" onClick={() => handleOperator('/')} />

        <Button label="7" onClick={() => handleNumber('7')} />
        <Button label="8" onClick={() => handleNumber('8')} />
        <Button label="9" onClick={() => handleNumber('9')} />
        <Button label="×" type="operator" onClick={() => handleOperator('*')} />

        <Button label="4" onClick={() => handleNumber('4')} />
        <Button label="5" onClick={() => handleNumber('5')} />
        <Button label="6" onClick={() => handleNumber('6')} />
        <Button label="-" type="operator" onClick={() => handleOperator('-')} />

        <Button label="1" onClick={() => handleNumber('1')} />
        <Button label="2" onClick={() => handleNumber('2')} />
        <Button label="3" onClick={() => handleNumber('3')} />
        <Button label="+" type="operator" onClick={() => handleOperator('+')} />

        <Button label="0" onClick={() => handleNumber('0')} />
        <Button label="." onClick={handleDot} />
        <div className="col-span-2">
            <button 
                onClick={handleEqual}
                className="w-full h-20 bg-blue-600 text-white rounded-2xl text-4xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-transform"
            >
                =
            </button>
        </div>
      </div>
    </div>
  );
};