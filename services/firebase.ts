import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue, push, set, remove, update, DatabaseReference } from 'firebase/database';
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

// Use a shared namespace so all devices sync to the same data source.
// This ensures that all users share a common milk record dataset.
const SHARED_NAMESPACE = 'shared_farm_data';

// --- Milk Records ---

export const subscribeToRecords = (callback: (records: MilkRecord[]) => void) => {
  // Now pointing to a shared path instead of a user-specific one
  const recordsRef = ref(db, `milkRecords/${SHARED_NAMESPACE}`);
  
  const unsubscribe = onValue(recordsRef, (snapshot) => {
    const data = snapshot.val();
    const loadedRecords: MilkRecord[] = [];
    
    if (data) {
      Object.keys(data).forEach((key) => {
        loadedRecords.push({
          id: key,
          ...data[key]
        });
      });
    }
    // Sort by date descending
    loadedRecords.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    callback(loadedRecords);
  });

  return unsubscribe;
};

export const addRecord = async (record: Omit<MilkRecord, 'id'>) => {
  const recordsRef = ref(db, `milkRecords/${SHARED_NAMESPACE}`);
  const newRecordRef = push(recordsRef);
  await set(newRecordRef, record);
};

export const updateRecord = async (record: MilkRecord) => {
  const recordRef = ref(db, `milkRecords/${SHARED_NAMESPACE}/${record.id}`);
  const { id, ...data } = record;
  await set(recordRef, data);
};

// New: Batch mark records as paid
export const markRecordsAsPaid = async (recordIds: string[]) => {
  const updates: { [key: string]: any } = {};
  recordIds.forEach(id => {
    updates[`milkRecords/${SHARED_NAMESPACE}/${id}/status`] = 'PAID';
  });
  await update(ref(db), updates);
};

// Modified: Hard delete (used by Trash view for permanent deletion)
export const permanentDeleteRecord = async (recordId: string) => {
  const recordRef = ref(db, `deletedRecords/${SHARED_NAMESPACE}/${recordId}`);
  await remove(recordRef);
};

// New: Soft Delete (Move to Trash)
export const softDeleteRecord = async (record: MilkRecord) => {
  // 1. Add to deletedRecords
  const deletedRef = ref(db, `deletedRecords/${SHARED_NAMESPACE}/${record.id}`);
  await set(deletedRef, { ...record, deletedAt: Date.now() });

  // 2. Remove from active milkRecords
  const originalRef = ref(db, `milkRecords/${SHARED_NAMESPACE}/${record.id}`);
  await remove(originalRef);
};

// New: Subscribe to Trash
export const subscribeToTrash = (callback: (records: (MilkRecord & { deletedAt: number })[]) => void) => {
  const trashRef = ref(db, `deletedRecords/${SHARED_NAMESPACE}`);
  
  const unsubscribe = onValue(trashRef, (snapshot) => {
    const data = snapshot.val();
    const loadedRecords: (MilkRecord & { deletedAt: number })[] = [];
    
    if (data) {
      Object.keys(data).forEach((key) => {
        loadedRecords.push({
          id: key,
          ...data[key]
        });
      });
    }
    // Sort by deletedAt descending (newest deleted first)
    loadedRecords.sort((a, b) => b.deletedAt - a.deletedAt);
    callback(loadedRecords);
  });

  return unsubscribe;
};

// New: Restore from Trash
export const restoreRecord = async (record: MilkRecord) => {
    // 1. Add back to milkRecords
    const activeRef = ref(db, `milkRecords/${SHARED_NAMESPACE}/${record.id}`);
    // Remove the extra 'deletedAt' property if it exists in the object passed
    const { id, ...data } = record as any;
    delete data.deletedAt;
    
    await set(activeRef, data);
  
    // 2. Remove from deletedRecords
    const trashRef = ref(db, `deletedRecords/${SHARED_NAMESPACE}/${record.id}`);
    await remove(trashRef);
};


// --- Notes ---

export const subscribeToNotes = (callback: (notes: Note[]) => void) => {
  const notesRef = ref(db, `notes/${SHARED_NAMESPACE}`);
  
  const unsubscribe = onValue(notesRef, (snapshot) => {
    const data = snapshot.val();
    const loadedNotes: Note[] = [];
    
    if (data) {
      Object.keys(data).forEach((key) => {
        loadedNotes.push({
          id: key,
          ...data[key]
        });
      });
    }
    // Sort by timestamp descending (newest first)
    loadedNotes.sort((a, b) => b.timestamp - a.timestamp);
    callback(loadedNotes);
  });

  return unsubscribe;
};

export const addNote = async (note: Omit<Note, 'id'>) => {
  const notesRef = ref(db, `notes/${SHARED_NAMESPACE}`);
  const newNoteRef = push(notesRef);
  await set(newNoteRef, note);
};

export const updateNote = async (note: Note) => {
  const noteRef = ref(db, `notes/${SHARED_NAMESPACE}/${note.id}`);
  const { id, ...data } = note;
  await set(noteRef, data);
};

export const deleteNote = async (noteId: string) => {
  const noteRef = ref(db, `notes/${SHARED_NAMESPACE}/${noteId}`);
  await remove(noteRef);
};