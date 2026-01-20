import React, { useState, useEffect } from 'react';
import { X, Calendar as CalendarIcon, Check, CheckCircle2 } from 'lucide-react';
import { MilkRecord } from '../types';

interface AddMilkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (record: Omit<MilkRecord, 'id'> | MilkRecord) => Promise<void> | void;
  existingRecord?: MilkRecord;
}

export const AddMilkModal: React.FC<AddMilkModalProps> = ({ isOpen, onClose, onSave, existingRecord }) => {
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [quantity, setQuantity] = useState<string>('');
  const [totalPrice, setTotalPrice] = useState<string>('');
  const [pricePerLiter, setPricePerLiter] = useState<number>(0);
  const [isSuccess, setIsSuccess] = useState(false);

  // Initialize form if editing
  useEffect(() => {
    if (isOpen) {
      if (existingRecord) {
        setDate(existingRecord.date);
        setQuantity(existingRecord.quantity.toString());
        setTotalPrice(existingRecord.totalPrice.toString());
      } else {
        // Reset for new entry
        setDate(new Date().toISOString().split('T')[0]);
        setQuantity('');
        setTotalPrice('');
        setPricePerLiter(0);
      }
      setIsSuccess(false);
    }
  }, [isOpen, existingRecord]);

  // Auto calculate Price Per Liter
  useEffect(() => {
    const q = parseFloat(quantity);
    const p = parseFloat(totalPrice);
    if (!isNaN(q) && !isNaN(p) && q > 0) {
      setPricePerLiter(parseFloat((p / q).toFixed(2)));
    } else {
      setPricePerLiter(0);
    }
  }, [quantity, totalPrice]);

  const playSuccessSound = () => {
    try {
      // Check Settings
      const settings = localStorage.getItem('dairyTrackSettings');
      if (settings) {
        const { soundsEnabled } = JSON.parse(settings);
        if (soundsEnabled === false) return;
      }

      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const t = ctx.currentTime;
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, t); // C5
      osc.frequency.exponentialRampToValueAtTime(1046.5, t + 0.1); // C6
      
      gain.gain.setValueAtTime(0.1, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
      
      osc.start(t);
      osc.stop(t + 0.5);
    } catch (e) {
      console.error("Sound play error", e);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quantity || !totalPrice || !date) return;

    const recordData: any = {
      date,
      quantity: parseFloat(quantity),
      totalPrice: parseFloat(totalPrice),
      pricePerLiter: pricePerLiter,
      timestamp: Date.now(),
      status: existingRecord?.status || 'UNPAID', // Default to UNPAID
    };

    if (existingRecord) {
      await onSave({ ...recordData, id: existingRecord.id });
    } else {
      await onSave(recordData);
    }

    playSuccessSound();
    setIsSuccess(true);

    setTimeout(() => {
      onClose();
    }, 1500); // Wait 1.5s before closing
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md transition-opacity duration-300 p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl animate-in fade-in zoom-in-95 duration-200 relative overflow-hidden">
        
        {isSuccess ? (
           <div className="flex flex-col items-center justify-center p-12 space-y-4 animate-in fade-in zoom-in duration-300">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-2">
                <CheckCircle2 size={40} className="text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800">Success!</h3>
              <p className="text-gray-500 font-medium">Record saved successfully.</p>
           </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-xl font-bold text-gray-800">
                {existingRecord ? 'Edit Milk Record' : 'Add Milk Record'}
              </h2>
              <button onClick={onClose} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
                <X size={20} className="text-gray-600" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              
              {/* Date Picker */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 ml-1">Date</label>
                <div className="relative group">
                  <input 
                    type="date" 
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full p-4 pl-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-medium text-gray-800"
                  />
                  <CalendarIcon className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none group-focus-within:text-blue-500 transition-colors" size={20} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-5">
                {/* Quantity */}
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 ml-1">Quantity (L)</label>
                  <input 
                    type="number" 
                    step="0.1"
                    placeholder="0.0"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-xl font-bold text-gray-800 placeholder-gray-300"
                    required
                  />
                </div>

                {/* Total Price */}
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 ml-1">Total Amount (₹)</label>
                  <input 
                    type="number" 
                    placeholder="0"
                    value={totalPrice}
                    onChange={(e) => setTotalPrice(e.target.value)}
                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-xl font-bold text-gray-800 placeholder-gray-300"
                    required
                  />
                </div>
              </div>

              {/* Auto Calculated Price Per Liter */}
              <div className="bg-blue-50 p-5 rounded-2xl flex items-center justify-between border border-blue-100/50">
                <div className="flex flex-col">
                    <span className="text-blue-600 font-semibold text-xs uppercase tracking-wider">Rate per Liter</span>
                    <span className="text-blue-400 text-[10px] mt-0.5">Calculated automatically</span>
                </div>
                <span className="text-blue-700 font-bold text-2xl">
                  ₹{pricePerLiter.toFixed(2)}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-4 pt-2">
                  <button 
                    type="button"
                    onClick={onClose}
                    className="w-full py-4 bg-gray-100 text-gray-700 rounded-xl font-bold text-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold text-lg shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-[0.98] transition-all flex items-center justify-center space-x-2"
                  >
                    <span>Save Record</span>
                    <Check size={20} strokeWidth={3} />
                  </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};