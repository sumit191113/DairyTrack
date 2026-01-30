
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
import { AuthView } from './components/AuthView';
import { AppView, MilkRecord, Note } from './types';
import { 
  subscribeToRecords, 
  addRecord, 
  updateRecord, 
  softDeleteRecord, 
  subscribeToNotes, 
  subscribeToAuth,
  syncAllPendingData
} from './services/firebase';
import { User } from 'firebase/auth';
import { Loader2 } from 'lucide-react';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [currentView, setCurrentView] = useState<AppView>(AppView.HOME);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [records, setRecords] = useState<MilkRecord[]>([]);
  const [editingRecord, setEditingRecord] = useState<MilkRecord | undefined>(undefined);
  
  const [isFloatingCalcOpen, setIsFloatingCalcOpen] = useState(false);
  const [calcDisplay, setCalcDisplay] = useState('0');

  const [notes, setNotes] = useState<Note[]>([]);
  const [reminderNotes, setReminderNotes] = useState<Note[]>([]);
  const [isReminderOpen, setIsReminderOpen] = useState(false);
  const hasShownRemindersRef = useRef(false);

  // Auth Logic
  useEffect(() => {
    const unsubscribe = subscribeToAuth((authenticatedUser) => {
      setUser(authenticatedUser);
      setAuthLoading(false);
      if (!authenticatedUser) {
        setRecords([]);
        setNotes([]);
        setReminderNotes([]);
        setCurrentView(AppView.HOME);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Data Subscriptions (Only when user exists)
  useEffect(() => {
    if (!user) return;

    const unsubRecords = subscribeToRecords((updated) => setRecords(updated));
    const unsubNotes = subscribeToNotes((updated) => {
      setNotes(updated);
      const reminders = updated.filter(n => n.remindMe);
      setReminderNotes(reminders);
      if (!hasShownRemindersRef.current && reminders.length > 0) {
        const latest = reminders[0];
        const lastDismissed = parseInt(localStorage.getItem(`dairy_dismissed_${user.uid}`) || '0');
        if (latest.timestamp > lastDismissed) {
          setIsReminderOpen(true);
          hasShownRemindersRef.current = true;
        }
      }
    });

    syncAllPendingData();

    return () => {
      unsubRecords();
      unsubNotes();
    };
  }, [user]);

  const handleAddClick = () => {
    setEditingRecord(undefined);
    setIsModalOpen(true);
  };

  const handleEditClick = (record: MilkRecord) => {
    setEditingRecord(record);
    setIsModalOpen(true);
  };

  const handleSaveRecord = async (data: Omit<MilkRecord, 'id'> | MilkRecord) => {
    if ('id' in data) await updateRecord(data as MilkRecord);
    else await addRecord(data);
  };

  const handleDeleteRecord = async (id: string) => {
    const record = records.find(r => r.id === id);
    if (record) await softDeleteRecord(record);
  };

  const handleDismissReminder = () => {
    if (reminderNotes.length > 0 && user) {
        localStorage.setItem(`dairy_dismissed_${user.uid}`, reminderNotes[0].timestamp.toString());
    }
    setIsReminderOpen(false);
  };

  const renderContent = () => {
    switch (currentView) {
      case AppView.HOME: return <Dashboard onAddMilk={handleAddClick} onChangeView={setCurrentView} records={records} />;
      case AppView.HISTORY: return <RecordList records={records} onBack={() => setCurrentView(AppView.HOME)} onEdit={handleEditClick} onDelete={handleDeleteRecord} />;
      case AppView.NOTEPAD: return <Notepad onBack={() => setCurrentView(AppView.HOME)} />;
      case AppView.CALENDAR: return <CalendarView records={records} onBack={() => setCurrentView(AppView.HOME)} onEditRecord={handleEditClick} />;
      case AppView.CALCULATOR: return <CalculatorView onBack={() => setCurrentView(AppView.HOME)} initialValue={calcDisplay} onValueChange={setCalcDisplay} onMinimize={() => { setIsFloatingCalcOpen(true); setCurrentView(AppView.HOME); }} />;
      case AppView.MANAGE: return <ManageView records={records} onBack={() => setCurrentView(AppView.HOME)} />;
      case AppView.SETTINGS: return <SettingsView onBack={() => setCurrentView(AppView.HOME)} onNavigate={setCurrentView} records={records} />;
      case AppView.TRASH: return <TrashView onBack={() => setCurrentView(AppView.SETTINGS)} />;
      case AppView.PROFILE: return <ProfileView onBack={() => setCurrentView(AppView.HOME)} />;
      default: return <Dashboard onAddMilk={handleAddClick} onChangeView={setCurrentView} records={records} />;
    }
  };

  // 1. Loading from Firebase
  if (authLoading) {
    return (
      <div className="h-[100dvh] w-full bg-blue-600 flex items-center justify-center">
        <Loader2 className="text-white animate-spin" size={48} />
      </div>
    );
  }

  // 2. Auth Guard
  if (!user) {
    return <AuthView />;
  }

  // 3. Main Application
  return (
    <div className="h-[100dvh] w-full bg-gray-50 flex flex-col font-sans text-gray-900 overflow-hidden relative">
      {currentView === AppView.HOME && <Header onMenuClick={() => setIsSidebarOpen(true)} />}
      
      <main className="flex-1 overflow-hidden relative w-full flex flex-col">
        {renderContent()}
      </main>

      <BottomNav currentView={currentView} onChangeView={setCurrentView} onAddClick={handleAddClick} />

      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        onChangeView={setCurrentView}
        onAddClick={handleAddClick}
        currentView={currentView}
        user={user}
      />

      <AddMilkModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSaveRecord} existingRecord={editingRecord} />
      <ReminderModal isOpen={isReminderOpen} onClose={() => setIsReminderOpen(false)} onDismiss={handleDismissReminder} notes={reminderNotes} />

      {isFloatingCalcOpen && (
        <FloatingCalculator initialValue={calcDisplay} onClose={() => setIsFloatingCalcOpen(false)} onExpand={() => { setIsFloatingCalcOpen(false); setCurrentView(AppView.CALCULATOR); }} onValueChange={setCalcDisplay} />
      )}
    </div>
  );
};

export default App;
