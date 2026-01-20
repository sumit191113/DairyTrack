import React from 'react';
import { 
  X, Home, Plus, BarChart3, Calendar, 
  ClipboardList, StickyNote, Calculator, 
  Settings, User, ChevronRight, LogOut 
} from 'lucide-react';
import { AppView } from '../types';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onChangeView: (view: AppView) => void;
  onAddClick: () => void;
  currentView: AppView;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  isOpen, 
  onClose, 
  onChangeView, 
  onAddClick,
  currentView 
}) => {
  
  const handleNavigation = (view: AppView) => {
    onChangeView(view);
    onClose();
  };

  const handleAddMilk = () => {
    onAddClick();
    onClose();
  };

  const NavItem = ({ 
    icon: Icon, 
    label, 
    view, 
    onClick 
  }: { 
    icon: any, 
    label: string, 
    view?: AppView, 
    onClick?: () => void 
  }) => {
    const isActive = view && currentView === view;
    return (
      <button 
        onClick={onClick || (() => view && handleNavigation(view))}
        className={`w-full flex items-center justify-between p-3 rounded-xl transition-all duration-200 group active:scale-95
          ${isActive 
            ? 'bg-blue-50 text-blue-600 font-bold' 
            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 font-medium'
          }`}
      >
        <div className="flex items-center space-x-3">
          <Icon size={20} strokeWidth={isActive ? 2.5 : 2} className={isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'} />
          <span>{label}</span>
        </div>
        {isActive && <div className="w-1.5 h-1.5 rounded-full bg-blue-600"></div>}
      </button>
    );
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Sidebar Panel */}
      <div 
        className={`fixed top-0 left-0 h-full w-[280px] bg-white z-[101] shadow-2xl transform transition-transform duration-300 ease-out flex flex-col ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="p-6 flex items-center justify-between border-b border-gray-100">
          <div className="flex items-center space-x-3">
             <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                D
             </div>
             <div>
                <h2 className="text-lg font-bold text-gray-800 leading-none">DairyTrack</h2>
                <span className="text-[10px] text-gray-400 font-medium tracking-wider">PRO VERSION</span>
             </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 bg-gray-50 text-gray-500 rounded-full hover:bg-gray-100 transition-colors active:scale-90"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto no-scrollbar py-4 px-4 space-y-1">
          <p className="px-3 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 mt-2">Main Menu</p>
          
          <NavItem icon={Home} label="Dashboard" view={AppView.HOME} />
          <NavItem icon={Plus} label="Add Milk Record" onClick={handleAddMilk} />
          <NavItem icon={BarChart3} label="Milk History" view={AppView.HISTORY} />
          <NavItem icon={Calendar} label="Calendar" view={AppView.CALENDAR} />
          <NavItem icon={ClipboardList} label="Manage & Analytics" view={AppView.MANAGE} />
          
          <div className="my-4 border-t border-gray-100"></div>
          
          <p className="px-3 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Tools & Settings</p>
          
          <NavItem icon={StickyNote} label="Notepad" view={AppView.NOTEPAD} />
          <NavItem icon={Calculator} label="Calculator" view={AppView.CALCULATOR} />
          <NavItem icon={Settings} label="Settings" view={AppView.SETTINGS} />
          <NavItem icon={User} label="My Profile" view={AppView.PROFILE} />
        </div>

        {/* Footer Credit */}
        <div className="p-6 border-t border-gray-100 bg-gray-50/50">
           <div className="flex flex-col items-center justify-center space-y-1">
              <span className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold">Created by</span>
              <span className="text-xs font-medium text-gray-600 bg-gray-200/50 px-3 py-1 rounded-full">Sumit Maurya</span>
           </div>
        </div>
      </div>
    </>
  );
};