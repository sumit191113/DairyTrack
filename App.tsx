
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
import { FloatingCalculator } from './components/FloatingCalculator';
import { AppView, MilkRecord, Note } from './types';
import { subscribeToRecords, addRecord, updateRecord, softDeleteRecord, subscribeToNotes } from './services/firebase';
import { Lock } from 'lucide-react';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.HOME);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [records, setRecords] = useState<MilkRecord[]>([]);
  const [editingRecord, setEditingRecord] = useState<MilkRecord | undefined>(undefined);
  
  // Floating Calculator State
  const [isFloatingCalcOpen, setIsFloatingCalcOpen] = useState(false);
  const [calcDisplay, setCalcDisplay] = useState('0');

  // Notes & Reminder State
  const [notes, setNotes] = useState<Note[]>([]);
  const [reminderNotes, setReminderNotes] = useState<Note[]>([]);
  const [isReminderOpen, setIsReminderOpen] = useState(false);
  const hasShownRemindersRef = useRef(false);

  // App Lock State
  const [isLocked, setIsLocked] = useState(false);
  const [lockPin, setLockPin] = useState('');
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);

  // Check App Lock on Load
  useEffect(() => {
    const settingsStr = localStorage.getItem('dairyTrackSettings');
    let settings = {
        soundsEnabled: true,
        alertsEnabled: true,
        appLockPin: '1911'
    };

    if (settingsStr) {
      const parsed = JSON.parse(settingsStr);
      if (parsed.appLockPin === undefined) {
         parsed.appLockPin = '1911';
         localStorage.setItem('dairyTrackSettings', JSON.stringify({ ...parsed, appLockPin: '1911' }));
         settings = { ...parsed, appLockPin: '1911' };
      } else {
         settings = parsed;
      }
    } else {
      localStorage.setItem('dairyTrackSettings', JSON.stringify(settings));
    }

    if (settings.appLockPin) {
      setLockPin(settings.appLockPin);
      setIsLocked(true);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToRecords((updatedRecords) => {
      setRecords(updatedRecords);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToNotes((updatedNotes) => {
      setNotes(updatedNotes);
      const activeReminders = updatedNotes.filter(n => n.remindMe === true);
      setReminderNotes(activeReminders);
      if (!hasShownRemindersRef.current && activeReminders.length > 0) {
        const latestReminder = activeReminders[0];
        const lastDismissedTimestamp = parseInt(localStorage.getItem('dairy_last_dismissed_note') || '0');
        if (latestReminder.timestamp > lastDismissedTimestamp) {
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
      setTimeout(() => setPinError(false), 2000);
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
    if (reminderNotes.length > 0) {
        localStorage.setItem('dairy_last_dismissed_note', reminderNotes[0].timestamp.toString());
    }
    setIsReminderOpen(false);
  };

  const renderContent = () => {
    switch (currentView) {
      case AppView.HOME:
        return <Dashboard onAddMilk={handleAddClick} onChangeView={setCurrentView} records={records} />;
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
        return (
          <CalculatorView 
            onBack={() => setCurrentView(AppView.HOME)} 
            initialValue={calcDisplay}
            onValueChange={setCalcDisplay}
            onMinimize={() => {
              setIsFloatingCalcOpen(true);
              setCurrentView(AppView.HOME);
            }}
          />
        );
      case AppView.MANAGE:
        return <ManageView records={records} onBack={() => setCurrentView(AppView.HOME)} />;
      case AppView.SETTINGS:
        return <SettingsView onBack={() => setCurrentView(AppView.HOME)} onNavigate={setCurrentView} records={records} />;
      case AppView.TRASH:
        return <TrashView onBack={() => setCurrentView(AppView.SETTINGS)} />;
      case AppView.PROFILE:
        return <ProfileView onBack={() => setCurrentView(AppView.HOME)} />;
      default:
        return <Dashboard onAddMilk={handleAddClick} onChangeView={setCurrentView} records={records} />;
    }
  };

  const showGlobalHeader = currentView === AppView.HOME;

  if (isLocked) {
    return (
      <div className="h-[100dvh] w-full bg-blue-600 flex flex-col items-center justify-center p-6 text-white relative overflow-hidden animate-in fade-in duration-300">
        <div className="absolute top-[-100px] right-[-100px] w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[-50px] left-[-50px] w-60 h-60 bg-white/10 rounded-full blur-3xl"></div>
        <div className="w-24 h-24 bg-white/20 backdrop-blur-md rounded-3xl flex items-center justify-center mb-8 shadow-xl border border-white/20">
            <Lock size={48} className="text-white" />
        </div>
        <h1 className="text-3xl font-bold mb-2">DairyTrack Locked</h1>
        <p className="text-blue-100 mb-8 opacity-90">Enter PIN to access your records</p>
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
              className={`w-full bg-white/20 backdrop-blur-sm border ${pinError ? 'border-red-300' : 'border-white/30'} p-4 rounded-2xl text-center text-4xl tracking-[0.5em] font-bold outline-none placeholder-blue-200/50 text-white transition-all focus:bg-white/30`}
              placeholder="••••"
              autoFocus
            />
            {pinError && <p className="text-white bg-red-500/80 px-4 py-2 rounded-lg text-sm font-bold mt-4 animate-bounce">Incorrect PIN. Try again.</p>}
            <button type="submit" className="w-full mt-8 bg-white text-blue-600 py-4 rounded-2xl font-bold text-lg shadow-lg active:scale-95 transition-transform hover:bg-blue-50">
                Unlock App
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
        onClose={() => setIsReminderOpen(false)}
        onDismiss={handleDismissReminder}
        notes={reminderNotes}
      />

      {isFloatingCalcOpen && (
        <FloatingCalculator 
          initialValue={calcDisplay}
          onClose={() => setIsFloatingCalcOpen(false)}
          onExpand={() => {
            setIsFloatingCalcOpen(false);
            setCurrentView(AppView.CALCULATOR);
          }}
          onValueChange={setCalcDisplay}
        />
      )}
    </div>
  );
};

export default App;
