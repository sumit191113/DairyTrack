
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue, set, remove, update, get } from 'firebase/database';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  sendPasswordResetEmail,
  User
} from 'firebase/auth';
import { MilkRecord, Note } from '../types';

const firebaseConfig = {
  apiKey: "AIzaSyAKOyQ-bm0RN6dllgWRsa3Zi8veUvqu548",
  authDomain: "milkrecord-bc81a.firebaseapp.com",
  databaseURL: "https://milkrecord-bc81a-default-rtdb.firebaseio.com",
  projectId: "milkrecord-bc81a",
  storageBucket: "milkrecord-bc81a.firebasestorage.app",
  messagingSenderId: "833623159257",
  appId: "1:833623159257:web:94c90cb5f0fef6d4d269c8",
  measurementId: "G-WTVFES3PS3"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);

let currentUid: string | null = null;

const LOCAL_STORAGE_KEY_RECORDS = 'dairy_pending_records';
const LOCAL_STORAGE_KEY_NOTES = 'dairy_pending_notes';
const LOCAL_STORAGE_KEY_DELETED = 'dairy_pending_deleted';

// --- Auth Functions ---

export const signUp = (email: string, pass: string) => createUserWithEmailAndPassword(auth, email, pass);
export const signIn = (email: string, pass: string) => signInWithEmailAndPassword(auth, email, pass);
export const logOut = () => signOut(auth);
export const resetPassword = (email: string) => sendPasswordResetEmail(auth, email);

export const subscribeToAuth = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, (user) => {
    currentUid = user ? user.uid : null;
    callback(user);
  });
};

// --- Helpers ---
const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
const isOnline = () => navigator.onLine;

const getLocalPending = <T>(key: string): T[] => {
  try {
    const item = localStorage.getItem(`${currentUid}_${key}`);
    return item ? JSON.parse(item) : [];
  } catch { return []; }
};

const setLocalPending = <T>(key: string, data: T[]) => {
  localStorage.setItem(`${currentUid}_${key}`, JSON.stringify(data));
};

// --- Synchronization Logic ---

export const syncAllPendingData = async () => {
  if (!isOnline() || !currentUid) return;

  const uid = currentUid;

  // 1. Records
  const pendingRecords = getLocalPending<MilkRecord>(LOCAL_STORAGE_KEY_RECORDS);
  if (pendingRecords.length > 0) {
    const remaining: MilkRecord[] = [];
    for (const record of pendingRecords) {
      try {
        const recordRef = ref(db, `milkData/${uid}/milkRecords/${record.id}`);
        const { pendingSync, ...clean } = record;
        await set(recordRef, clean);
      } catch { remaining.push(record); }
    }
    setLocalPending(LOCAL_STORAGE_KEY_RECORDS, remaining);
    notifyRecordListeners();
  }

  // 2. Notes
  const pendingNotes = getLocalPending<Note>(LOCAL_STORAGE_KEY_NOTES);
  if (pendingNotes.length > 0) {
    const remaining: Note[] = [];
    for (const note of pendingNotes) {
      try {
        const noteRef = ref(db, `milkData/${uid}/notes/${note.id}`);
        const { pendingSync, ...clean } = note;
        await set(noteRef, clean);
      } catch { remaining.push(note); }
    }
    setLocalPending(LOCAL_STORAGE_KEY_NOTES, remaining);
    notifyNoteListeners();
  }

  // 3. Deletions
  const pendingDeletes = getLocalPending<{id: string, path: string}>(LOCAL_STORAGE_KEY_DELETED);
  if (pendingDeletes.length > 0) {
    const remaining: any[] = [];
    for (const item of pendingDeletes) {
        try { await remove(ref(db, item.path)); } catch { remaining.push(item); }
    }
    setLocalPending(LOCAL_STORAGE_KEY_DELETED, remaining);
  }
};

window.addEventListener('online', syncAllPendingData);

// --- Subscriptions ---

const recordListeners: ((records: MilkRecord[]) => void)[] = [];
let cachedServerRecords: MilkRecord[] = [];

const notifyRecordListeners = () => {
  const pending = getLocalPending<MilkRecord>(LOCAL_STORAGE_KEY_RECORDS);
  const recordMap = new Map<string, MilkRecord>();
  cachedServerRecords.forEach(r => recordMap.set(r.id, r));
  pending.forEach(r => recordMap.set(r.id, r));
  const combined = Array.from(recordMap.values());
  combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  recordListeners.forEach(cb => cb(combined));
};

export const subscribeToRecords = (callback: (records: MilkRecord[]) => void) => {
  if (!currentUid) return () => {};
  recordListeners.push(callback);
  const recordsRef = ref(db, `milkData/${currentUid}/milkRecords`);
  const unsubscribe = onValue(recordsRef, (snapshot) => {
    const data = snapshot.val();
    cachedServerRecords = data ? Object.keys(data).map(key => ({ id: key, ...data[key] })) : [];
    notifyRecordListeners();
  });
  notifyRecordListeners();
  return () => {
    recordListeners.splice(recordListeners.indexOf(callback), 1);
    unsubscribe();
  };
};

const noteListeners: ((notes: Note[]) => void)[] = [];
let cachedServerNotes: Note[] = [];

const notifyNoteListeners = () => {
  const pending = getLocalPending<Note>(LOCAL_STORAGE_KEY_NOTES);
  const noteMap = new Map<string, Note>();
  cachedServerNotes.forEach(n => noteMap.set(n.id, n));
  pending.forEach(n => noteMap.set(n.id, n));
  const combined = Array.from(noteMap.values());
  combined.sort((a, b) => b.timestamp - a.timestamp);
  noteListeners.forEach(cb => cb(combined));
};

export const subscribeToNotes = (callback: (notes: Note[]) => void) => {
  if (!currentUid) return () => {};
  noteListeners.push(callback);
  const notesRef = ref(db, `milkData/${currentUid}/notes`);
  const unsubscribe = onValue(notesRef, (snapshot) => {
    const data = snapshot.val();
    cachedServerNotes = data ? Object.keys(data).map(key => ({ id: key, ...data[key] })) : [];
    notifyNoteListeners();
  });
  notifyNoteListeners();
  return () => {
    noteListeners.splice(noteListeners.indexOf(callback), 1);
    unsubscribe();
  };
};

// --- Mutations ---

export const addRecord = async (recordData: Omit<MilkRecord, 'id'>) => {
  const newId = generateId();
  const newRecord: MilkRecord = { ...recordData, id: newId, pendingSync: true };
  const pending = getLocalPending<MilkRecord>(LOCAL_STORAGE_KEY_RECORDS);
  pending.push(newRecord);
  setLocalPending(LOCAL_STORAGE_KEY_RECORDS, pending);
  notifyRecordListeners();
  if (isOnline()) syncAllPendingData();
};

export const updateRecord = async (record: MilkRecord) => {
  const pending = getLocalPending<MilkRecord>(LOCAL_STORAGE_KEY_RECORDS);
  const idx = pending.findIndex(r => r.id === record.id);
  if (idx >= 0) pending[idx] = { ...record, pendingSync: true };
  else pending.push({ ...record, pendingSync: true });
  setLocalPending(LOCAL_STORAGE_KEY_RECORDS, pending);
  notifyRecordListeners();
  if (isOnline()) syncAllPendingData();
};

export const updateRecordsStatus = async (ids: string[], status: 'PAID' | 'UNPAID') => {
  for (const id of ids) {
    const base = cachedServerRecords.find(r => r.id === id) || getLocalPending<MilkRecord>(LOCAL_STORAGE_KEY_RECORDS).find(r => r.id === id);
    if (base) await updateRecord({ ...base, status });
  }
};

export const softDeleteRecord = async (record: MilkRecord) => {
  if (!currentUid) return;
  const uid = currentUid;
  const pendingDeletes = getLocalPending<{id: string, path: string}>(LOCAL_STORAGE_KEY_DELETED);
  pendingDeletes.push({ id: record.id, path: `milkData/${uid}/milkRecords/${record.id}` });
  setLocalPending(LOCAL_STORAGE_KEY_DELETED, pendingDeletes);

  let records = getLocalPending<MilkRecord>(LOCAL_STORAGE_KEY_RECORDS);
  setLocalPending(LOCAL_STORAGE_KEY_RECORDS, records.filter(r => r.id !== record.id));

  cachedServerRecords = cachedServerRecords.filter(r => r.id !== record.id);
  notifyRecordListeners();

  if (isOnline()) {
    await set(ref(db, `milkData/${uid}/trash/${record.id}`), { ...record, deletedAt: Date.now() });
    await remove(ref(db, `milkData/${uid}/milkRecords/${record.id}`));
  }
};

export const subscribeToTrash = (callback: (records: (MilkRecord & { deletedAt: number })[]) => void) => {
  if (!currentUid) return () => {};
  const trashRef = ref(db, `milkData/${currentUid}/trash`);
  return onValue(trashRef, (snapshot) => {
    const data = snapshot.val();
    const loaded = data ? Object.keys(data).map(key => ({ id: key, ...data[key] })) : [];
    loaded.sort((a, b) => b.deletedAt - a.deletedAt);
    callback(loaded);
  });
};

export const permanentDeleteRecord = async (id: string) => {
  if (isOnline() && currentUid) await remove(ref(db, `milkData/${currentUid}/trash/${id}`));
};

export const restoreRecord = async (record: MilkRecord) => {
  if (isOnline() && currentUid) {
    const { id, ...data } = record as any;
    delete data.deletedAt;
    await set(ref(db, `milkData/${currentUid}/milkRecords/${record.id}`), data);
    await remove(ref(db, `milkData/${currentUid}/trash/${record.id}`));
  }
};

export const addNote = async (data: Omit<Note, 'id'>) => {
  const id = generateId();
  const note = { ...data, id, pendingSync: true };
  const pending = getLocalPending<Note>(LOCAL_STORAGE_KEY_NOTES);
  pending.push(note);
  setLocalPending(LOCAL_STORAGE_KEY_NOTES, pending);
  notifyNoteListeners();
  if (isOnline()) syncAllPendingData();
};

export const updateNote = async (note: Note) => {
  const pending = getLocalPending<Note>(LOCAL_STORAGE_KEY_NOTES);
  const idx = pending.findIndex(n => n.id === note.id);
  if (idx >= 0) pending[idx] = { ...note, pendingSync: true };
  else pending.push({ ...note, pendingSync: true });
  setLocalPending(LOCAL_STORAGE_KEY_NOTES, pending);
  notifyNoteListeners();
  if (isOnline()) syncAllPendingData();
};

export const deleteNote = async (id: string) => {
  if (!currentUid) return;
  const uid = currentUid;
  let pending = getLocalPending<Note>(LOCAL_STORAGE_KEY_NOTES);
  setLocalPending(LOCAL_STORAGE_KEY_NOTES, pending.filter(n => n.id !== id));
  cachedServerNotes = cachedServerNotes.filter(n => n.id !== id);
  notifyNoteListeners();

  if (isOnline()) await remove(ref(db, `milkData/${uid}/notes/${id}`));
  else {
    const deletes = getLocalPending<{id: string, path: string}>(LOCAL_STORAGE_KEY_DELETED);
    deletes.push({ id, path: `milkData/${uid}/notes/${id}` });
    setLocalPending(LOCAL_STORAGE_KEY_DELETED, deletes);
  }
};
