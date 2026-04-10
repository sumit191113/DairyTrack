
import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, User, Phone, MapPin, Camera, Save, Edit2, Tractor, LogOut, Mail, ShieldAlert, Power, X } from 'lucide-react';
import { logOut, subscribeToAuth } from '../services/firebase';
import { User as FirebaseUser } from 'firebase/auth';

interface ProfileViewProps {
  onBack: () => void;
}

interface UserProfile {
  name: string;
  phone: string;
  location: string;
  farmName: string;
  avatar?: string;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ onBack }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [profile, setProfile] = useState<UserProfile>({
    name: '',
    phone: '',
    location: '',
    farmName: '',
    avatar: ''
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsub = subscribeToAuth(setUser);
    return () => unsub();
  }, []);

  useEffect(() => {
    if (user) {
      const saved = localStorage.getItem(`dairy_profile_${user.uid}`);
      if (saved) setProfile(JSON.parse(saved));
    }
  }, [user]);

  const handleSave = () => {
    if (user) {
      localStorage.setItem(`dairy_profile_${user.uid}`, JSON.stringify(profile));
    }
    setIsEditing(false);
  };

  const handleConfirmLogout = async () => {
    setShowLogoutConfirm(false);
    await logOut();
  };

  const handleChange = (field: keyof UserProfile, value: string) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const updated = { ...profile, avatar: reader.result as string };
        setProfile(updated);
        if (user) localStorage.setItem(`dairy_profile_${user.uid}`, JSON.stringify(updated));
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="h-full bg-gray-50 flex flex-col animate-in slide-in-from-right duration-300">
      <div className="flex items-center justify-between p-6 bg-white shadow-sm z-10 sticky top-0 pt-safe">
        <div className="flex items-center space-x-4">
            <button onClick={onBack} className="p-3 bg-gray-100 rounded-2xl hover:bg-gray-200 transition-colors shadow-sm active:scale-90">
                <ArrowLeft size={28} className="text-gray-700" />
            </button>
            <h2 className="text-2xl font-[900] text-gray-800 tracking-tight">Profile</h2>
        </div>
        <button 
            onClick={() => isEditing ? handleSave() : setIsEditing(true)}
            className={`p-3 rounded-2xl transition-all shadow-sm active:scale-90 flex items-center space-x-2 ${isEditing ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
        >
            {isEditing ? <Save size={20} /> : <Edit2 size={20} />}
            {isEditing && <span className="font-bold pr-2">Save</span>}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar pb-32 p-6 space-y-8">
        <div className="flex flex-col items-center">
            <div className="relative">
                <div className="w-32 h-32 bg-white rounded-[3rem] flex items-center justify-center border-4 border-white shadow-xl overflow-hidden ring-4 ring-blue-50">
                    {profile.avatar ? (
                        <img src={profile.avatar} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                        <User size={64} className="text-blue-100" />
                    )}
                </div>
                <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 p-3 bg-blue-600 text-white rounded-2xl shadow-lg border-4 border-white active:scale-90 transition-transform"
                >
                    <Camera size={20} />
                </button>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
            </div>
            {!isEditing && (
                <div className="mt-4 text-center">
                    <h3 className="text-2xl font-black text-gray-800 tracking-tight">{profile.name || 'Set Your Name'}</h3>
                    <div className="flex items-center gap-1.5 justify-center mt-1 text-gray-400">
                        <Mail size={14} />
                        <span className="text-xs font-bold">{user?.email}</span>
                    </div>
                </div>
            )}
        </div>

        <div className="space-y-6">
            <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100">
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-8">Personal Information</h3>
                <div className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Full Name</label>
                        {isEditing ? (
                            <input type="text" value={profile.name} onChange={(e) => handleChange('name', e.target.value)} placeholder="Enter your name" className="w-full p-4 bg-gray-50 rounded-2xl font-black text-gray-800 outline-none focus:ring-4 focus:ring-blue-100 transition-all border-none" />
                        ) : (
                            <div className="p-4 bg-gray-50/50 rounded-2xl font-black text-gray-800">{profile.name || 'Not set'}</div>
                        )}
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Farm Name</label>
                        {isEditing ? (
                            <input type="text" value={profile.farmName} onChange={(e) => handleChange('farmName', e.target.value)} placeholder="e.g. Green Valley Dairy" className="w-full p-4 bg-gray-50 rounded-2xl font-black text-gray-800 outline-none focus:ring-4 focus:ring-blue-100 transition-all border-none" />
                        ) : (
                            <div className="p-4 bg-gray-50/50 rounded-2xl font-black text-gray-800">{profile.farmName || 'Not set'}</div>
                        )}
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Account Actions</h3>
                    <div className="px-2 py-0.5 bg-blue-50 rounded-md">
                        <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest">Active Session</span>
                    </div>
                </div>
                
                <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50/30 border border-gray-50 rounded-2xl">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white rounded-xl shadow-sm border border-gray-100">
                                <Mail size={16} className="text-blue-500" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Email Address</span>
                                <span className="text-sm font-bold text-gray-700">{user?.email}</span>
                            </div>
                        </div>
                        <span className="text-[10px] font-black text-green-500 uppercase tracking-widest bg-green-50 px-2 py-1 rounded-lg">Verified</span>
                    </div>

                    <button 
                        onClick={() => setShowLogoutConfirm(true)}
                        className="w-full group relative overflow-hidden flex items-center justify-center gap-3 p-5 bg-white border-2 border-red-50 text-red-600 rounded-[1.8rem] font-black text-xs uppercase tracking-[0.2em] hover:bg-red-50 hover:border-red-100 active:scale-95 transition-all duration-300"
                    >
                        <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
                        <span>Sign Out of DairyTrack</span>
                    </button>
                </div>
            </div>
        </div>
      </div>

      {/* Custom Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div 
          className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 animate-in fade-in duration-300"
          onClick={() => setShowLogoutConfirm(false)}
        >
          <div 
            className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl animate-in slide-in-from-bottom-10 duration-500 relative overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Background Accent */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-50 rounded-bl-full opacity-50 -z-0"></div>
            
            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-red-50 rounded-[2rem] flex items-center justify-center mb-6 shadow-inner ring-4 ring-red-100/30">
                <Power size={36} className="text-red-600 animate-pulse" />
              </div>
              
              <h3 className="text-2xl font-black text-gray-900 tracking-tight mb-2">Sign Out?</h3>
              <p className="text-gray-500 font-medium leading-relaxed mb-8 px-2">
                You're about to leave the app. Don't worry, all your synced data is safe on our servers.
              </p>
              
              <div className="flex flex-col gap-3 w-full">
                <button 
                  onClick={handleConfirmLogout}
                  className="w-full py-4.5 bg-red-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-red-200 hover:bg-red-700 active:scale-95 transition-all"
                >
                  Confirm Sign Out
                </button>
                <button 
                  onClick={() => setShowLogoutConfirm(false)}
                  className="w-full py-4.5 bg-gray-100 text-gray-600 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-gray-200 active:scale-95 transition-all"
                >
                  Stay Logged In
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
