import React, { useState, useMemo } from 'react';
import { MilkRecord } from '../types';
import { Filter, TrendingUp, Droplets, Banknote, Calendar, ArrowUpRight, ArrowDownRight, Award, ChevronDown, Check, ArrowLeft, AlertCircle, CalendarRange, FileText, CheckCircle2, CircleDollarSign, ChevronLeft, Receipt, ChevronRight } from 'lucide-react';
import { markRecordsAsPaid } from '../services/firebase';

interface ManageViewProps {
  records: MilkRecord[];
  onBack?: () => void;
}

const COLORS = ['#2563eb', '#ea580c', '#059669', '#7c3aed', '#db2777']; // Blue, Orange, Emerald, Violet, Pink

type Tab = 'INVOICES' | 'ANALYTICS';

export const ManageView: React.FC<ManageViewProps> = ({ records, onBack }) => {
  const [activeTab, setActiveTab] = useState<Tab>('INVOICES');

  // --- Invoice State ---
  const [selectedInvoiceMonth, setSelectedInvoiceMonth] = useState<string | null>(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showPaymentConfirm, setShowPaymentConfirm] = useState(false);
  const [showDetailList, setShowDetailList] = useState(false); // New state for list view
  const [invoiceMode, setInvoiceMode] = useState<'MONTH' | 'RANGE'>('MONTH');
  const [customRange, setCustomRange] = useState({ start: '', end: '' });

  // --- Analytics State ---
  const currentYear = new Date().getFullYear();
  const [selectedYears, setSelectedYears] = useState<number[]>([currentYear]);
  const [selectedMonth, setSelectedMonth] = useState<string>('ALL'); // 'ALL', 'CUSTOM', '0'...'11'
  const [isYearDropdownOpen, setIsYearDropdownOpen] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [customStart, setCustomStart] = useState(new Date(currentYear, new Date().getMonth(), 1).toISOString().split('T')[0]);
  const [customEnd, setCustomEnd] = useState(new Date().toISOString().split('T')[0]);

  // --- Helpers ---
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // ==========================
  // INVOICE LOGIC
  // ==========================

  // Group records by Month for Invoice List
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
  }, [records]);

  // Current Invoice Data (For Modal)
  const currentInvoice = useMemo(() => {
    let filteredRecords: MilkRecord[] = [];
    
    if (invoiceMode === 'MONTH' && selectedInvoiceMonth) {
         filteredRecords = invoiceGroups.find(g => `${g.year}-${months.indexOf(g.month)}` === selectedInvoiceMonth)?.records || [];
    } else if (invoiceMode === 'RANGE' && customRange.start && customRange.end) {
         filteredRecords = records.filter(r => r.date >= customRange.start && r.date <= customRange.end);
    }

    // Sort details by date descending
    filteredRecords.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const totalAmount = filteredRecords.reduce((sum, r) => sum + r.totalPrice, 0);
    const paidAmount = filteredRecords.reduce((sum, r) => sum + (r.status === 'PAID' ? r.totalPrice : 0), 0);
    const unpaidAmount = totalAmount - paidAmount;
    
    return { records: filteredRecords, totalAmount, paidAmount, unpaidAmount };
  }, [invoiceMode, selectedInvoiceMonth, customRange, records, invoiceGroups]);

  const handleMarkAsPaid = async () => {
    const unpaidRecords = currentInvoice.records.filter(r => r.status !== 'PAID');
    const ids = unpaidRecords.map(r => r.id);
    
    if (ids.length > 0) {
        await markRecordsAsPaid(ids);
    }
    setShowPaymentConfirm(false);
  };

  const closeInvoiceModal = () => {
      setShowInvoiceModal(false);
      setShowDetailList(false); // Reset detail view
      setShowPaymentConfirm(false);
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
      if (selectedYears.length > 1) {
        setSelectedYears(prev => prev.filter(y => y !== year));
      }
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
    
    const dailyMap: {[key: string]: number} = {};
    filtered.forEach(r => {
        if (!dailyMap[r.date]) dailyMap[r.date] = 0;
        dailyMap[r.date] += r.totalPrice;
    });

    let maxDayRev = 0;
    let bestDayDate = '';
    let minDayRev = Infinity;
    let worstDayDate = '';

    const dailyEntries = Object.entries(dailyMap);
    if (dailyEntries.length > 0) {
        dailyEntries.forEach(([date, total]) => {
            if (total > maxDayRev) { maxDayRev = total; bestDayDate = date; }
            if (total < minDayRev) { minDayRev = total; worstDayDate = date; }
        });
    } else {
        minDayRev = 0;
    }

    return { totalQty, totalRev, avgRate, maxDayRev, bestDayDate, minDayRev, worstDayDate };
  }, [records, selectedYears, selectedMonth, customStart, customEnd]);

  const chartDatasets = useMemo(() => {
    if (selectedMonth === 'CUSTOM') {
        const start = new Date(customStart);
        const end = new Date(customEnd);
        const data: number[] = [];
        const labels: string[] = [];
        const fullLabels: string[] = [];
        
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            const dateStr = d.toISOString().split('T')[0];
            const dayRecords = records.filter(r => r.date === dateStr);
            const total = dayRecords.reduce((acc, r) => acc + r.totalPrice, 0);
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
                    data[m] += r.totalPrice;
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
                    if (data[d] !== undefined) data[d] += r.totalPrice;
                });
            }
            return { year, data, labels, fullLabels };
        });
    }
  }, [selectedYears, selectedMonth, records, customStart, customEnd]);

  const allValues = chartDatasets.flatMap(d => d.data);
  const maxValue = Math.max(...allValues, 1000); 
  const chartHeight = 250; 
  const chartWidth = 1000;
  const paddingX = 20;
  const paddingY = 20;
  const usableHeight = chartHeight - paddingY * 2;
  const usableWidth = chartWidth - paddingX * 2;

  const getX = (index: number, totalPoints: number) => (totalPoints <= 1) ? paddingX + usableWidth / 2 : paddingX + (index / (totalPoints - 1)) * usableWidth;
  const getY = (value: number) => chartHeight - paddingY - (value / maxValue) * usableHeight;

  // ==========================
  // RENDERERS
  // ==========================

  const renderAnalytics = () => (
    <div className="space-y-6 animate-in slide-in-from-right-10 duration-300">
        {/* Analytics Filters */}
        <div className="flex gap-4 items-center">
            {selectedMonth !== 'CUSTOM' && (
                <div className="relative shrink-0" onClick={e => e.stopPropagation()}>
                    <button 
                        onClick={() => setIsYearDropdownOpen(!isYearDropdownOpen)}
                        className="flex items-center space-x-3 bg-white pl-5 pr-4 py-3 rounded-2xl text-base font-bold text-gray-700 border border-gray-100"
                    >
                        <span>{selectedYears.length === 1 ? selectedYears[0] : `${selectedYears.length} Years`}</span>
                        <ChevronDown size={18} className={`transition-transform duration-200 ${isYearDropdownOpen ? 'rotate-180' : ''}`}/>
                    </button>
                    {isYearDropdownOpen && (
                        <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-3xl shadow-xl border border-gray-100 z-50 p-3">
                            <div className="space-y-1">
                                {availableYears.map(year => (
                                    <button 
                                        key={year} onClick={() => toggleYear(year)}
                                        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-base font-medium transition-colors ${selectedYears.includes(year) ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}
                                    >
                                        <span>{year}</span>
                                        {selectedYears.includes(year) && <Check size={20} className="text-blue-600"/>}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
            <div className="relative shrink-0 flex-1">
                <select 
                    value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}
                    className="w-full appearance-none bg-blue-600 pl-5 pr-12 py-3 rounded-2xl text-base font-bold text-white shadow-lg shadow-blue-200"
                >
                    <option value="ALL">Full Year</option>
                    <option value="CUSTOM">Custom Range</option>
                    <hr />
                    {months.map((m, i) => <option key={i} value={i}>{m}</option>)}
                </select>
                <Filter size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-100 pointer-events-none"/>
            </div>
        </div>

        {selectedMonth === 'CUSTOM' && (
            <div className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-gray-100">
                <div className="flex-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-1 mb-1 block">From</label>
                    <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} className="w-full bg-gray-50 rounded-xl px-3 py-2 text-sm font-bold text-gray-700 outline-none" />
                </div>
                <div className="flex-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-1 mb-1 block">To</label>
                    <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} className="w-full bg-gray-50 rounded-xl px-3 py-2 text-sm font-bold text-gray-700 outline-none" />
                </div>
            </div>
        )}
        
        {/* Main Stats Cards */}
        <div className="grid grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-6 rounded-[2rem] text-white shadow-xl shadow-blue-200 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10"><Banknote size={80} /></div>
                <p className="text-blue-100 text-sm font-medium mb-1">Revenue</p>
                <h3 className="text-3xl font-bold">₹{(stats.totalRev / 1000).toFixed(1)}k</h3>
                <p className="text-xs opacity-80 mt-1">Exact: ₹{stats.totalRev.toLocaleString()}</p>
            </div>
            <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-4 opacity-5"><Droplets size={80} className="text-blue-600" /></div>
                <p className="text-gray-400 text-sm font-medium mb-1">Volume</p>
                <h3 className="text-3xl font-bold text-gray-800">{stats.totalQty.toFixed(0)} L</h3>
                <div className="flex items-center mt-2 space-x-1"><span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-lg font-bold">Avg ₹{stats.avgRate.toFixed(1)}/L</span></div>
            </div>
        </div>

        {/* Sales Trend */}
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-xl font-bold text-gray-800">Sales Trend</h3>
                    <p className="text-sm text-gray-400">{selectedMonth === 'CUSTOM' ? 'Custom Range' : selectedMonth === 'ALL' ? 'Monthly Comparison' : `Daily - ${months[parseInt(selectedMonth)]}`}</p>
                </div>
            </div>
            {/* SVG Chart */}
            <div className="relative w-full overflow-hidden" style={{ height: '250px' }}>
                <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-full overflow-visible" preserveAspectRatio="none">
                    {[0, 0.25, 0.5, 0.75, 1].map((t) => (
                        <line key={t} x1={paddingX} y1={paddingY + t * usableHeight} x2={chartWidth - paddingX} y2={paddingY + t * usableHeight} stroke="#f3f4f6" strokeWidth="1" strokeDasharray={t === 1 ? "" : "4 4"} />
                    ))}
                    {chartDatasets.map((ds, idx) => {
                        const color = selectedMonth === 'CUSTOM' ? '#2563eb' : COLORS[idx % COLORS.length];
                        const points = ds.data.map((val, i) => `${getX(i, ds.data.length)},${getY(val)}`).join(' ');
                        return (
                            <g key={ds.year}>
                                <polyline points={points} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                                {ds.data.map((val, i) => (
                                    <circle key={i} cx={getX(i, ds.data.length)} cy={getY(val)} r={hoveredIndex === i ? 6 : 3} fill="white" stroke={color} strokeWidth="2" />
                                ))}
                            </g>
                        );
                    })}
                    {chartDatasets[0] && chartDatasets[0].data.map((_, i) => {
                        const total = chartDatasets[0].data.length;
                        const w = total > 1 ? usableWidth / (total - 1) : usableWidth; 
                        const x = getX(i, total) - (w / 2);
                        return <rect key={i} x={x > 0 ? x : 0} y={0} width={w > 10 ? w : 10} height={chartHeight} fill="transparent" onMouseEnter={() => setHoveredIndex(i)} onMouseLeave={() => setHoveredIndex(null)} onClick={() => setHoveredIndex(i)} />
                    })}
                </svg>
                {hoveredIndex !== null && chartDatasets.length > 0 && (
                     <div className="absolute pointer-events-none z-10 bg-gray-900/90 text-white text-sm rounded-xl py-3 px-4 shadow-xl backdrop-blur-sm border border-gray-700" style={{ left: `${(hoveredIndex / (chartDatasets[0].data.length <= 1 ? 1 : chartDatasets[0].data.length - 1)) * 100}%`, top: '5%', transform: `translateX(-50%)` }}>
                        <p className="font-bold text-gray-300 mb-2 text-center border-b border-gray-700 pb-1">{chartDatasets[0].fullLabels[hoveredIndex]}</p>
                        <div className="space-y-1">
                            {chartDatasets.map((ds, idx) => (
                                <div key={ds.year} className="flex items-center justify-between space-x-4">
                                    {selectedMonth !== 'CUSTOM' && <span className="font-medium text-gray-400">{ds.year}</span>}
                                    <span className="font-bold">₹{ds.data[hoveredIndex].toLocaleString()}</span>
                                </div>
                            ))}
                        </div>
                     </div>
                )}
            </div>
            <div className="flex justify-between mt-4 px-2">
                 {chartDatasets[0] && chartDatasets[0].labels.map((label, i) => {
                    const total = chartDatasets[0].labels.length;
                    const skipStep = Math.ceil(total / 6);
                    const show = total > 10 ? i % skipStep === 0 : true;
                    return <span key={i} className={`text-xs font-bold ${hoveredIndex === i ? 'text-blue-600 scale-110' : 'text-gray-400'} transition-all text-center flex-1`}>{show ? label : ''}</span>
                 })}
            </div>
        </div>
    </div>
  );

  const renderInvoices = () => {
    // Totals for top cards
    const totalDue = records.reduce((acc, r) => acc + (r.status !== 'PAID' ? r.totalPrice : 0), 0);
    const totalCollected = records.reduce((acc, r) => acc + (r.status === 'PAID' ? r.totalPrice : 0), 0);

    return (
        <div className="space-y-6 animate-in slide-in-from-left-10 duration-300">
            {/* Invoice Summary Cards */}
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

            {/* Generate Invoice Action */}
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

            {/* Monthly Invoice List */}
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
      
      {/* Header with Tabs */}
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

        {/* Custom Tab Switcher */}
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
            
            {/* Sliding Background */}
            <div 
                className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white rounded-xl shadow-sm transition-transform duration-300 ease-out ${activeTab === 'ANALYTICS' ? 'translate-x-[calc(100%+4px)]' : 'translate-x-1'}`}
            ></div>
        </div>
      </div>

      <div className="p-6 space-y-6 overflow-y-auto no-scrollbar pb-32 flex-1">
         {activeTab === 'INVOICES' ? renderInvoices() : renderAnalytics()}
      </div>

      {/* Invoice Modal */}
      {showInvoiceModal && (
         <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
             <div className="bg-white w-full max-w-lg rounded-[2rem] max-h-[90vh] flex flex-col animate-in slide-in-from-bottom-10 duration-300 shadow-2xl overflow-hidden">
                
                {/* Switch between Summary and Detailed List */}
                {showDetailList ? (
                    // --- DETAILED LIST VIEW ---
                    <div className="flex flex-col h-full bg-gray-50">
                        {/* List Header */}
                        <div className="bg-white p-6 border-b border-gray-100 flex items-center gap-4 shrink-0">
                            <button 
                                onClick={() => setShowDetailList(false)}
                                className="p-3 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors active:scale-90"
                            >
                                <ChevronLeft size={24} className="text-gray-700" />
                            </button>
                            <div>
                                <h3 className="text-xl font-bold text-gray-800">Included Records</h3>
                                <p className="text-sm text-gray-400">{currentInvoice.records.length} items</p>
                            </div>
                        </div>

                        {/* Scrollable List */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                            {currentInvoice.records.map(r => {
                                const d = new Date(r.date);
                                const day = d.getDate();
                                const monthShort = d.toLocaleString('default', { month: 'short' });
                                return (
                                    <div key={r.id} className="flex items-center justify-between bg-white border border-gray-100 p-4 rounded-2xl shadow-sm">
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
                                        <div className="text-right">
                                            <div className="font-bold text-lg text-gray-900">₹{r.totalPrice.toLocaleString()}</div>
                                            <div className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full inline-flex items-center gap-1 mt-1 ${r.status === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                                {r.status === 'PAID' ? <CheckCircle2 size={10} /> : <CircleDollarSign size={10} />}
                                                {r.status === 'PAID' ? 'Paid' : 'Unpaid'}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ) : (
                    // --- INVOICE SUMMARY VIEW ---
                    <>
                        {/* Modal Header */}
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

                        {/* Modal Body */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            
                            {/* Range Inputs (If Range Mode) */}
                            {invoiceMode === 'RANGE' && (
                                <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-2xl border border-gray-100 mb-4">
                                    <div className="flex-1">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase ml-1 mb-1 block">Start Date</label>
                                        <input type="date" value={customRange.start} onChange={e => setCustomRange({...customRange, start: e.target.value})} className="w-full bg-white rounded-xl px-3 py-2 text-sm font-bold text-gray-700 outline-none border border-gray-200" />
                                    </div>
                                    <div className="flex-1">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase ml-1 mb-1 block">End Date</label>
                                        <input type="date" value={customRange.end} onChange={e => setCustomRange({...customRange, end: e.target.value})} className="w-full bg-white rounded-xl px-3 py-2 text-sm font-bold text-gray-700 outline-none border border-gray-200" />
                                    </div>
                                </div>
                            )}

                            {/* Invoice Paper UI */}
                            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.1)] relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
                                
                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Balance Due</p>
                                        <h2 className="text-3xl font-bold text-gray-900 mt-1">₹{currentInvoice.unpaidAmount.toLocaleString()}</h2>
                                    </div>
                                    <div className={`px-3 py-1 rounded-lg text-xs font-bold uppercase ${currentInvoice.unpaidAmount === 0 && currentInvoice.totalAmount > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        {currentInvoice.unpaidAmount === 0 && currentInvoice.totalAmount > 0 ? 'Paid' : 'Unpaid'}
                                    </div>
                                </div>

                                <div className="space-y-3 mb-6">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Total Quantity</span>
                                        <span className="font-bold text-gray-800">{currentInvoice.records.reduce((acc, r) => acc + r.quantity, 0).toFixed(1)} L</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Total Amount</span>
                                        <span className="font-bold text-gray-800">₹{currentInvoice.totalAmount.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Already Paid</span>
                                        <span className="font-bold text-green-600">- ₹{currentInvoice.paidAmount.toLocaleString()}</span>
                                    </div>
                                    <div className="h-px bg-gray-100 my-2"></div>
                                    <div className="flex justify-between text-base font-bold">
                                        <span className="text-gray-800">Amount Due</span>
                                        <span className="text-blue-600">₹{currentInvoice.unpaidAmount.toLocaleString()}</span>
                                    </div>
                                </div>

                                {/* List Preview Button */}
                                <button 
                                    onClick={() => setShowDetailList(true)}
                                    className="w-full bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors flex items-center justify-between group active:scale-[0.99]"
                                >
                                    <div>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1 text-left">Included Records</p>
                                        <div className="flex items-center gap-2 text-xs font-bold text-gray-700">
                                            <Receipt size={14} className="text-blue-500"/>
                                            <span>{currentInvoice.records.length} Records</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 text-xs font-bold text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                        View Details <ChevronRight size={14} />
                                    </div>
                                </button>
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="p-6 border-t border-gray-100 bg-gray-50 rounded-b-[2rem]">
                            {currentInvoice.unpaidAmount > 0 ? (
                                <button 
                                    onClick={() => setShowPaymentConfirm(true)}
                                    className="w-full py-4 bg-green-600 text-white rounded-xl font-bold text-lg shadow-lg shadow-green-200 hover:bg-green-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                                >
                                    <CircleDollarSign size={24} /> Mark as Paid
                                </button>
                            ) : (
                                <button disabled className="w-full py-4 bg-gray-200 text-gray-400 rounded-xl font-bold flex items-center justify-center gap-2 cursor-not-allowed">
                                    <CheckCircle2 size={24} /> Invoice Fully Paid
                                </button>
                            )}
                        </div>
                    </>
                )}
             </div>
         </div>
      )}

      {/* Confirmation Dialog */}
      {showPaymentConfirm && (
         <div className="fixed inset-0 z-[150] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
             <div className="bg-white w-full max-w-sm rounded-[2rem] p-6 animate-in slide-in-from-bottom-10 duration-300 relative overflow-hidden text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Banknote size={32} className="text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">Confirm Payment?</h3>
                <p className="text-gray-500 mb-6">
                    Mark <strong>₹{currentInvoice.unpaidAmount.toLocaleString()}</strong> as received? This will update the status of {currentInvoice.records.filter(r => r.status !== 'PAID').length} records to Paid.
                </p>
                <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => setShowPaymentConfirm(false)} className="py-3 bg-gray-100 rounded-xl font-bold text-gray-600">Cancel</button>
                    <button onClick={handleMarkAsPaid} className="py-3 bg-green-600 text-white rounded-xl font-bold shadow-lg shadow-green-200">Confirm Received</button>
                </div>
             </div>
         </div>
      )}

    </div>
  );
};