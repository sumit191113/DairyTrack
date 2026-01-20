import React, { useState, useEffect } from 'react';
import { ArrowLeft, Volume2, VolumeX, FileDown, Lock, Trash2, Info, ChevronRight, Check, AlertTriangle, FileText, Table, File, Calendar, ChevronLeft } from 'lucide-react';
import { AppView, MilkRecord } from '../types';

interface SettingsViewProps {
  onBack: () => void;
  onNavigate: (view: AppView) => void;
  records: MilkRecord[];
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onBack, onNavigate, records }) => {
  // --- State ---
  const [soundsEnabled, setSoundsEnabled] = useState(true);
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const [appLockEnabled, setAppLockEnabled] = useState(false);
  
  // Export State
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportStep, setExportStep] = useState<'FORMAT' | 'FILTER'>('FORMAT');
  const [selectedFormat, setSelectedFormat] = useState<'PDF' | 'EXCEL' | 'CSV' | null>(null);
  const [filterType, setFilterType] = useState<'ALL' | 'MONTH' | 'RANGE'>('ALL');
  const [exportMonth, setExportMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // Lock State
  const [showPinSetup, setShowPinSetup] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [confirmPinInput, setConfirmPinInput] = useState('');
  const [pinError, setPinError] = useState('');

  // --- Load Settings on Mount ---
  useEffect(() => {
    const savedSettings = localStorage.getItem('dairyTrackSettings');
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings);
      setSoundsEnabled(parsed.soundsEnabled ?? true);
      setAlertsEnabled(parsed.alertsEnabled ?? true);
      setAppLockEnabled(!!parsed.appLockPin);
    }
  }, []);

  // --- Save Helpers ---
  const saveSettings = (newSettings: any) => {
    const current = JSON.parse(localStorage.getItem('dairyTrackSettings') || '{}');
    localStorage.setItem('dairyTrackSettings', JSON.stringify({ ...current, ...newSettings }));
  };

  const handleToggleSound = () => {
    const newVal = !soundsEnabled;
    setSoundsEnabled(newVal);
    saveSettings({ soundsEnabled: newVal });
  };

  const handleToggleAlerts = () => {
    const newVal = !alertsEnabled;
    setAlertsEnabled(newVal);
    saveSettings({ alertsEnabled: newVal });
  };

  // --- App Lock Logic ---
  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput.length !== 4) {
      setPinError('PIN must be 4 digits');
      return;
    }
    if (pinInput !== confirmPinInput) {
      setPinError('PINs do not match');
      return;
    }
    
    // Save PIN
    saveSettings({ appLockPin: pinInput });
    setAppLockEnabled(true);
    setShowPinSetup(false);
    setPinInput('');
    setConfirmPinInput('');
    setPinError('');
    alert('App Lock Enabled Successfully!');
  };

  const handleDisableLock = () => {
    if (window.confirm('Disable App Lock? You will no longer need a PIN to enter.')) {
        saveSettings({ appLockPin: null });
        setAppLockEnabled(false);
    }
  };

  // --- Export Logic ---

  const handleFormatSelect = (format: 'PDF' | 'EXCEL' | 'CSV') => {
      setSelectedFormat(format);
      setExportStep('FILTER');
  };

  const handleCloseExport = () => {
      setShowExportModal(false);
      // Reset after transition
      setTimeout(() => {
          setExportStep('FORMAT');
          setSelectedFormat(null);
          setFilterType('ALL');
          setStartDate('');
          setEndDate('');
      }, 300);
  };

  const getFilteredData = (): MilkRecord[] => {
      let data = [...records];
      
      if (filterType === 'MONTH') {
          data = data.filter(r => r.date.startsWith(exportMonth));
      } else if (filterType === 'RANGE') {
          if (startDate && endDate) {
              data = data.filter(r => r.date >= startDate && r.date <= endDate);
          }
      }
      
      // Sort by date ASC for export usually looks better, but DESC is fine too. Let's stick to Date Descending as stored.
      return data;
  };

  const handleExportDownload = () => {
    const data = getFilteredData();
    if (data.length === 0) {
        alert("No records found for the selected range.");
        return;
    }

    if (selectedFormat === 'CSV') exportToCSV(data);
    else if (selectedFormat === 'EXCEL') exportToExcel(data);
    else if (selectedFormat === 'PDF') exportToPDF(data);
    
    handleCloseExport();
  };

  const exportToCSV = (data: MilkRecord[]) => {
    const headers = ['Date', 'Quantity (L)', 'Total Price (INR)', 'Price/Liter'];
    const rows = data.map(r => [
        r.date,
        r.quantity,
        r.totalPrice,
        r.pricePerLiter
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
        + headers.join(",") + "\n" 
        + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `milk_records_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToExcel = (data: MilkRecord[]) => {
    // Simple HTML Table export for Excel
    let table = '<table border="1"><thead><tr><th>Date</th><th>Quantity (L)</th><th>Total Price</th><th>Rate</th></tr></thead><tbody>';
    data.forEach(r => {
        table += `<tr><td>${r.date}</td><td>${r.quantity}</td><td>${r.totalPrice}</td><td>${r.pricePerLiter}</td></tr>`;
    });
    table += '</tbody></table>';

    const dataType = 'application/vnd.ms-excel';
    const tableHtml = table.replace(/ /g, '%20');
    
    // Create download link
    const a = document.createElement('a');
    a.href = `data:${dataType}, ${tableHtml}`;
    a.download = `milk_records_${new Date().toISOString().split('T')[0]}.xls`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const exportToPDF = (data: MilkRecord[]) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        alert("Please allow popups to generate PDF");
        return;
    }

    const totalQty = data.reduce((sum, r) => sum + r.quantity, 0);
    const totalAmt = data.reduce((sum, r) => sum + r.totalPrice, 0);

    const html = `
        <html>
        <head>
            <title>Milk Records Export</title>
            <style>
                body { font-family: 'Helvetica', 'Arial', sans-serif; padding: 40px; color: #333; }
                .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #eee; padding-bottom: 20px; }
                h1 { margin: 0; color: #2563eb; }
                p { margin: 5px 0; color: #666; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 14px; }
                th, td { border: 1px solid #e5e7eb; padding: 12px; text-align: left; }
                th { background-color: #f8fafc; font-weight: bold; color: #475569; }
                tr:nth-child(even) { background-color: #f8fafc; }
                .summary { margin-top: 30px; padding: 20px; background-color: #f0f9ff; border-radius: 10px; }
                .summary p { font-size: 16px; font-weight: bold; color: #1e40af; }
                .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #9ca3af; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>Milk Production Report</h1>
                <p>Generated on ${new Date().toLocaleDateString()}</p>
            </div>

            <table>
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Quantity (L)</th>
                        <th>Amount (₹)</th>
                        <th>Rate/L</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.map(r => `
                        <tr>
                            <td>${r.date}</td>
                            <td>${r.quantity}</td>
                            <td>${r.totalPrice}</td>
                            <td>${r.pricePerLiter}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>

            <div class="summary">
                <p>Total Records: ${data.length}</p>
                <p>Total Quantity: ${totalQty.toFixed(2)} Liters</p>
                <p>Total Amount: ₹${totalAmt.toLocaleString()}</p>
            </div>

            <div class="footer">
                <p>Generated by DairyTrack Pro App</p>
            </div>

            <script>
                window.onload = function() { window.print(); window.close(); }
            </script>
        </body>
        </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
  };


  // --- Render ---

  if (showPinSetup) {
    return (
        <div className="h-full bg-white flex flex-col p-6 animate-in slide-in-from-right duration-300">
             <button onClick={() => setShowPinSetup(false)} className="self-start p-3 bg-gray-100 rounded-full mb-6">
                <ArrowLeft size={24} />
             </button>
             <h2 className="text-2xl font-bold text-gray-800 mb-2">Set App Lock</h2>
             <p className="text-gray-500 mb-8">Create a 4-digit PIN to secure your data.</p>
             
             <form onSubmit={handlePinSubmit} className="space-y-6">
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Enter PIN</label>
                    <input 
                        type="password" 
                        maxLength={4}
                        pattern="\d*"
                        value={pinInput}
                        onChange={(e) => setPinInput(e.target.value.replace(/\D/g,''))}
                        className="w-full bg-gray-50 border border-gray-200 p-4 rounded-xl text-center text-3xl tracking-[1em] font-bold outline-none focus:border-blue-500 transition-colors"
                        placeholder="••••"
                    />
                </div>
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Confirm PIN</label>
                    <input 
                        type="password" 
                        maxLength={4}
                        pattern="\d*"
                        value={confirmPinInput}
                        onChange={(e) => setConfirmPinInput(e.target.value.replace(/\D/g,''))}
                        className="w-full bg-gray-50 border border-gray-200 p-4 rounded-xl text-center text-3xl tracking-[1em] font-bold outline-none focus:border-blue-500 transition-colors"
                        placeholder="••••"
                    />
                </div>
                
                {pinError && <p className="text-red-500 text-sm font-bold text-center">{pinError}</p>}

                <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold shadow-lg shadow-blue-200 mt-4 active:scale-95 transition-transform">
                    Set PIN Code
                </button>
             </form>
        </div>
    )
  }

  return (
    <div className="h-full bg-gray-50 flex flex-col animate-in slide-in-from-right duration-300">
      
      {/* Header */}
      <div className="flex items-center space-x-4 p-6 bg-white shadow-sm z-10 sticky top-0 pt-safe">
        <button onClick={onBack} className="p-3 bg-gray-100 rounded-2xl hover:bg-gray-200 transition-colors shadow-sm active:scale-90">
            <ArrowLeft size={28} className="text-gray-700" />
        </button>
        <h2 className="text-2xl font-bold text-gray-800">Settings</h2>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar pb-32 p-6 space-y-8">
        
        {/* Section: Preferences */}
        <section>
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3 px-1">Sound & Feedback</h3>
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="flex items-center justify-between p-5 border-b border-gray-50">
                    <div className="flex items-center space-x-4">
                        <div className={`p-2.5 rounded-xl ${soundsEnabled ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                            {soundsEnabled ? <Volume2 size={22} /> : <VolumeX size={22} />}
                        </div>
                        <div>
                            <p className="font-bold text-gray-800">Success Sounds</p>
                            <p className="text-xs text-gray-500">Play sound when saving records</p>
                        </div>
                    </div>
                    <button 
                        onClick={handleToggleSound}
                        className={`w-12 h-7 rounded-full transition-colors relative ${soundsEnabled ? 'bg-blue-600' : 'bg-gray-300'}`}
                    >
                        <div className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-all shadow-sm ${soundsEnabled ? 'left-6' : 'left-1'}`}></div>
                    </button>
                </div>
                
                <div className="flex items-center justify-between p-5">
                    <div className="flex items-center space-x-4">
                         <div className={`p-2.5 rounded-xl ${alertsEnabled ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-400'}`}>
                            <AlertTriangle size={22} />
                        </div>
                        <div>
                            <p className="font-bold text-gray-800">Alert Sounds</p>
                            <p className="text-xs text-gray-500">Warnings and confirmations</p>
                        </div>
                    </div>
                    <button 
                        onClick={handleToggleAlerts}
                        className={`w-12 h-7 rounded-full transition-colors relative ${alertsEnabled ? 'bg-blue-600' : 'bg-gray-300'}`}
                    >
                        <div className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-all shadow-sm ${alertsEnabled ? 'left-6' : 'left-1'}`}></div>
                    </button>
                </div>
            </div>
        </section>

        {/* Section: Data */}
        <section>
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3 px-1">Data Management</h3>
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <button 
                    onClick={() => setShowExportModal(true)}
                    className="w-full flex items-center justify-between p-5 border-b border-gray-50 hover:bg-gray-50 transition-colors active:scale-[0.98]"
                >
                    <div className="flex items-center space-x-4">
                        <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                            <FileDown size={22} />
                        </div>
                        <div className="text-left">
                            <p className="font-bold text-gray-800">Export Records</p>
                            <p className="text-xs text-gray-500">PDF, Excel, or CSV</p>
                        </div>
                    </div>
                    <ChevronRight size={20} className="text-gray-300" />
                </button>

                <button 
                    onClick={() => onNavigate(AppView.TRASH)}
                    className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition-colors active:scale-[0.98]"
                >
                    <div className="flex items-center space-x-4">
                        <div className="p-2.5 bg-red-50 text-red-600 rounded-xl">
                            <Trash2 size={22} />
                        </div>
                        <div className="text-left">
                            <p className="font-bold text-gray-800">Recently Deleted</p>
                            <p className="text-xs text-gray-500">Recover lost records</p>
                        </div>
                    </div>
                    <ChevronRight size={20} className="text-gray-300" />
                </button>
            </div>
        </section>

        {/* Section: Security */}
        <section>
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3 px-1">Security</h3>
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                 <div className="flex items-center justify-between p-5">
                    <div className="flex items-center space-x-4">
                        <div className={`p-2.5 rounded-xl ${appLockEnabled ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-400'}`}>
                            <Lock size={22} />
                        </div>
                        <div>
                            <p className="font-bold text-gray-800">App Lock</p>
                            <p className="text-xs text-gray-500">{appLockEnabled ? 'Protected with PIN' : 'Secure your app'}</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => appLockEnabled ? handleDisableLock() : setShowPinSetup(true)}
                        className={`w-12 h-7 rounded-full transition-colors relative ${appLockEnabled ? 'bg-blue-600' : 'bg-gray-300'}`}
                    >
                        <div className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-all shadow-sm ${appLockEnabled ? 'left-6' : 'left-1'}`}></div>
                    </button>
                </div>
            </div>
        </section>

        {/* Section: About */}
        <section>
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3 px-1">About</h3>
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden p-6 text-center">
                 <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4 shadow-lg shadow-blue-200">
                    D
                 </div>
                 <h4 className="text-xl font-bold text-gray-800">DairyTrack Pro</h4>
                 <p className="text-sm text-gray-400 font-medium mb-6">Version 2.4.0</p>
                 
                 <div className="bg-gray-50 rounded-2xl p-4 text-sm text-gray-600 leading-relaxed mb-6">
                    Professional milk production tracking designed for modern dairy farmers. 
                    Offline-first, secure, and easy to use.
                 </div>

                 <div className="border-t border-gray-100 pt-4">
                    <p className="text-xs text-gray-400 uppercase tracking-widest font-bold mb-1">Created By</p>
                    <p className="text-sm font-bold text-gray-800">Sumit Maurya</p>
                 </div>
            </div>
        </section>

      </div>

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 z-[150] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4" onClick={handleCloseExport}>
            <div className="bg-white w-full max-w-sm rounded-[2rem] p-6 animate-in slide-in-from-bottom-10 duration-300 relative overflow-hidden" onClick={e => e.stopPropagation()}>
                
                {exportStep === 'FORMAT' ? (
                  <>
                    <h3 className="text-xl font-bold text-gray-800 mb-6 text-center">Export Records As</h3>
                    <div className="grid grid-cols-3 gap-4">
                        <button onClick={() => handleFormatSelect('PDF')} className="flex flex-col items-center gap-3 p-4 bg-red-50 rounded-2xl text-red-700 hover:bg-red-100 transition-colors active:scale-95">
                            <FileText size={32} />
                            <span className="font-bold text-sm">PDF</span>
                        </button>
                        <button onClick={() => handleFormatSelect('EXCEL')} className="flex flex-col items-center gap-3 p-4 bg-green-50 rounded-2xl text-green-700 hover:bg-green-100 transition-colors active:scale-95">
                            <Table size={32} />
                            <span className="font-bold text-sm">Excel</span>
                        </button>
                        <button onClick={() => handleFormatSelect('CSV')} className="flex flex-col items-center gap-3 p-4 bg-blue-50 rounded-2xl text-blue-700 hover:bg-blue-100 transition-colors active:scale-95">
                            <File size={32} />
                            <span className="font-bold text-sm">CSV</span>
                        </button>
                    </div>
                  </>
                ) : (
                  <div className="animate-in slide-in-from-right duration-300">
                      <div className="flex items-center space-x-3 mb-6">
                         <button onClick={() => setExportStep('FORMAT')} className="p-2 -ml-2 rounded-full hover:bg-gray-100"><ChevronLeft size={24} /></button>
                         <h3 className="text-xl font-bold text-gray-800">Select Range</h3>
                      </div>
                      
                      <div className="space-y-4 mb-8">
                          {/* Option: All Records */}
                          <label className="flex items-center justify-between p-4 bg-gray-50 rounded-xl cursor-pointer border border-transparent has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50 transition-all">
                              <span className="font-bold text-gray-700">All Records</span>
                              <input type="radio" name="filter" checked={filterType === 'ALL'} onChange={() => setFilterType('ALL')} className="w-5 h-5 text-blue-600" />
                          </label>

                          {/* Option: Month */}
                          <div className={`p-4 bg-gray-50 rounded-xl border transition-all ${filterType === 'MONTH' ? 'border-blue-500 bg-blue-50' : 'border-transparent'}`}>
                              <label className="flex items-center justify-between cursor-pointer mb-2">
                                  <span className="font-bold text-gray-700">Specific Month</span>
                                  <input type="radio" name="filter" checked={filterType === 'MONTH'} onChange={() => setFilterType('MONTH')} className="w-5 h-5 text-blue-600" />
                              </label>
                              {filterType === 'MONTH' && (
                                  <input 
                                    type="month" 
                                    value={exportMonth} 
                                    onChange={(e) => setExportMonth(e.target.value)}
                                    className="w-full p-2 rounded-lg border border-gray-200 text-gray-700 font-medium outline-none focus:ring-2 focus:ring-blue-200"
                                  />
                              )}
                          </div>

                          {/* Option: Range */}
                          <div className={`p-4 bg-gray-50 rounded-xl border transition-all ${filterType === 'RANGE' ? 'border-blue-500 bg-blue-50' : 'border-transparent'}`}>
                              <label className="flex items-center justify-between cursor-pointer mb-2">
                                  <span className="font-bold text-gray-700">Date Range</span>
                                  <input type="radio" name="filter" checked={filterType === 'RANGE'} onChange={() => setFilterType('RANGE')} className="w-5 h-5 text-blue-600" />
                              </label>
                              {filterType === 'RANGE' && (
                                  <div className="flex gap-2">
                                      <div className="flex-1">
                                        <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">From</p>
                                        <input 
                                            type="date" 
                                            value={startDate} 
                                            onChange={(e) => setStartDate(e.target.value)}
                                            className="w-full p-2 rounded-lg border border-gray-200 text-xs font-bold"
                                        />
                                      </div>
                                      <div className="flex-1">
                                        <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">To</p>
                                        <input 
                                            type="date" 
                                            value={endDate} 
                                            onChange={(e) => setEndDate(e.target.value)}
                                            className="w-full p-2 rounded-lg border border-gray-200 text-xs font-bold"
                                        />
                                      </div>
                                  </div>
                              )}
                          </div>
                      </div>

                      <button 
                        onClick={handleExportDownload}
                        className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold text-lg shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-[0.98] transition-all"
                      >
                        Download {selectedFormat}
                      </button>
                  </div>
                )}

                <button onClick={handleCloseExport} className="w-full mt-4 py-3 bg-gray-100 rounded-xl font-bold text-gray-600 hover:bg-gray-200 text-sm">
                    Cancel
                </button>
            </div>
        </div>
      )}

    </div>
  );
};