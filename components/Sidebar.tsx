
import React, { useState } from 'react';
import { 
  X, Home, Plus, BarChart3, Calendar, 
  ClipboardList, StickyNote, Calculator, 
  Settings, User, LogOut, Power 
} from 'lucide-react';
import { AppView } from '../types';
import { logOut } from '../services/firebase';
import { User as FirebaseUser } from 'firebase/auth';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onChangeView: (view: AppView) => void;
  onAddClick: () => void;
  currentView: AppView;
  user?: FirebaseUser;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  isOpen, 
  onClose, 
  onChangeView, 
  onAddClick,
  currentView,
  user
}) => {
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  
  const handleNavigation = (view: AppView) => {
    onChangeView(view);
    onClose();
  };

  const handleConfirmLogout = async () => {
    setShowLogoutModal(false);
    await logOut();
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
      <div 
        className={`fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      <div 
        className={`fixed top-0 left-0 h-full w-[280px] bg-white z-[101] shadow-2xl transform transition-transform duration-300 ease-out flex flex-col ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-6 flex flex-col border-b border-gray-100 bg-blue-600 text-white relative overflow-hidden">
          <div className="absolute top-[-50px] right-[-50px] w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
          
          <div className="flex items-center justify-between mb-6 relative z-10">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center text-white font-black text-xl border border-white/20">
                D
              </div>
              <h2 className="text-xl font-black tracking-tight leading-none">DairyTrack</h2>
            </div>
            <button onClick={onClose} className="p-2 bg-white/10 text-white rounded-full hover:bg-white/20 transition-colors">
              <X size={20} />
            </button>
          </div>

          <div className="flex items-center space-x-3 relative z-10">
             <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg border-2 border-white/20">
                <User size={24} className="text-blue-600" />
             </div>
             <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate">{user?.email}</p>
                <p className="text-[10px] text-blue-100 font-black uppercase tracking-widest opacity-60">Professional Account</p>
             </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar py-4 px-4 space-y-1">
          <p className="px-3 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 mt-2">Navigation</p>
          <NavItem icon={Home} label="Dashboard" view={AppView.HOME} />
          <NavItem icon={Plus} label="Add Milk Record" onClick={() => { onAddClick(); onClose(); }} />
          <NavItem icon={BarChart3} label="Milk History" view={AppView.HISTORY} />
          <NavItem icon={Calendar} label="Calendar" view={AppView.CALENDAR} />
          <NavItem icon={ClipboardList} label="Manage & Analytics" view={AppView.MANAGE} />
          
          <div className="my-4 border-t border-gray-100"></div>
          <p className="px-3 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3">Resources</p>
          <NavItem icon={StickyNote} label="Notepad" view={AppView.NOTEPAD} />
          <NavItem icon={Calculator} label="Calculator" view={AppView.CALCULATOR} />
          <NavItem icon={Settings} label="Settings" view={AppView.SETTINGS} />
        </div>

        <div className="p-4 border-t border-gray-100">
           <button 
             onClick={() => setShowLogoutModal(true)}
             className="w-full flex items-center justify-center gap-2 p-4 bg-red-50 text-red-600 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-red-100 active:scale-95 transition-all"
           >
             <LogOut size={18} />
             <span>Log Out</span>
           </button>
        </div>
      </div>

      {/* Shared Logout Confirmation Modal */}
      {showLogoutModal && (
        <div 
          className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 animate-in fade-in duration-300"
          onClick={() => setShowLogoutModal(false)}
        >
          <div 
            className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl animate-in slide-in-from-bottom-10 duration-500 relative overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-6">
                <Power size={32} className="text-red-600" />
              </div>
              <h3 className="text-xl font-black text-gray-900 mb-2">Sign Out?</h3>
              <p className="text-gray-500 text-sm font-medium mb-8">
                Are you sure you want to log out of your account?
              </p>
              <div className="flex flex-col gap-3 w-full">
                <button 
                  onClick={handleConfirmLogout}
                  className="w-full py-4 bg-red-600 text-white rounded-xl font-bold uppercase tracking-widest text-xs"
                >
                  Sign Out Now
                </button>
                <button 
                  onClick={() => setShowLogoutModal(false)}
                  className="w-full py-4 bg-gray-100 text-gray-600 rounded-xl font-bold uppercase tracking-widest text-xs"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
