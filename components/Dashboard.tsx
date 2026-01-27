import React, { useMemo } from 'react';
import { Milk, BarChart3, CalendarDays, Calculator, FileText, StickyNote, ChevronRight, Calendar, Droplets, Banknote, ClipboardCheck } from 'lucide-react';
import { AppView, MilkRecord } from '../types';

interface DashboardProps {
  onAddMilk: () => void;
  onChangeView: (view: AppView) => void;
  records?: MilkRecord[];
}

export const Dashboard: React.FC<DashboardProps> = ({ onAddMilk, onChangeView, records = [] }) => {
  
  const stats = useMemo(() => {
    const safeRecords = Array.isArray(records) ? records : [];
    return safeRecords.reduce((acc, curr) => ({
      quantity: acc.quantity + (curr.quantity || 0),
      amount: acc.amount + (curr.totalPrice || 0),
      count: acc.count + 1
    }), { quantity: 0, amount: 0, count: 0 });
  }, [records]);

  const QuickAction = ({ 
    icon: Icon, 
    label, 
    onClick,
    variant = "blue"
  }: { 
    icon: any, 
    label: string, 
    onClick?: () => void,
    variant?: "blue" | "orange" | "green" | "purple"
  }) => {
    const variants = {
      blue: { bg: "bg-blue-50", text: "text-blue-600" },
      orange: { bg: "bg-orange-50", text: "text-orange-600" },
      green: { bg: "bg-emerald-50", text: "text-emerald-600" },
      purple: { bg: "bg-purple-50", text: "text-purple-600" }
    };

    const style = variants[variant];

    return (
      <button 
        onClick={onClick}
        className="flex flex-col items-center justify-center p-3 bg-white rounded-[2rem] shadow-sm border border-blue-200 hover:border-blue-400 hover:bg-blue-50/30 transition-all active:scale-90 h-full w-full group"
      >
        <div className={`w-12 h-12 ${style.bg} rounded-2xl flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform duration-300`}>
          <Icon className={style.text} size={22} />
        </div>
        <span className="text-[10px] font-black text-gray-500 tracking-wider uppercase text-center w-full leading-tight">
          {label}
        </span>
      </button>
    );
  };

  return (
    <div className="h-full overflow-y-auto no-scrollbar pb-32">
      <div className="p-6 pt-24 space-y-8 animate-in fade-in duration-500">
        
        {/* Ultra-Compact Professional Welcome Card */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[#0A58EE] via-[#1E40AF] to-[#1E3A8A] rounded-[2.5rem] p-7 text-white shadow-2xl shadow-blue-900/20">
          {/* Abstract Mesh BG */}
          <div className="absolute top-[-20%] left-[-10%] w-64 h-64 bg-blue-400 rounded-full blur-[100px] opacity-20"></div>
          
          <div className="relative z-10 flex items-center justify-between">
            
            {/* Left Column: Essential Branding */}
            <div className="flex-1 min-w-0 pr-4">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full border border-white/10 mb-3">
                  <Calendar size={10} className="text-blue-200" />
                  <span className="text-[8px] font-black uppercase tracking-widest text-blue-50">
                    {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                  </span>
                </div>
                <h2 className="text-4xl font-black tracking-tight leading-none mb-1">Welcome!</h2>
                <p className="text-blue-100/40 text-[9px] font-black uppercase tracking-[0.15em]">Track your dairy production</p>
            </div>

            {/* Right Column: Ultra-Compact Single-Line Stats Stack */}
            <div className="flex flex-col gap-2.5 shrink-0 pl-5 border-l border-white/10">
                {/* Milk Row */}
                <div className="flex items-center gap-2">
                    <Droplets size={12} className="text-blue-300 shrink-0" />
                    <div className="flex items-center whitespace-nowrap">
                        <span className="text-[9px] font-black text-blue-200/70 uppercase tracking-widest mr-1">Milk -</span>
                        <span className="text-[12px] font-black leading-none">{stats.quantity.toFixed(1)}<span className="text-[8px] ml-0.5 opacity-60">L</span></span>
                    </div>
                </div>

                {/* Earnings Row */}
                <div className="flex items-center gap-2">
                    <Banknote size={12} className="text-emerald-300 shrink-0" />
                    <div className="flex items-center whitespace-nowrap">
                        <span className="text-[9px] font-black text-blue-200/70 uppercase tracking-widest mr-1">Earn -</span>
                        <span className="text-[12px] font-black leading-none">₹{stats.amount.toLocaleString()}</span>
                    </div>
                </div>

                {/* Logs Row */}
                <div className="flex items-center gap-2">
                    <ClipboardCheck size={12} className="text-purple-300 shrink-0" />
                    <div className="flex items-center whitespace-nowrap">
                        <span className="text-[9px] font-black text-blue-200/70 uppercase tracking-widest mr-1">Logs -</span>
                        <span className="text-[12px] font-black leading-none">{stats.count}</span>
                    </div>
                </div>
            </div>

          </div>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-4 gap-3">
          <QuickAction 
            icon={StickyNote} 
            label="Notepad" 
            variant="blue"
            onClick={() => onChangeView(AppView.NOTEPAD)} 
          />
          <QuickAction 
            icon={CalendarDays} 
            label="Calendar" 
            variant="purple"
            onClick={() => onChangeView(AppView.CALENDAR)}
          />
          <QuickAction 
            icon={Calculator} 
            label="Calc" 
            variant="orange"
            onClick={() => onChangeView(AppView.CALCULATOR)}
          />
          <QuickAction 
            icon={FileText} 
            label="Invoice" 
            variant="green"
            onClick={() => onChangeView(AppView.MANAGE)}
          />
        </div>

        {/* Main Interaction Cards */}
        <div className="space-y-4">
          <div className="p-[3px] bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 rounded-[2.5rem] shadow-xl shadow-blue-500/20 active:scale-[0.98] transition-all">
            <button 
              onClick={onAddMilk}
              className="w-full group bg-white rounded-[2.3rem] p-6 flex items-center justify-between hover:bg-gray-50/50 transition-all relative overflow-hidden"
            >
              <div className="flex items-center space-x-5 relative z-10">
                <div className="w-16 h-16 bg-blue-50 rounded-[1.25rem] flex items-center justify-center shadow-inner border border-blue-100 group-hover:scale-110 transition-transform duration-500">
                  <Milk className="text-blue-600" size={32} />
                </div>
                <div className="text-left">
                  <h3 className="text-gray-900 font-black text-2xl tracking-tight leading-none mb-1">Add Entry</h3>
                  <p className="text-gray-500 text-sm font-semibold uppercase tracking-wide opacity-60">Log Production</p>
                </div>
              </div>
              <div className="w-10 h-10 bg-gray-50 rounded-full border border-gray-100 flex items-center justify-center group-hover:bg-blue-600 group-hover:border-blue-600 transition-all duration-300">
                <ChevronRight className="text-gray-400 group-hover:text-white" size={20} />
              </div>
            </button>
          </div>

          <div className="p-[3px] bg-gradient-to-br from-indigo-500 via-blue-500 to-blue-600 rounded-[2.5rem] shadow-xl shadow-blue-500/20 active:scale-[0.98] transition-all">
            <button 
              onClick={() => onChangeView(AppView.HISTORY)}
              className="w-full group bg-white rounded-[2.3rem] p-6 flex items-center justify-between hover:bg-gray-50/50 transition-all relative overflow-hidden"
            >
              <div className="flex items-center space-x-5 relative z-10">
                <div className="w-16 h-16 bg-orange-50 rounded-[1.25rem] flex items-center justify-center shadow-inner border border-orange-100 group-hover:scale-110 transition-transform duration-500">
                  <BarChart3 className="text-orange-600" size={32} />
                </div>
                <div className="text-left">
                  <h3 className="text-gray-900 font-black text-2xl tracking-tight leading-none mb-1">Records</h3>
                  <p className="text-gray-500 text-sm font-semibold uppercase tracking-wide opacity-60">View History</p>
                </div>
              </div>
              <div className="w-10 h-10 bg-gray-50 rounded-full border border-gray-100 flex items-center justify-center group-hover:bg-indigo-600 group-hover:border-indigo-600 transition-all duration-300">
                <ChevronRight className="text-gray-400 group-hover:text-white" size={20} />
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};