import React from 'react';
import { Menu, User } from 'lucide-react';

interface HeaderProps {
  onMenuClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  return (
    <header className="absolute top-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-md px-6 py-4 flex items-center justify-between border-b border-white/20 pt-safe">
      <button 
        onClick={onMenuClick}
        className="p-2.5 text-gray-600 rounded-full hover:bg-black/5 transition-colors active:scale-95"
      >
        <Menu size={28} />
      </button>
      
      <h1 className="text-xl font-bold text-gray-800 tracking-tight">DairyTrack</h1>
      
      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-100 to-blue-50 flex items-center justify-center border border-white shadow-sm">
        <User size={20} className="text-blue-600" />
      </div>
    </header>
  );
};