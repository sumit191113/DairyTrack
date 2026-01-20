import React, { useState, useMemo, useEffect } from 'react';
import { MilkRecord, FolderSummary } from '../types';
import { Folder, ChevronRight, Droplets, Banknote, Edit2, Trash2, ArrowLeft, TrendingUp, AlertTriangle, FileText, CheckCircle2, Clock, CloudUpload } from 'lucide-react';

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
            {/* Improved Overall Summary Card */}
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2.5rem] p-6 text-white shadow-xl shadow-blue-200 mb-8 relative overflow-hidden group">
                {/* Background Decorations */}
                <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none group-hover:bg-white/15 transition-colors"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-500/30 rounded-full blur-2xl -ml-10 -mb-10 pointer-events-none"></div>

                {/* Content */}
                <div className="relative z-10">
                    {/* Total Revenue Section */}
                    <div className="flex items-center space-x-4 mb-6">
                        <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/10 shadow-inner">
                            <Banknote size={28} className="text-white" />
                        </div>
                        <div>
                            <p className="text-blue-100 font-medium text-sm">Total Earnings</p>
                            <h3 className="text-3xl font-bold tracking-tight">₹{overallStats.amount.toLocaleString()}</h3>
                        </div>
                    </div>

                    {/* Grid for Milk & Entries */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-4 border border-white/5 hover:bg-black/30 transition-colors">
                            <div className="flex items-center space-x-2 mb-1">
                                <Droplets size={16} className="text-blue-200" />
                                <span className="text-blue-100 text-xs font-bold uppercase tracking-wider">Total Milk</span>
                            </div>
                            <p className="text-xl font-bold">{overallStats.quantity.toFixed(0)} <span className="text-sm opacity-70 font-medium">L</span></p>
                        </div>
                        <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-4 border border-white/5 hover:bg-black/30 transition-colors">
                            <div className="flex items-center space-x-2 mb-1">
                                <FileText size={16} className="text-blue-200" />
                                 <span className="text-blue-100 text-xs font-bold uppercase tracking-wider">Entries</span>
                            </div>
                             <p className="text-xl font-bold">{overallStats.count}</p>
                        </div>
                    </div>
                </div>
            </div>

            <h3 className="text-xs font-bold text-gray-400 mb-3 px-1 uppercase tracking-wider">Recent Folders</h3>

            {folders.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400 bg-white rounded-3xl border border-dashed border-gray-200">
                <Folder size={64} className="mb-6 opacity-50" />
                <p className="text-lg">No records found.</p>
            </div>
            ) : (
            <div className="space-y-4">
                {folders.map(folder => (
                <button 
                    key={folder.id}
                    onClick={() => setSelectedFolderId(folder.id)}
                    className="w-full bg-white rounded-3xl p-5 shadow-sm border border-gray-100 flex items-center justify-between active:scale-[0.98] hover:border-blue-200 transition-all cursor-pointer group"
                >
                    <div className="flex items-center gap-5">
                    <div className="w-14 h-14 bg-blue-50 group-hover:bg-blue-100 transition-colors rounded-2xl flex items-center justify-center shrink-0">
                        <Folder size={28} className="text-blue-600" />
                    </div>
                    <div className="flex flex-col text-left">
                        <span className="font-bold text-gray-800 text-lg">{folder.label}</span>
                        <span className="text-sm text-gray-500">{folder.records.length} Records</span>
                    </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <div className="text-base font-bold text-gray-900">{folder.totalQuantity.toFixed(1)} L</div>
                            <div className="text-sm font-bold text-green-600">₹{folder.totalAmount.toLocaleString()}</div>
                        </div>
                        <ChevronRight size={24} className="text-gray-300" />
                    </div>
                </button>
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
            <h2 className="text-2xl font-bold text-gray-800">{selectedFolder?.label}</h2>
            <p className="text-xs text-gray-500">Folder Details</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar p-6 pb-32">
            {/* Folder Summary Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-500 rounded-[2rem] p-6 text-white shadow-lg shadow-blue-200 mb-8">
            <div className="grid grid-cols-3 gap-4 text-center divide-x divide-blue-400/50">
                <div>
                <p className="text-blue-100 text-sm mb-1">Total Milk</p>
                <p className="font-bold text-xl">{selectedFolder?.totalQuantity.toFixed(1)} L</p>
                </div>
                <div>
                <p className="text-blue-100 text-sm mb-1">Total Amt</p>
                <p className="font-bold text-xl">₹{selectedFolder?.totalAmount.toLocaleString()}</p>
                </div>
                <div>
                <p className="text-blue-100 text-sm mb-1">Avg Price</p>
                <p className="font-bold text-xl">₹{selectedFolder?.avgPricePerLiter.toFixed(1)}</p>
                </div>
            </div>
            </div>

            {/* Record List */}
            <div className="space-y-4">
            {selectedFolder?.records.map((record) => (
                <div key={record.id} className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2">
                         <span className="bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg text-sm font-bold">
                            {new Date(record.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                        </span>
                        {record.pendingSync && (
                            <span className="bg-orange-50 text-orange-600 px-2 py-1.5 rounded-lg text-[10px] font-bold flex items-center">
                                <CloudUpload size={10} className="mr-1" /> Pending
                            </span>
                        )}
                    </div>
                    <div className="flex space-x-3">
                    <button onClick={() => onEdit(record)} className="p-2 hover:bg-blue-50 text-gray-400 hover:text-blue-600 rounded-lg transition-colors">
                        <Edit2 size={20} />
                    </button>
                    <button onClick={() => setDeleteId(record.id)} className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-lg transition-colors">
                        <Trash2 size={20} />
                    </button>
                    </div>
                </div>
                
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                    <div className="p-3 bg-blue-50 rounded-full">
                        <Droplets className="text-blue-500" size={24} />
                    </div>
                    <div>
                        <p className="text-lg font-bold text-gray-700">{record.quantity} Liters</p>
                        <p className="text-sm text-gray-400">@ ₹{record.pricePerLiter}/L</p>
                    </div>
                    </div>
                    <div className="text-right flex flex-col items-end">
                        <div className="flex items-center space-x-1.5 text-green-600">
                            <Banknote size={20} />
                            <span className="font-bold text-lg">₹{record.totalPrice}</span>
                        </div>
                        {/* Status Badge */}
                        <div className={`mt-1 flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${record.status === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                             {record.status === 'PAID' ? <CheckCircle2 size={10} /> : <Clock size={10} />}
                             {record.status === 'PAID' ? 'Paid' : 'Unpaid'}
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