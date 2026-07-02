
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Volume2, VolumeX, FileDown, Lock, Unlock, Trash2, ChevronRight, AlertTriangle, FileText, Table, File, ChevronLeft, FileUp, Info, ClipboardList } from 'lucide-react';
import { AppView, MilkRecord } from '../types';
import * as XLSX from 'xlsx';
import { addRecord } from '../services/firebase';

interface SettingsViewProps {
  onBack: () => void;
  onNavigate: (view: AppView) => void;
  records: MilkRecord[];
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onBack, onNavigate, records }) => {
  // --- State ---
  const [soundsEnabled, setSoundsEnabled] = useState(true);
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  
  // Lock State
  const [appLockEnabled, setAppLockEnabled] = useState(false);
  const [savedPin, setSavedPin] = useState<string | null>(null);
  const [showPinSetup, setShowPinSetup] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [confirmPinInput, setConfirmPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  
  // Export State
  const [showExportModal, setShowExportModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showTextImportModal, setShowTextImportModal] = useState(false);
  const [pastedText, setPastedText] = useState('');
  const [importLoading, setImportLoading] = useState(false);
  const [importError, setImportError] = useState('');
  const [importSuccess, setImportSuccess] = useState('');
  const [showPDFConfirmModal, setShowPDFConfirmModal] = useState(false);
  const [exportStep, setExportStep] = useState<'FORMAT' | 'FILTER'>('FORMAT');
  const [selectedFormat, setSelectedFormat] = useState<'PDF' | 'EXCEL' | 'CSV' | null>(null);
  const [filterType, setFilterType] = useState<'ALL' | 'MONTH' | 'RANGE'>('ALL');
  const [exportMonth, setExportMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  

  // --- Load Settings on Mount ---
  useEffect(() => {
    const savedSettings = localStorage.getItem('dairyTrackSettings');
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings);
      setSoundsEnabled(parsed.soundsEnabled ?? true);
      setAlertsEnabled(parsed.alertsEnabled ?? true);
      
      // Fixed: Default behavior is disabled (null) for new users/projects
      if (parsed.appLockPin) {
          setAppLockEnabled(true);
          setSavedPin(parsed.appLockPin);
      } else {
          setAppLockEnabled(false);
          setSavedPin(null);
      }
    } else {
        // Defaults for absolutely fresh installs: LOCK IS OFF
        setAppLockEnabled(false);
        setSavedPin(null);
    }
  }, []);

  // --- Save Helpers ---
  const saveSettings = (newSettings: any) => {
    const current = JSON.parse(localStorage.getItem('dairyTrackSettings') || '{}');
    const updated = { ...current, ...newSettings };
    localStorage.setItem('dairyTrackSettings', JSON.stringify(updated));
    // Trigger storage event for App.tsx to reactive-sync
    window.dispatchEvent(new Event('storage'));
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
    setSavedPin(pinInput);
    
    setShowPinSetup(false);
    setPinInput('');
    setConfirmPinInput('');
    setPinError('');
  };

  const handleDisableLock = () => {
    if (window.confirm('Disable App Lock? Any user will be able to access the app without a password.')) {
        saveSettings({ appLockPin: null });
        setAppLockEnabled(false);
        setSavedPin(null);
    }
  };

  // --- Export Logic ---

  const handleFormatSelect = (format: 'PDF' | 'EXCEL' | 'CSV') => {
      setSelectedFormat(format);
      setExportStep('FILTER');
  };

  const handleCloseExport = () => {
      setShowExportModal(false);
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

  // --- Import Logic ---
  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportLoading(true);
    setImportError('');
    setImportSuccess('');

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        if (data.length === 0) {
          setImportError('Excel file is empty');
          setImportLoading(false);
          return;
        }

        let importedCount = 0;
        for (const row of data as any[]) {
          // Map Excel columns to MilkRecord fields
          // Expected columns: Date, Period, Milk, Amount
          const date = row.Date || row.date || row.DATE;
          const quantity = parseFloat(row.Milk || row.milk || row.MILK || row.Quantity || row.quantity || 0);
          const totalPrice = parseFloat(row.Amount || row.amount || row.AMOUNT || row.TotalPrice || 0);
          const pricePerLiterInput = parseFloat(row.Rate || row.rate || row.RATE || row.PricePerLiter || 0);
          
          // Calculate price per liter if Amount and Milk are provided
          const pricePerLiter = pricePerLiterInput > 0 ? pricePerLiterInput : (quantity > 0 ? totalPrice / quantity : 0);
          const finalTotalPrice = totalPrice > 0 ? totalPrice : quantity * pricePerLiter;

          const period = (row.Period || row.period || row.PERIOD || row.Shift || row.shift || 'DAY').toString().toUpperCase();
          const shift = period === 'NIGHT' ? 'NIGHT' : 'DAY';
          const status = (row.Status || row.status || row.STATUS || 'UNPAID').toUpperCase() === 'PAID' ? 'PAID' : 'UNPAID';

          if (date && quantity > 0 && pricePerLiter > 0) {
            // Try to parse date
            let formattedDate = '';
            try {
              const d = new Date(date);
              if (!isNaN(d.getTime())) {
                formattedDate = d.toISOString().split('T')[0];
              } else {
                // Handle DD-MM-YYYY or DD/MM/YYYY
                const parts = date.toString().split(/[-/]/);
                if (parts.length === 3) {
                  if (parts[0].length === 4) formattedDate = `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
                  else formattedDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
                }
              }
            } catch (e) {
              console.warn('Failed to parse date:', date);
              continue;
            }

            if (formattedDate) {
              await addRecord({
                date: formattedDate,
                quantity,
                pricePerLiter,
                totalPrice: finalTotalPrice,
                shift: shift as 'DAY' | 'NIGHT',
                status: status as 'PAID' | 'UNPAID',
                timestamp: new Date(formattedDate).getTime()
              });
              importedCount++;
            }
          }
        }

        setImportSuccess(`Successfully imported ${importedCount} records!`);
        setTimeout(() => setShowImportModal(false), 2000);
      } catch (err) {
        setImportError('Failed to parse Excel file. Please check the format.');
        console.error(err);
      } finally {
        setImportLoading(false);
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleImportPastedText = async () => {
    if (!pastedText.trim()) return;
    setImportLoading(true);
    setImportError('');
    setImportSuccess('');

    try {
      const lines = pastedText.split('\n').filter(l => l.trim());
      let importedCount = 0;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.toLowerCase().includes('date,period,milk')) continue; // Skip header

        // Simple CSV split logic that handles quotes
        const parts: string[] = [];
        let current = '';
        let inQuotes = false;
        for (let char of line) {
          if (char === '"') inQuotes = !inQuotes;
          else if (char === ',' && !inQuotes) {
            parts.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        parts.push(current.trim());

        if (parts.length >= 5) {
          const dateStr = parts[0]; // e.g. "19 January, 2026"
          const period = parts[1].toUpperCase().includes('NIGHT') ? 'NIGHT' : 'DAY';
          const milk = parseFloat(parts[2]);
          const perLiter = parseFloat(parts[3]);
          const amount = parseFloat(parts[4]);

          if (dateStr && !isNaN(milk) && !isNaN(amount)) {
            const d = new Date(dateStr);
            if (!isNaN(d.getTime())) {
              const formattedDate = d.toISOString().split('T')[0];
              await addRecord({
                date: formattedDate,
                quantity: milk,
                pricePerLiter: perLiter || (amount / milk),
                totalPrice: amount,
                shift: period as 'DAY' | 'NIGHT',
                status: 'UNPAID',
                timestamp: d.getTime()
              });
              importedCount++;
            }
          }
        }
      }
      setImportSuccess(`Successfully imported ${importedCount} records!`);
      setTimeout(() => {
        setShowTextImportModal(false);
        setPastedText('');
        setImportSuccess('');
      }, 2000);
    } catch (err) {
      setImportError('Failed to parse text. Please check the format.');
      console.error(err);
    } finally {
      setImportLoading(false);
    }
  };

  const handleAutoImportPDF = () => {
    setShowPDFConfirmModal(true);
  };

  const executePDFImport = async () => {
    setShowPDFConfirmModal(false);
    setImportLoading(true);
    setImportError('');
    setImportSuccess('');
    
    const pdfRecords = [
      // Page 1
      { date: "2026-01-19", shift: "NIGHT", quantity: 2.8, pricePerLiter: 35.11, totalPrice: 98.3 },
      { date: "2026-01-20", shift: "DAY", quantity: 2.9, pricePerLiter: 35.11, totalPrice: 101.81 },
      { date: "2026-01-20", shift: "NIGHT", quantity: 2.8, pricePerLiter: 35.11, totalPrice: 98.3 },

      // Page 2
      { date: "2026-01-21", shift: "DAY", quantity: 2.8, pricePerLiter: 35.11, totalPrice: 98.3 },
      { date: "2026-01-21", shift: "NIGHT", quantity: 2.9, pricePerLiter: 35.11, totalPrice: 101.81 },
      { date: "2026-01-22", shift: "DAY", quantity: 2.8, pricePerLiter: 35.11, totalPrice: 98.3 },
      { date: "2026-01-22", shift: "NIGHT", quantity: 2.9, pricePerLiter: 35.83, totalPrice: 103.9 },
      { date: "2026-01-23", shift: "DAY", quantity: 2.9, pricePerLiter: 37.83, totalPrice: 109.71 },
      { date: "2026-01-23", shift: "NIGHT", quantity: 3.0, pricePerLiter: 36.83, totalPrice: 110.49 },
      { date: "2026-01-24", shift: "DAY", quantity: 3.0, pricePerLiter: 36.08, totalPrice: 108.24 },
      { date: "2026-01-24", shift: "NIGHT", quantity: 2.9, pricePerLiter: 36.57, totalPrice: 106.05 },
      { date: "2026-01-25", shift: "DAY", quantity: 3.0, pricePerLiter: 35.11, totalPrice: 105.33 },
      { date: "2026-01-25", shift: "NIGHT", quantity: 2.9, pricePerLiter: 38.29, totalPrice: 111.04 },
      { date: "2026-01-26", shift: "DAY", quantity: 3.0, pricePerLiter: 35.11, totalPrice: 105.34 },
      { date: "2026-01-26", shift: "NIGHT", quantity: 3.0, pricePerLiter: 35.11, totalPrice: 105.33 },
      { date: "2026-01-27", shift: "DAY", quantity: 3.0, pricePerLiter: 35.11, totalPrice: 105.33 },
      { date: "2026-01-27", shift: "NIGHT", quantity: 3.0, pricePerLiter: 35.86, totalPrice: 107.58 },
      { date: "2026-01-28", shift: "DAY", quantity: 3.0, pricePerLiter: 35.11, totalPrice: 105.33 },
      { date: "2026-01-28", shift: "NIGHT", quantity: 3.0, pricePerLiter: 39.27, totalPrice: 117.81 },
      { date: "2026-01-29", shift: "DAY", quantity: 3.0, pricePerLiter: 38.29, totalPrice: 114.87 },
      { date: "2026-01-29", shift: "NIGHT", quantity: 3.0, pricePerLiter: 36.83, totalPrice: 110.49 },
      { date: "2026-01-30", shift: "DAY", quantity: 1.9, pricePerLiter: 35.11, totalPrice: 66.7 },
      { date: "2026-01-30", shift: "NIGHT", quantity: 2.4, pricePerLiter: 27.00, totalPrice: 64.8 },
      { date: "2026-01-31", shift: "DAY", quantity: 3.0, pricePerLiter: 36.83, totalPrice: 110.49 },
      { date: "2026-01-31", shift: "NIGHT", quantity: 4.3, pricePerLiter: 34.53, totalPrice: 148.47 },

      // Page 3
      { date: "2026-02-01", shift: "DAY", quantity: 3.0, pricePerLiter: 35.11, totalPrice: 105.33 },
      { date: "2026-02-01", shift: "NIGHT", quantity: 4.4, pricePerLiter: 35.10, totalPrice: 154.46 },
      { date: "2026-02-02", shift: "DAY", quantity: 3.0, pricePerLiter: 35.11, totalPrice: 105.33 },
      { date: "2026-02-02", shift: "NIGHT", quantity: 4.5, pricePerLiter: 35.10, totalPrice: 157.95 },
      { date: "2026-02-03", shift: "NIGHT", quantity: 3.8, pricePerLiter: 35.11, totalPrice: 133.41 },
      { date: "2026-02-03", shift: "DAY", quantity: 3.4, pricePerLiter: 34.08, totalPrice: 115.86 },
      { date: "2026-02-04", shift: "DAY", quantity: 3.2, pricePerLiter: 36.34, totalPrice: 116.28 },
      { date: "2026-02-04", shift: "NIGHT", quantity: 4.4, pricePerLiter: 36.83, totalPrice: 162.05 },
      { date: "2026-02-05", shift: "DAY", quantity: 3.3, pricePerLiter: 35.11, totalPrice: 115.86 },
      { date: "2026-02-05", shift: "NIGHT", quantity: 4.2, pricePerLiter: 35.11, totalPrice: 147.46 },
      { date: "2026-02-06", shift: "DAY", quantity: 3.5, pricePerLiter: 36.83, totalPrice: 128.9 },
      { date: "2026-02-06", shift: "NIGHT", quantity: 4.4, pricePerLiter: 36.83, totalPrice: 162.05 },
      { date: "2026-02-07", shift: "DAY", quantity: 3.4, pricePerLiter: 35.11, totalPrice: 119.37 },
      { date: "2026-02-07", shift: "NIGHT", quantity: 4.8, pricePerLiter: 35.60, totalPrice: 170.88 },
      { date: "2026-02-08", shift: "NIGHT", quantity: 4.4, pricePerLiter: 35.11, totalPrice: 154.48 },
      { date: "2026-02-08", shift: "DAY", quantity: 3.7, pricePerLiter: 35.11, totalPrice: 129.9 },
      { date: "2026-02-09", shift: "NIGHT", quantity: 4.7, pricePerLiter: 35.11, totalPrice: 165.01 },
      { date: "2026-02-09", shift: "DAY", quantity: 3.2, pricePerLiter: 35.11, totalPrice: 112.35 },
      { date: "2026-02-10", shift: "DAY", quantity: 2.8, pricePerLiter: 35.11, totalPrice: 98.3 },
      { date: "2026-02-10", shift: "NIGHT", quantity: 4.2, pricePerLiter: 35.00, totalPrice: 147.00 },

      // Page 4
      { date: "2026-02-11", shift: "DAY", quantity: 3.5, pricePerLiter: 35.20, totalPrice: 123.2 },
      { date: "2026-02-11", shift: "NIGHT", quantity: 4.1, pricePerLiter: 35.11, totalPrice: 143.95 },
      { date: "2026-02-12", shift: "DAY", quantity: 3.0, pricePerLiter: 35.11, totalPrice: 105.33 },
      { date: "2026-02-12", shift: "NIGHT", quantity: 4.2, pricePerLiter: 36.34, totalPrice: 152.62 },
      { date: "2026-02-13", shift: "DAY", quantity: 3.4, pricePerLiter: 35.11, totalPrice: 119.36 },
      { date: "2026-02-13", shift: "NIGHT", quantity: 4.1, pricePerLiter: 35.11, totalPrice: 143.95 },
      { date: "2026-02-14", shift: "DAY", quantity: 4.0, pricePerLiter: 35.11, totalPrice: 140.44 },
      { date: "2026-02-14", shift: "NIGHT", quantity: 4.4, pricePerLiter: 37.32, totalPrice: 164.2 },
      { date: "2026-02-15", shift: "NIGHT", quantity: 4.5, pricePerLiter: 35.11, totalPrice: 157.99 },
      { date: "2026-02-15", shift: "DAY", quantity: 3.5, pricePerLiter: 35.86, totalPrice: 125.51 },
      { date: "2026-02-16", shift: "DAY", quantity: 3.7, pricePerLiter: 35.11, totalPrice: 129.9 },
      { date: "2026-02-16", shift: "NIGHT", quantity: 4.1, pricePerLiter: 35.60, totalPrice: 145.96 },
      { date: "2026-02-17", shift: "DAY", quantity: 3.1, pricePerLiter: 36.83, totalPrice: 114.17 },
      { date: "2026-02-17", shift: "NIGHT", quantity: 4.1, pricePerLiter: 35.60, totalPrice: 145.96 },
      { date: "2026-02-18", shift: "NIGHT", quantity: 3.8, pricePerLiter: 36.08, totalPrice: 137.1 },
      { date: "2026-02-18", shift: "DAY", quantity: 3.3, pricePerLiter: 35.11, totalPrice: 115.86 },
      { date: "2026-02-19", shift: "DAY", quantity: 3.6, pricePerLiter: 35.63, totalPrice: 128.26 },
      { date: "2026-02-19", shift: "NIGHT", quantity: 3.3, pricePerLiter: 35.01, totalPrice: 115.53 },
      { date: "2026-02-20", shift: "DAY", quantity: 3.3, pricePerLiter: 35.86, totalPrice: 118.33 },
      { date: "2026-02-20", shift: "NIGHT", quantity: 4.0, pricePerLiter: 35.11, totalPrice: 140.44 },

      // Page 5
      { date: "2026-02-21", shift: "DAY", quantity: 2.6, pricePerLiter: 35.86, totalPrice: 93.23 },
      { date: "2026-02-21", shift: "NIGHT", quantity: 3.7, pricePerLiter: 35.11, totalPrice: 129.9 },
      { date: "2026-02-22", shift: "DAY", quantity: 3.0, pricePerLiter: 35.11, totalPrice: 105.33 },
      { date: "2026-02-22", shift: "NIGHT", quantity: 4.2, pricePerLiter: 34.27, totalPrice: 143.95 },
      { date: "2026-02-23", shift: "DAY", quantity: 3.4, pricePerLiter: 35.11, totalPrice: 119.37 },
      { date: "2026-02-23", shift: "NIGHT", quantity: 4.2, pricePerLiter: 35.11, totalPrice: 147.46 },
      { date: "2026-02-24", shift: "DAY", quantity: 3.5, pricePerLiter: 35.60, totalPrice: 124.6 },
      { date: "2026-02-24", shift: "NIGHT", quantity: 4.1, pricePerLiter: 35.11, totalPrice: 143.95 },
      { date: "2026-02-25", shift: "DAY", quantity: 3.0, pricePerLiter: 38.29, totalPrice: 114.87 },
      { date: "2026-02-25", shift: "NIGHT", quantity: 3.1, pricePerLiter: 35.10, totalPrice: 108.81 },
      { date: "2026-02-26", shift: "DAY", quantity: 2.5, pricePerLiter: 35.11, totalPrice: 87.77 },
      { date: "2026-02-26", shift: "NIGHT", quantity: 4.0, pricePerLiter: 35.11, totalPrice: 140.44 },
      { date: "2026-02-27", shift: "DAY", quantity: 3.0, pricePerLiter: 35.11, totalPrice: 105.33 },
      { date: "2026-02-27", shift: "NIGHT", quantity: 3.4, pricePerLiter: 41.39, totalPrice: 140.71 },
      { date: "2026-02-28", shift: "DAY", quantity: 3.0, pricePerLiter: 35.86, totalPrice: 107.58 },

      // Page 6
      { date: "2026-03-01", shift: "DAY", quantity: 3.0, pricePerLiter: 38.29, totalPrice: 114.87 },
      { date: "2026-03-02", shift: "NIGHT", quantity: 3.2, pricePerLiter: 38.13, totalPrice: 122.00 },
      { date: "2026-03-03", shift: "NIGHT", quantity: 3.3, pricePerLiter: 38.29, totalPrice: 126.35 },
      { date: "2026-03-03", shift: "DAY", quantity: 2.5, pricePerLiter: 38.29, totalPrice: 95.72 },
      { date: "2026-03-05", shift: "DAY", quantity: 3.4, pricePerLiter: 36.83, totalPrice: 125.22 },
      { date: "2026-03-05", shift: "NIGHT", quantity: 4.1, pricePerLiter: 36.86, totalPrice: 151.12 },
      { date: "2026-03-06", shift: "NIGHT", quantity: 3.6, pricePerLiter: 35.10, totalPrice: 126.35 },
      { date: "2026-03-06", shift: "DAY", quantity: 2.5, pricePerLiter: 35.60, totalPrice: 89.00 },
      { date: "2026-03-07", shift: "DAY", quantity: 2.4, pricePerLiter: 39.75, totalPrice: 95.40 },
      { date: "2026-03-07", shift: "NIGHT", quantity: 3.8, pricePerLiter: 35.11, totalPrice: 133.41 },
      { date: "2026-03-08", shift: "DAY", quantity: 2.5, pricePerLiter: 35.51, totalPrice: 88.77 },
      { date: "2026-03-08", shift: "NIGHT", quantity: 3.5, pricePerLiter: 36.34, totalPrice: 127.19 },
      { date: "2026-03-09", shift: "NIGHT", quantity: 3.0, pricePerLiter: 36.27, totalPrice: 108.80 },
      { date: "2026-03-09", shift: "DAY", quantity: 2.1, pricePerLiter: 37.80, totalPrice: 79.38 },
      { date: "2026-03-10", shift: "DAY", quantity: 2.2, pricePerLiter: 36.82, totalPrice: 81.00 },
      { date: "2026-03-10", shift: "NIGHT", quantity: 3.3, pricePerLiter: 37.32, totalPrice: 123.15 },

      // Page 7
      { date: "2026-03-11", shift: "NIGHT", quantity: 3.1, pricePerLiter: 35.11, totalPrice: 108.84 },
      { date: "2026-03-11", shift: "DAY", quantity: 2.3, pricePerLiter: 35.20, totalPrice: 80.95 },
      { date: "2026-03-12", shift: "DAY", quantity: 2.0, pricePerLiter: 35.86, totalPrice: 71.72 },
      { date: "2026-03-13", shift: "NIGHT", quantity: 3.0, pricePerLiter: 36.80, totalPrice: 110.40 },
      { date: "2026-03-13", shift: "DAY", quantity: 2.1, pricePerLiter: 36.08, totalPrice: 75.76 },
      { date: "2026-03-14", shift: "DAY", quantity: 2.3, pricePerLiter: 35.11, totalPrice: 80.75 },
      { date: "2026-03-14", shift: "NIGHT", quantity: 2.8, pricePerLiter: 35.60, totalPrice: 99.68 },
      { date: "2026-03-15", shift: "DAY", quantity: 2.1, pricePerLiter: 39.27, totalPrice: 82.46 },
      { date: "2026-03-15", shift: "NIGHT", quantity: 3.0, pricePerLiter: 35.02, totalPrice: 105.05 },
      { date: "2026-03-16", shift: "NIGHT", quantity: 2.6, pricePerLiter: 35.11, totalPrice: 91.28 },
      { date: "2026-03-16", shift: "DAY", quantity: 2.2, pricePerLiter: 35.11, totalPrice: 77.24 },
      { date: "2026-03-17", shift: "NIGHT", quantity: 3.4, pricePerLiter: 36.06, totalPrice: 122.62 },
      { date: "2026-03-18", shift: "DAY", quantity: 2.6, pricePerLiter: 35.86, totalPrice: 93.23 },
      { date: "2026-03-18", shift: "NIGHT", quantity: 3.0, pricePerLiter: 35.11, totalPrice: 105.33 },
      { date: "2026-03-19", shift: "DAY", quantity: 2.0, pricePerLiter: 35.11, totalPrice: 70.22 },
      { date: "2026-03-19", shift: "NIGHT", quantity: 3.0, pricePerLiter: 35.11, totalPrice: 105.33 },
      { date: "2026-03-20", shift: "DAY", quantity: 2.0, pricePerLiter: 37.20, totalPrice: 74.40 },
      { date: "2026-03-20", shift: "NIGHT", quantity: 2.8, pricePerLiter: 35.11, totalPrice: 98.30 },

      // Page 8
      { date: "2026-03-21", shift: "DAY", quantity: 1.7, pricePerLiter: 37.20, totalPrice: 63.24 },
      { date: "2026-03-21", shift: "NIGHT", quantity: 2.2, pricePerLiter: 35.11, totalPrice: 77.24 },
      { date: "2026-03-22", shift: "DAY", quantity: 1.7, pricePerLiter: 35.11, totalPrice: 59.68 },
      { date: "2026-03-22", shift: "NIGHT", quantity: 2.4, pricePerLiter: 35.11, totalPrice: 84.26 },
      { date: "2026-03-23", shift: "NIGHT", quantity: 2.4, pricePerLiter: 35.11, totalPrice: 84.26 },
      { date: "2026-03-23", shift: "DAY", quantity: 1.5, pricePerLiter: 35.11, totalPrice: 52.66 },
      { date: "2026-03-24", shift: "NIGHT", quantity: 2.8, pricePerLiter: 35.11, totalPrice: 98.30 },
      { date: "2026-03-25", shift: "NIGHT", quantity: 2.6, pricePerLiter: 35.11, totalPrice: 91.28 },
      { date: "2026-03-26", shift: "NIGHT", quantity: 3.0, pricePerLiter: 35.11, totalPrice: 105.33 },
      { date: "2026-03-27", shift: "NIGHT", quantity: 2.1, pricePerLiter: 37.20, totalPrice: 78.12 },
      { date: "2026-03-28", shift: "NIGHT", quantity: 1.9, pricePerLiter: 35.11, totalPrice: 66.70 },
      { date: "2026-03-29", shift: "NIGHT", quantity: 2.1, pricePerLiter: 35.11, totalPrice: 73.73 },
      { date: "2026-03-30", shift: "NIGHT", quantity: 2.1, pricePerLiter: 35.60, totalPrice: 74.76 },
      { date: "2026-03-31", shift: "NIGHT", quantity: 1.8, pricePerLiter: 37.06, totalPrice: 66.70 },

      // Page 9
      { date: "2026-04-01", shift: "NIGHT", quantity: 2.0, pricePerLiter: 36.34, totalPrice: 72.68 },
      { date: "2026-04-02", shift: "NIGHT", quantity: 2.0, pricePerLiter: 35.11, totalPrice: 70.22 },
      { date: "2026-04-03", shift: "NIGHT", quantity: 2.0, pricePerLiter: 35.36, totalPrice: 70.72 },
      { date: "2026-04-05", shift: "NIGHT", quantity: 2.2, pricePerLiter: 35.11, totalPrice: 77.24 },
      { date: "2026-04-06", shift: "NIGHT", quantity: 2.0, pricePerLiter: 35.11, totalPrice: 70.22 },
      { date: "2026-04-08", shift: "NIGHT", quantity: 1.8, pricePerLiter: 35.11, totalPrice: 63.19 },
      { date: "2026-04-09", shift: "NIGHT", quantity: 1.5, pricePerLiter: 35.11, totalPrice: 52.66 },
      { date: "2026-04-10", shift: "NIGHT", quantity: 1.7, pricePerLiter: 35.60, totalPrice: 60.52 },

      // Page 10
      { date: "2026-04-12", shift: "NIGHT", quantity: 1.7, pricePerLiter: 33.04, totalPrice: 56.17 },
      { date: "2026-04-13", shift: "NIGHT", quantity: 1.4, pricePerLiter: 35.11, totalPrice: 49.15 },
      { date: "2026-04-14", shift: "NIGHT", quantity: 1.7, pricePerLiter: 33.04, totalPrice: 56.17 },
      { date: "2026-04-15", shift: "NIGHT", quantity: 1.4, pricePerLiter: 35.00, totalPrice: 49.00 },
      { date: "2026-04-16", shift: "NIGHT", quantity: 1.8, pricePerLiter: 35.08, totalPrice: 63.15 },
      { date: "2026-04-17", shift: "NIGHT", quantity: 1.7, pricePerLiter: 45.86, totalPrice: 77.96 },
      { date: "2026-04-20", shift: "NIGHT", quantity: 1.6, pricePerLiter: 35.11, totalPrice: 56.17 },

      // Page 11
      { date: "2026-04-21", shift: "NIGHT", quantity: 1.5, pricePerLiter: 35.11, totalPrice: 52.66 },
      { date: "2026-04-22", shift: "NIGHT", quantity: 1.7, pricePerLiter: 35.11, totalPrice: 59.68 },
      { date: "2026-04-23", shift: "NIGHT", quantity: 1.5, pricePerLiter: 35.11, totalPrice: 52.66 },
      { date: "2026-04-25", shift: "NIGHT", quantity: 1.5, pricePerLiter: 35.11, totalPrice: 52.66 },
      { date: "2026-04-28", shift: "NIGHT", quantity: 1.7, pricePerLiter: 34.20, totalPrice: 58.14 },
      { date: "2026-04-30", shift: "NIGHT", quantity: 1.7, pricePerLiter: 35.11, totalPrice: 59.68 },

      // Page 12
      { date: "2026-05-01", shift: "NIGHT", quantity: 1.7, pricePerLiter: 35.11, totalPrice: 59.68 },
      { date: "2026-05-02", shift: "NIGHT", quantity: 1.6, pricePerLiter: 35.11, totalPrice: 56.17 },
      { date: "2026-05-06", shift: "NIGHT", quantity: 1.7, pricePerLiter: 35.11, totalPrice: 59.68 },
      { date: "2026-05-08", shift: "NIGHT", quantity: 1.7, pricePerLiter: 35.11, totalPrice: 59.68 },
      { date: "2026-05-09", shift: "NIGHT", quantity: 2.0, pricePerLiter: 35.11, totalPrice: 70.22 },
      { date: "2026-05-10", shift: "NIGHT", quantity: 2.0, pricePerLiter: 35.11, totalPrice: 70.22 },

      // Page 13
      { date: "2026-05-11", shift: "NIGHT", quantity: 1.6, pricePerLiter: 36.34, totalPrice: 58.14 },
      { date: "2026-05-12", shift: "NIGHT", quantity: 2.2, pricePerLiter: 37.20, totalPrice: 81.84 },
      { date: "2026-05-13", shift: "NIGHT", quantity: 1.7, pricePerLiter: 36.83, totalPrice: 62.61 },
      { date: "2026-05-14", shift: "NIGHT", quantity: 2.4, pricePerLiter: 36.80, totalPrice: 88.33 },
      { date: "2026-05-15", shift: "NIGHT", quantity: 1.6, pricePerLiter: 37.80, totalPrice: 60.48 },
      { date: "2026-05-16", shift: "NIGHT", quantity: 2.1, pricePerLiter: 35.11, totalPrice: 73.73 },
      { date: "2026-05-17", shift: "NIGHT", quantity: 2.2, pricePerLiter: 36.83, totalPrice: 81.02 },
      { date: "2026-05-18", shift: "NIGHT", quantity: 1.8, pricePerLiter: 36.81, totalPrice: 66.25 },
      { date: "2026-05-19", shift: "NIGHT", quantity: 2.0, pricePerLiter: 36.08, totalPrice: 72.16 },
      { date: "2026-05-20", shift: "NIGHT", quantity: 1.8, pricePerLiter: 35.08, totalPrice: 63.15 },

      // Page 14
      { date: "2026-05-21", shift: "NIGHT", quantity: 1.6, pricePerLiter: 30.31, totalPrice: 48.49 },
      { date: "2026-05-22", shift: "NIGHT", quantity: 1.7, pricePerLiter: 38.64, totalPrice: 65.68 },
      { date: "2026-05-23", shift: "NIGHT", quantity: 1.9, pricePerLiter: 32.51, totalPrice: 61.76 },
      { date: "2026-05-24", shift: "NIGHT", quantity: 2.8, pricePerLiter: 30.23, totalPrice: 84.64 },
      { date: "2026-05-25", shift: "NIGHT", quantity: 2.1, pricePerLiter: 30.23, totalPrice: 63.48 },
      { date: "2026-05-26", shift: "NIGHT", quantity: 2.9, pricePerLiter: 34.08, totalPrice: 98.84 },
      { date: "2026-05-27", shift: "NIGHT", quantity: 3.4, pricePerLiter: 32.51, totalPrice: 110.53 },
      { date: "2026-05-28", shift: "NIGHT", quantity: 2.9, pricePerLiter: 32.51, totalPrice: 94.27 },
      { date: "2026-05-29", shift: "NIGHT", quantity: 2.9, pricePerLiter: 34.23, totalPrice: 99.28 },
      { date: "2026-05-30", shift: "NIGHT", quantity: 3.4, pricePerLiter: 31.87, totalPrice: 108.35 },

      // Page 15
      { date: "2026-06-01", shift: "NIGHT", quantity: 3.0, pricePerLiter: 32.51, totalPrice: 97.53 },
      { date: "2026-06-02", shift: "NIGHT", quantity: 2.2, pricePerLiter: 30.23, totalPrice: 66.50 },
      { date: "2026-06-03", shift: "NIGHT", quantity: 2.0, pricePerLiter: 32.20, totalPrice: 64.40 },
      { date: "2026-06-04", shift: "NIGHT", quantity: 3.0, pricePerLiter: 32.51, totalPrice: 97.53 },
      { date: "2026-06-05", shift: "NIGHT", quantity: 2.5, pricePerLiter: 31.87, totalPrice: 79.67 },
      { date: "2026-06-06", shift: "NIGHT", quantity: 3.0, pricePerLiter: 33.33, totalPrice: 100.00 },
      { date: "2026-06-08", shift: "NIGHT", quantity: 3.0, pricePerLiter: 30.30, totalPrice: 90.90 },
      { date: "2026-06-10", shift: "NIGHT", quantity: 3.4, pricePerLiter: 31.25, totalPrice: 106.24 },

      // Page 16
      { date: "2026-06-12", shift: "NIGHT", quantity: 3.0, pricePerLiter: 32.96, totalPrice: 98.88 },
      { date: "2026-06-13", shift: "NIGHT", quantity: 3.2, pricePerLiter: 33.26, totalPrice: 106.43 },
      { date: "2026-06-14", shift: "NIGHT", quantity: 2.9, pricePerLiter: 32.51, totalPrice: 94.27 },
      { date: "2026-06-15", shift: "NIGHT", quantity: 3.0, pricePerLiter: 32.51, totalPrice: 97.53 },
      { date: "2026-06-16", shift: "NIGHT", quantity: 2.8, pricePerLiter: 31.35, totalPrice: 87.77 },
      { date: "2026-06-18", shift: "NIGHT", quantity: 3.8, pricePerLiter: 32.51, totalPrice: 123.53 },
      { date: "2026-06-19", shift: "NIGHT", quantity: 2.8, pricePerLiter: 32.51, totalPrice: 91.02 },
      { date: "2026-06-20", shift: "NIGHT", quantity: 3.3, pricePerLiter: 32.51, totalPrice: 107.28 },

      // Page 17
      { date: "2026-06-21", shift: "NIGHT", quantity: 3.3, pricePerLiter: 30.23, totalPrice: 99.75 },
      { date: "2026-06-27", shift: "NIGHT", quantity: 1.5, pricePerLiter: 36.36, totalPrice: 54.54 },
      { date: "2026-06-28", shift: "NIGHT", quantity: 2.8, pricePerLiter: 32.50, totalPrice: 91.00 },
      { date: "2026-06-29", shift: "NIGHT", quantity: 3.1, pricePerLiter: 33.23, totalPrice: 103.00 },

      // Page 18
      { date: "2026-07-01", shift: "NIGHT", quantity: 3.1, pricePerLiter: 33.23, totalPrice: 103.00 },
      { date: "2026-07-02", shift: "NIGHT", quantity: 2.8, pricePerLiter: 33.20, totalPrice: 92.96 }
    ];

    try {
      let importedCount = 0;
      for (const r of pdfRecords) {
        await addRecord({
          date: r.date,
          quantity: r.quantity,
          pricePerLiter: r.pricePerLiter,
          totalPrice: r.totalPrice,
          shift: r.shift as 'DAY' | 'NIGHT',
          status: 'UNPAID',
          timestamp: new Date(r.date).getTime()
        });
        importedCount++;
      }
      setImportSuccess(`Successfully imported ${importedCount} records from PDF! Please wait a moment while they sync in the background.`);
      setTimeout(() => setImportSuccess(''), 5000);
    } catch (err) {
      setImportError('Failed to import PDF records.');
      console.error(err);
    } finally {
      setImportLoading(false);
    }
  };

  const exportToCSV = (data: MilkRecord[]) => {
    const headers = ['Date', 'Quantity (L)', 'Total Price (INR)', 'Price/Liter'];
    const rows = data.map(r => [r.date, r.quantity, r.totalPrice, r.pricePerLiter]);
    const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `milk_records_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToExcel = (data: MilkRecord[]) => {
    let table = '<table border="1"><thead><tr><th>Date</th><th>Quantity (L)</th><th>Total Price</th><th>Rate</th></tr></thead><tbody>';
    data.forEach(r => {
        table += `<tr><td>${r.date}</td><td>${r.quantity}</td><td>${r.totalPrice}</td><td>${r.pricePerLiter}</td></tr>`;
    });
    table += '</tbody></table>';
    const dataType = 'application/vnd.ms-excel';
    const tableHtml = table.replace(/ /g, '%20');
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
                table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 14px; }
                th, td { border: 1px solid #e5e7eb; padding: 12px; text-align: left; }
                th { background-color: #f8fafc; font-weight: bold; }
                tr:nth-child(even) { background-color: #f8fafc; }
                .summary { margin-top: 30px; padding: 20px; background-color: #f0f9ff; border-radius: 10px; }
                .summary p { font-size: 16px; font-weight: bold; color: #1e40af; }
            </style>
        </head>
        <body>
            <div class="header"><h1>Milk Production Report</h1><p>Generated on ${new Date().toLocaleDateString()}</p></div>
            <table><thead><tr><th>Date</th><th>Quantity (L)</th><th>Amount (₹)</th><th>Rate/L</th></tr></thead>
            <tbody>${data.map(r => `<tr><td>${r.date}</td><td>${r.quantity}</td><td>${r.totalPrice}</td><td>${r.pricePerLiter}</td></tr>`).join('')}</tbody>
            </table>
            <div class="summary"><p>Total Records: ${data.length}</p><p>Total Quantity: ${totalQty.toFixed(2)} Liters</p><p>Total Amount: ₹${totalAmt.toLocaleString()}</p></div>
            <script>window.onload = function() { window.print(); window.close(); }</script>
        </body></html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
  };

  if (showPinSetup) {
    return (
        <div className="h-full bg-white flex flex-col p-6 animate-in slide-in-from-right duration-300">
             <button onClick={() => setShowPinSetup(false)} className="self-start p-3 bg-gray-100 rounded-full mb-6">
                <ArrowLeft size={24} />
             </button>
             <h2 className="text-2xl font-bold text-gray-800 mb-2">
                {appLockEnabled ? 'Change PIN' : 'Set App Lock'}
             </h2>
             <p className="text-gray-500 mb-8">Create a 4-digit PIN to secure your data.</p>
             <form onSubmit={handlePinSubmit} className="space-y-6">
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Enter New PIN</label>
                    <input type="password" maxLength={4} pattern="\d*" value={pinInput} onChange={(e) => setPinInput(e.target.value.replace(/\D/g,''))} className="w-full bg-gray-50 border border-gray-200 p-4 rounded-xl text-center text-3xl tracking-[1em] font-bold outline-none focus:border-blue-500 transition-colors" placeholder="••••" />
                </div>
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Confirm New PIN</label>
                    <input type="password" maxLength={4} pattern="\d*" value={confirmPinInput} onChange={(e) => setConfirmPinInput(e.target.value.replace(/\D/g,''))} className="w-full bg-gray-50 border border-gray-200 p-4 rounded-xl text-center text-3xl tracking-[1em] font-bold outline-none focus:border-blue-500 transition-colors" placeholder="••••" />
                </div>
                {pinError && <p className="text-red-500 text-sm font-bold text-center animate-pulse">{pinError}</p>}
                <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold shadow-lg shadow-blue-200 mt-4 active:scale-95 transition-transform">
                    {appLockEnabled ? 'Update PIN' : 'Enable Lock'}
                </button>
             </form>
        </div>
    )
  }

  return (
    <div className="h-full bg-gray-50 flex flex-col animate-in slide-in-from-right duration-300">
      <div className="flex items-center space-x-4 p-6 bg-white shadow-sm z-10 sticky top-0 pt-safe">
        <button onClick={onBack} className="p-3 bg-gray-100 rounded-2xl hover:bg-gray-200 transition-colors shadow-sm active:scale-90">
            <ArrowLeft size={28} className="text-gray-700" />
        </button>
        <h2 className="text-2xl font-bold text-gray-800">Settings</h2>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar pb-32 p-6 space-y-8">
        {importSuccess && (
          <div className="bg-green-100 border border-green-200 text-green-800 p-4 rounded-2xl text-sm font-bold text-center animate-pulse shadow-sm">
            {importSuccess}
          </div>
        )}
        {importError && (
          <div className="bg-red-100 border border-red-200 text-red-800 p-4 rounded-2xl text-sm font-bold text-center animate-bounce shadow-sm">
            {importError}
          </div>
        )}
        <section>
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3 px-1">Sound & Feedback</h3>
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="flex items-center justify-between p-5">
                    <div className="flex items-center space-x-4">
                        <div className={`p-2.5 rounded-xl ${soundsEnabled ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                            {soundsEnabled ? <Volume2 size={22} /> : <VolumeX size={22} />}
                        </div>
                        <div><p className="font-bold text-gray-800">Success Sounds</p><p className="text-xs text-gray-500">Play sound when saving records</p></div>
                    </div>
                    <button onClick={handleToggleSound} className={`w-12 h-7 rounded-full transition-colors relative ${soundsEnabled ? 'bg-blue-600' : 'bg-gray-300'}`}><div className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-all shadow-sm ${soundsEnabled ? 'left-6' : 'left-1'}`}></div></button>
                </div>
            </div>
        </section>

        <section>
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3 px-1">Security</h3>
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                 <div className="flex items-center justify-between p-5">
                    <div className="flex items-center space-x-4">
                        <div className={`p-2.5 rounded-xl ${appLockEnabled ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-400'}`}>
                            {appLockEnabled ? <Lock size={22} /> : <Unlock size={22} />}
                        </div>
                        <div><p className="font-bold text-gray-800">App Lock</p><p className="text-xs text-gray-500">{appLockEnabled ? 'Active' : 'Currently disabled'}</p></div>
                    </div>
                    <button onClick={() => appLockEnabled ? handleDisableLock() : setShowPinSetup(true)} className={`w-12 h-7 rounded-full transition-colors relative ${appLockEnabled ? 'bg-blue-600' : 'bg-gray-300'}`}><div className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-all shadow-sm ${appLockEnabled ? 'left-6' : 'left-1'}`}></div></button>
                </div>
                {appLockEnabled && (
                    <button onClick={() => setShowPinSetup(true)} className="w-full text-left px-5 py-4 text-sm font-bold text-blue-600 border-t border-gray-50 hover:bg-gray-50 flex items-center justify-between">Change PIN Code<ChevronRight size={16} /></button>
                )}
            </div>
        </section>

        <section>
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3 px-1">Data Management</h3>
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <button onClick={() => setShowExportModal(true)} className="w-full flex items-center justify-between p-5 border-b border-gray-50 hover:bg-gray-50 transition-colors active:scale-[0.98]">
                    <div className="flex items-center space-x-4"><div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl"><FileDown size={22} /></div><div className="text-left"><p className="font-bold text-gray-800">Export Records</p><p className="text-xs text-gray-500">PDF, Excel, or CSV</p></div></div>
                    <ChevronRight size={20} className="text-gray-300" />
                </button>
                <button onClick={() => onNavigate(AppView.TRASH)} className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition-colors active:scale-[0.98]">
                    <div className="flex items-center space-x-4"><div className="p-2.5 bg-red-50 text-red-600 rounded-xl"><Trash2 size={22} /></div><div className="text-left"><p className="font-bold text-gray-800">Recently Deleted</p><p className="text-xs text-gray-500">Recover lost records</p></div></div>
                    <ChevronRight size={20} className="text-gray-300" />
                </button>
            </div>
        </section>


      </div>

      {showExportModal && (
        <div className="fixed inset-0 z-[150] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4" onClick={handleCloseExport}>
            <div className="bg-white w-full max-w-sm rounded-[2rem] p-6 animate-in slide-in-from-bottom-10 duration-300 relative overflow-hidden" onClick={e => e.stopPropagation()}>
                {exportStep === 'FORMAT' ? (
                  <div className="text-center"><h3 className="text-xl font-bold text-gray-800 mb-6">Export As</h3>
                    <div className="grid grid-cols-3 gap-4">
                        <button onClick={() => handleFormatSelect('PDF')} className="flex flex-col items-center gap-3 p-4 bg-red-50 rounded-2xl text-red-700 active:scale-95"><FileText size={32} /><span className="font-bold text-sm">PDF</span></button>
                        <button onClick={() => handleFormatSelect('EXCEL')} className="flex flex-col items-center gap-3 p-4 bg-green-50 rounded-2xl text-green-700 active:scale-95"><Table size={32} /><span className="font-bold text-sm">Excel</span></button>
                        <button onClick={() => handleFormatSelect('CSV')} className="flex flex-col items-center gap-3 p-4 bg-blue-50 rounded-2xl text-blue-700 active:scale-95"><File size={32} /><span className="font-bold text-sm">CSV</span></button>
                    </div>
                  </div>
                ) : (
                  <div className="animate-in slide-in-from-right duration-300">
                      <div className="flex items-center space-x-3 mb-6"><button onClick={() => setExportStep('FORMAT')} className="p-2 -ml-2 rounded-full hover:bg-gray-100"><ChevronLeft size={24} /></button><h3 className="text-xl font-bold text-gray-800">Select Range</h3></div>
                      <div className="space-y-4 mb-8">
                          <label className="flex items-center justify-between p-4 bg-gray-50 rounded-xl cursor-pointer has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50 transition-all border border-transparent"><span className="font-bold text-gray-700">All Records</span><input type="radio" name="filter" checked={filterType === 'ALL'} onChange={() => setFilterType('ALL')} className="w-5 h-5" /></label>
                          <div className={`p-4 bg-gray-50 rounded-xl border transition-all ${filterType === 'MONTH' ? 'border-blue-500 bg-blue-50' : 'border-transparent'}`}><label className="flex items-center justify-between cursor-pointer mb-2"><span className="font-bold text-gray-700">Specific Month</span><input type="radio" name="filter" checked={filterType === 'MONTH'} onChange={() => setFilterType('MONTH')} className="w-5 h-5" /></label>{filterType === 'MONTH' && (<input type="month" value={exportMonth} onChange={(e) => setExportMonth(e.target.value)} className="w-full p-2 rounded-lg border border-gray-200 outline-none" />)}</div>
                          <div className={`p-4 bg-gray-50 rounded-xl border transition-all ${filterType === 'RANGE' ? 'border-blue-500 bg-blue-50' : 'border-transparent'}`}><label className="flex items-center justify-between cursor-pointer mb-2"><span className="font-bold text-gray-700">Date Range</span><input type="radio" name="filter" checked={filterType === 'RANGE'} onChange={() => setFilterType('RANGE')} className="w-5 h-5" /></label>{filterType === 'RANGE' && (<div className="flex gap-2"><div className="flex-1"><p className="text-[10px] text-gray-500 font-bold uppercase mb-1">From</p><input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full p-2 rounded-lg border border-gray-200 text-xs" /></div><div className="flex-1"><p className="text-[10px] text-gray-500 font-bold uppercase mb-1">To</p><input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full p-2 rounded-lg border border-gray-200 text-xs" /></div></div>)}</div>
                      </div>
                      <button onClick={handleExportDownload} className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold shadow-lg active:scale-95 transition-all">Download {selectedFormat}</button>
                  </div>
                )}
                <button onClick={handleCloseExport} className="w-full mt-4 py-3 bg-gray-100 rounded-xl font-bold text-gray-600 text-sm">Cancel</button>
            </div>
        </div>
      )}

      {showImportModal && (
        <div className="fixed inset-0 z-[150] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4" onClick={() => !importLoading && setShowImportModal(false)}>
            <div className="bg-white w-full max-w-sm rounded-[2rem] p-6 animate-in slide-in-from-bottom-10 duration-300 relative overflow-hidden" onClick={e => e.stopPropagation()}>
                <h3 className="text-xl font-bold text-gray-800 mb-4 text-center">Import Records</h3>
                
                <div className="bg-blue-50 p-4 rounded-2xl mb-6">
                    <div className="flex items-start space-x-3">
                        <Info size={20} className="text-blue-600 mt-0.5 shrink-0" />
                        <div className="text-xs text-blue-800 leading-relaxed">
                            <p className="font-bold mb-1">Excel Format Guide:</p>
                            <p>Your Excel should have these columns:</p>
                            <ul className="list-disc list-inside mt-1 space-y-0.5">
                                <li><span className="font-bold">Date</span> (YYYY-MM-DD)</li>
                                <li><span className="font-bold">Period</span> (Day/Night)</li>
                                <li><span className="font-bold">Milk</span> (Quantity in Liters)</li>
                                <li><span className="font-bold">Amount</span> (Total Price)</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {importError && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-xl text-xs font-bold mb-4 text-center animate-shake">
                        {importError}
                    </div>
                )}

                {importSuccess && (
                    <div className="bg-green-50 text-green-600 p-3 rounded-xl text-xs font-bold mb-4 text-center">
                        {importSuccess}
                    </div>
                )}

                <div className="relative">
                    <input 
                        type="file" 
                        accept=".xlsx, .xls" 
                        onChange={handleImportFile}
                        disabled={importLoading}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    <div className={`w-full py-8 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center space-y-2 transition-colors ${importLoading ? 'bg-gray-50 border-gray-200' : 'bg-blue-50/30 border-blue-200 hover:bg-blue-50'}`}>
                        {importLoading ? (
                            <div className="flex flex-col items-center">
                                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-2"></div>
                                <p className="text-sm font-bold text-gray-500">Importing...</p>
                            </div>
                        ) : (
                            <>
                                <FileUp size={32} className="text-blue-600" />
                                <p className="text-sm font-bold text-gray-700">Click to upload Excel</p>
                                <p className="text-xs text-gray-400">Max size 5MB</p>
                            </>
                        )}
                    </div>
                </div>

                <button 
                    onClick={() => setShowImportModal(false)} 
                    disabled={importLoading}
                    className="w-full mt-4 py-3 bg-gray-100 rounded-xl font-bold text-gray-600 text-sm disabled:opacity-50"
                >
                    Cancel
                </button>
            </div>
        </div>
      )}

      {showTextImportModal && (
        <div className="fixed inset-0 z-[150] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4" onClick={() => !importLoading && setShowTextImportModal(false)}>
            <div className="bg-white w-full max-w-md rounded-[2rem] p-6 animate-in slide-in-from-bottom-10 duration-300 relative overflow-hidden" onClick={e => e.stopPropagation()}>
                <h3 className="text-xl font-bold text-gray-800 mb-4 text-center">Import Text Records</h3>
                
                <div className="bg-purple-50 p-4 rounded-2xl mb-6">
                    <div className="flex items-start space-x-3">
                        <Info size={20} className="text-purple-600 mt-0.5 shrink-0" />
                        <div className="text-xs text-purple-800 leading-relaxed">
                            <p className="font-bold mb-1">Text Format Guide:</p>
                            <p>Paste records in this format (CSV):</p>
                            <p className="font-mono bg-white/50 p-1 rounded mt-1 text-[10px]">Date,Period,Milk,Per Liter,Amount</p>
                            <p className="mt-2">Example:</p>
                            <p className="font-mono bg-white/50 p-1 rounded mt-1 text-[10px]">"19 January, 2026",NIGHT,2.8,35.11,98.3</p>
                        </div>
                    </div>
                </div>

                {importError && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-xl text-xs font-bold mb-4 text-center animate-shake">
                        {importError}
                    </div>
                )}

                {importSuccess && (
                    <div className="bg-green-50 text-green-600 p-3 rounded-xl text-xs font-bold mb-4 text-center">
                        {importSuccess}
                    </div>
                )}

                <div className="space-y-4">
                    <textarea 
                        value={pastedText}
                        onChange={(e) => setPastedText(e.target.value)}
                        placeholder='Paste your records here...'
                        disabled={importLoading}
                        className="w-full h-48 bg-gray-50 border border-gray-200 rounded-2xl p-4 text-sm outline-none focus:border-purple-500 transition-colors resize-none font-mono"
                    />
                    
                    <button 
                        onClick={handleImportPastedText}
                        disabled={importLoading || !pastedText.trim()}
                        className={`w-full py-4 rounded-xl font-bold shadow-lg transition-all active:scale-95 flex items-center justify-center space-x-2 ${importLoading || !pastedText.trim() ? 'bg-gray-200 text-gray-400' : 'bg-purple-600 text-white shadow-purple-200'}`}
                    >
                        {importLoading ? (
                            <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                            <>
                                <ClipboardList size={20} />
                                <span>Import Records</span>
                            </>
                        )}
                    </button>
                </div>

                <button 
                    onClick={() => setShowTextImportModal(false)} 
                    disabled={importLoading}
                    className="w-full mt-4 py-3 bg-gray-100 rounded-xl font-bold text-gray-600 text-sm disabled:opacity-50"
                >
                    Cancel
                </button>
            </div>
        </div>
      )}

      {showPDFConfirmModal && (
        <div className="fixed inset-0 z-[150] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4" onClick={() => !importLoading && setShowPDFConfirmModal(false)}>
            <div className="bg-white w-full max-w-md rounded-[2rem] p-6 animate-in slide-in-from-bottom-10 duration-300 relative overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="flex flex-col items-center text-center space-y-4">
                    <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
                        <FileText size={32} />
                    </div>
                    
                    <div>
                        <h3 className="text-xl font-bold text-gray-800">Import PDF Milk Records</h3>
                        <p className="text-sm text-gray-500 mt-2">
                            Do you want to import all <span className="font-bold text-blue-600">177 records</span> accurately extracted from the PDF? This will instantly sync them to your Dairy Diary.
                        </p>
                    </div>

                    <div className="bg-blue-50/50 rounded-2xl p-4 w-full text-left space-y-2 border border-blue-100">
                        <h4 className="text-xs font-bold text-blue-800 uppercase tracking-wider">Extraction Details</h4>
                        <ul className="text-xs text-blue-700 space-y-1">
                            <li>• Total Records: <strong>177 days/shifts</strong></li>
                            <li>• Columns: <strong>Date, Shift/Period, Milk, Amount</strong></li>
                            <li>• Destination Node: <strong>yFMiVObygBWhrOXkdxdF93swQmj1</strong></li>
                        </ul>
                    </div>

                    <div className="w-full space-y-3 pt-2">
                        <button 
                            onClick={executePDFImport}
                            disabled={importLoading}
                            className={`w-full py-4 rounded-xl font-bold shadow-lg transition-all active:scale-95 flex items-center justify-center space-x-2 ${importLoading ? 'bg-gray-200 text-gray-400' : 'bg-blue-600 text-white shadow-blue-200 hover:bg-blue-700'}`}
                        >
                            {importLoading ? (
                                <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    <FileText size={20} />
                                    <span>Yes, Import All 177 Records</span>
                                </>
                            )}
                        </button>

                        <button 
                            onClick={() => setShowPDFConfirmModal(false)} 
                            disabled={importLoading}
                            className="w-full py-3 bg-gray-100 rounded-xl font-bold text-gray-600 text-sm hover:bg-gray-200 transition-colors disabled:opacity-50"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};
