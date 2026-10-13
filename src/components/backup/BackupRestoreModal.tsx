import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { BusinessSlotData } from '../../types';
import {
  loadBackupVault,
  saveBackupVault,
  createBackupSnapshot,
  restoreFromSnapshot,
  exportSnapshotToFile,
  DailyBackupSnapshot,
  BackupHistoryMeta,
} from '../../utils/dailyBackupUtils';
import {
  Download,
  Upload,
  Database,
  CheckCircle2,
  AlertTriangle,
  X,
  FileJson,
  Copy,
  Check,
  RefreshCw,
  HardDriveDownload,
  HardDriveUpload,
  ShieldCheck,
  History,
  Calendar,
  Clock,
  Sparkles,
  Archive,
  ArrowRight,
  RotateCcw,
} from 'lucide-react';

interface BackupRestoreModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BackupRestoreModal: React.FC<BackupRestoreModalProps> = ({ isOpen, onClose }) => {
  const { slots, activeSlotId, restoreSlotsData, profile } = useApp();

  const [activeTab, setActiveTab] = useState<'daily_vault' | 'backup' | 'restore'>('daily_vault');
  const [copied, setCopied] = useState(false);
  const [vaultMeta, setVaultMeta] = useState<BackupHistoryMeta>(() => loadBackupVault());
  const [vaultNotification, setVaultNotification] = useState<string | null>(null);

  // Restore State
  const [uploadedData, setUploadedData] = useState<any | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [parsedSlots, setParsedSlots] = useState<BusinessSlotData[] | null>(null);
  const [restoreMode, setRestoreMode] = useState<'all' | 'current'>('all');
  const [restoreSuccessMsg, setRestoreSuccessMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setVaultMeta(loadBackupVault());
      setVaultNotification(null);
      setRestoreSuccessMsg(null);
      setValidationError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Aggregate stats across all slots
  const totalParties = slots.reduce((acc, s) => acc + (s.parties?.length || 0), 0);
  const totalItems = slots.reduce((acc, s) => acc + (s.items?.length || 0), 0);
  const totalInvoices = slots.reduce((acc, s) => acc + (s.invoices?.length || 0), 0);
  const totalExpenses = slots.reduce((acc, s) => acc + (s.expenses?.length || 0), 0);
  const totalJournals = slots.reduce((acc, s) => acc + (s.journals?.length || 0), 0);

  const getBackupPayload = () => {
    return {
      appName: 'SKT Billing',
      version: '2.0.0',
      exportedAt: new Date().toISOString(),
      creator: 'Pushpendra Singh Raika',
      activeSlotId,
      slots,
    };
  };

  const handleDownloadBackup = () => {
    const payload = getBackupPayload();
    const dataStr = JSON.stringify(payload, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const dateStr = new Date().toISOString().split('T')[0];
    const link = document.createElement('a');
    link.href = url;
    link.download = `SKTBilling_Backup_5Slots_${dateStr}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCopyClipboard = () => {
    const payload = getBackupPayload();
    navigator.clipboard.writeText(JSON.stringify(payload, null, 2)).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const handleTriggerManualSnapshot = () => {
    const res = createBackupSnapshot(slots, activeSlotId, 'manual');
    setVaultMeta(res.vault);
    setVaultNotification(`Instant snapshot created & secured in Daily Vault! (${new Date().toLocaleTimeString()})`);
    setTimeout(() => setVaultNotification(null), 4000);
  };

  const handleToggleAutoBackup = () => {
    const updated = {
      ...vaultMeta,
      autoBackupEnabled: !vaultMeta.autoBackupEnabled,
    };
    saveBackupVault(updated);
    setVaultMeta(updated);
  };

  const handleRestoreFromSnapshotItem = (snapshot: DailyBackupSnapshot) => {
    if (
      !window.confirm(
        `Are you sure you want to restore the backup from ${snapshot.dateKey} (${new Date(snapshot.timestamp).toLocaleTimeString()})?\n\nThis will restore all ${snapshot.totalInvoices} invoices and ${snapshot.totalParties} parties.`
      )
    ) {
      return;
    }

    const restored = restoreFromSnapshot(snapshot);
    if (!restored) {
      alert('Unable to decrypt or restore this snapshot. The data might be corrupted.');
      return;
    }

    restoreSlotsData(restored, snapshot.activeSlotId || 1);
    setVaultNotification(`Successfully restored system state to ${snapshot.dateKey}! All billing data recovered.`);
    setTimeout(() => setVaultNotification(null), 5000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValidationError(null);
    setRestoreSuccessMsg(null);
    setParsedSlots(null);
    setUploadedData(null);

    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);

        // Validate JSON
        let candidateSlots: BusinessSlotData[] | null = null;
        if (parsed.slots && Array.isArray(parsed.slots)) {
          candidateSlots = parsed.slots;
        } else if (Array.isArray(parsed)) {
          candidateSlots = parsed;
        } else if (parsed.parties || parsed.invoices || parsed.items) {
          // Single slot legacy backup format
          candidateSlots = slots.map(s => {
            if (s.slotId === activeSlotId) {
              return {
                ...s,
                profile: parsed.profile || s.profile,
                parties: parsed.parties || [],
                items: parsed.items || [],
                invoices: parsed.invoices || [],
                expenses: parsed.expenses || [],
                journals: parsed.journals || [],
              };
            }
            return s;
          });
        }

        if (!candidateSlots || candidateSlots.length === 0) {
          setValidationError('Invalid backup file format. Could not detect SKT Billing business slots data.');
          return;
        }

        setUploadedData(parsed);
        setParsedSlots(candidateSlots);
      } catch (err: any) {
        setValidationError(`Failed to parse JSON file: ${err.message || 'Corrupted file'}`);
      }
    };
    reader.readAsText(file);
  };

  const handleExecuteRestore = () => {
    if (!parsedSlots) return;

    if (restoreMode === 'all') {
      // Ensure all slots are populated
      const allSlotIds = Array.from(new Set([...slots.map(s => s.slotId), ...parsedSlots.map(s => s.slotId)]));
      const fullSlots: BusinessSlotData[] = allSlotIds.map(idx => {
        const found = parsedSlots.find(s => s.slotId === idx);
        if (found) return found;
        const existing = slots.find(s => s.slotId === idx);
        return (
          existing || {
            slotId: idx,
            slotName: `Business Profile ${idx}`,
            profile: profile,
            parties: [],
            items: [],
            invoices: [],
            expenses: [],
            journals: [],
            smsLogs: [],
          }
        );
      });

      restoreSlotsData(fullSlots, uploadedData?.activeSlotId || 1);
      setRestoreSuccessMsg(`Successfully restored all ${fullSlots.length} Business Profile slots! Your system has been updated.`);
    } else {
      // Restore into current active slot only
      const sourceSlot = parsedSlots.find(s => s.slotId === activeSlotId) || parsedSlots[0];
      const mergedSlots = slots.map(s => {
        if (s.slotId === activeSlotId) {
          return {
            ...s,
            profile: sourceSlot.profile || s.profile,
            parties: sourceSlot.parties || [],
            items: sourceSlot.items || [],
            invoices: sourceSlot.invoices || [],
            expenses: sourceSlot.expenses || [],
            journals: sourceSlot.journals || [],
          };
        }
        return s;
      });

      restoreSlotsData(mergedSlots, activeSlotId);
      setRestoreSuccessMsg(`Successfully restored data into Slot ${activeSlotId} (${profile.businessName || 'Active Slot'})!`);
    }

    setParsedSlots(null);
    setUploadedData(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center p-3 sm:p-4 font-sans">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden border border-slate-300 animate-in fade-in zoom-in-95 duration-100 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-rose-600 flex items-center justify-center text-white">
              <Database className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold tracking-tight">Automated Daily Backup & Recovery Vault</h2>
                <span className="px-2 py-0.2 bg-emerald-500/20 text-emerald-300 text-[10px] font-bold rounded-full border border-emerald-500/30 flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3" /> Auto Login Protected
                </span>
              </div>
              <p className="text-[11px] text-slate-300">
                Automatic daily snapshots upon login guarantee zero billing data loss
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-5 pt-2">
          <button
            onClick={() => setActiveTab('daily_vault')}
            className={`flex items-center gap-2 py-2 px-4 border-b-2 font-bold text-xs transition-colors ${
              activeTab === 'daily_vault'
                ? 'border-rose-600 text-rose-600 bg-white rounded-t-lg shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <History className="h-4 w-4" />
            <span>Daily Login Vault ({vaultMeta.snapshots.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('backup')}
            className={`flex items-center gap-2 py-2 px-4 border-b-2 font-bold text-xs transition-colors ${
              activeTab === 'backup'
                ? 'border-rose-600 text-rose-600 bg-white rounded-t-lg shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <HardDriveDownload className="h-4 w-4" />
            <span>Manual Export (.JSON)</span>
          </button>

          <button
            onClick={() => setActiveTab('restore')}
            className={`flex items-center gap-2 py-2 px-4 border-b-2 font-bold text-xs transition-colors ${
              activeTab === 'restore'
                ? 'border-rose-600 text-rose-600 bg-white rounded-t-lg shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <HardDriveUpload className="h-4 w-4" />
            <span>File Restore (Upload)</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          {/* TAB 1: DAILY LOGIN VAULT */}
          {activeTab === 'daily_vault' && (
            <div className="space-y-4">
              {/* Vault Notification */}
              {vaultNotification && (
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-start gap-2 text-xs text-emerald-900 animate-in fade-in">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <p className="text-[11px] font-semibold">{vaultNotification}</p>
                </div>
              )}

              {/* Status Header & Controls */}
              <div className="bg-gradient-to-r from-slate-900 to-rose-950 p-4 rounded-xl text-white flex flex-wrap items-center justify-between gap-3 shadow-sm">
                <div>
                  <span className="text-[10px] font-bold text-rose-300 uppercase tracking-wider block">
                    Zero Data Loss Guarantee
                  </span>
                  <h3 className="text-sm font-bold flex items-center gap-2">
                    <span>Automated Daily Login Backup System</span>
                    <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-[10px] rounded-full border border-emerald-400/30">
                      Active
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    Whenever you log in or open SKT Billing, your invoices, parties, and stock are automatically snapshotted.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleTriggerManualSnapshot}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-all active:scale-95 shadow-sm"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Create Snapshot Now</span>
                  </button>
                </div>
              </div>

              {/* Toggle Auto Backup & Vault Stats */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                <div className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    id="auto-backup-toggle"
                    checked={vaultMeta.autoBackupEnabled}
                    onChange={handleToggleAutoBackup}
                    className="h-4 w-4 text-rose-600 rounded focus:ring-rose-500 cursor-pointer"
                  />
                  <label htmlFor="auto-backup-toggle" className="font-semibold text-slate-800 cursor-pointer">
                    Enable Automatic Daily Login Backup
                  </label>
                </div>
                <div className="text-[11px] text-slate-500 flex items-center gap-3">
                  <span>
                    Last Backup:{' '}
                    <strong className="text-slate-800 font-mono">
                      {vaultMeta.lastBackupDate || 'Today (On Startup)'}
                    </strong>
                  </span>
                  <span>
                    Vault Retention:{' '}
                    <strong className="text-slate-800 font-mono">
                      {vaultMeta.snapshots.length} of {vaultMeta.maxSnapshotsRetention} days
                    </strong>
                  </span>
                </div>
              </div>

              {/* Snapshots List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 px-1">
                  <span>Recorded Daily Snapshots</span>
                  <span className="text-[11px] text-slate-400 font-normal">
                    Click &ldquo;Restore&rdquo; to roll back to any past date
                  </span>
                </div>

                {vaultMeta.snapshots.length === 0 ? (
                  <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                    <Archive className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-xs font-bold text-slate-700">No daily snapshots in vault yet</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Snapshots are automatically created each morning when you log in, or click &ldquo;Create Snapshot Now&rdquo;.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {vaultMeta.snapshots.map((snap, idx) => {
                      const dateObj = new Date(snap.timestamp);
                      const isToday = snap.dateKey === new Date().toISOString().split('T')[0];
                      return (
                        <div
                          key={snap.id || idx}
                          className="p-3 bg-white hover:bg-slate-50/80 rounded-xl border border-slate-200 transition-all flex flex-wrap items-center justify-between gap-3 shadow-2xs"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`h-9 w-9 rounded-lg flex items-center justify-center font-bold text-xs ${
                                isToday ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              <Calendar className="h-4 w-4" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-xs text-slate-900">{snap.dateKey}</span>
                                {isToday && (
                                  <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 font-bold text-[10px] rounded">
                                    Latest Today
                                  </span>
                                )}
                                <span className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                                  <Clock className="h-3 w-3" />
                                  {dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-medium capitalize">
                                  {snap.trigger.replace('_', ' ')}
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-500 mt-0.5 flex flex-wrap items-center gap-2">
                                <span>
                                  <strong>{snap.totalInvoices}</strong> invoices
                                </span>
                                <span>·</span>
                                <span>
                                  <strong>{snap.totalParties}</strong> parties
                                </span>
                                <span>·</span>
                                <span>
                                  <strong>{snap.totalItems}</strong> stock items
                                </span>
                                <span>·</span>
                                <span className="text-slate-400 font-mono text-[10px]">
                                  {snap.firmNames?.slice(0, 2).join(', ')}
                                  {snap.firmNames && snap.firmNames.length > 2 ? '...' : ''}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => exportSnapshotToFile(snap)}
                              title="Download this day's backup as a JSON file"
                              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold border border-slate-300 transition-all active:scale-95 flex items-center gap-1"
                            >
                              <Download className="h-3.5 w-3.5" />
                              <span className="hidden sm:inline">JSON</span>
                            </button>

                            <button
                              onClick={() => handleRestoreFromSnapshotItem(snap)}
                              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-all active:scale-95 shadow-2xs flex items-center gap-1"
                              title="Restore system back to this snapshot"
                            >
                              <RotateCcw className="h-3.5 w-3.5" />
                              <span>Restore</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: MANUAL EXPORT (.JSON) */}
          {activeTab === 'backup' && (
            <div className="space-y-4">
              {/* Stats Card */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-tight">
                    Current System Snapshot
                  </span>
                  <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold border border-emerald-200 flex items-center gap-1">
                    <ShieldCheck className="h-3 w-3" /> Ready to Secure
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center">
                  <div className="bg-white p-2 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-500 block">Slots</span>
                    <strong className="text-sm font-bold text-slate-800 font-mono">{slots.length}</strong>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-500 block">Vouchers</span>
                    <strong className="text-sm font-bold text-slate-800 font-mono">{totalInvoices}</strong>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-500 block">Parties</span>
                    <strong className="text-sm font-bold text-slate-800 font-mono">{totalParties}</strong>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-500 block">Items</span>
                    <strong className="text-sm font-bold text-slate-800 font-mono">{totalItems}</strong>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-slate-200 col-span-2 sm:col-span-1">
                    <span className="text-[10px] text-slate-500 block">Expenses</span>
                    <strong className="text-sm font-bold text-slate-800 font-mono">{totalExpenses}</strong>
                  </div>
                </div>

                <p className="text-[11px] text-slate-500">
                  Your downloaded JSON file contains all parties, items, sales, purchases, quotations, challans, journals, and GST profiles across all {slots.length} slots.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <button
                  onClick={handleDownloadBackup}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all active:scale-95"
                >
                  <Download className="h-4 w-4" />
                  <span>Download Backup JSON File</span>
                </button>

                <button
                  onClick={handleCopyClipboard}
                  className="flex items-center gap-1.5 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-xl text-xs font-semibold transition-all active:scale-95"
                >
                  {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                  <span>{copied ? 'Copied JSON!' : 'Copy to Clipboard'}</span>
                </button>
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-start gap-2 text-xs text-amber-900">
                <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-[11px] leading-relaxed">
                  <strong>Recommendation:</strong> Store your regular backup on a USB thumb drive, Google Drive, or email draft. This allows instant recovery on any computer or mobile browser.
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: FILE RESTORE (UPLOAD) */}
          {activeTab === 'restore' && (
            <div className="space-y-4">
              {/* Success Notification */}
              {restoreSuccessMsg && (
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-start gap-2 text-xs text-emerald-900">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <p className="text-[11px] font-semibold">{restoreSuccessMsg}</p>
                </div>
              )}

              {/* Error Notification */}
              {validationError && (
                <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 flex items-start gap-2 text-xs text-rose-900">
                  <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                  <p className="text-[11px] font-medium">{validationError}</p>
                </div>
              )}

              {/* File Upload Zone */}
              <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:border-rose-500 transition-colors bg-slate-50/50">
                <FileJson className="h-9 w-9 text-slate-400 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-800">
                  Select SKT Billing Backup JSON File
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5 mb-3">
                  Upload a previously downloaded <code className="bg-slate-200 px-1 py-0.5 rounded font-mono">.json</code> backup file
                </p>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="backup-file-input"
                />

                <label
                  htmlFor="backup-file-input"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold cursor-pointer transition-all active:scale-95 shadow-sm"
                >
                  <Upload className="h-3.5 w-3.5" />
                  <span>Choose JSON File</span>
                </label>
              </div>

              {/* Uploaded File Preview & Confirmation */}
              {parsedSlots && (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-300 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      Valid Backup File Detected
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {uploadedData?.exportedAt ? `Saved on: ${new Date(uploadedData.exportedAt).toLocaleDateString()}` : 'Custom Backup'}
                    </span>
                  </div>

                  <div className="text-xs text-slate-700 bg-white p-3 rounded-lg border border-slate-200 space-y-1">
                    <p>
                      <strong>Slots Count:</strong> {parsedSlots.length} business profile slot(s)
                    </p>
                    <p>
                      <strong>Total Invoices:</strong>{' '}
                      {parsedSlots.reduce((acc, s) => acc + (s.invoices?.length || 0), 0)} vouchers
                    </p>
                    <p>
                      <strong>Total Parties:</strong>{' '}
                      {parsedSlots.reduce((acc, s) => acc + (s.parties?.length || 0), 0)} customer/supplier accounts
                    </p>
                    <p>
                      <strong>Total Items:</strong>{' '}
                      {parsedSlots.reduce((acc, s) => acc + (s.items?.length || 0), 0)} inventory items
                    </p>
                  </div>

                  {/* Restore Mode Radio */}
                  <div className="space-y-1.5 pt-1">
                    <label className="text-[11px] font-bold text-slate-700 block uppercase tracking-tight">
                      Restore Target:
                    </label>

                    <label className="flex items-center gap-2 text-xs text-slate-800 cursor-pointer p-2 bg-white rounded border border-slate-200">
                      <input
                        type="radio"
                        name="restoreMode"
                        checked={restoreMode === 'all'}
                        onChange={() => setRestoreMode('all')}
                        className="text-rose-600 focus:ring-rose-500"
                      />
                      <span>
                        <strong>Restore All {slots.length} Slots</strong> (Full system restore replacing existing data)
                      </span>
                    </label>

                    <label className="flex items-center gap-2 text-xs text-slate-800 cursor-pointer p-2 bg-white rounded border border-slate-200">
                      <input
                        type="radio"
                        name="restoreMode"
                        checked={restoreMode === 'current'}
                        onChange={() => setRestoreMode('current')}
                        className="text-rose-600 focus:ring-rose-500"
                      />
                      <span>
                        <strong>Restore into Current Slot {activeSlotId} Only</strong> (Leaves other slots untouched)
                      </span>
                    </label>
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-2">
                    <button
                      onClick={() => {
                        setParsedSlots(null);
                        setUploadedData(null);
                      }}
                      className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleExecuteRestore}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all active:scale-95 flex items-center gap-1.5"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      <span>Confirm & Restore Now</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer with Creator Credit */}
        <div className="px-5 py-2.5 bg-slate-100 border-t border-slate-200 flex flex-wrap items-center justify-between text-[11px] text-slate-500">
          <div>
            Built & Engineered by <strong className="text-slate-800">Pushpendra Singh Raika</strong>
          </div>
          <a
            href="https://skt-intelligence.ai.studio/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-rose-600 hover:underline font-bold"
          >
            SKT Intelligence AI Studio &rarr;
          </a>
        </div>
      </div>
    </div>
  );
};
