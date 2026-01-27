import React, { useState } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight, Droplets, Banknote, Calendar as CalendarIcon, Edit2, Sun, Moon } from 'lucide-react';
import { MilkRecord } from '../types';

interface CalendarViewProps {
  onBack: () => void;
  records: MilkRecord[];
  onEditRecord: (record: MilkRecord) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ onBack, records, onEditRecord }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  
  const monthName = currentDate.toLocaleString('default', { month: 'long' });

  // Map records to dates for easy lookup
  const recordsByDate = records.reduce((acc, record) => {
    if (!acc[record.date]) acc[record.date] = [];
    acc[record.date].push(record);
    return acc;
  }, {} as { [key: string]: MilkRecord[] });

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const handleDateClick = (day: number) => {
    const formattedDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    if (recordsByDate[formattedDate]) {
      setSelectedDate(formattedDate);
    }
  };

  const selectedRecords = selectedDate ? recordsByDate[selectedDate] : [];
  selectedRecords.sort((a, b) => b.timestamp - a.timestamp);

  const selectedDayTotal = selectedRecords?.reduce((acc, r) => acc + r.quantity, 0) || 0;
  const selectedDayAmount = selectedRecords?.reduce((acc, r) => acc + r.totalPrice, 0) || 0;
  
  const selectedDayPrice = selectedDayTotal > 0 ? (selectedDayAmount / selectedDayTotal).toFixed(2) : "0.00";

  return (
    <div className="h-full bg-gray-50 flex flex-col animate-in slide-in-from-bottom-10 duration-300">
      
      {/* Header */}
      <div className="flex items-center space-x-4 p-6 bg-white shadow-sm z-10 sticky top-0 pt-safe">
        <button onClick={onBack} className="p-3 bg-gray-100 rounded-2xl hover:bg-gray-200 transition-colors shadow-sm active:scale-90">
            <ArrowLeft size={28} className="text-gray-700" />
        </button>
        <h2 className="text-2xl font-bold text-gray-800">Calendar</h2>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar pb-32">
        {/* Calendar Card */}
        <div className="bg-white rounded-b-[2.5rem] shadow-sm border-b border-gray-100 pb-8 mb-6">
            {/* Calendar Controls */}
            <div className="flex items-center justify-between px-6 py-6">
                <div className="flex flex-col">
                    <h3 className="text-3xl font-bold text-gray-800">{monthName}</h3>
                    <span className="text-gray-400 font-medium text-base">{year}</span>
                </div>
                <div className="flex space-x-3 bg-gray-50 p-1.5 rounded-2xl">
                    <button onClick={prevMonth} className="p-3 bg-white shadow-sm rounded-xl hover:bg-gray-50 text-gray-600 transition-colors"><ChevronLeft size={24} /></button>
                    <button onClick={nextMonth} className="p-3 bg-white shadow-sm rounded-xl hover:bg-gray-50 text-gray-600 transition-colors"><ChevronRight size={24} /></button>
                </div>
            </div>

            {/* Week Days */}
            <div className="grid grid-cols-7 gap-2 px-6 mb-3">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                    <div key={i} className="text-center text-sm font-bold text-gray-400 py-2 uppercase tracking-wide">{day}</div>
                ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-3 px-6">
                {Array.from({ length: firstDay }).map((_, i) => (
                    <div key={`empty-${i}`} />
                ))}
                
                {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const formattedDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    const hasRecord = !!recordsByDate[formattedDate];
                    const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();
                    const isSelected = selectedDate === formattedDate;

                    return (
                        <button 
                            key={day}
                            onClick={() => handleDateClick(day)}
                            disabled={!hasRecord}
                            className={`
                                aspect-square rounded-2xl flex flex-col items-center justify-center relative transition-all duration-200
                                ${isSelected ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 scale-105 z-10' : 
                                  isToday ? 'bg-blue-50 border-2 border-blue-200 text-blue-600' : 'bg-white border border-gray-100 text-gray-700'}
                                ${hasRecord && !isSelected ? 'hover:bg-blue-50 cursor-pointer hover:shadow-md hover:border-blue-200' : ''}
                                ${!hasRecord ? 'cursor-default opacity-40' : ''}
                            `}
                        >
                            <span className="text-lg font-bold">{day}</span>
                            {hasRecord && !isSelected && (
                                <div className="w-2 h-2 rounded-full bg-blue-500 mt-1 shadow-sm"></div>
                            )}
                            {hasRecord && isSelected && (
                                <div className="w-2 h-2 rounded-full bg-white mt-1 opacity-80"></div>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>

        {/* Selected Date Records */}
        {selectedDate ? (
             <div className="px-6 animate-in slide-in-from-bottom-5 duration-500">
                <div className="flex items-center justify-between mb-5 px-1">
                     <h3 className="text-xl font-bold text-gray-800">
                        {new Date(selectedDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })}
                     </h3>
                     <span className="text-sm font-bold text-blue-600 bg-blue-100 px-3 py-1.5 rounded-full">
                        {selectedRecords.length} Entries
                     </span>
                </div>

                {/* Daily Stats */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center justify-center">
                        <div className="bg-blue-50 p-2.5 rounded-full mb-2">
                             <Droplets size={20} className="text-blue-500" />
                        </div>
                        <span className="text-xl font-bold text-gray-800 leading-none">{selectedDayTotal.toFixed(2)}L</span>
                        <span className="text-xs text-gray-400 font-bold uppercase mt-1 text-center">Milk</span>
                    </div>
                    <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center justify-center">
                        <div className="bg-green-50 p-2.5 rounded-full mb-2">
                             <Banknote size={20} className="text-green-500" />
                        </div>
                        <span className="text-xl font-bold text-gray-800 leading-none">₹{selectedDayAmount.toFixed(0)}</span>
                        <span className="text-xs text-gray-400 font-bold uppercase mt-1 text-center">Amount</span>
                    </div>
                     <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center justify-center">
                         <div className="bg-orange-50 p-2.5 rounded-full mb-2">
                             <span className="text-sm font-bold text-orange-500">Rate</span>
                        </div>
                        <span className="text-xl font-bold text-gray-800 leading-none">₹{selectedDayPrice}</span>
                        <span className="text-xs text-gray-400 font-bold uppercase mt-1 text-center">Avg/L</span>
                    </div>
                </div>

                {/* Records List */}
                <div className="space-y-4">
                    {selectedRecords.map(record => (
                        <div key={record.id} className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex justify-between items-center hover:border-blue-200 transition-colors relative overflow-hidden">
                            <div className="flex flex-col">
                                <div className="flex items-center space-x-3 mb-1">
                                    <div className="flex items-center gap-1.5 px-2 py-1 bg-gray-50 rounded-lg">
                                        {record.shift === 'DAY' ? <Sun size={14} className="text-orange-500" /> : <Moon size={14} className="text-indigo-500" />}
                                        <span className="text-[10px] font-bold text-gray-500 uppercase">{record.shift || 'Day'}</span>
                                    </div>
                                    <span className="font-bold text-gray-800 text-xl">{record.quantity} L</span>
                                </div>
                                <span className="text-sm font-semibold text-blue-600">
                                    Total: ₹{record.totalPrice} (@ ₹{record.pricePerLiter})
                                </span>
                            </div>
                            <button 
                                onClick={() => onEditRecord(record)}
                                className="p-4 bg-gray-50 text-gray-400 rounded-2xl hover:bg-blue-600 hover:text-white transition-all shadow-sm active:scale-95"
                            >
                                <Edit2 size={24} />
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        ) : (
            <div className="flex flex-col items-center justify-center py-16 text-gray-300">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <CalendarIcon size={40} />
                </div>
                <p className="text-lg font-medium">Select a date to view records</p>
            </div>
        )}
      </div>
    </div>
  );
};