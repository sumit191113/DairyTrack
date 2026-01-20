import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, User, Phone, MapPin, Camera, Save, Edit2, Tractor } from 'lucide-react';

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
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState<UserProfile>({
    name: '',
    phone: '',
    location: '',
    farmName: '',
    avatar: ''
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('dairy_profile');
    if (saved) {
      setProfile(JSON.parse(saved));
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem('dairy_profile', JSON.stringify(profile));
    setIsEditing(false);
  };

  const handleChange = (field: keyof UserProfile, value: string) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        const updatedProfile = { ...profile, avatar: base64String };
        setProfile(updatedProfile);
        
        // If not currently editing, save the image immediately
        if (!isEditing) {
            localStorage.setItem('dairy_profile', JSON.stringify(updatedProfile));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="h-full bg-gray-50 flex flex-col animate-in slide-in-from-right duration-300">
      
      {/* Header */}
      <div className="flex items-center justify-between p-6 bg-white shadow-sm z-10 sticky top-0 pt-safe">
        <div className="flex items-center space-x-4">
            <button onClick={onBack} className="p-3 bg-gray-100 rounded-2xl hover:bg-gray-200 transition-colors shadow-sm active:scale-90">
                <ArrowLeft size={28} className="text-gray-700" />
            </button>
            <h2 className="text-2xl font-bold text-gray-800">My Profile</h2>
        </div>
        <button 
            onClick={() => isEditing ? handleSave() : setIsEditing(true)}
            className={`p-3 rounded-2xl transition-all shadow-sm active:scale-90 flex items-center space-x-2 ${isEditing ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
        >
            {isEditing ? <Save size={24} /> : <Edit2 size={24} />}
            {isEditing && <span className="font-bold pr-2">Save</span>}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar pb-32 p-6">
        
        {/* Profile Image Section */}
        <div className="flex flex-col items-center justify-center mb-8">
            <div className="relative group">
                <div className="w-32 h-32 bg-gradient-to-tr from-blue-100 to-blue-50 rounded-full flex items-center justify-center border-4 border-white shadow-xl overflow-hidden">
                    {profile.avatar ? (
                        <img src={profile.avatar} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                        <User size={64} className="text-blue-300" />
                    )}
                </div>
                <button 
                    onClick={handleImageClick}
                    className="absolute bottom-0 right-0 p-3 bg-blue-600 text-white rounded-full shadow-lg border-4 border-white active:scale-90 transition-transform cursor-pointer hover:bg-blue-700"
                >
                    <Camera size={20} />
                </button>
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*"
                    onChange={handleFileChange}
                />
            </div>
            {!isEditing && (
                <div className="mt-4 text-center animate-in fade-in duration-300">
                    <h3 className="text-2xl font-bold text-gray-800">{profile.name || 'Set User Name'}</h3>
                    <p className="text-gray-400 font-medium">{profile.location || 'Location not set'}</p>
                </div>
            )}
        </div>

        {/* Info Cards */}
        <div className="space-y-6">
            
            {/* Personal Details */}
            <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-6 flex items-center gap-2">
                    <User size={16} /> Personal Information
                </h3>
                
                <div className="space-y-6">
                    {/* Name Field */}
                    <div className="group">
                        <label className="text-xs font-bold text-gray-400 uppercase mb-1.5 block ml-1">Full Name</label>
                        {isEditing ? (
                            <input 
                                type="text" 
                                value={profile.name}
                                onChange={(e) => handleChange('name', e.target.value)}
                                placeholder="Enter your name"
                                className="w-full p-4 bg-gray-50 rounded-xl font-bold text-gray-800 outline-none focus:ring-2 focus:ring-blue-200 transition-all border border-transparent focus:border-blue-300 placeholder-gray-300"
                            />
                        ) : (
                            <div className="p-4 bg-gray-50/50 rounded-xl font-bold text-gray-800 border border-transparent">
                                {profile.name || <span className="text-gray-300 italic">Not set</span>}
                            </div>
                        )}
                    </div>

                    {/* Farm Name Field */}
                    <div className="group">
                        <label className="text-xs font-bold text-gray-400 uppercase mb-1.5 block ml-1 flex items-center gap-1">
                             <Tractor size={12} /> Farm Name
                        </label>
                        {isEditing ? (
                            <input 
                                type="text" 
                                value={profile.farmName}
                                onChange={(e) => handleChange('farmName', e.target.value)}
                                placeholder="e.g. Green Valley Dairy"
                                className="w-full p-4 bg-gray-50 rounded-xl font-bold text-gray-800 outline-none focus:ring-2 focus:ring-blue-200 transition-all border border-transparent focus:border-blue-300 placeholder-gray-300"
                            />
                        ) : (
                            <div className="p-4 bg-gray-50/50 rounded-xl font-bold text-gray-800 border border-transparent">
                                {profile.farmName || <span className="text-gray-300 italic">Not set</span>}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Contact Details */}
            <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-6 flex items-center gap-2">
                    <Phone size={16} /> Contact Details
                </h3>

                <div className="space-y-6">
                    {/* Phone */}
                    <div className="group">
                        <label className="text-xs font-bold text-gray-400 uppercase mb-1.5 block ml-1">Phone Number</label>
                        {isEditing ? (
                            <input 
                                type="tel" 
                                value={profile.phone}
                                onChange={(e) => handleChange('phone', e.target.value)}
                                placeholder="+91 00000 00000"
                                className="w-full p-4 bg-gray-50 rounded-xl font-bold text-gray-800 outline-none focus:ring-2 focus:ring-blue-200 transition-all border border-transparent focus:border-blue-300 placeholder-gray-300"
                            />
                        ) : (
                            <div className="p-4 bg-gray-50/50 rounded-xl font-bold text-gray-800 border border-transparent flex items-center justify-between">
                                <span>{profile.phone || <span className="text-gray-300 italic">Not set</span>}</span>
                                {profile.phone && <Phone size={18} className="text-blue-500" />}
                            </div>
                        )}
                    </div>

                    {/* Location */}
                    <div className="group">
                        <label className="text-xs font-bold text-gray-400 uppercase mb-1.5 block ml-1">Location / Address</label>
                        {isEditing ? (
                            <textarea 
                                value={profile.location}
                                onChange={(e) => handleChange('location', e.target.value)}
                                placeholder="Enter farm address..."
                                rows={2}
                                className="w-full p-4 bg-gray-50 rounded-xl font-bold text-gray-800 outline-none focus:ring-2 focus:ring-blue-200 transition-all border border-transparent focus:border-blue-300 placeholder-gray-300 resize-none"
                            />
                        ) : (
                            <div className="p-4 bg-gray-50/50 rounded-xl font-bold text-gray-800 border border-transparent flex items-start justify-between min-h-[80px]">
                                <span>{profile.location || <span className="text-gray-300 italic">Not set</span>}</span>
                                {profile.location && <MapPin size={18} className="text-blue-500 mt-1" />}
                            </div>
                        )}
                    </div>
                </div>
            </div>

        </div>
      </div>
    </div>
  );
};