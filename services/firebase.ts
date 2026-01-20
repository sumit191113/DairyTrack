import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue, set, remove, update, get } from 'firebase/database';
import { MilkRecord, Note } from '../types';

const firebaseConfig = {
  apiKey: "AIzaSyALCuAEfJjgmxeip41Dji6HUEKIosi0Aik",
  authDomain: "milkrecordapp.firebaseapp.com",
  databaseURL: "https://milkrecordapp-default-rtdb.firebaseio.com",
  projectId: "milkrecordapp",
  storageBucket: "milkrecordapp.firebasestorage.app",
  messagingSenderId: "797212369388",
  appId: "1:797212369388:web:5e082b93ad9e23bbf3a0c9"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const SHARED_NAMESPACE = 'shared_farm_data';
const LOCAL_STORAGE_KEY_RECORDS = 'dairy_pending_records';
const LOCAL_STORAGE_KEY_NOTES = 'dairy_pending_notes';
const LOCAL_STORAGE_KEY_DELETED = 'dairy_pending_deleted';

// --- Helpers ---

// Generate a unique ID locally (Timestamp + Random) to ensure no collision during offline creation
const generateId = () => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Check if online
const isOnline = () => navigator.onLine;

// --- Local Storage Helpers ---

const getLocalPending = <T>(key: string): T[] => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : [];
  } catch {
    return [];
  }
};

const setLocalPending = <T>(key: string, data: T[]) => {
  localStorage.setItem(key, JSON.stringify(data));
};

// --- State & Notification Logic ---

const recordListeners: ((records: MilkRecord[]) => void)[] = [];
let cachedServerRecords: MilkRecord[] = [];

const noteListeners: ((notes: Note[]) => void)[] = [];
let cachedServerNotes: Note[] = [];

// Notify Record Subscribers (Merges Server + Pending)
const notifyRecordListeners = () => {
  const pending = getLocalPending<MilkRecord>(LOCAL_STORAGE_KEY_RECORDS);
  
  // Merge Strategy: Pending records override server records with same ID
  const recordMap = new Map<string, MilkRecord>();
  
  // 1. Populate with server data
  cachedServerRecords.forEach(r => recordMap.set(r.id, r));
  
  // 2. Overlay pending data
  pending.forEach(r => recordMap.set(r.id, r));

  const combined = Array.from(recordMap.values());
  
  // Sort by Date Descending
  combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  recordListeners.forEach(cb => cb(combined));
};

// Notify Note Subscribers (Merges Server + Pending)
const notifyNoteListeners = () => {
  const pending = getLocalPending<Note>(LOCAL_STORAGE_KEY_NOTES);
  const noteMap = new Map<string, Note>();
  
  cachedServerNotes.forEach(n => noteMap.set(n.id, n));
  pending.forEach(n => noteMap.set(n.id, n));

  const combined = Array.from(noteMap.values());
  // Sort by Timestamp Descending
  combined.sort((a, b) => b.timestamp - a.timestamp);
  
  noteListeners.forEach(cb => cb(combined));
};

// --- Synchronization Logic ---

// Generic Sync Function
export const syncAllPendingData = async () => {
  if (!isOnline()) return;

  // 1. Sync Records
  const pendingRecords = getLocalPending<MilkRecord>(LOCAL_STORAGE_KEY_RECORDS);
  if (pendingRecords.length > 0) {
    const remainingRecords: MilkRecord[] = [];
    
    for (const record of pendingRecords) {
      try {
        // Use SET instead of PUSH with the local ID to ensure idempotency (no duplicates)
        const recordRef = ref(db, `milkRecords/${SHARED_NAMESPACE}/${record.id}`);
        const { pendingSync, ...cleanRecord } = record;
        await set(recordRef, cleanRecord);
      } catch (e) {
        console.error("Failed to sync record", record.id, e);
        remainingRecords.push(record); // Keep in queue if failed
      }
    }
    setLocalPending(LOCAL_STORAGE_KEY_RECORDS, remainingRecords);
    notifyRecordListeners(); // Refresh UI to remove 'pending' status
  }

  // 2. Sync Notes
  const pendingNotes = getLocalPending<Note>(LOCAL_STORAGE_KEY_NOTES);
  if (pendingNotes.length > 0) {
    const remainingNotes: Note[] = [];
    for (const note of pendingNotes) {
      try {
        const noteRef = ref(db, `notes/${SHARED_NAMESPACE}/${note.id}`);
        const { pendingSync, ...cleanNote } = note;
        await set(noteRef, cleanNote);
      } catch (e) {
        remainingNotes.push(note);
      }
    }
    setLocalPending(LOCAL_STORAGE_KEY_NOTES, remainingNotes);
    notifyNoteListeners(); // Refresh UI to remove 'pending' status
  }

  // 3. Sync Deletions (Soft Deletes / Moves)
  const pendingDeletions = getLocalPending<{id: string, path: string}>(LOCAL_STORAGE_KEY_DELETED);
  if (pendingDeletions.length > 0) {
    const remainingDeletions: typeof pendingDeletions = [];
    for (const item of pendingDeletions) {
        try {
            const refToDelete = ref(db, item.path);
            await remove(refToDelete);
        } catch (e) {
            remainingDeletions.push(item);
        }
    }
    setLocalPending(LOCAL_STORAGE_KEY_DELETED, remainingDeletions);
  }
};

// Auto-sync listeners
window.addEventListener('online', syncAllPendingData);
// Initial sync attempt on load
setTimeout(syncAllPendingData, 2000);


// --- Milk Records Manager ---

export const subscribeToRecords = (callback: (records: MilkRecord[]) => void) => {
  recordListeners.push(callback);
  
  // Listen to Firebase
  const recordsRef = ref(db, `milkRecords/${SHARED_NAMESPACE}`);
  const unsubscribe = onValue(recordsRef, (snapshot) => {
    const data = snapshot.val();
    const loadedRecords: MilkRecord[] = [];
    if (data) {
      Object.keys(data).forEach((key) => {
        loadedRecords.push({ id: key, ...data[key] });
      });
    }
    cachedServerRecords = loadedRecords;
    notifyRecordListeners(); // Merge and notify
  });

  // Initial notify with whatever local data we have
  notifyRecordListeners();

  return () => {
      const index = recordListeners.indexOf(callback);
      if (index > -1) recordListeners.splice(index, 1);
      unsubscribe();
  };
};

export const addRecord = async (recordData: Omit<MilkRecord, 'id'>) => {
  // 1. Generate Local ID
  const newId = generateId();
  const newRecord: MilkRecord = { 
      ...recordData, 
      id: newId, 
      pendingSync: true 
  };

  // 2. Save to Local Pending
  const pending = getLocalPending<MilkRecord>(LOCAL_STORAGE_KEY_RECORDS);
  pending.push(newRecord);
  setLocalPending(LOCAL_STORAGE_KEY_RECORDS, pending);

  // 3. Update UI Immediately
  notifyRecordListeners();

  // 4. Try Sync
  if (isOnline()) {
      syncAllPendingData();
  }
};

export const updateRecord = async (record: MilkRecord) => {
  // Logic: treat update like an overwrite. 
  // If it's pending, update in pending. If it's server, add to pending with same ID.
  
  const pending = getLocalPending<MilkRecord>(LOCAL_STORAGE_KEY_RECORDS);
  const index = pending.findIndex(r => r.id === record.id);
  
  if (index >= 0) {
      // Update existing pending
      pending[index] = { ...record, pendingSync: true };
      setLocalPending(LOCAL_STORAGE_KEY_RECORDS, pending);
  } else {
      // Add to pending to overwrite server
      pending.push({ ...record, pendingSync: true });
      setLocalPending(LOCAL_STORAGE_KEY_RECORDS, pending);
  }

  notifyRecordListeners();
  if (isOnline()) syncAllPendingData();
};

export const markRecordsAsPaid = async (recordIds: string[]) => {
    // Treat as bulk update
    const pending = getLocalPending<MilkRecord>(LOCAL_STORAGE_KEY_RECORDS);
    const updates: MilkRecord[] = [];

    recordIds.forEach(id => {
        // Find current version (pending prefers)
        const currentPending = pending.find(r => r.id === id);
        const currentServer = cachedServerRecords.find(r => r.id === id);
        const base = currentPending || currentServer;

        if (base) {
            updates.push({ ...base, status: 'PAID' as const });
        }
    });

    for (const u of updates) {
        await updateRecord(u);
    }
};

export const softDeleteRecord = async (record: MilkRecord) => {
  // 1. Queue removal from main list (Deletion Queue)
  const pendingDeletions = getLocalPending<{id: string, path: string}>(LOCAL_STORAGE_KEY_DELETED);
  pendingDeletions.push({ id: record.id, path: `milkRecords/${SHARED_NAMESPACE}/${record.id}` });
  setLocalPending(LOCAL_STORAGE_KEY_DELETED, pendingDeletions);

  // 2. Remove from pending records if it exists there (stop it from syncing back)
  let pendingRecords = getLocalPending<MilkRecord>(LOCAL_STORAGE_KEY_RECORDS);
  pendingRecords = pendingRecords.filter(r => r.id !== record.id);
  setLocalPending(LOCAL_STORAGE_KEY_RECORDS, pendingRecords);

  // 3. Optimistic UI Update: Hide from cache temporarily until server confirms deletion
  cachedServerRecords = cachedServerRecords.filter(r => r.id !== record.id);
  notifyRecordListeners();
  
  // 4. If online, do the actual swap immediately for better UX
  if (isOnline()) {
      const deletedRef = ref(db, `deletedRecords/${SHARED_NAMESPACE}/${record.id}`);
      await set(deletedRef, { ...record, deletedAt: Date.now() });
      const originalRef = ref(db, `milkRecords/${SHARED_NAMESPACE}/${record.id}`);
      await remove(originalRef);
  } else {
      // Offline fallback: The deletion queue handles removal from main list.
      // Ideally we should also queue adding to trash, but for simplicity we rely on main list removal.
  }
};

export const subscribeToTrash = (callback: (records: (MilkRecord & { deletedAt: number })[]) => void) => {
  const trashRef = ref(db, `deletedRecords/${SHARED_NAMESPACE}`);
  return onValue(trashRef, (snapshot) => {
    const data = snapshot.val();
    const loadedRecords: (MilkRecord & { deletedAt: number })[] = [];
    if (data) {
      Object.keys(data).forEach((key) => {
        loadedRecords.push({ id: key, ...data[key] });
      });
    }
    loadedRecords.sort((a, b) => b.deletedAt - a.deletedAt);
    callback(loadedRecords);
  });
};

export const permanentDeleteRecord = async (recordId: string) => {
    if (isOnline()) {
        const recordRef = ref(db, `deletedRecords/${SHARED_NAMESPACE}/${recordId}`);
        await remove(recordRef);
    }
};

export const restoreRecord = async (record: MilkRecord) => {
    if (isOnline()) {
        const activeRef = ref(db, `milkRecords/${SHARED_NAMESPACE}/${record.id}`);
        const { id, ...data } = record as any;
        delete data.deletedAt;
        await set(activeRef, data);
        const trashRef = ref(db, `deletedRecords/${SHARED_NAMESPACE}/${record.id}`);
        await remove(trashRef);
    }
};


// --- Notes Manager (Offline First) ---

export const subscribeToNotes = (callback: (notes: Note[]) => void) => {
  noteListeners.push(callback);
  
  const notesRef = ref(db, `notes/${SHARED_NAMESPACE}`);
  const unsubscribe = onValue(notesRef, (snapshot) => {
    const data = snapshot.val();
    const loadedNotes: Note[] = [];
    if (data) {
      Object.keys(data).forEach((key) => {
        loadedNotes.push({ id: key, ...data[key] });
      });
    }
    cachedServerNotes = loadedNotes;
    notifyNoteListeners();
  });

  notifyNoteListeners();

  return () => {
      const index = noteListeners.indexOf(callback);
      if (index > -1) noteListeners.splice(index, 1);
      unsubscribe();
  };
};

export const addNote = async (noteData: Omit<Note, 'id'>) => {
  const newId = generateId();
  const newNote: Note = { ...noteData, id: newId, pendingSync: true };
  
  const pending = getLocalPending<Note>(LOCAL_STORAGE_KEY_NOTES);
  pending.push(newNote);
  setLocalPending(LOCAL_STORAGE_KEY_NOTES, pending);
  
  notifyNoteListeners();
  if (isOnline()) syncAllPendingData();
};

export const updateNote = async (note: Note) => {
  const pending = getLocalPending<Note>(LOCAL_STORAGE_KEY_NOTES);
  const index = pending.findIndex(n => n.id === note.id);
  
  if (index >= 0) {
      pending[index] = { ...note, pendingSync: true };
      setLocalPending(LOCAL_STORAGE_KEY_NOTES, pending);
  } else {
      pending.push({ ...note, pendingSync: true });
      setLocalPending(LOCAL_STORAGE_KEY_NOTES, pending);
  }

  notifyNoteListeners();
  if (isOnline()) syncAllPendingData();
};

export const deleteNote = async (noteId: string) => {
  // Remove from pending
  let pending = getLocalPending<Note>(LOCAL_STORAGE_KEY_NOTES);
  pending = pending.filter(n => n.id !== noteId);
  setLocalPending(LOCAL_STORAGE_KEY_NOTES, pending);
  
  // Hide from cache
  cachedServerNotes = cachedServerNotes.filter(n => n.id !== noteId);
  notifyNoteListeners();

  if (isOnline()) {
      const noteRef = ref(db, `notes/${SHARED_NAMESPACE}/${noteId}`);
      await remove(noteRef);
  } else {
      // Queue deletion
       const pendingDeletions = getLocalPending<{id: string, path: string}>(LOCAL_STORAGE_KEY_DELETED);
       pendingDeletions.push({ id: noteId, path: `notes/${SHARED_NAMESPACE}/${noteId}` });
       setLocalPending(LOCAL_STORAGE_KEY_DELETED, pendingDeletions);
  }
};