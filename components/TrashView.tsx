import React, { useState, useEffect } from 'react';
import { ArrowLeft, RefreshCw, Trash2, AlertTriangle, History, AlertCircle } from 'lucide-react';
import { MilkRecord } from '../types';
import { subscribeToTrash, restoreRecord, permanentDeleteRecord } from '../services/firebase';

interface TrashViewProps {
  onBack: () => void;
}

export const TrashView: React.FC<TrashViewProps> = ({ onBack }) => {
  const [deletedRecords, setDeletedRecords] = useState<(MilkRecord & { deletedAt: number })[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmAction, setConfirmAction] = useState<{ id: string, type: 'RESTORE' | 'DELETE' } | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToTrash((records) => {
      setDeletedRecords(records);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Auto-clean helper (Client side check for MVP)
  useEffect(() => {
    if (deletedRecords.length > 0) {
        const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
        const now = Date.now();
        
        deletedRecords.forEach(async (r) => {
            if (now - r.deletedAt > thirtyDaysMs) {
                await permanentDeleteRecord(r.id);
            }
        });
    }
  }, [deletedRecords]);

  const handleConfirm = async () => {
    if (!confirmAction) return;

    if (confirmAction.type === 'RESTORE') {
        const record = deletedRecords.find(r => r.id === confirmAction.id);
        if (record) await restoreRecord(record);
    } else {
        await permanentDeleteRecord(confirmAction.id);
    }
    setConfirmAction(null);
  };

  return (
    <div className="h-full bg-gray-50 flex flex-col animate-in slide-in-from-right duration-300">
      
      {/* Header */}
      <div className="flex items-center space-x-4 p-6 bg-white shadow-sm z-10 sticky top-0 pt-safe">
        <button onClick={onBack} className="p-3 bg-gray-100 rounded-2xl hover:bg-gray-200 transition-colors shadow-sm active:scale-90">
            <ArrowLeft size={28} className="text-gray-700" />
        </button>
        <div>
            <h2 className="text-2xl font-bold text-gray-800">Recently Deleted</h2>
            <p className="text-xs text-gray-500">Items removed in last 30 days</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar pb-32 p-6">
        
        {loading ? (
             <div className="flex justify-center mt-10"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>
        ) : deletedRecords.length === 0 ? (
            <div className="flex flex-col items-center justify-center pt-20 opacity-50">
                <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mb-4">
                    <Trash2 size={40} className="text-gray-400" />
                </div>
                <p className="text-lg font-medium text-gray-500">Trash is empty</p>
            </div>
        ) : (
            <div className="space-y-4">
                 <div className="bg-orange-50 p-4 rounded-xl flex items-start space-x-3 mb-6">
                    <AlertTriangle className="text-orange-500 shrink-0 mt-0.5" size={20} />
                    <p className="text-sm text-orange-800 font-medium leading-tight">
                        Records in this list will be automatically deleted permanently after 30 days.
                    </p>
                 </div>

                {deletedRecords.map(record => (
                    <div key={record.id} className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h4 className="font-bold text-gray-800 text-lg">{record.quantity} Liters</h4>
                                <p className="text-sm text-gray-500">
                                    {new Date(record.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                </p>
                            </div>
                            <span className="px-2 py-1 bg-gray-100 rounded-lg text-xs font-bold text-gray-500 flex items-center gap-1">
                                <History size={12} />
                                Deleted {Math.ceil((Date.now() - record.deletedAt) / (1000 * 60 * 60 * 24))}d ago
                            </span>
                        </div>
                        
                        <div className="flex items-center gap-3 pt-2 border-t border-gray-50 mt-2">
                             <button 
                                onClick={() => setConfirmAction({ id: record.id, type: 'RESTORE' })}
                                className="flex-1 py-3 bg-blue-50 text-blue-600 rounded-xl font-bold text-sm hover:bg-blue-100 transition-colors flex items-center justify-center gap-2 active:scale-95"
                            >
                                <RefreshCw size={18} /> Restore
                             </button>
                             <button 
                                onClick={() => setConfirmAction({ id: record.id, type: 'DELETE' })}
                                className="flex-1 py-3 bg-red-50 text-red-600 rounded-xl font-bold text-sm hover:bg-red-100 transition-colors flex items-center justify-center gap-2 active:scale-95"
                            >
                                <Trash2 size={18} /> Delete
                             </button>
                        </div>
                    </div>
                ))}
            </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {confirmAction && (
        <div className="fixed inset-0 z-[150] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4" onClick={() => setConfirmAction(null)}>
            <div className="bg-white w-full max-w-sm rounded-[2rem] p-6 animate-in slide-in-from-bottom-10 duration-300 relative overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="flex flex-col items-center text-center space-y-4">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-2 ${confirmAction.type === 'RESTORE' ? 'bg-blue-100' : 'bg-red-100'}`}>
                        {confirmAction.type === 'RESTORE' ? (
                             <RefreshCw size={32} className="text-blue-600" />
                        ) : (
                             <AlertCircle size={32} className="text-red-600" />
                        )}
                    </div>
                    <h3 className="text-xl font-bold text-gray-800">
                        {confirmAction.type === 'RESTORE' ? 'Restore Record?' : 'Delete Permanently?'}
                    </h3>
                    <p className="text-gray-500 font-medium leading-relaxed">
                        {confirmAction.type === 'RESTORE' 
                            ? 'This record will be moved back to your active history.' 
                            : 'This action cannot be undone. The record will be lost forever.'}
                    </p>
                    
                    <div className="grid grid-cols-2 gap-3 w-full mt-4">
                        <button 
                            onClick={() => setConfirmAction(null)}
                            className="w-full py-4 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={handleConfirm}
                            className={`w-full py-4 text-white rounded-xl font-bold shadow-lg active:scale-[0.98] transition-all ${
                                confirmAction.type === 'RESTORE' 
                                ? 'bg-blue-600 shadow-blue-200 hover:bg-blue-700' 
                                : 'bg-red-600 shadow-red-200 hover:bg-red-700'
                            }`}
                        >
                            {confirmAction.type === 'RESTORE' ? 'Restore' : 'Delete'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}

    </div>
  );
};