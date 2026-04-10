import React from 'react';
import { X, StickyNote, Calendar, Check } from 'lucide-react';
import { Note } from '../types';

interface ReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDismiss: () => void;
  notes: Note[];
}

export const ReminderModal: React.FC<ReminderModalProps> = ({ isOpen, onClose, onDismiss, notes }) => {
  if (!isOpen) return null;
  if (notes.length === 0) return null;

  // Sort notes by timestamp descending (newest first)
  const sortedNotes = [...notes].sort((a, b) => b.timestamp - a.timestamp);
  const latestNote = sortedNotes[0];
  const otherNotes = sortedNotes.slice(1);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-300 relative">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 pt-8 text-white relative shrink-0">
            <button 
                onClick={onClose}
                className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-full backdrop-blur-md transition-colors"
            >
                <X size={20} className="text-white" />
            </button>
            
            <div className="flex items-center space-x-3 mb-2">
                <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-md shadow-inner">
                    <StickyNote size={24} className="text-white" />
                </div>
                <h2 className="text-2xl font-bold tracking-tight">Daily Notes</h2>
            </div>
            <p className="text-blue-100 text-sm font-medium opacity-90 ml-1">
                You have {notes.length} saved note{notes.length > 1 ? 's' : ''}
            </p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50 no-scrollbar">
            
            {/* Latest Note (Hero) */}
            <div className="bg-white p-5 rounded-3xl shadow-sm border border-blue-100 relative group">
                <div className="absolute top-4 right-4 text-[10px] font-bold text-blue-500 bg-blue-50 px-2 py-1 rounded-lg uppercase tracking-wider">
                    Latest
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-2 pr-12 line-clamp-1">{latestNote.title || 'Untitled Note'}</h3>
                <p className="text-gray-600 text-sm leading-relaxed mb-3 whitespace-pre-line">
                    {latestNote.content || 'No content'}
                </p>
                <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                    <Calendar size={12} />
                    <span>{new Date(latestNote.timestamp).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </div>
            </div>

            {/* Other Notes */}
            {otherNotes.length > 0 && (
                <div className="space-y-3">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Older Notes</h4>
                    {otherNotes.map(note => (
                        <div key={note.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col">
                            <h4 className="font-bold text-gray-700 text-sm mb-1">{note.title || 'Untitled'}</h4>
                            <p className="text-xs text-gray-500 line-clamp-2 mb-2">{note.content}</p>
                             <div className="text-[10px] text-gray-400 font-medium">
                                {new Date(note.timestamp).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-white border-t border-gray-100 shrink-0">
            <button 
                onClick={onDismiss}
                className="w-full py-4 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-2xl font-bold text-base transition-colors flex items-center justify-center gap-2 active:scale-95"
            >
                <Check size={20} /> Dismiss
            </button>
        </div>

      </div>
    </div>
  );
};