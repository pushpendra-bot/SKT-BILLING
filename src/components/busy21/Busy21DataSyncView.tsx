import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import {
  FileText,
  Upload,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ArrowRightLeft,
  Copy,
  Check,
  RefreshCw,
  Building2,
  Users,
  Package,
  Receipt,
  FileCode,
  HelpCircle,
  Sparkles,
  ClipboardPaste,
  ArrowRight,
  Database,
  ExternalLink,
  Table,
} from 'lucide-react';
import {
  generateBusy21Xml,
  generateBusy21ExcelWorkbook,
  generateBusy21AccountsExcel,
  generateBusy21ItemsExcel,
  generateBusy21VouchersExcel,
  generateBusy21AccountsCsv,
  generateBusy21ItemsCsv,
  generateBusy21VouchersCsv,
  getSampleBusy21Xml,
  parseAnyBusy21Data,
  parseBusy21Excel,
  downloadFile,
  downloadBinaryFile,
  Busy21ParsedData,
} from '../../utils/busy21Data';
import { Party, InventoryItem, Invoice } from '../../types';

interface Busy21DataSyncViewProps {
  onNavigateTab?: (tab: string) => void;
}

export const Busy21DataSyncView: React.FC<Busy21DataSyncViewProps> = ({ onNavigateTab }) => {
  const { profile, parties, items, invoices, slots, activeSlotId, restoreSlotsData } = useApp();

  const [activeTab, setActiveTab] = useState<'import' | 'export' | 'guide'>('import');
  const [importInputMethod, setImportInputMethod] = useState<'file' | 'paste'>('file');
  const [pastedContent, setPastedContent] = useState('');

  // Target Slot for Import
  const [targetSlotId, setTargetSlotId] = useState<number>(activeSlotId);

  // Copy feedbacks
  const [copiedType, setCopiedType] = useState<string | null>(null);

  // Drag over state
  const [isDragging, setIsDragging] = useState(false);

  // Import State
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');
  const [parsedData, setParsedData] = useState<Busy21ParsedData | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<{
    message: string;
    slotId: number;
    partiesAdded: number;
    itemsAdded: number;
    invoicesAdded: number;
  } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // XML Preview State
  const [showXmlPreview, setShowXmlPreview] = useState(false);

  const xmlExportData = React.useMemo(() => {
    return generateBusy21Xml(profile, parties, items, invoices);
  }, [profile, parties, items, invoices]);

  const copyWithFeedback = (text: string, type: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedType(type);
      setTimeout(() => setCopiedType(null), 2500);
    });
  };

  // Export handlers
  const handleDownloadFullExcel = () => {
    const buffer = generateBusy21ExcelWorkbook(parties, items, invoices);
    const dateStr = new Date().toISOString().split('T')[0];
    const safeName = profile.businessName?.replace(/[^a-zA-Z0-9]/g, '_') || 'Firm';
    downloadBinaryFile(
      buffer,
      `Busy21_All_Data_Package_${safeName}_${dateStr}.xlsx`,
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
  };

  const handleDownloadAccountsExcel = () => {
    const buffer = generateBusy21AccountsExcel(parties, invoices);
    const dateStr = new Date().toISOString().split('T')[0];
    downloadBinaryFile(buffer, `Busy21_Accounts_All_Details_${dateStr}.xlsx`);
  };

  const handleDownloadItemsExcel = () => {
    const buffer = generateBusy21ItemsExcel(items, invoices);
    const dateStr = new Date().toISOString().split('T')[0];
    downloadBinaryFile(buffer, `Busy21_Items_All_Details_${dateStr}.xlsx`);
  };

  const handleDownloadVouchersExcel = () => {
    const buffer = generateBusy21VouchersExcel(invoices, parties, items);
    const dateStr = new Date().toISOString().split('T')[0];
    downloadBinaryFile(buffer, `Busy21_Vouchers_All_Details_${dateStr}.xlsx`);
  };

  const handleDownloadXml = () => {
    const dateStr = new Date().toISOString().split('T')[0];
    const safeName = profile.businessName?.replace(/[^a-zA-Z0-9]/g, '_') || 'Firm';
    downloadFile(xmlExportData, `Busy21_Export_${safeName}_${dateStr}.xml`, 'application/xml');
  };

  const handleDownloadAccountsCsv = () => {
    const csv = generateBusy21AccountsCsv(parties, invoices);
    const dateStr = new Date().toISOString().split('T')[0];
    downloadFile(csv, `Busy21_Accounts_Masters_All_Details_${dateStr}.csv`, 'text/csv');
  };

  const handleDownloadItemsCsv = () => {
    const csv = generateBusy21ItemsCsv(items, invoices);
    const dateStr = new Date().toISOString().split('T')[0];
    downloadFile(csv, `Busy21_Item_Masters_All_Details_${dateStr}.csv`, 'text/csv');
  };

  const handleDownloadVouchersCsv = () => {
    const csv = generateBusy21VouchersCsv(invoices, parties, items);
    const dateStr = new Date().toISOString().split('T')[0];
    downloadFile(csv, `Busy21_Vouchers_Transactions_All_Details_${dateStr}.csv`, 'text/csv');
  };

  const handleDownloadFullJson = () => {
    const payload = {
      generator: 'SKT Billing Enterprise (Busy 21 Engine)',
      exportedAt: new Date().toISOString(),
      firm: profile,
      accounts: parties,
      items: items,
      vouchers: invoices,
    };
    const jsonStr = JSON.stringify(payload, null, 2);
    downloadFile(jsonStr, `Busy21_All_Data_${new Date().toISOString().split('T')[0]}.json`, 'application/json');
  };

  // Process text from file or paste
  const processImportString = (rawText: string) => {
    setImportError(null);
    setImportSuccess(null);
    setIsProcessing(true);

    try {
      if (!rawText || !rawText.trim()) {
        setImportError('Input is empty. Please choose a file or paste your Busy 21 XML or CSV data.');
        setIsProcessing(false);
        return;
      }

      const parsed = parseAnyBusy21Data(rawText);

      if (parsed.summary.partiesCount === 0 && parsed.summary.itemsCount === 0 && parsed.summary.invoicesCount === 0) {
        setImportError(
          'Could not find any accounts, stock items, or vouchers in the provided data. Please verify your file contains Busy 21 XML tags or CSV master columns.'
        );
        setIsProcessing(false);
        return;
      }

      setParsedData(parsed);
    } catch (err: any) {
      setImportError(`Parse error: ${err.message || 'Failed to read data format'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Process a File object (handles both binary Excel and text XML/CSV/JSON)
  const processFile = (file: File) => {
    setImportError(null);
    setImportSuccess(null);
    setIsProcessing(true);

    const fileName = file.name.toLowerCase();
    const isExcel = fileName.endsWith('.xlsx') || fileName.endsWith('.xls');

    if (isExcel) {
      const reader = new FileReader();
      reader.onload = ev => {
        try {
          const buffer = ev.target?.result as ArrayBuffer;
          const parsed = parseBusy21Excel(buffer);

          if (
            parsed.summary.partiesCount === 0 &&
            parsed.summary.itemsCount === 0 &&
            parsed.summary.invoicesCount === 0
          ) {
            setImportError(
              `No accounts, stock items, or vouchers were found in "${file.name}". Please ensure your Excel sheet has column headers like "Item Name", "Account Name", or "Voucher No".`
            );
            setIsProcessing(false);
            return;
          }

          setParsedData(parsed);
        } catch (err: any) {
          setImportError(`Excel read error: ${err.message || 'Failed to parse Excel file'}`);
        } finally {
          setIsProcessing(false);
        }
      };
      reader.onerror = () => {
        setImportError('Failed to read Excel file from disk.');
        setIsProcessing(false);
      };
      reader.readAsArrayBuffer(file);
    } else {
      const reader = new FileReader();
      reader.onload = ev => {
        const text = ev.target?.result as string;
        processImportString(text);
      };
      reader.onerror = () => {
        setImportError('Failed to read file from disk. Try using the "Paste Raw Text" option instead.');
        setIsProcessing(false);
      };
      reader.readAsText(file);
    }
  };

  // File upload change handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  // Paste handler
  const handleParsePasted = () => {
    processImportString(pastedContent);
  };

  // Sample data loader
  const handleLoadSampleData = () => {
    setImportError(null);
    setImportSuccess(null);
    const sampleXml = getSampleBusy21Xml();
    processImportString(sampleXml);
  };

  // Confirm and apply import
  const handleConfirmImport = () => {
    if (!parsedData) return;

    try {
      const targetSlot = slots.find(s => s.slotId === targetSlotId) || slots[0];

      let updatedParties: Party[] = [];
      let updatedItems: InventoryItem[] = [];
      let updatedInvoices: Invoice[] = [];

      if (importMode === 'replace') {
        updatedParties = parsedData.parties;
        updatedItems = parsedData.items;
        updatedInvoices = parsedData.invoices;
      } else {
        // MERGE Parties: match by name or GSTIN
        const existingParties = [...(targetSlot.parties || [])];
        parsedData.parties.forEach(newP => {
          const idx = existingParties.findIndex(
            ep =>
              ep.name.toLowerCase() === newP.name.toLowerCase() ||
              (newP.gstin && ep.gstin && ep.gstin.toUpperCase() === newP.gstin.toUpperCase())
          );
          if (idx !== -1) {
            existingParties[idx] = { ...existingParties[idx], ...newP, id: existingParties[idx].id };
          } else {
            existingParties.push(newP);
          }
        });
        updatedParties = existingParties;

        // MERGE Items: match by item name
        const existingItems = [...(targetSlot.items || [])];
        parsedData.items.forEach(newIt => {
          const idx = existingItems.findIndex(
            eit => eit.name.toLowerCase() === newIt.name.toLowerCase()
          );
          if (idx !== -1) {
            existingItems[idx] = { ...existingItems[idx], ...newIt, id: existingItems[idx].id };
          } else {
            existingItems.push(newIt);
          }
        });
        updatedItems = existingItems;

        // MERGE Invoices: match by invoice number
        const existingInvoices = [...(targetSlot.invoices || [])];
        parsedData.invoices.forEach(newInv => {
          const idx = existingInvoices.findIndex(
            einv => einv.invoiceNumber === newInv.invoiceNumber && einv.type === newInv.type
          );
          if (idx !== -1) {
            existingInvoices[idx] = { ...existingInvoices[idx], ...newInv, id: existingInvoices[idx].id };
          } else {
            existingInvoices.push(newInv);
          }
        });
        updatedInvoices = existingInvoices;
      }

      // Update slot
      const updatedSlots = slots.map(s => {
        if (s.slotId === targetSlotId) {
          return {
            ...s,
            parties: updatedParties,
            items: updatedItems,
            invoices: updatedInvoices,
          };
        }
        return s;
      });

      restoreSlotsData(updatedSlots, targetSlotId);

      setImportSuccess({
        message: `Successfully imported Busy 21 data into Business Profile Slot ${targetSlotId} (${targetSlot.profile.businessName || `Slot ${targetSlotId}`})!`,
        slotId: targetSlotId,
        partiesAdded: parsedData.summary.partiesCount,
        itemsAdded: parsedData.summary.itemsCount,
        invoicesAdded: parsedData.summary.invoicesCount,
      });

      setParsedData(null);
      setPastedContent('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      setImportError(`Failed to save imported data: ${err.message}`);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 font-sans">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-slate-700">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-rose-600/30 border border-rose-500/40 text-rose-300 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <ArrowRightLeft className="h-3.5 w-3.5 text-rose-400" />
              Busy 21 Universal Data Bridge
            </span>
            <span className="text-xs text-emerald-300 font-mono font-semibold">
              Excel (.xlsx) · XML · CSV · JSON
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Busy 21 Data Import & Export Hub
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
            Import all Accounts, Stock Inventory, and Vouchers directly from Busy 21 Excel spreadsheets or XML files, and export your complete SKT Billing records into Busy 21 Excel and XML packages.
          </p>
        </div>

        {/* Current Active Slot Stats Pill */}
        <div className="bg-white/10 backdrop-blur-md px-4 py-3 rounded-xl border border-white/20 text-right shrink-0">
          <div className="text-[10px] text-slate-300 uppercase font-bold tracking-wider">
            Active Slot {activeSlotId} Masters
          </div>
          <div className="text-sm font-bold text-white mt-0.5">
            {profile.businessName || 'Business Profile'}
          </div>
          <div className="text-xs text-emerald-400 font-semibold mt-1 flex items-center justify-end gap-2">
            <span>{parties.length} Parties</span>
            <span>·</span>
            <span>{items.length} Items</span>
            <span>·</span>
            <span>{invoices.length} Bills</span>
          </div>
        </div>
      </div>

      {/* Main Tabs Selector */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab('import')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-2xs ${
            activeTab === 'import'
              ? 'bg-rose-600 text-white shadow-sm'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
          }`}
        >
          <Upload className="h-4 w-4" />
          <span>Import Data from Busy 21</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('export')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-2xs ${
            activeTab === 'export'
              ? 'bg-rose-600 text-white shadow-sm'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
          }`}
        >
          <Download className="h-4 w-4" />
          <span>Export Data to Busy 21</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('guide')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-2xs ${
            activeTab === 'guide'
              ? 'bg-rose-600 text-white shadow-sm'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
          }`}
        >
          <HelpCircle className="h-4 w-4" />
          <span>Busy 21 Software Guide</span>
        </button>
      </div>

      {/* TAB 1: IMPORT FROM BUSY 21 */}
      {activeTab === 'import' && (
        <div className="space-y-6">
          {/* Success Banner with Quick Links */}
          {importSuccess && (
            <div className="p-5 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl border-2 border-emerald-300 shadow-sm space-y-3 animate-in fade-in duration-300">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-base font-extrabold text-emerald-950">
                    Import Completed Successfully!
                  </h3>
                  <p className="text-xs text-emerald-800 mt-0.5">
                    {importSuccess.message}
                  </p>
                </div>
              </div>

              {/* Imported counts pills */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="px-3 py-1 bg-white rounded-lg border border-emerald-200 text-xs font-bold text-emerald-900 shadow-2xs">
                  👤 Parties Imported: <strong>{importSuccess.partiesAdded}</strong>
                </span>
                <span className="px-3 py-1 bg-white rounded-lg border border-emerald-200 text-xs font-bold text-emerald-900 shadow-2xs">
                  📦 Items Imported: <strong>{importSuccess.itemsAdded}</strong>
                </span>
                <span className="px-3 py-1 bg-white rounded-lg border border-emerald-200 text-xs font-bold text-emerald-900 shadow-2xs">
                  🧾 Vouchers Imported: <strong>{importSuccess.invoicesAdded}</strong>
                </span>
              </div>

              {/* Navigation shortcuts */}
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-emerald-200/60">
                <span className="text-xs font-semibold text-emerald-900">Jump to View:</span>
                {onNavigateTab && (
                  <>
                    <button
                      type="button"
                      onClick={() => onNavigateTab('parties')}
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1"
                    >
                      <span>View Parties</span>
                      <ArrowRight className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onNavigateTab('inventory')}
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1"
                    >
                      <span>View Inventory</span>
                      <ArrowRight className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onNavigateTab('sales')}
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1"
                    >
                      <span>View Sale Bills</span>
                      <ArrowRight className="h-3 w-3" />
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Error Banner */}
          {importError && (
            <div className="p-4 bg-rose-50 rounded-2xl border border-rose-200 flex items-start gap-3 text-rose-900 text-xs animate-in fade-in duration-200">
              <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <strong className="block text-sm font-bold text-rose-900">Import Issue Detected</strong>
                <p>{importError}</p>
                <p className="text-[11px] text-slate-600">
                  Tip: Make sure you export from Busy 21 using <strong>MS-Excel (.xlsx)</strong> or <strong>XML</strong>. You can also paste copied rows into the <strong>&quot;Paste Raw Text&quot;</strong> tab!
                </p>
              </div>
            </div>
          )}

          {/* Import Method Toggle: File vs Paste */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-2.5 rounded-2xl border border-slate-200">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setImportInputMethod('file')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  importInputMethod === 'file'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Upload className="h-4 w-4" />
                <span>Upload File (.XLSX, .XLS, .XML, .CSV, .JSON)</span>
              </button>

              <button
                type="button"
                onClick={() => setImportInputMethod('paste')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  importInputMethod === 'paste'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <ClipboardPaste className="h-4 w-4" />
                <span>Paste Raw Text / XML / CSV</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleLoadSampleData}
              className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl font-bold text-xs transition-all active:scale-95 flex items-center gap-1.5"
              title="Loads ready-to-test Busy 21 sample XML data"
            >
              <Sparkles className="h-3.5 w-3.5 text-rose-600" />
              <span>Load 1-Click Sample Data</span>
            </button>
          </div>

          {/* Method A: File Upload Zone */}
          {importInputMethod === 'file' && (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`bg-white rounded-2xl p-6 sm:p-10 border-2 border-dashed transition-all text-center space-y-4 ${
                isDragging
                  ? 'border-rose-600 bg-rose-50/50 scale-[1.01]'
                  : 'border-slate-300 hover:border-rose-500'
              }`}
            >
              <div className="p-4 bg-rose-50 text-rose-600 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
                <Upload className="h-8 w-8" />
              </div>

              <div className="space-y-1">
                <h3 className="text-base font-extrabold text-slate-900">
                  Select or Drag Busy 21 Export File
                </h3>
                <p className="text-xs text-slate-500 max-w-lg mx-auto">
                  Accepts MS-Excel workbooks (<code className="font-mono text-rose-600">.xlsx, .xls</code>), official Busy 21 XML (<code className="font-mono text-rose-600">.xml</code>), Accounts CSV, Item Master CSV, or JSON backups.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.xml,.csv,.tsv,.txt,.json"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="busy-file-input"
                />
                <label
                  htmlFor="busy-file-input"
                  className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs cursor-pointer shadow-sm transition-all active:scale-95 flex items-center gap-2"
                >
                  <Upload className="h-4 w-4" />
                  <span>Choose File to Import</span>
                </label>
              </div>

              <div className="text-[11px] text-slate-400 font-mono">
                Formats: .xlsx / .xls (Excel Multi-Sheet), .xml (Busy 21 & Tally), .csv (Masters & Registers), .json
              </div>

              {isProcessing && (
                <div className="pt-2 flex items-center justify-center gap-2 text-xs font-semibold text-rose-600">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Parsing Busy 21 dataset...</span>
                </div>
              )}
            </div>
          )}

          {/* Method B: Direct Paste Text Area */}
          {importInputMethod === 'paste' && (
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">
                    Paste Raw Busy 21 Text / XML / CSV Data
                  </h3>
                  <p className="text-xs text-slate-500">
                    Copy rows or XML directly from Busy 21 software and paste below:
                  </p>
                </div>
                {pastedContent && (
                  <button
                    type="button"
                    onClick={() => setPastedContent('')}
                    className="text-xs text-slate-400 hover:text-slate-600 font-medium"
                  >
                    Clear Text
                  </button>
                )}
              </div>

              <textarea
                value={pastedContent}
                onChange={e => setPastedContent(e.target.value)}
                placeholder="Paste Busy 21 XML tags, CSV rows, or tab-separated data here..."
                rows={8}
                className="w-full p-3 font-mono text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white text-slate-800"
              />

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleParsePasted}
                  disabled={!pastedContent.trim() || isProcessing}
                  className="px-6 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-xl font-bold text-xs shadow-xs transition-all active:scale-95 flex items-center gap-2"
                >
                  {isProcessing ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <ArrowRight className="h-4 w-4" />
                  )}
                  <span>Parse Pasted Data</span>
                </button>
              </div>
            </div>
          )}

          {/* PARSED DATA PREVIEW & CONFIRMATION BOX */}
          {parsedData && (
            <div className="bg-white rounded-2xl p-5 border-2 border-indigo-200 shadow-lg space-y-5 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900">
                      Discovered Busy 21 Records
                    </h3>
                    <p className="text-xs text-slate-500">
                      Format: <strong className="uppercase font-mono text-indigo-600">{parsedData.formatDetected}</strong>
                      {parsedData.firmName && ` · Firm: "${parsedData.firmName}"`}
                    </p>
                  </div>
                </div>

                {/* Import Target Slot & Mode Settings */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-200">
                    <span className="text-[11px] font-bold text-slate-600">Target Slot:</span>
                    <select
                      value={targetSlotId}
                      onChange={e => setTargetSlotId(Number(e.target.value))}
                      className="text-xs font-bold text-slate-900 bg-transparent focus:outline-none cursor-pointer"
                    >
                      {slots.map(s => (
                        <option key={s.slotId} value={s.slotId}>
                          Slot {s.slotId}: {s.profile.businessName || `Business ${s.slotId}`}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setImportMode('merge')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        importMode === 'merge'
                          ? 'bg-white text-slate-900 shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Merge & Update
                    </button>
                    <button
                      type="button"
                      onClick={() => setImportMode('replace')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        importMode === 'replace'
                          ? 'bg-rose-600 text-white shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Replace Slot Data
                    </button>
                  </div>
                </div>
              </div>

              {/* Counts Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 bg-indigo-50/70 rounded-xl border border-indigo-100">
                  <span className="text-[10px] text-indigo-700 font-bold uppercase block tracking-wider">
                    Parties / Accounts Found
                  </span>
                  <div className="text-2xl font-black text-slate-900 mt-0.5">
                    {parsedData.summary.partiesCount}
                  </div>
                  <span className="text-[11px] text-slate-500">Debtors & Creditors</span>
                </div>
                <div className="p-3.5 bg-emerald-50/70 rounded-xl border border-emerald-100">
                  <span className="text-[10px] text-emerald-700 font-bold uppercase block tracking-wider">
                    Inventory Items Found
                  </span>
                  <div className="text-2xl font-black text-slate-900 mt-0.5">
                    {parsedData.summary.itemsCount}
                  </div>
                  <span className="text-[11px] text-slate-500">Stock & Goods</span>
                </div>
                <div className="p-3.5 bg-amber-50/70 rounded-xl border border-amber-100">
                  <span className="text-[10px] text-amber-700 font-bold uppercase block tracking-wider">
                    Vouchers / Bills Found
                  </span>
                  <div className="text-2xl font-black text-slate-900 mt-0.5">
                    {parsedData.summary.invoicesCount}
                  </div>
                  <span className="text-[11px] text-slate-500">Sales & Purchases</span>
                </div>
              </div>

              {/* Sample preview tables */}
              {parsedData.parties.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                      Accounts Sample Preview (Showing up to 4)
                    </h4>
                    <span className="text-xs text-slate-500">{parsedData.parties.length} total parties</span>
                  </div>
                  <div className="overflow-x-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                        <tr>
                          <th className="p-2.5">Party Name</th>
                          <th className="p-2.5">Type</th>
                          <th className="p-2.5">GSTIN</th>
                          <th className="p-2.5">Phone</th>
                          <th className="p-2.5">State</th>
                          <th className="p-2.5 text-right">Balance (₹)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-800">
                        {parsedData.parties.slice(0, 4).map((p, i) => (
                          <tr key={i} className="hover:bg-slate-50/50">
                            <td className="p-2.5 font-bold">{p.name}</td>
                            <td className="p-2.5 capitalize">{p.type}</td>
                            <td className="p-2.5 font-mono text-[11px]">{p.gstin || 'Unregistered'}</td>
                            <td className="p-2.5">{p.phone || 'N/A'}</td>
                            <td className="p-2.5">{p.state}</td>
                            <td className="p-2.5 text-right font-mono font-bold">₹{p.openingBalance}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {parsedData.items.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                      Inventory Items Sample Preview (Showing up to 4)
                    </h4>
                    <span className="text-xs text-slate-500">{parsedData.items.length} total items</span>
                  </div>
                  <div className="overflow-x-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                        <tr>
                          <th className="p-2.5">Item Name</th>
                          <th className="p-2.5">HSN Code</th>
                          <th className="p-2.5">Unit</th>
                          <th className="p-2.5 text-right">Selling Price (₹)</th>
                          <th className="p-2.5 text-right">Tax Rate (%)</th>
                          <th className="p-2.5 text-right">Stock</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-800">
                        {parsedData.items.slice(0, 4).map((it, i) => (
                          <tr key={i} className="hover:bg-slate-50/50">
                            <td className="p-2.5 font-bold">{it.name}</td>
                            <td className="p-2.5 font-mono text-[11px]">{it.hsnSac || 'N/A'}</td>
                            <td className="p-2.5">{it.unit}</td>
                            <td className="p-2.5 text-right font-mono font-bold">₹{it.sellingPrice}</td>
                            <td className="p-2.5 text-right font-mono">{it.taxRate}%</td>
                            <td className="p-2.5 text-right font-mono font-bold">{it.currentStock}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {parsedData.invoices.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                      Vouchers Sample Preview (Showing up to 3)
                    </h4>
                    <span className="text-xs text-slate-500">{parsedData.invoices.length} total vouchers</span>
                  </div>
                  <div className="overflow-x-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                        <tr>
                          <th className="p-2.5">Voucher #</th>
                          <th className="p-2.5">Type</th>
                          <th className="p-2.5">Date</th>
                          <th className="p-2.5">Party Name</th>
                          <th className="p-2.5 text-right">Grand Total (₹)</th>
                          <th className="p-2.5 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-800">
                        {parsedData.invoices.slice(0, 3).map((inv, i) => (
                          <tr key={i} className="hover:bg-slate-50/50">
                            <td className="p-2.5 font-bold">{inv.invoiceNumber}</td>
                            <td className="p-2.5 uppercase text-[11px]">{inv.type}</td>
                            <td className="p-2.5">{inv.date}</td>
                            <td className="p-2.5 font-semibold">{inv.partyName}</td>
                            <td className="p-2.5 text-right font-mono font-bold">₹{inv.grandTotal}</td>
                            <td className="p-2.5 text-right">{inv.status}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between pt-3 border-t border-slate-100 gap-3">
                <button
                  type="button"
                  onClick={() => setParsedData(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel Preview
                </button>

                <button
                  type="button"
                  onClick={handleConfirmImport}
                  className="px-7 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs shadow-md transition-all active:scale-95 flex items-center gap-2"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Execute Import & Apply to Slot {targetSlotId}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: EXPORT TO BUSY 21 */}
      {activeTab === 'export' && (
        <div className="space-y-6">
          {/* Top Hero Card: Complete Excel Workbook */}
          <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white rounded-2xl p-6 shadow-md border border-emerald-700/60 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center gap-2">
                <span className="px-3 py-0.5 bg-emerald-500/30 text-emerald-300 border border-emerald-400/40 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-400" />
                  Recommended for Busy 21
                </span>
                <span className="text-xs text-amber-300 font-bold">1-Click All-in-One</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black tracking-tight">
                Complete Busy 21 MS-Excel Package (.xlsx)
              </h3>
              <p className="text-xs sm:text-sm text-slate-300">
                Exports all <strong>Accounts (with GSTIN, PAN, Phone, Email, Billing & Shipping Address, State Code, City, Pincode, Balances)</strong>, <strong>Item Masters (with HSN/SAC, Tax Rates, Cost & Sale Rates, Stock, Margins, Valuation)</strong>, and <strong>Vouchers (with line-by-line Party & Item details)</strong> inside a single multi-sheet Excel file configured for Busy 21 import.
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-emerald-200">
                <span>✓ All Party Details (GSTIN, PAN, Address, Contact, Balances)</span>
                <span>·</span>
                <span>✓ All Item Details (HSN, Price, Cost, Stock, Margins, Tax)</span>
                <span>·</span>
                <span>✓ All Vouchers</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleDownloadFullExcel}
              className="px-7 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm rounded-xl shadow-lg transition-all active:scale-95 flex items-center gap-2 shrink-0 cursor-pointer"
            >
              <Download className="h-5 w-5" />
              <span>Download Excel (.xlsx) Package</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Busy 21 Full XML Card */}
            <div className="bg-white rounded-2xl p-5 border-2 border-rose-200 shadow-sm flex flex-col justify-between space-y-4 hover:border-rose-400 transition-all">
              <div className="space-y-2">
                <div className="p-3 bg-rose-50 text-rose-600 rounded-xl w-fit">
                  <FileCode className="h-6 w-6" />
                </div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-extrabold text-sm text-slate-900">Busy 21 Standard XML</h3>
                  <span className="text-[10px] font-bold bg-rose-100 text-rose-700 px-1.5 py-0.2 rounded">Official</span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Complete backup of all Parties, Inventory items, and Vouchers structured for Busy 21 XML import.
                </p>
                <div className="text-[11px] font-semibold text-slate-600 bg-slate-50 p-2.5 rounded-lg space-y-0.5">
                  <div>Accounts: <strong>{parties.length}</strong></div>
                  <div>Inventory Items: <strong>{items.length}</strong></div>
                  <div>Vouchers: <strong>{invoices.length}</strong></div>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleDownloadXml}
                  className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
                >
                  <Download className="h-4 w-4" />
                  <span>Download XML File</span>
                </button>
                <button
                  type="button"
                  onClick={() => copyWithFeedback(xmlExportData, 'xml')}
                  className="w-full py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer"
                >
                  {copiedType === 'xml' ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copiedType === 'xml' ? 'Copied XML!' : 'Copy XML Code'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowXmlPreview(!showXmlPreview)}
                  className="w-full py-1 text-slate-500 hover:text-slate-800 text-[11px] font-semibold cursor-pointer"
                >
                  {showXmlPreview ? 'Hide Code' : 'Preview XML'}
                </button>
              </div>
            </div>

            {/* Busy 21 Accounts Master Card */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between space-y-4 hover:border-indigo-400 transition-all">
              <div className="space-y-2">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl w-fit">
                  <Users className="h-6 w-6" />
                </div>
                <h3 className="font-extrabold text-sm text-slate-900">Accounts Master</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Export Customer & Supplier accounts with GSTIN, PAN, addresses, and opening balances.
                </p>
                <div className="text-[11px] font-semibold text-slate-600 bg-slate-50 p-2.5 rounded-lg">
                  Total Accounts: <strong>{parties.length}</strong>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleDownloadAccountsExcel}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  <span>Download Excel (.xlsx)</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadAccountsCsv}
                  className="w-full py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download CSV</span>
                </button>
              </div>
            </div>

            {/* Busy 21 Item Masters Card */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between space-y-4 hover:border-emerald-400 transition-all">
              <div className="space-y-2">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl w-fit">
                  <Package className="h-6 w-6" />
                </div>
                <h3 className="font-extrabold text-sm text-slate-900">Item Masters</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Export Inventory items with sales rates, purchase prices, GST tax rates, HSN codes, and stock.
                </p>
                <div className="text-[11px] font-semibold text-slate-600 bg-slate-50 p-2.5 rounded-lg">
                  Total Items: <strong>{items.length}</strong>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleDownloadItemsExcel}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  <span>Download Excel (.xlsx)</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadItemsCsv}
                  className="w-full py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download CSV</span>
                </button>
              </div>
            </div>

            {/* Busy 21 Vouchers Card */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between space-y-4 hover:border-amber-400 transition-all">
              <div className="space-y-2">
                <div className="p-3 bg-amber-50 text-amber-600 rounded-xl w-fit">
                  <Receipt className="h-6 w-6" />
                </div>
                <h3 className="font-extrabold text-sm text-slate-900">Vouchers / Bills</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Export Sales invoices and Purchase bills with line items, tax breakdowns, and payment records.
                </p>
                <div className="text-[11px] font-semibold text-slate-600 bg-slate-50 p-2.5 rounded-lg">
                  Total Invoices: <strong>{invoices.length}</strong>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleDownloadVouchersExcel}
                  className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  <span>Download Excel (.xlsx)</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadVouchersCsv}
                  className="w-full py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download CSV</span>
                </button>
              </div>
            </div>
          </div>

          {/* All-in-One Full JSON Backup */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-slate-200 text-slate-700 rounded-xl">
                <Database className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">
                  Consolidated Full JSON Backup (All Masters & Vouchers in 1 File)
                </h4>
                <p className="text-[11px] text-slate-500">
                  Perfect for archiving or transferring all active business data across browsers and computers.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleDownloadFullJson}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-2xs transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Download Consolidated JSON</span>
            </button>
          </div>

          {/* XML Live Preview Section */}
          {showXmlPreview && (
            <div className="bg-slate-900 rounded-2xl p-5 border border-slate-700 text-white space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileCode className="h-4 w-4 text-rose-400" />
                  <span className="text-xs font-bold font-mono">Busy 21 Compliant XML Document (Preview)</span>
                </div>
                <button
                  type="button"
                  onClick={() => copyWithFeedback(xmlExportData, 'xml')}
                  className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1 transition-colors text-slate-200 cursor-pointer"
                >
                  {copiedType === 'xml' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copiedType === 'xml' ? 'Copied XML!' : 'Copy XML'}</span>
                </button>
              </div>
              <pre className="max-h-80 overflow-y-auto bg-slate-950 p-4 rounded-xl text-[11px] font-mono text-emerald-400 leading-relaxed border border-slate-800">
                {xmlExportData.slice(0, 3500)}
                {xmlExportData.length > 3500 && '\n\n... [truncated for preview - full file contains all records]'}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: STEP-BY-STEP USER GUIDE */}
      {activeTab === 'guide' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Guide A: How to Export from Busy 21 into SKT Billing */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                <Upload className="h-5 w-5" />
              </div>
              <h3 className="font-extrabold text-sm text-slate-900">
                How to Export from Busy 21 to SKT Billing
              </h3>
            </div>

            <ol className="list-decimal list-inside space-y-3 text-xs text-slate-600 leading-relaxed font-medium">
              <li className="pl-1">
                Open your <strong>Busy 21 Software</strong> on desktop and log into your company.
              </li>
              <li className="pl-1">
                <strong>Method 1 (MS-Excel):</strong> Go to <strong>Print / Export &rarr; Export to MS-Excel (.xlsx)</strong> or export reports like Account List or Stock Summary.
              </li>
              <li className="pl-1">
                <strong>Method 2 (XML):</strong> Go to:
                <div className="mt-1 p-2 bg-slate-50 rounded-lg font-mono text-[11px] text-slate-800 border border-slate-200">
                  Administration &rarr; Data Export / Import &rarr; Export Data in XML
                </div>
              </li>
              <li className="pl-1">
                Select <strong>All Accounts</strong>, <strong>All Items</strong>, and the desired date range under Vouchers.
              </li>
              <li className="pl-1">
                Save the file (<code className="bg-slate-100 px-1 py-0.5 rounded text-rose-600">.xlsx</code> or <code className="bg-slate-100 px-1 py-0.5 rounded text-rose-600">.xml</code>).
              </li>
              <li className="pl-1">
                In SKT Billing, open the <strong>&quot;Import Data from Busy 21&quot;</strong> tab and upload the file.
              </li>
              <li className="pl-1">
                Click <strong>&quot;Execute Import&quot;</strong> &mdash; all accounts, items, and bills will populate instantly!
              </li>
            </ol>
          </div>

          {/* Guide B: How to Import SKT Billing into Busy 21 */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
                <Download className="h-5 w-5" />
              </div>
              <h3 className="font-extrabold text-sm text-slate-900">
                How to Import SKT Billing into Busy 21
              </h3>
            </div>

            <ol className="list-decimal list-inside space-y-3 text-xs text-slate-600 leading-relaxed font-medium">
              <li className="pl-1">
                Under the <strong>&quot;Export Data to Busy 21&quot;</strong> tab above, click <strong>&quot;Download Excel (.xlsx) Package&quot;</strong> or <strong>&quot;Download XML File&quot;</strong>.
              </li>
              <li className="pl-1">
                Open your <strong>Busy 21 Software</strong> on your desktop.
              </li>
              <li className="pl-1">
                <strong>For XML:</strong> Navigate to:
                <div className="mt-1 p-2 bg-slate-50 rounded-lg font-mono text-[11px] text-slate-800 border border-slate-200">
                  Administration &rarr; Data Export / Import &rarr; Import Data from XML
                </div>
              </li>
              <li className="pl-1">
                <strong>For Excel:</strong> Navigate to:
                <div className="mt-1 p-2 bg-slate-50 rounded-lg font-mono text-[11px] text-slate-800 border border-slate-200">
                  Administration &rarr; Data Export / Import &rarr; Import Masters from MS-Excel
                </div>
              </li>
              <li className="pl-1">
                Select the downloaded file and click <strong>Execute Import</strong>.
              </li>
              <li className="pl-1">
                Busy 21 reads all ledgers, items, and transactions automatically without any manual typing!
              </li>
            </ol>
          </div>
        </div>
      )}
    </div>
  );
};
