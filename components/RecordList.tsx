import React, { useState, useMemo, useEffect } from 'react';
import { MilkRecord, FolderSummary } from '../types';
import { Folder, ChevronRight, Droplets, Banknote, Edit2, Trash2, ArrowLeft, TrendingUp, AlertTriangle, FileText, CheckCircle2, Clock, CloudUpload, Sun, Moon } from 'lucide-react';

interface RecordListProps {
  records: MilkRecord[];
  onBack: () => void;
  onEdit: (record: MilkRecord) => void;
  onDelete: (id: string) => void;
}

export const RecordList: React.FC<RecordListProps> = ({ records, onBack, onEdit, onDelete }) => {
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Group records by 10-day periods
  const folders = useMemo(() => {
    const grouped: { [key: string]: FolderSummary } = {};

    records.forEach(record => {
      const date = new Date(record.date);
      const day = date.getDate();
      const month = date.toLocaleString('default', { month: 'short' });
      const year = date.getFullYear();

      let period = 1;
      let rangeLabel = `1–10 ${month}`;
      let startD = 1;
      let endD = 10;

      if (day > 10 && day <= 20) {
        period = 2;
        rangeLabel = `11–20 ${month}`;
        startD = 11;
        endD = 20;
      } else if (day > 20) {
        period = 3;
        // Determine last day of month
        const lastDay = new Date(year, date.getMonth() + 1, 0).getDate();
        rangeLabel = `21–${lastDay} ${month}`;
        startD = 21;
        endD = lastDay;
      }

      const folderId = `${year}-${date.getMonth()}-${period}`;

      if (!grouped[folderId]) {
        grouped[folderId] = {
          id: folderId,
          label: rangeLabel,
          startDate: `${year}-${date.getMonth() + 1}-${startD}`,
          endDate: `${year}-${date.getMonth() + 1}-${endD}`,
          totalQuantity: 0,
          totalAmount: 0,
          avgPricePerLiter: 0,
          records: []
        };
      }

      grouped[folderId].records.push(record);
      grouped[folderId].totalQuantity += record.quantity;
      grouped[folderId].totalAmount += record.totalPrice;
    });

    // Calculate averages and turn into array
    return Object.values(grouped).map(folder => ({
      ...folder,
      avgPricePerLiter: folder.totalQuantity > 0 ? folder.totalAmount / folder.totalQuantity : 0
    })).sort((a, b) => b.id.localeCompare(a.id)); // Sort new folders first
  }, [records]);

  // Calculate overall statistics
  const overallStats = useMemo(() => {
    return records.reduce((acc, curr) => ({
      quantity: acc.quantity + curr.quantity,
      amount: acc.amount + curr.totalPrice,
      count: acc.count + 1
    }), { quantity: 0, amount: 0, count: 0 });
  }, [records]);

  const selectedFolder = folders.find(f => f.id === selectedFolderId);

  // Effect: Handle case where folder becomes empty after deletion
  useEffect(() => {
    if (selectedFolderId && !selectedFolder) {
      setSelectedFolderId(null);
    }
  }, [selectedFolderId, selectedFolder]);

  const handleDeleteConfirm = () => {
    if (deleteId) {
        onDelete(deleteId);
        setDeleteId(null);
    }
  };

  // View: Folder List
  if (!selectedFolderId) {
    return (
      <div className="h-full flex flex-col bg-gray-50 animate-in slide-in-from-right-10 duration-300">
        <div className="bg-white/90 backdrop-blur-md px-6 py-4 flex items-center space-x-4 border-b border-gray-100 pt-safe sticky top-0 z-20">
          <button onClick={onBack} className="p-3 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors active:scale-90 shadow-sm">
            <ArrowLeft size={24} className="text-gray-700" />
          </button>
          <h2 className="text-2xl font-bold text-gray-800">Milk History</h2>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar p-6 pb-32">
            {/* Extremely Compact Overall Summary Card */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-500 rounded-3xl p-4 text-white shadow-md shadow-blue-100 mb-6">
                <div className="grid grid-cols-3 gap-2 text-center divide-x divide-blue-400/50">
                    <div>
                        <p className="text-blue-100 text-[9px] font-black uppercase tracking-wider mb-0.5">Total Milk</p>
                        <p className="font-black text-lg">{overallStats.quantity.toFixed(1)}<span className="text-[10px] ml-0.5 font-bold">L</span></p>
                    </div>
                    <div>
                        <p className="text-blue-100 text-[9px] font-black uppercase tracking-wider mb-0.5">Earnings</p>
                        <p className="font-black text-lg">₹{overallStats.amount.toLocaleString()}</p>
                    </div>
                    <div>
                        <p className="text-blue-100 text-[9px] font-black uppercase tracking-wider mb-0.5">Entries</p>
                        <p className="font-black text-lg">{overallStats.count}</p>
                    </div>
                </div>
            </div>

            <h3 className="text-[10px] font-black text-gray-400 mb-3 px-1 uppercase tracking-widest">Recent Folders</h3>

            {folders.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400 bg-white rounded-3xl border border-dashed border-gray-200">
                <Folder size={64} className="mb-6 opacity-50" />
                <p className="text-lg">No records found.</p>
            </div>
            ) : (
            <div className="space-y-4">
                {folders.map(folder => (
                <div key={folder.id} className="p-[3.5px] bg-gradient-to-br from-blue-600 via-blue-400 to-indigo-500 rounded-[1.8rem] shadow-lg shadow-blue-50 transition-transform active:scale-[0.98]">
                    <button 
                        onClick={() => setSelectedFolderId(folder.id)}
                        className="w-full bg-white rounded-[1.6rem] p-4 flex items-center justify-between cursor-pointer group"
                    >
                        <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-50 group-hover:bg-blue-100 transition-colors rounded-2xl flex items-center justify-center shrink-0">
                            <Folder size={24} className="text-blue-600" />
                        </div>
                        <div className="flex flex-col text-left">
                            <span className="font-bold text-gray-800 text-base">{folder.label}</span>
                            <span className="text-[11px] font-semibold text-gray-400">{folder.records.length} Records</span>
                        </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="text-right">
                                <div className="text-sm font-black text-gray-900">{folder.totalQuantity.toFixed(1)} L</div>
                                <div className="text-[11px] font-black text-green-600">₹{folder.totalAmount.toLocaleString()}</div>
                            </div>
                            <ChevronRight size={20} className="text-gray-300 group-hover:text-blue-500 transition-colors" />
                        </div>
                    </button>
                </div>
                ))}
            </div>
            )}
        </div>
      </div>
    );
  }

  // View: Inside Folder
  return (
    <div className="h-full flex flex-col bg-gray-50 animate-in slide-in-from-right-10 duration-300">
        <div className="bg-white/90 backdrop-blur-md px-6 py-4 flex items-center space-x-4 border-b border-gray-100 pt-safe sticky top-0 z-20">
          <button onClick={() => setSelectedFolderId(null)} className="p-3 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors active:scale-90 shadow-sm">
            <ArrowLeft size={24} className="text-gray-700" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-gray-800 leading-none mb-1">{selectedFolder?.label}</h2>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Production Logs</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar p-6 pb-32">
            {/* Compact Folder Summary Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-500 rounded-3xl p-4 text-white shadow-md shadow-blue-100 mb-6">
            <div className="grid grid-cols-3 gap-2 text-center divide-x divide-blue-400/50">
                <div>
                <p className="text-blue-100 text-[9px] font-black uppercase tracking-wider mb-0.5">Milk</p>
                <p className="font-black text-lg">{selectedFolder?.totalQuantity.toFixed(1)}<span className="text-[10px] ml-0.5 font-bold">L</span></p>
                </div>
                <div>
                <p className="text-blue-100 text-[9px] font-black uppercase tracking-wider mb-0.5">Amount</p>
                <p className="font-black text-lg">₹{selectedFolder?.totalAmount.toLocaleString()}</p>
                </div>
                <div>
                <p className="text-blue-100 text-[9px] font-black uppercase tracking-wider mb-0.5">Rate</p>
                <p className="font-black text-lg">₹{selectedFolder?.avgPricePerLiter.toFixed(1)}</p>
                </div>
            </div>
            </div>

            {/* Record List - Compact Design with Blue Gradient Border & No Paid Status */}
            <div className="space-y-4">
            {selectedFolder?.records.map((record) => (
                <div key={record.id} className="p-[3px] bg-gradient-to-br from-blue-600 via-blue-400 to-indigo-500 rounded-3xl shadow-lg shadow-blue-50 group">
                  <div className="bg-white rounded-[1.3rem] p-3 flex flex-col">
                      <div className="flex justify-between items-center mb-2">
                          <div className="flex items-center gap-2">
                               <span className="bg-gray-50 text-gray-600 px-2 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 border border-gray-100">
                                  {record.shift === 'DAY' ? <Sun size={12} className="text-orange-500 fill-orange-500/10" /> : <Moon size={12} className="text-indigo-500 fill-indigo-500/10" />}
                                  {new Date(record.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                              </span>
                              {record.pendingSync && (
                                  <span className="bg-orange-50 text-orange-600 px-1.5 py-1 rounded-md text-[9px] font-bold flex items-center tracking-tighter uppercase">
                                      <CloudUpload size={10} className="mr-0.5" /> Sync
                                  </span>
                              )}
                          </div>
                          <div className="flex space-x-1">
                              <button onClick={() => onEdit(record)} className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors active:scale-90">
                                  <Edit2 size={14} />
                              </button>
                              <button onClick={() => setDeleteId(record.id)} className="p-1.5 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition-colors active:scale-90">
                                  <Trash2 size={14} />
                              </button>
                          </div>
                      </div>
                      
                      <div className="flex items-center justify-between px-1">
                          <div className="flex items-center space-x-2.5">
                              <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center shrink-0 border border-blue-100/30">
                                  <Droplets className="text-blue-500" size={16} />
                              </div>
                              <div>
                                  <div className="flex items-baseline gap-0.5">
                                      <p className="text-base font-black text-gray-800 leading-none">{record.quantity}</p>
                                      <p className="text-[9px] font-bold text-gray-400 uppercase">L</p>
                                  </div>
                                  <p className="text-[10px] font-semibold text-gray-400">₹{record.pricePerLiter}/L</p>
                              </div>
                          </div>

                          <div className="text-right flex flex-col items-end">
                              <div className="flex items-center space-x-1 text-green-600">
                                  <Banknote size={14} />
                                  <span className="font-black text-lg tracking-tight">₹{record.totalPrice}</span>
                              </div>
                          </div>
                      </div>
                  </div>
                </div>
            ))}
            </div>
        </div>

        {/* Delete Confirmation Modal */}
        {deleteId && (
            <div className="fixed inset-0 z-[150] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4" onClick={() => setDeleteId(null)}>
                <div className="bg-white w-full max-w-sm rounded-[2rem] p-6 animate-in slide-in-from-bottom-10 duration-300 relative overflow-hidden" onClick={e => e.stopPropagation()}>
                    <div className="flex flex-col items-center text-center space-y-4">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-2">
                            <Trash2 size={32} className="text-red-600" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-800">Move to Trash?</h3>
                        <p className="text-gray-500 font-medium leading-relaxed">
                            This record will be moved to Recently Deleted. You can restore it later if needed.
                        </p>
                        
                        <div className="grid grid-cols-2 gap-3 w-full mt-4">
                            <button 
                                onClick={() => setDeleteId(null)}
                                className="w-full py-4 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleDeleteConfirm}
                                className="w-full py-4 bg-red-600 text-white rounded-xl font-bold shadow-lg shadow-red-200 hover:bg-red-700 active:scale-[0.98] transition-all"
                            >
                                Move to Trash
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};
