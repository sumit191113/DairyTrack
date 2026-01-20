import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { Dashboard } from './components/Dashboard';
import { AddMilkModal } from './components/AddMilkModal';
import { RecordList } from './components/RecordList';
import { Notepad } from './components/Notepad';
import { CalendarView } from './components/CalendarView';
import { CalculatorView } from './components/CalculatorView';
import { ManageView } from './components/ManageView';
import { SettingsView } from './components/SettingsView';
import { TrashView } from './components/TrashView';
import { ProfileView } from './components/ProfileView';
import { Sidebar } from './components/Sidebar';
import { ReminderModal } from './components/ReminderModal';
import { AppView, MilkRecord, Note } from './types';
import { subscribeToRecords, addRecord, updateRecord, softDeleteRecord, subscribeToNotes } from './services/firebase';
import { Lock } from 'lucide-react';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.HOME);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [records, setRecords] = useState<MilkRecord[]>([]);
  const [editingRecord, setEditingRecord] = useState<MilkRecord | undefined>(undefined);
  
  // Notes & Reminder State
  const [notes, setNotes] = useState<Note[]>([]);
  const [isReminderOpen, setIsReminderOpen] = useState(false);
  const hasShownRemindersRef = useRef(false);

  // App Lock State
  const [isLocked, setIsLocked] = useState(false);
  const [lockPin, setLockPin] = useState('');
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);

  // Check App Lock on Load
  useEffect(() => {
    const settings = localStorage.getItem('dairyTrackSettings');
    if (settings) {
      const parsed = JSON.parse(settings);
      if (parsed.appLockPin) {
        setLockPin(parsed.appLockPin);
        setIsLocked(true);
      }
    }
  }, []);

  // Sync Milk Records
  useEffect(() => {
    const unsubscribe = subscribeToRecords((updatedRecords) => {
      setRecords(updatedRecords);
    });
    return () => unsubscribe();
  }, []);

  // Sync Notes & Trigger Reminder
  useEffect(() => {
    const unsubscribe = subscribeToNotes((updatedNotes) => {
      setNotes(updatedNotes);
      
      // Show reminder only on initial load if notes exist AND haven't been permanently dismissed
      if (!hasShownRemindersRef.current && updatedNotes.length > 0) {
        const latestNote = updatedNotes[0]; // Assuming sorted desc
        const lastDismissedTimestamp = parseInt(localStorage.getItem('dairy_last_dismissed_note') || '0');
        
        // Only show if the latest note is newer than what was last dismissed
        if (latestNote.timestamp > lastDismissedTimestamp) {
            setIsReminderOpen(true);
            hasShownRemindersRef.current = true;
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === lockPin) {
      setIsLocked(false);
      setPinInput('');
      setPinError(false);
    } else {
      setPinError(true);
      setPinInput('');
    }
  };

  const handleAddClick = () => {
    setEditingRecord(undefined);
    setIsModalOpen(true);
  };

  const handleEditClick = (record: MilkRecord) => {
    setEditingRecord(record);
    setIsModalOpen(true);
  };

  const handleSaveRecord = async (data: Omit<MilkRecord, 'id'> | MilkRecord) => {
    if ('id' in data) {
      await updateRecord(data as MilkRecord);
    } else {
      await addRecord(data);
    }
  };

  const handleDeleteRecord = async (id: string) => {
    const recordToDelete = records.find(r => r.id === id);
    if (recordToDelete) {
      await softDeleteRecord(recordToDelete);
    }
  };

  const handleDismissReminder = () => {
    if (notes.length > 0) {
        // Store the timestamp of the newest note
        // notes are already sorted desc by subscribeToNotes
        localStorage.setItem('dairy_last_dismissed_note', notes[0].timestamp.toString());
    }
    setIsReminderOpen(false);
  };

  const renderContent = () => {
    switch (currentView) {
      case AppView.HOME:
        return <Dashboard onAddMilk={handleAddClick} onChangeView={setCurrentView} />;
      case AppView.HISTORY:
        return (
          <RecordList 
            records={records} 
            onBack={() => setCurrentView(AppView.HOME)}
            onEdit={handleEditClick}
            onDelete={handleDeleteRecord}
          />
        );
      case AppView.NOTEPAD:
        return <Notepad onBack={() => setCurrentView(AppView.HOME)} />;
      case AppView.CALENDAR:
        return (
          <CalendarView 
            records={records}
            onBack={() => setCurrentView(AppView.HOME)}
            onEditRecord={(record) => {
              handleEditClick(record);
            }}
          />
        );
      case AppView.CALCULATOR:
        return <CalculatorView onBack={() => setCurrentView(AppView.HOME)} />;
      case AppView.MANAGE:
        return <ManageView records={records} onBack={() => setCurrentView(AppView.HOME)} />;
      case AppView.SETTINGS:
        return <SettingsView onBack={() => setCurrentView(AppView.HOME)} onNavigate={setCurrentView} records={records} />;
      case AppView.TRASH:
        return <TrashView onBack={() => setCurrentView(AppView.SETTINGS)} />;
      case AppView.PROFILE:
        return <ProfileView onBack={() => setCurrentView(AppView.HOME)} />;
      default:
        return <Dashboard onAddMilk={handleAddClick} onChangeView={setCurrentView} />;
    }
  };

  const showGlobalHeader = currentView === AppView.HOME;

  // App Lock Overlay
  if (isLocked) {
    return (
      <div className="h-[100dvh] w-full bg-blue-600 flex flex-col items-center justify-center p-6 text-white relative overflow-hidden">
        <div className="absolute top-[-100px] right-[-100px] w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[-50px] left-[-50px] w-60 h-60 bg-white/10 rounded-full blur-3xl"></div>
        
        <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-3xl flex items-center justify-center mb-8 shadow-xl border border-white/20">
            <Lock size={40} className="text-white" />
        </div>
        
        <h1 className="text-3xl font-bold mb-2">DairyTrack Locked</h1>
        <p className="text-blue-100 mb-8">Enter PIN to access your records</p>

        <form onSubmit={handleUnlock} className="w-full max-w-xs flex flex-col items-center">
            <input 
              type="password" 
              maxLength={4}
              pattern="\d*"
              inputMode="numeric"
              value={pinInput}
              onChange={(e) => {
                  setPinInput(e.target.value.replace(/\D/g,''));
                  setPinError(false);
              }}
              className={`w-full bg-white/20 backdrop-blur-sm border ${pinError ? 'border-red-300' : 'border-white/30'} p-4 rounded-2xl text-center text-4xl tracking-[0.5em] font-bold outline-none placeholder-blue-200/50 text-white transition-all`}
              placeholder="••••"
              autoFocus
            />
            {pinError && <p className="text-red-200 font-bold mt-4 animate-pulse">Incorrect PIN</p>}
            
            <button type="submit" className="w-full mt-8 bg-white text-blue-600 py-4 rounded-2xl font-bold text-lg shadow-lg active:scale-95 transition-transform">
                Unlock
            </button>
        </form>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] w-full bg-gray-50 flex flex-col font-sans text-gray-900 overflow-hidden relative">
      
      {showGlobalHeader && <Header onMenuClick={() => setIsSidebarOpen(true)} />}
      
      <main className="flex-1 overflow-hidden relative w-full flex flex-col">
        {renderContent()}
      </main>

      <BottomNav 
        currentView={currentView} 
        onChangeView={setCurrentView}
        onAddClick={handleAddClick}
      />

      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        onChangeView={setCurrentView}
        onAddClick={handleAddClick}
        currentView={currentView}
      />

      <AddMilkModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={handleSaveRecord}
        existingRecord={editingRecord}
      />

      <ReminderModal 
        isOpen={isReminderOpen}
        onClose={() => setIsReminderOpen(false)} // Close temporarily
        onDismiss={handleDismissReminder} // Close permanently
        notes={notes}
      />
    </div>
  );
};

export default App;