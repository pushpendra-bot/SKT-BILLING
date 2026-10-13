import { BusinessSlotData } from '../types';
import { secureEncrypt, secureDecrypt } from './securityUtils';

export interface DailyBackupSnapshot {
  id: string; // e.g. "backup-2026-10-12"
  dateKey: string; // YYYY-MM-DD
  timestamp: string; // ISO String
  activeSlotId: number;
  totalInvoices: number;
  totalParties: number;
  totalItems: number;
  totalExpenses: number;
  totalJournals: number;
  firmNames: string[];
  slotsEncrypted: string; // AES/Encrypted slots data
  trigger: 'login_auto' | 'manual' | 'scheduled';
}

export interface BackupHistoryMeta {
  lastBackupDate: string; // YYYY-MM-DD
  lastBackupTime: string; // ISO
  autoBackupEnabled: boolean;
  maxSnapshotsRetention: number; // e.g. 14 days
  snapshots: DailyBackupSnapshot[];
}

const DAILY_BACKUP_STORAGE_KEY = 'skt_billing_daily_backups_vault_v1';
const AUTO_BACKUP_SETTINGS_KEY = 'skt_billing_auto_backup_config_v1';

export function getTodayDateKey(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function loadBackupVault(): BackupHistoryMeta {
  try {
    const raw = localStorage.getItem(DAILY_BACKUP_STORAGE_KEY);
    if (!raw) {
      return {
        lastBackupDate: '',
        lastBackupTime: '',
        autoBackupEnabled: true,
        maxSnapshotsRetention: 14,
        snapshots: [],
      };
    }

    const parsed = JSON.parse(raw);
    return {
      lastBackupDate: parsed.lastBackupDate || '',
      lastBackupTime: parsed.lastBackupTime || '',
      autoBackupEnabled: parsed.autoBackupEnabled ?? true,
      maxSnapshotsRetention: parsed.maxSnapshotsRetention || 14,
      snapshots: Array.isArray(parsed.snapshots) ? parsed.snapshots : [],
    };
  } catch (err) {
    console.warn('Failed to parse backup vault', err);
    return {
      lastBackupDate: '',
      lastBackupTime: '',
      autoBackupEnabled: true,
      maxSnapshotsRetention: 14,
      snapshots: [],
    };
  }
}

export function saveBackupVault(vault: BackupHistoryMeta): void {
  try {
    localStorage.setItem(DAILY_BACKUP_STORAGE_KEY, JSON.stringify(vault));
  } catch (err) {
    console.error('Failed to save backup vault to storage', err);
  }
}

/**
 * Creates a cryptographically encrypted snapshot of the current state.
 */
export function createBackupSnapshot(
  slots: BusinessSlotData[],
  activeSlotId: number,
  trigger: 'login_auto' | 'manual' | 'scheduled' = 'login_auto'
): { snapshot: DailyBackupSnapshot; vault: BackupHistoryMeta; isNewDay: boolean } {
  const vault = loadBackupVault();
  const todayKey = getTodayDateKey();
  const nowIso = new Date().toISOString();

  const totalInvoices = slots.reduce((acc, s) => acc + (s.invoices?.length || 0), 0);
  const totalParties = slots.reduce((acc, s) => acc + (s.parties?.length || 0), 0);
  const totalItems = slots.reduce((acc, s) => acc + (s.items?.length || 0), 0);
  const totalExpenses = slots.reduce((acc, s) => acc + (s.expenses?.length || 0), 0);
  const totalJournals = slots.reduce((acc, s) => acc + (s.journals?.length || 0), 0);
  const firmNames = slots.map(s => s.profile.businessName || s.slotName || `Slot ${s.slotId}`);

  // Securely encrypt the slots data
  const encryptedData = secureEncrypt(slots);

  const snapshotId = `skt-backup-${todayKey}-${Date.now()}`;
  const newSnapshot: DailyBackupSnapshot = {
    id: snapshotId,
    dateKey: todayKey,
    timestamp: nowIso,
    activeSlotId,
    totalInvoices,
    totalParties,
    totalItems,
    totalExpenses,
    totalJournals,
    firmNames,
    slotsEncrypted: encryptedData,
    trigger,
  };

  const isNewDay = vault.lastBackupDate !== todayKey;

  // Filter out any older duplicate for the exact same date if we want 1 clean daily snapshot,
  // or keep manual snapshots distinct
  let updatedSnapshots = vault.snapshots.filter(s => s.dateKey !== todayKey || trigger === 'manual');
  updatedSnapshots.unshift(newSnapshot);

  // Retention limit (keep up to maxSnapshotsRetention)
  if (updatedSnapshots.length > (vault.maxSnapshotsRetention || 14)) {
    updatedSnapshots = updatedSnapshots.slice(0, vault.maxSnapshotsRetention || 14);
  }

  const updatedVault: BackupHistoryMeta = {
    ...vault,
    lastBackupDate: todayKey,
    lastBackupTime: nowIso,
    snapshots: updatedSnapshots,
  };

  saveBackupVault(updatedVault);

  return { snapshot: newSnapshot, vault: updatedVault, isNewDay };
}

/**
 * Triggers daily automated backup on login / startup if not yet backed up today.
 */
export function checkAndTriggerDailyAutoBackup(
  slots: BusinessSlotData[],
  activeSlotId: number
): { triggered: boolean; snapshot?: DailyBackupSnapshot; message?: string } {
  try {
    const vault = loadBackupVault();
    if (!vault.autoBackupEnabled) {
      return { triggered: false, message: 'Auto backup disabled by user.' };
    }

    const todayKey = getTodayDateKey();
    if (vault.lastBackupDate === todayKey && vault.snapshots.length > 0) {
      // Already backed up today
      return {
        triggered: false,
        snapshot: vault.snapshots[0],
        message: `Today's backup is already secured for ${todayKey}`,
      };
    }

    // Perform the daily backup
    const result = createBackupSnapshot(slots, activeSlotId, 'login_auto');
    return {
      triggered: true,
      snapshot: result.snapshot,
      message: `Daily Automated Backup successfully secured for ${todayKey}!`,
    };
  } catch (err: any) {
    console.error('Auto backup execution error:', err);
    return { triggered: false, message: err?.message || 'Backup failed' };
  }
}

/**
 * Decrypts a stored snapshot back into BusinessSlotData array.
 */
export function restoreFromSnapshot(snapshot: DailyBackupSnapshot): BusinessSlotData[] | null {
  try {
    if (!snapshot.slotsEncrypted) return null;
    const decrypted = secureDecrypt<BusinessSlotData[], null>(snapshot.slotsEncrypted, null);
    if (Array.isArray(decrypted) && decrypted.length > 0) {
      return decrypted;
    }
    return null;
  } catch (err) {
    console.error('Failed to restore snapshot', err);
    return null;
  }
}

/**
 * Generates downloadable JSON blob from a snapshot.
 */
export function exportSnapshotToFile(snapshot: DailyBackupSnapshot) {
  const slots = restoreFromSnapshot(snapshot);
  const payload = {
    appName: 'SKT Billing',
    version: '2.0.0',
    exportedAt: snapshot.timestamp,
    snapshotDate: snapshot.dateKey,
    trigger: snapshot.trigger,
    activeSlotId: snapshot.activeSlotId,
    summary: {
      invoices: snapshot.totalInvoices,
      parties: snapshot.totalParties,
      items: snapshot.totalItems,
      expenses: snapshot.totalExpenses,
    },
    slots: slots || [],
  };

  const dataStr = JSON.stringify(payload, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `SKTBilling_DailyBackup_${snapshot.dateKey}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
