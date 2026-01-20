import React from 'react';
import { Home, ClipboardList, Plus, Settings, User } from 'lucide-react';
import { AppView } from '../types';

interface BottomNavProps {
  currentView: AppView;
  onChangeView: (view: AppView) => void;
  onAddClick: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentView, onChangeView, onAddClick }) => {
  const navItemClass = (view: AppView) => 
    `flex flex-col items-center justify-center space-y-1 min-w-[60px] transition-all duration-200 ${currentView === view ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`;

  return (
    <div className="absolute bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 pb-safe shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.03)]">
        <div className="flex items-center justify-around px-2 h-[72px]">
            
            <button onClick={() => onChangeView(AppView.HOME)} className={navItemClass(AppView.HOME)}>
                <Home size={26} strokeWidth={currentView === AppView.HOME ? 2.5 : 2} />
                <span className="text-[10px] font-bold mt-0.5">Home</span>
            </button>

            <button onClick={() => onChangeView(AppView.MANAGE)} className={navItemClass(AppView.MANAGE)}>
                <ClipboardList size={26} strokeWidth={currentView === AppView.MANAGE ? 2.5 : 2} />
                <span className="text-[10px] font-bold mt-0.5">Manage</span>
            </button>

            {/* Integrated Add Button - Inside the bar */}
            <button 
              onClick={onAddClick}
              className="bg-blue-600 text-white rounded-2xl w-12 h-12 flex items-center justify-center shadow-lg shadow-blue-200 hover:bg-blue-700 hover:scale-105 active:scale-95 transition-all mx-1"
            >
              <Plus size={28} strokeWidth={3} />
            </button>

            <button onClick={() => onChangeView(AppView.SETTINGS)} className={navItemClass(AppView.SETTINGS)}>
                <Settings size={26} strokeWidth={currentView === AppView.SETTINGS ? 2.5 : 2} />
                <span className="text-[10px] font-bold mt-0.5">Settings</span>
            </button>

            <button onClick={() => onChangeView(AppView.PROFILE)} className={navItemClass(AppView.PROFILE)}>
                <User size={26} strokeWidth={currentView === AppView.PROFILE ? 2.5 : 2} />
                <span className="text-[10px] font-bold mt-0.5">Profile</span>
            </button>
        </div>
    </div>
  );
};