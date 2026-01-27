import React, { useState, useMemo } from 'react';
import { MilkRecord } from '../types';
import { Filter, TrendingUp, Droplets, Banknote, Calendar, ArrowUpRight, ArrowDownRight, ArrowLeft, AlertCircle, FileText, CheckCircle2, CircleDollarSign, ChevronLeft, Receipt, ChevronRight, XCircle, Undo2, ChevronDown, Check, Trophy, TrendingDown, Sun, Moon } from 'lucide-react';
import { markRecordsAsPaid, updateRecord } from '../services/firebase';

interface ManageViewProps {
  records: MilkRecord[];
  onBack?: () => void;
}

const COLORS = ['#2563eb', '#ea580c', '#059669', '#7c3aed', '#db2777']; // Blue, Orange, Emerald, Violet, Pink

type Tab = 'INVOICES' | 'ANALYTICS';
type Metric = 'QUANTITY' | 'AMOUNT';

export const ManageView: React.FC<ManageViewProps> = ({ records, onBack }) => {
  const [activeTab, setActiveTab] = useState<Tab>('INVOICES');
  const [selectedMetric, setSelectedMetric] = useState<Metric>('AMOUNT');

  // --- Invoice State ---
  const [selectedInvoiceMonth, setSelectedInvoiceMonth] = useState<string | null>(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showPaymentConfirm, setShowPaymentConfirm] = useState(false);
  const [showUnpaidConfirm, setShowUnpaidConfirm] = useState(false); 
  const [showDetailList, setShowDetailList] = useState(false); 
  const [invoiceMode, setInvoiceMode] = useState<'MONTH' | 'RANGE'>('MONTH');
  const [customRange, setCustomRange] = useState({ start: '', end: '' });

  // --- Analytics State ---
  const currentYear = new Date().getFullYear();
  const [selectedYears, setSelectedYears] = useState<number[]>([currentYear]);
  const [selectedMonth, setSelectedMonth] = useState<string>('ALL'); 
  const [isYearDropdownOpen, setIsYearDropdownOpen] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [customStart, setCustomStart] = useState(new Date(currentYear, new Date().getMonth(), 1).toISOString().split('T')[0]);
  const [customEnd, setCustomEnd] = useState(new Date().toISOString().split('T')[0]);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // ==========================
  // INVOICE LOGIC
  // ==========================

  const invoiceGroups = useMemo(() => {
    const groups: { [key: string]: { month: string, year: number, total: number, paid: number, unpaid: number, records: MilkRecord[] } } = {};
    
    records.forEach(r => {
        const d = new Date(r.date);
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        if (!groups[key]) {
            groups[key] = {
                month: months[d.getMonth()],
                year: d.getFullYear(),
                total: 0,
                paid: 0,
                unpaid: 0,
                records: []
            };
        }
        groups[key].records.push(r);
        groups[key].total += r.totalPrice;
        if (r.status === 'PAID') {
            groups[key].paid += r.totalPrice;
        } else {
            groups[key].unpaid += r.totalPrice;
        }
    });

    return Object.values(groups).sort((a, b) => {
        if (b.year !== a.year) return b.year - a.year;
        return months.indexOf(b.month) - months.indexOf(a.month);
    });
  }, [records, months]);

  const currentInvoice = useMemo(() => {
    let filteredRecords: MilkRecord[] = [];
    
    if (invoiceMode === 'MONTH' && selectedInvoiceMonth) {
         filteredRecords = invoiceGroups.find(g => `${g.year}-${months.indexOf(g.month)}` === selectedInvoiceMonth)?.records || [];
    } else if (invoiceMode === 'RANGE' && customRange.start && customRange.end) {
         filteredRecords = records.filter(r => r.date >= customRange.start && r.date <= customRange.end);
    }

    filteredRecords.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const totalAmount = filteredRecords.reduce((sum, r) => sum + r.totalPrice, 0);
    const paidAmount = filteredRecords.reduce((sum, r) => sum + (r.status === 'PAID' ? r.totalPrice : 0), 0);
    const unpaidAmount = totalAmount - paidAmount;
    
    return { records: filteredRecords, totalAmount, paidAmount, unpaidAmount };
  }, [invoiceMode, selectedInvoiceMonth, customRange, records, invoiceGroups, months]);

  const handleMarkAsPaid = async () => {
    const unpaidRecords = currentInvoice.records.filter(r => r.status !== 'PAID');
    const ids = unpaidRecords.map(r => r.id);
    if (ids.length > 0) await markRecordsAsPaid(ids);
    setShowPaymentConfirm(false);
  };

  const handleMarkAsUnpaidBulk = async () => {
    const paidRecords = currentInvoice.records.filter(r => r.status === 'PAID');
    for (const r of paidRecords) await updateRecord({ ...r, status: 'UNPAID' });
    setShowUnpaidConfirm(false);
  };

  const toggleRecordStatus = async (record: MilkRecord) => {
    const newStatus = record.status === 'PAID' ? 'UNPAID' : 'PAID';
    await updateRecord({ ...record, status: newStatus });
  };

  const closeInvoiceModal = () => {
      setShowInvoiceModal(false);
      setShowDetailList(false);
      setShowPaymentConfirm(false);
      setShowUnpaidConfirm(false);
  };

  const getStatusColor = (paid: number, total: number) => {
      if (total === 0) return 'bg-gray-100 text-gray-500';
      if (paid === total) return 'bg-green-100 text-green-700';
      if (paid === 0) return 'bg-red-100 text-red-700';
      return 'bg-orange-100 text-orange-700';
  };

  const getStatusText = (paid: number, total: number) => {
    if (total === 0) return 'No Data';
    if (paid === total) return 'Paid';
    if (paid === 0) return 'Unpaid';
    return 'Partial';
  };

  // ==========================
  // ANALYTICS LOGIC
  // ==========================
  
  const availableYears = useMemo(() => {
    const years = new Set<number>(records.map(r => new Date(r.date).getFullYear()));
    years.add(currentYear);
    return Array.from(years).sort((a: number, b: number) => b - a);
  }, [records, currentYear]);

  const toggleYear = (year: number) => {
    if (selectedYears.includes(year)) {
      if (selectedYears.length > 1) setSelectedYears(prev => prev.filter(y => y !== year));
    } else {
      setSelectedYears(prev => [...prev, year]);
    }
  };

  const stats = useMemo(() => {
    let filtered: MilkRecord[] = [];
    if (selectedMonth === 'CUSTOM') {
        filtered = records.filter(r => r.date >= customStart && r.date <= customEnd);
    } else {
        filtered = records.filter(r => {
            const d = new Date(r.date);
            const yearMatch = selectedYears.includes(d.getFullYear());
            const monthMatch = selectedMonth === 'ALL' || d.getMonth().toString() === selectedMonth;
            return yearMatch && monthMatch;
        });
    }
    const totalQty = filtered.reduce((acc, r) => acc + r.quantity, 0);
    const totalRev = filtered.reduce((acc, r) => acc + r.totalPrice, 0);
    const avgRate = totalQty > 0 ? totalRev / totalQty : 0;

    // Find Best & Worst Entry (Single Session)
    let bestEntry = null;
    let worstEntry = null;

    if (filtered.length > 0) {
        // Best: Highest Price per Liter
        bestEntry = filtered.reduce((prev, curr) => (prev.pricePerLiter > curr.pricePerLiter) ? prev : curr);
        // Worst: Lowest Total Amount
        worstEntry = filtered.reduce((prev, curr) => (prev.totalPrice < curr.totalPrice) ? prev : curr);
    }

    return { totalQty, totalRev, avgRate, bestEntry, worstEntry };
  }, [records, selectedYears, selectedMonth, customStart, customEnd]);

  const chartDatasets = useMemo(() => {
    const valueKey = selectedMetric === 'AMOUNT' ? 'totalPrice' : 'quantity';

    if (selectedMonth === 'CUSTOM') {
        const start = new Date(customStart);
        const end = new Date(customEnd);
        const data: number[] = [];
        const labels: string[] = [];
        const fullLabels: string[] = [];
        
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            const dateStr = d.toISOString().split('T')[0];
            const dayRecords = records.filter(r => r.date === dateStr);
            const total = dayRecords.reduce((acc, r) => acc + (r[valueKey] as number), 0);
            data.push(total);
            labels.push(d.getDate().toString());
            fullLabels.push(d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }));
        }
        return [{ year: 'Range', data, labels, fullLabels }];
    } else {
        return selectedYears.map(year => {
            let data: number[] = [];
            let labels: string[] = [];
            let fullLabels: string[] = [];

            if (selectedMonth === 'ALL') {
                data = new Array(12).fill(0);
                labels = months.map(m => m.substring(0, 3));
                fullLabels = months;
                records.filter(r => new Date(r.date).getFullYear() === year).forEach(r => {
                    const m = new Date(r.date).getMonth();
                    data[m] += (r[valueKey] as number);
                });
            } else {
                const monthIndex = parseInt(selectedMonth);
                const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
                data = new Array(daysInMonth).fill(0);
                labels = Array.from({length: daysInMonth}, (_, i) => (i + 1).toString());
                fullLabels = Array.from({length: daysInMonth}, (_, i) => `${i + 1} ${months[monthIndex]}`);
                records.filter(r => {
                    const d = new Date(r.date);
                    return d.getFullYear() === year && d.getMonth() === monthIndex;
                }).forEach(r => {
                    const d = new Date(r.date).getDate() - 1;
                    if (data[d] !== undefined) data[d] += (r[valueKey] as number);
                });
            }
            return { year, data, labels, fullLabels };
        });
    }
  }, [selectedYears, selectedMonth, records, customStart, customEnd, months, selectedMetric]);

  const allValues = chartDatasets.flatMap(d => d.data);
  const maxValue = Math.max(...allValues, selectedMetric === 'AMOUNT' ? 1000 : 10); 
  const chartHeight = 250; 
  const chartWidth = 1000;
  const paddingX = 40;
  const paddingY = 20;
  const usableHeight = chartHeight - paddingY * 2;
  const usableWidth = chartWidth - paddingX * 2;

  // For Bar Chart, we calculate X differently to center bars in columns
  const getX = (index: number, totalPoints: number) => {
    const colWidth = usableWidth / totalPoints;
    return paddingX + (index * colWidth) + (colWidth / 2);
  };
  const getY = (value: number) => chartHeight - paddingY - (value / maxValue) * usableHeight;

  // Format Helper
  const formatDateString = (dateStr: string) => {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  };

  // ==========================
  // RENDERERS
  // ==========================

  const renderAnalytics = () => (
    <div className="space-y-6 animate-in slide-in-from-right-10 duration-300">
        {/* Filters Top Bar */}
        <div className="flex gap-3 items-center">
            {selectedMonth !== 'CUSTOM' && (
                <div className="relative" onClick={e => e.stopPropagation()}>
                    <button 
                        onClick={() => setIsYearDropdownOpen(!isYearDropdownOpen)}
                        className="flex items-center space-x-2 bg-white px-4 py-3 rounded-2xl text-sm font-bold text-gray-700 border border-gray-100 shadow-sm"
                    >
                        <span>{selectedYears.length === 1 ? selectedYears[0] : `${selectedYears.length} Yrs`}</span>
                        <ChevronDown size={16} className={`transition-transform duration-200 ${isYearDropdownOpen ? 'rotate-180' : ''}`}/>
                    </button>
                    {isYearDropdownOpen && (
                        <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 p-2">
                            {availableYears.map(year => (
                                <button key={year} onClick={() => toggleYear(year)} className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium ${selectedYears.includes(year) ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}>
                                    <span>{year}</span>
                                    {selectedYears.includes(year) && <Check size={16}/>}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}
            <div className="relative flex-1">
                <select 
                    value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}
                    className="w-full appearance-none bg-white px-4 py-3 rounded-2xl text-sm font-bold text-gray-700 border border-gray-100 shadow-sm outline-none"
                >
                    <option value="ALL">All Months</option>
                    <option value="CUSTOM">Custom Range</option>
                    {months.map((m, i) => <option key={i} value={i}>{m}</option>)}
                </select>
                <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"/>
            </div>
        </div>

        {selectedMonth === 'CUSTOM' && (
            <div className="flex items-center gap-3 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex-1">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Start</label>
                    <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} className="w-full bg-gray-50 rounded-xl px-3 py-2 text-xs font-bold text-gray-700 outline-none" />
                </div>
                <div className="flex-1">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">End</label>
                    <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} className="w-full bg-gray-50 rounded-xl px-3 py-2 text-xs font-bold text-gray-700 outline-none" />
                </div>
            </div>
        )}
        
        {/* Modern Analytics Card */}
        <div className="bg-white rounded-[2.5rem] shadow-[0_10px_40px_-15px_rgba(0,0,0,0.08)] border border-gray-100/50 p-8 flex flex-col relative overflow-hidden">
            
            {/* Header Area of Card */}
            <div className="flex justify-between items-start mb-10">
                <div className="space-y-1">
                    <h4 className="text-gray-400 text-sm font-semibold tracking-tight">
                        {selectedMetric === 'AMOUNT' ? 'Total Sales' : 'Total Production'}
                    </h4>
                    <div className="flex items-baseline gap-2">
                        <h2 className="text-3xl font-black text-gray-900 tracking-tight">
                            {selectedMetric === 'AMOUNT' ? `₹${stats.totalRev.toLocaleString()}` : `${stats.totalQty.toFixed(1)} L`}
                        </h2>
                        <div className={`flex items-center font-bold text-xs px-2 py-0.5 rounded-full ${selectedMetric === 'AMOUNT' ? 'text-blue-500 bg-blue-50' : 'text-emerald-500 bg-emerald-50'}`}>
                            <ArrowUpRight size={14} /> 
                            <span>{selectedMetric === 'AMOUNT' ? 'Revenue' : 'Volume'}</span>
                        </div>
                    </div>
                </div>
                
                {/* Micro Stat Bar (Horizontal Summary) */}
                <div className="hidden sm:flex items-center gap-6 bg-gray-50/50 p-3 rounded-2xl border border-gray-100">
                    <div className="text-right border-r border-gray-200 pr-4">
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Rate Avg</p>
                        <p className="text-xs font-bold text-gray-700">₹{stats.avgRate.toFixed(1)}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Total Qty</p>
                        <p className="text-xs font-bold text-gray-700">{stats.totalQty.toFixed(0)}L</p>
                    </div>
                </div>
            </div>

            {/* Bar Chart Area */}
            <div className="relative w-full h-[250px] mb-8">
                {/* Grid Lines */}
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-[0.4]">
                    {[0, 1, 2, 3].map(i => (
                        <div key={i} className="w-full h-px bg-gray-200"></div>
                    ))}
                </div>
                
                <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-full overflow-visible" preserveAspectRatio="none">
                    {chartDatasets.map((ds, idx) => {
                        const baseColor = selectedMetric === 'AMOUNT' ? '#2563eb' : '#059669';
                        const totalPoints = ds.data.length;
                        const colWidth = usableWidth / totalPoints;
                        const barWidth = colWidth * 0.7; // Bar takes 70% of column width

                        return (
                            <g key={ds.year}>
                                {ds.data.map((val, i) => {
                                    const h = (val / (maxValue || 1)) * usableHeight;
                                    const x = getX(i, totalPoints) - (barWidth / 2);
                                    const y = chartHeight - paddingY - h;
                                    const isHovered = hoveredIndex === i;

                                    return (
                                        <rect 
                                            key={i}
                                            x={x}
                                            y={y}
                                            width={barWidth}
                                            height={h > 0 ? h : 0}
                                            rx={8} // Rounded top corners
                                            ry={8}
                                            fill={baseColor}
                                            className="transition-all duration-300 ease-out cursor-pointer"
                                            style={{ 
                                                opacity: isHovered ? 1 : 0.8,
                                                filter: isHovered ? `drop-shadow(0 4px 8px ${baseColor}44)` : 'none',
                                                transformOrigin: `${x + barWidth/2}px ${chartHeight - paddingY}px`,
                                                transform: isHovered ? 'scaleY(1.05)' : 'scaleY(1)'
                                            }}
                                            onMouseEnter={() => setHoveredIndex(i)}
                                            onMouseLeave={() => setHoveredIndex(null)}
                                        />
                                    );
                                })}
                            </g>
                        );
                    })}
                </svg>

                {/* X-Axis Labels */}
                <div className="absolute bottom-[-30px] left-0 right-0 flex justify-between px-2">
                    {chartDatasets[0]?.labels.map((label, i) => {
                        const total = chartDatasets[0].labels.length;
                        const skipStep = Math.ceil(total / 6);
                        if (total > 10 && i % skipStep !== 0) return null;
                        return (
                            <span key={i} className={`text-[10px] font-black uppercase tracking-widest transition-all duration-300 flex-1 text-center ${hoveredIndex === i ? 'text-blue-600 scale-110' : 'text-gray-300'}`}>
                                {label}
                            </span>
                        )
                    })}
                </div>

                {/* Tooltip */}
                {hoveredIndex !== null && chartDatasets[0] && (
                     <div 
                        className="absolute z-50 bg-gray-900 text-white rounded-2xl py-3 px-5 shadow-2xl backdrop-blur-md border border-gray-700 animate-in fade-in zoom-in duration-200"
                        style={{ 
                            left: `${(getX(hoveredIndex, chartDatasets[0].data.length) - paddingX) / (usableWidth) * 100}%`, 
                            top: `${getY(chartDatasets[0].data[hoveredIndex]) - 70}px`,
                            transform: 'translateX(-50%)' 
                        }}
                     >
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">{chartDatasets[0].fullLabels[hoveredIndex]}</p>
                        <p className="text-lg font-black leading-none">
                            {selectedMetric === 'AMOUNT' ? `₹${chartDatasets[0].data[hoveredIndex].toLocaleString()}` : `${chartDatasets[0].data[hoveredIndex].toFixed(1)} L`}
                        </p>
                        <div className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-3 h-3 bg-gray-900 rotate-45"></div>
                     </div>
                )}
            </div>

            {/* Metric Selector Buttons */}
            <div className="mt-8 flex gap-4 pt-6 border-t border-gray-50">
                <button 
                    onClick={() => setSelectedMetric('AMOUNT')}
                    className={`flex-1 flex items-center justify-center gap-3 p-4 rounded-3xl transition-all border-2 
                        ${selectedMetric === 'AMOUNT' ? 'bg-blue-50 border-blue-100 shadow-[0_4px_15px_-5px_rgba(37,99,235,0.2)]' : 'bg-transparent border-gray-50 opacity-60'}`}
                >
                    <div className={`w-3 h-3 rounded-full ${selectedMetric === 'AMOUNT' ? 'bg-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.6)]' : 'bg-gray-300'}`}></div>
                    <span className={`text-sm font-bold ${selectedMetric === 'AMOUNT' ? 'text-blue-700' : 'text-gray-400'}`}>Revenue</span>
                </button>
                <button 
                    onClick={() => setSelectedMetric('QUANTITY')}
                    className={`flex-1 flex items-center justify-center gap-3 p-4 rounded-3xl transition-all border-2 
                        ${selectedMetric === 'QUANTITY' ? 'bg-emerald-50 border-emerald-100 shadow-[0_4px_15px_-5px_rgba(5,150,105,0.2)]' : 'bg-transparent border-gray-50 opacity-60'}`}
                >
                    <div className={`w-3 h-3 rounded-full ${selectedMetric === 'QUANTITY' ? 'bg-emerald-600 shadow-[0_0_8px_rgba(5,150,105,0.6)]' : 'bg-gray-300'}`}></div>
                    <span className={`text-sm font-bold ${selectedMetric === 'QUANTITY' ? 'text-emerald-700' : 'text-gray-400'}`}>Quantity</span>
                </button>
            </div>
        </div>

        {/* Best Entry & Worst Entry Cards */}
        <div className="grid grid-cols-2 gap-4">
             {/* Best Entry Card (Highest Rate) */}
             <div className="bg-white p-6 rounded-[2.5rem] border border-emerald-100 shadow-[0_10px_30px_-15px_rgba(16,185,129,0.1)] flex flex-col relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-50 rounded-bl-[2.5rem] flex items-center justify-center text-emerald-500">
                    <Trophy size={20} className="group-hover:scale-110 transition-transform" />
                </div>
                
                <div className="mb-4">
                  <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Highest Rate</p>
                  <div className="flex items-center gap-1.5">
                    <h5 className="text-sm font-bold text-gray-800">{stats.bestEntry ? formatDateString(stats.bestEntry.date) : 'No Data'}</h5>
                    {stats.bestEntry && (
                      stats.bestEntry.shift === 'DAY' ? <Sun size={12} className="text-orange-400" /> : <Moon size={12} className="text-indigo-400" />
                    )}
                  </div>
                </div>
                
                <div className="space-y-3 mt-auto border-t border-gray-50 pt-3">
                    <div className="flex items-center justify-between">
                        <span className="text-[9px] font-bold text-gray-400 uppercase">Volume</span>
                        <span className="text-sm font-black text-gray-800">{stats.bestEntry?.quantity.toFixed(1) || '0'} L</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-[9px] font-bold text-gray-400 uppercase">Rate/L</span>
                        <span className="text-sm font-black text-emerald-600">₹{stats.bestEntry?.pricePerLiter.toFixed(1) || '0'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-[9px] font-bold text-gray-400 uppercase">Total</span>
                        <span className="text-sm font-black text-gray-900">₹{stats.bestEntry?.totalPrice.toLocaleString() || '0'}</span>
                    </div>
                </div>
             </div>

             {/* Worst Entry Card (Lowest Amount) */}
             <div className="bg-white p-6 rounded-[2.5rem] border border-rose-100 shadow-[0_10px_30px_-15px_rgba(244,63,94,0.1)] flex flex-col relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-16 h-16 bg-rose-50 rounded-bl-[2.5rem] flex items-center justify-center text-rose-500">
                    <TrendingDown size={20} className="group-hover:scale-110 transition-transform" />
                </div>
                
                <div className="mb-4">
                  <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-1">Lowest Rate</p>
                  <div className="flex items-center gap-1.5">
                    <h5 className="text-sm font-bold text-gray-800">{stats.worstEntry ? formatDateString(stats.worstEntry.date) : 'No Data'}</h5>
                    {stats.worstEntry && (
                      stats.worstEntry.shift === 'DAY' ? <Sun size={12} className="text-orange-400" /> : <Moon size={12} className="text-indigo-400" />
                    )}
                  </div>
                </div>
                
                <div className="space-y-3 mt-auto border-t border-gray-50 pt-3">
                    <div className="flex items-center justify-between">
                        <span className="text-[9px] font-bold text-gray-400 uppercase">Volume</span>
                        <span className="text-sm font-black text-gray-800">{stats.worstEntry?.quantity.toFixed(1) || '0'} L</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-[9px] font-bold text-gray-400 uppercase">Rate/L</span>
                        <span className="text-sm font-black text-gray-900">₹{stats.worstEntry?.pricePerLiter.toFixed(1) || '0'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-[9px] font-bold text-gray-400 uppercase">Total</span>
                        <span className="text-sm font-black text-rose-600">₹{stats.worstEntry?.totalPrice.toLocaleString() || '0'}</span>
                    </div>
                </div>
             </div>
        </div>
    </div>
  );

  const renderInvoices = () => {
    const totalDue = records.reduce((acc, r) => acc + (r.status !== 'PAID' ? r.totalPrice : 0), 0);
    const totalCollected = records.reduce((acc, r) => acc + (r.status === 'PAID' ? r.totalPrice : 0), 0);

    return (
        <div className="space-y-6 animate-in slide-in-from-left-10 duration-300">
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-5 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col justify-between">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-2 bg-red-50 rounded-xl text-red-500"><AlertCircle size={20} /></div>
                        <span className="text-sm font-bold text-gray-400 uppercase tracking-wide">Unpaid</span>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800">₹{totalDue.toLocaleString()}</h3>
                    <p className="text-xs text-gray-400">Total Outstanding</p>
                </div>
                <div className="bg-white p-5 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col justify-between">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-2 bg-green-50 rounded-xl text-green-500"><CheckCircle2 size={20} /></div>
                        <span className="text-sm font-bold text-gray-400 uppercase tracking-wide">Paid</span>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800">₹{totalCollected.toLocaleString()}</h3>
                    <p className="text-xs text-gray-400">Total Collected</p>
                </div>
            </div>

            <button 
                onClick={() => {
                    setInvoiceMode('RANGE');
                    setSelectedInvoiceMonth(null);
                    setShowInvoiceModal(true);
                }}
                className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
            >
                <FileText size={20} /> Generate Custom Invoice
            </button>

            <div>
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 px-1">Monthly Statements</h3>
                <div className="space-y-3">
                    {invoiceGroups.map(group => {
                        const statusColor = getStatusColor(group.paid, group.total);
                        const statusText = getStatusText(group.paid, group.total);
                        const monthKey = `${group.year}-${months.indexOf(group.month)}`;

                        return (
                            <button 
                                key={monthKey}
                                onClick={() => {
                                    setInvoiceMode('MONTH');
                                    setSelectedInvoiceMonth(monthKey);
                                    setShowInvoiceModal(true);
                                }}
                                className="w-full bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between hover:border-blue-200 transition-colors active:scale-[0.99]"
                            >
                                <div className="text-left">
                                    <div className="flex items-center gap-3 mb-1">
                                        <h4 className="font-bold text-gray-800 text-lg">{group.month} {group.year}</h4>
                                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase ${statusColor}`}>
                                            {statusText}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-400">{group.records.length} Records</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-gray-900 text-lg">₹{group.total.toLocaleString()}</p>
                                    {group.unpaid > 0 && <p className="text-xs font-bold text-red-500">₹{group.unpaid.toLocaleString()} due</p>}
                                </div>
                            </button>
                        );
                    })}
                    {invoiceGroups.length === 0 && (
                        <div className="text-center py-10 text-gray-400 bg-white rounded-3xl border border-dashed border-gray-200">
                            <FileText size={40} className="mx-auto mb-2 opacity-50" />
                            <p>No records to generate invoices.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
  };

  return (
    <div className="h-full bg-gray-50 flex flex-col animate-in fade-in duration-500" onClick={() => setIsYearDropdownOpen(false)}>
      
      <div className="bg-white/90 backdrop-blur-md px-6 py-4 pt-safe border-b border-gray-100 shadow-sm z-20 sticky top-0 transition-all">
        <div className="flex items-center justify-between mb-4 mt-2">
            <div className="flex items-center space-x-4">
                {onBack && (
                <button onClick={onBack} className="p-3 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors active:scale-90 shadow-sm">
                    <ArrowLeft size={24} className="text-gray-700" />
                </button>
                )}
                <h2 className="text-3xl font-bold text-gray-800">Manage</h2>
            </div>
        </div>

        <div className="flex p-1 bg-gray-100 rounded-2xl relative">
            <button 
                onClick={() => setActiveTab('INVOICES')}
                className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all relative z-10 ${activeTab === 'INVOICES' ? 'text-gray-800' : 'text-gray-400'}`}
            >
                Invoices
            </button>
            <button 
                onClick={() => setActiveTab('ANALYTICS')}
                className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all relative z-10 ${activeTab === 'ANALYTICS' ? 'text-gray-800' : 'text-gray-400'}`}
            >
                Analytics
            </button>
            <div className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white rounded-xl shadow-sm transition-transform duration-300 ease-out ${activeTab === 'ANALYTICS' ? 'translate-x-[calc(100%+4px)]' : 'translate-x-1'}`}></div>
        </div>
      </div>

      <div className="p-6 space-y-6 overflow-y-auto no-scrollbar pb-32 flex-1">
         {activeTab === 'INVOICES' ? renderInvoices() : renderAnalytics()}
      </div>

      {showInvoiceModal && (
         <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
             <div className="bg-white w-full max-w-lg rounded-[2rem] max-h-[90vh] flex flex-col animate-in slide-in-from-bottom-10 duration-300 shadow-2xl overflow-hidden">
                {showDetailList ? (
                    <div className="flex flex-col h-full bg-gray-50">
                        <div className="bg-white p-6 border-b border-gray-100 flex items-center gap-4 shrink-0">
                            <button onClick={() => setShowDetailList(false)} className="p-3 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors active:scale-90">
                                <ChevronLeft size={24} className="text-gray-700" />
                            </button>
                            <div>
                                <h3 className="text-xl font-bold text-gray-800">Included Records</h3>
                                <p className="text-sm text-gray-400">{currentInvoice.records.length} items</p>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
                            {currentInvoice.records.map(r => {
                                const d = new Date(r.date);
                                const day = d.getDate();
                                const monthShort = d.toLocaleString('default', { month: 'short' });
                                return (
                                    <div key={r.id} className="flex items-center justify-between bg-white border border-gray-100 p-4 rounded-2xl shadow-sm hover:border-blue-100 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="bg-blue-50 rounded-xl px-3 py-2 text-center min-w-[56px]">
                                                <span className="block text-xs font-bold text-blue-400 uppercase tracking-wider">{monthShort}</span>
                                                <span className="block text-xl font-bold text-blue-700">{day}</span>
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <Droplets size={16} className="text-blue-500 fill-blue-500/20"/>
                                                    <span className="font-bold text-gray-800 text-lg">{r.quantity} <span className="text-sm text-gray-400 font-normal">L</span></span>
                                                </div>
                                                <div className="text-xs text-gray-400 font-medium mt-1">Rate: ₹{r.pricePerLiter}/L</div>
                                            </div>
                                        </div>
                                        <div className="text-right flex flex-col items-end gap-2">
                                            <div className="font-bold text-lg text-gray-900">₹{r.totalPrice.toLocaleString()}</div>
                                            <button onClick={() => toggleRecordStatus(r)} className={`group flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[11px] font-bold uppercase transition-all active:scale-95 ${r.status === 'PAID' ? 'bg-green-50 border-green-100 text-green-700 hover:bg-red-50 hover:border-red-100 hover:text-red-700' : 'bg-orange-50 border-orange-100 text-orange-700 hover:bg-green-50 hover:border-green-100 hover:text-green-700'}`}>
                                                {r.status === 'PAID' ? <><CheckCircle2 size={14} className="group-hover:hidden" /><XCircle size={14} className="hidden group-hover:block" /><span className="group-hover:hidden">Paid</span><span className="hidden group-hover:block">Mark Unpaid</span></> : <><CircleDollarSign size={14} className="group-hover:hidden" /><CheckCircle2 size={14} className="hidden group-hover:block" /><span className="group-hover:hidden">Unpaid</span><span className="hidden group-hover:block">Mark Paid</span></>}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <div>
                                <h3 className="text-xl font-bold text-gray-800">
                                    {invoiceMode === 'MONTH' && selectedInvoiceMonth ? (() => {
                                        const [y, m] = selectedInvoiceMonth.split('-');
                                        return `Invoice: ${months[parseInt(m)]} ${y}`;
                                    })() : 'Generate Invoice'}
                                </h3>
                                {invoiceMode === 'RANGE' && <p className="text-xs text-gray-500">Select custom dates</p>}
                            </div>
                            <button onClick={closeInvoiceModal} className="p-2 bg-gray-50 rounded-full hover:bg-gray-100"><ArrowDownRight size={20} className="text-gray-500"/></button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {invoiceMode === 'RANGE' && (
                                <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-2xl border border-gray-100 mb-4">
                                    <div className="flex-1"><label className="text-[10px] font-bold text-gray-400 uppercase ml-1 mb-1 block">Start Date</label><input type="date" value={customRange.start} onChange={e => setCustomRange({...customRange, start: e.target.value})} className="w-full bg-white rounded-xl px-3 py-2 text-sm font-bold text-gray-700 outline-none border border-gray-200" /></div>
                                    <div className="flex-1"><label className="text-[10px] font-bold text-gray-400 uppercase ml-1 mb-1 block">End Date</label><input type="date" value={customRange.end} onChange={e => setCustomRange({...customRange, end: e.target.value})} className="w-full bg-white rounded-xl px-3 py-2 text-sm font-bold text-gray-700 outline-none border border-gray-200" /></div>
                                </div>
                            )}
                            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.1)] relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
                                <div className="flex justify-between items-start mb-6">
                                    <div><p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Balance Due</p><h2 className="text-3xl font-bold text-gray-900 mt-1">₹{currentInvoice.unpaidAmount.toLocaleString()}</h2></div>
                                    <div className={`px-3 py-1 rounded-lg text-xs font-bold uppercase ${currentInvoice.unpaidAmount === 0 && currentInvoice.totalAmount > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{currentInvoice.unpaidAmount === 0 && currentInvoice.totalAmount > 0 ? 'Paid' : 'Unpaid'}</div>
                                </div>
                                <div className="space-y-3 mb-6">
                                    <div className="flex justify-between text-sm"><span className="text-gray-500">Total Quantity</span><span className="font-bold text-gray-800">{currentInvoice.records.reduce((acc, r) => acc + r.quantity, 0).toFixed(1)} L</span></div>
                                    <div className="flex justify-between text-sm"><span className="text-gray-500">Total Amount</span><span className="font-bold text-gray-800">₹{currentInvoice.totalAmount.toLocaleString()}</span></div>
                                    <div className="flex justify-between text-sm"><span className="text-gray-500">Already Paid</span><span className="font-bold text-green-600">- ₹{currentInvoice.paidAmount.toLocaleString()}</span></div>
                                    <div className="h-px bg-gray-100 my-2"></div>
                                    <div className="flex justify-between text-base font-bold"><span className="text-gray-800">Amount Due</span><span className="text-blue-600">₹{currentInvoice.unpaidAmount.toLocaleString()}</span></div>
                                </div>
                                <button onClick={() => setShowDetailList(true)} className="w-full bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors flex items-center justify-between group active:scale-[0.99]"><div className="text-left"><p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Included Records</p><div className="flex items-center gap-2 text-xs font-bold text-gray-700"><Receipt size={14} className="text-blue-500"/><span>{currentInvoice.records.length} Records</span></div></div><div className="flex items-center gap-1 text-xs font-bold text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">View Details <ChevronRight size={14} /></div></button>
                            </div>
                        </div>
                        <div className="p-6 border-t border-gray-100 bg-gray-50 rounded-b-[2rem] flex flex-col gap-3">
                            {currentInvoice.unpaidAmount > 0 && <button onClick={() => setShowPaymentConfirm(true)} className="w-full py-4 bg-green-600 text-white rounded-xl font-bold text-lg shadow-lg shadow-green-200 hover:bg-green-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2"><CircleDollarSign size={24} /> Mark as Paid</button>}
                            {currentInvoice.paidAmount > 0 && <button onClick={() => setShowUnpaidConfirm(true)} className={`w-full py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 active:scale-[0.98] ${currentInvoice.unpaidAmount === 0 ? 'bg-orange-100 text-orange-700 hover:bg-orange-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}><Undo2 size={24} /> Mark all as Unpaid</button>}
                        </div>
                    </>
                )}
             </div>
         </div>
      )}

      {showPaymentConfirm && (
         <div className="fixed inset-0 z-[150] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
             <div className="bg-white w-full max-w-sm rounded-[2rem] p-6 animate-in slide-in-from-bottom-10 duration-300 relative overflow-hidden text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"><Banknote size={32} className="text-green-600" /></div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">Confirm Payment?</h3>
                <p className="text-gray-500 mb-6">Mark <strong>₹{currentInvoice.unpaidAmount.toLocaleString()}</strong> as received? This will update the status of {currentInvoice.records.filter(r => r.status !== 'PAID').length} records to Paid.</p>
                <div className="grid grid-cols-2 gap-3"><button onClick={() => setShowPaymentConfirm(false)} className="py-3 bg-gray-100 rounded-xl font-bold text-gray-600">Cancel</button><button onClick={handleMarkAsPaid} className="py-3 bg-green-600 text-white rounded-xl font-bold shadow-lg shadow-green-200">Confirm Received</button></div>
             </div>
         </div>
      )}

      {showUnpaidConfirm && (
         <div className="fixed inset-0 z-[150] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
             <div className="bg-white w-full max-w-sm rounded-[2rem] p-6 animate-in slide-in-from-bottom-10 duration-300 relative overflow-hidden text-center">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4"><Undo2 size={32} className="text-orange-600" /></div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">Reset to Unpaid?</h3>
                <p className="text-gray-500 mb-6">This will mark <strong>₹{currentInvoice.paidAmount.toLocaleString()}</strong> worth of records as <strong>Unpaid</strong>.</p>
                <div className="grid grid-cols-2 gap-3"><button onClick={() => setShowUnpaidConfirm(false)} className="py-3 bg-gray-100 rounded-xl font-bold text-gray-600">Cancel</button><button onClick={handleMarkAsUnpaidBulk} className="py-3 bg-orange-600 text-white rounded-xl font-bold shadow-lg shadow-orange-200">Confirm Reset</button></div>
             </div>
         </div>
      )}
    </div>
  );
};