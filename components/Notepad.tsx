import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Search, Trash2, Save, ChevronLeft } from 'lucide-react';
import { Note } from '../types';
import { subscribeToNotes, addNote, updateNote, deleteNote } from '../services/firebase';

interface NotepadProps {
  onBack: () => void;
}

export const Notepad: React.FC<NotepadProps> = ({ onBack }) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [view, setView] = useState<'LIST' | 'EDITOR'>('LIST');
  const [currentNote, setCurrentNote] = useState<Partial<Note>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToNotes((updatedNotes) => {
      setNotes(updatedNotes);
    });
    return () => unsubscribe();
  }, []);

  const handleAddNew = () => {
    setCurrentNote({
      title: '',
      content: '',
      date: new Date().toISOString().split('T')[0],
      timestamp: Date.now()
    });
    setView('EDITOR');
  };

  const handleEdit = (note: Note) => {
    setCurrentNote(note);
    setView('EDITOR');
  };

  const handleSave = async () => {
    if (!currentNote.title?.trim() && !currentNote.content?.trim()) {
      setView('LIST');
      return;
    }

    const noteData = {
      title: currentNote.title || 'Untitled Note',
      content: currentNote.content || '',
      date: currentNote.date || new Date().toISOString().split('T')[0],
      timestamp: Date.now()
    };

    if (currentNote.id) {
      await updateNote({ ...noteData, id: currentNote.id });
    } else {
      await addNote(noteData);
    }
    setView('LIST');
  };

  const promptDelete = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setDeleteId(id);
  };

  const confirmDelete = async () => {
    if (deleteId) {
      await deleteNote(deleteId);
      setDeleteId(null);
      if (view === 'EDITOR') setView('LIST');
    }
  };

  const filteredNotes = notes.filter(note => 
    note.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    note.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderDeleteModal = () => {
    if (!deleteId) return null;
    
    return (
      <div className="fixed inset-0 z-[150] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4" onClick={() => setDeleteId(null)}>
        <div className="bg-white w-full max-w-sm rounded-[2rem] p-6 animate-in slide-in-from-bottom-10 duration-300 relative overflow-hidden text-center" onClick={e => e.stopPropagation()}>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 size={32} className="text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-800">Delete Note?</h3>
            <p className="text-gray-500 font-medium leading-relaxed mb-6">
                This action cannot be undone. This note will be permanently removed.
            </p>
            
            <div className="grid grid-cols-2 gap-3 w-full">
                <button 
                    onClick={() => setDeleteId(null)}
                    className="w-full py-4 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                >
                    Cancel
                </button>
                <button 
                    onClick={confirmDelete}
                    className="w-full py-4 bg-red-600 text-white rounded-xl font-bold shadow-lg shadow-red-200 hover:bg-red-700 active:scale-[0.98] transition-all"
                >
                    Delete
                </button>
            </div>
        </div>
      </div>
    );
  };

  // --- EDITOR VIEW ---
  if (view === 'EDITOR') {
    return (
      <div className="h-full flex flex-col bg-white animate-in slide-in-from-right duration-300 relative">
        <div className="flex items-center justify-between p-6 border-b border-gray-100 pt-safe mt-2">
          <button onClick={() => setView('LIST')} className="p-3 bg-gray-100 rounded-2xl hover:bg-gray-200 text-gray-700 shadow-sm active:scale-90 transition-all">
             <ChevronLeft size={28} />
          </button>
          <div className="flex items-center space-x-3">
            {currentNote.id && (
               <button onClick={(e) => promptDelete(currentNote.id!, e)} className="p-3 text-red-500 bg-red-50 rounded-2xl hover:bg-red-100 active:scale-90 transition-transform">
                <Trash2 size={24} />
              </button>
            )}
            <button onClick={handleSave} className="px-6 py-3 bg-blue-600 text-white text-base font-bold rounded-2xl shadow-lg shadow-blue-200 active:scale-95 transition-transform">
              Save Note
            </button>
          </div>
        </div>
        
        <div className="flex-1 flex flex-col p-8 overflow-y-auto pb-32">
          <input 
            type="text" 
            placeholder="Title" 
            value={currentNote.title}
            onChange={(e) => setCurrentNote({...currentNote, title: e.target.value})}
            className="text-4xl font-bold text-gray-800 placeholder-gray-300 outline-none mb-6 w-full bg-transparent"
          />
          <textarea 
            placeholder="Type something..." 
            value={currentNote.content}
            onChange={(e) => setCurrentNote({...currentNote, content: e.target.value})}
            className="flex-1 resize-none text-gray-600 leading-relaxed outline-none text-xl placeholder-gray-300 bg-transparent"
          />
        </div>
        
        {renderDeleteModal()}
      </div>
    );
  }

  // --- LIST VIEW ---
  return (
    <div className="h-full flex flex-col bg-gray-50 animate-in fade-in duration-300 relative">
      <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-md shadow-sm p-6 space-y-4 pt-safe">
        <div className="flex items-center space-x-4">
          <button onClick={onBack} className="p-3 bg-gray-100 rounded-2xl hover:bg-gray-200 text-gray-700 shadow-sm active:scale-90 transition-all">
            <ArrowLeft size={28} />
          </button>
          <h2 className="text-2xl font-bold text-gray-800">My Notes</h2>
        </div>
        
        {/* Search Bar */}
        <div className="relative">
          <input 
            type="text" 
            placeholder="Search notes..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-200 text-base font-medium"
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={24} />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar p-6 pb-32 space-y-4">
        {filteredNotes.length === 0 ? (
          <div className="flex flex-col items-center justify-center pt-24 text-gray-400">
            <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mb-4">
              <Plus size={40} className="text-gray-400" />
            </div>
            <p className="text-lg">No notes yet</p>
          </div>
        ) : (
          filteredNotes.map(note => (
            <div 
              key={note.id} 
              onClick={() => handleEdit(note)}
              className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 active:scale-[0.99] transition-transform relative group"
            >
              <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-xl text-gray-800 line-clamp-1 pr-10">{note.title}</h3>
                  <button 
                    onClick={(e) => promptDelete(note.id, e)}
                    className="p-2 -mr-2 -mt-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors absolute right-4 top-4"
                  >
                    <Trash2 size={20} />
                  </button>
              </div>
              <p className="text-base text-gray-500 line-clamp-2 mb-4">{note.content}</p>
              <div className="text-sm font-medium text-gray-400">
                {new Date(note.timestamp).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
              </div>
            </div>
          ))
        )}
      </div>

      <button 
        onClick={handleAddNew}
        className="absolute bottom-28 right-6 w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-2xl shadow-blue-300 hover:scale-110 transition-transform active:scale-90 z-20"
      >
        <Plus size={32} strokeWidth={3} />
      </button>

      {renderDeleteModal()}
    </div>
  );
};