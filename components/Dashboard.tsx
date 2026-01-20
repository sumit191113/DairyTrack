import React from 'react';
import { Milk, BarChart3, CalendarDays, Calculator, FileText, StickyNote, ChevronRight } from 'lucide-react';
import { AppView } from '../types';

interface DashboardProps {
  onAddMilk: () => void;
  onChangeView: (view: AppView) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onAddMilk, onChangeView }) => {
  const QuickAction = ({ icon: Icon, label, onClick }: { icon: any, label: string, onClick?: () => void }) => (
    <button 
      onClick={onClick}
      className="flex flex-col items-center justify-center space-y-3 bg-white p-4 rounded-3xl shadow-sm border border-gray-100 hover:bg-gray-50 transition-colors active:scale-95 h-full w-full"
    >
      <Icon className="text-blue-600" size={28} />
      <span className="text-xs font-bold text-gray-700 truncate w-full text-center">{label}</span>
    </button>
  );

  return (
    <div className="h-full overflow-y-auto no-scrollbar pb-32">
      <div className="p-6 pt-24 space-y-8 animate-in fade-in duration-500">
        
        {/* Welcome Card */}
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-500 to-blue-700 rounded-[2rem] p-8 text-white shadow-xl shadow-blue-200">
          <div className="relative z-10">
            <h2 className="text-3xl font-bold mb-2">Welcome Back!</h2>
            <p className="text-blue-100 text-base font-medium">Track your dairy production efficiently</p>
          </div>
          
          {/* Decorative background circle */}
          <div className="absolute -right-8 -bottom-12 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
          <div className="absolute right-4 top-4 w-12 h-12 bg-white/10 rounded-full blur-xl"></div>
        </div>

        {/* Quick Action Grid */}
        <div className="grid grid-cols-4 gap-3">
          <QuickAction 
            icon={StickyNote} 
            label="Notepad" 
            onClick={() => onChangeView(AppView.NOTEPAD)} 
          />
          <QuickAction 
            icon={CalendarDays} 
            label="Calendar" 
            onClick={() => onChangeView(AppView.CALENDAR)}
          />
          <QuickAction 
            icon={Calculator} 
            label="Calculator" 
            onClick={() => onChangeView(AppView.CALCULATOR)}
          />
          <QuickAction 
            icon={FileText} 
            label="Invoice" 
            onClick={() => onChangeView(AppView.MANAGE)}
          />
        </div>

        {/* Primary Action Card */}
        <button 
          onClick={onAddMilk}
          className="w-full group bg-blue-600 rounded-[2rem] p-6 flex items-center justify-between shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all active:scale-[0.99]"
        >
          <div className="flex items-center space-x-5">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm group-hover:bg-white/30 transition-colors">
              <Milk className="text-white" size={32} />
            </div>
            <div className="text-left">
              <h3 className="text-white font-bold text-2xl leading-tight">Add Milk</h3>
              <p className="text-blue-100 text-base">Record milk production</p>
            </div>
          </div>
          <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
            <ChevronRight className="text-white" size={24} />
          </div>
        </button>

        {/* Secondary Action Card */}
        <button 
          onClick={() => onChangeView(AppView.HISTORY)}
          className="w-full group bg-white rounded-[2rem] p-6 flex items-center justify-between shadow-sm border border-gray-100 hover:border-blue-200 transition-all active:scale-[0.99]"
        >
          <div className="flex items-center space-x-5">
            <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center group-hover:bg-orange-200 transition-colors">
              <BarChart3 className="text-orange-600" size={32} />
            </div>
            <div className="text-left">
              <h3 className="text-gray-800 font-bold text-2xl leading-tight">Milk Record</h3>
              <p className="text-gray-500 text-base">View production history</p>
            </div>
          </div>
          <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center">
            <ChevronRight className="text-gray-400" size={24} />
          </div>
        </button>
      </div>
    </div>
  );
};