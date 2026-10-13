/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/layout/Header';
import { Sidebar, NavTab } from './components/layout/Sidebar';
import { DashboardView } from './components/dashboard/DashboardView';
import { SalesView } from './components/invoices/SalesView';
import { QuotationsView } from './components/invoices/QuotationsView';
import { DeliveryChallansView } from './components/invoices/DeliveryChallansView';
import { PurchasesView } from './components/invoices/PurchasesView';
import { InventoryView } from './components/inventory/InventoryView';
import { PartiesView } from './components/parties/PartiesView';
import { ExpensesView } from './components/accounting/ExpensesView';
import { LedgerView } from './components/accounting/LedgerView';
import { ReportsView } from './components/reports/ReportsView';
import { MonthlyReportsView } from './components/reports/MonthlyReportsView';
import { ItemLedgerView } from './components/reports/ItemLedgerView';
import { PartyLedgerView } from './components/reports/PartyLedgerView';
import { SmsNotificationsView } from './components/reports/SmsNotificationsView';
import { OrdersWorkflowView } from './components/enterprise/OrdersWorkflowView';
import { BRSView } from './components/enterprise/BRSView';
import { FYClosingView } from './components/enterprise/FYClosingView';
import { SchemesView } from './components/enterprise/SchemesView';
import { EWayView } from './components/enterprise/EWayView';
import { SettingsView } from './components/settings/SettingsView';
import { SubscriptionView } from './components/subscription/SubscriptionView';
import { SubscriptionModal } from './components/subscription/SubscriptionModal';
import { InvoiceModal } from './components/invoices/InvoiceModal';
import { InvoicePrintModal } from './components/invoices/InvoicePrintModal';
import { BackupRestoreModal } from './components/backup/BackupRestoreModal';
import { CompanyUnlockModal } from './components/common/CompanyUnlockModal';
import { StartupAnimation } from './components/common/StartupAnimation';
import { HotkeysModal } from './components/common/HotkeysModal';
import { OfflineIndicator } from './components/common/OfflineIndicator';
import { Busy21DataSyncView } from './components/busy21/Busy21DataSyncView';
import { Invoice, InvoiceType, BusinessSlotData } from './types';
import { checkAndTriggerDailyAutoBackup } from './utils/dailyBackupUtils';

const MainApp: React.FC = () => {
  const { parties, items, invoices, unlockSlot, subscription, updateSubscription, slots, activeSlotId } = useApp();

  const [showStartupAnimation, setShowStartupAnimation] = useState(true);
  const [dailyBackupResult, setDailyBackupResult] = useState<{ triggered: boolean; message?: string } | null>(null);
  const [showBackupToast, setShowBackupToast] = useState(false);
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');

  // Subscription Modal State
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);

  // Backup & Restore Modal State
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);

  // Company Slot Unlock Modal State
  const [isUnlockModalOpen, setIsUnlockModalOpen] = useState(false);
  const [targetUnlockSlot, setTargetUnlockSlot] = useState<BusinessSlotData | null>(null);

  // Invoice Modal State
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [invoiceModalType, setInvoiceModalType] = useState<InvoiceType>('sale');
  const [invoiceToEdit, setInvoiceToEdit] = useState<Invoice | null>(null);

  // Print Modal State
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [invoiceToPrint, setInvoiceToPrint] = useState<Invoice | null>(null);

  // Global Hotkeys Panel State (Alt + H)
  const [isHotkeysModalOpen, setIsHotkeysModalOpen] = useState(false);


  // Quick Action Handlers
  const handleOpenNewInvoice = (type: InvoiceType) => {
    setInvoiceModalType(type);
    setInvoiceToEdit(null);
    setIsInvoiceModalOpen(true);
  };

  const handleEditInvoice = (inv: Invoice) => {
    setInvoiceModalType(inv.type);
    setInvoiceToEdit(inv);
    setIsInvoiceModalOpen(true);
  };

  const handlePrintInvoice = (inv: Invoice) => {
    setInvoiceToPrint(inv);
    setIsPrintModalOpen(true);
  };

  const handleInvoiceSaved = (savedInvoice: Invoice, printNow: boolean) => {
    if (printNow) {
      setInvoiceToPrint(savedInvoice);
      setIsPrintModalOpen(true);
    }
  };

  const handleOpenNewExpense = () => {
    setActiveTab('expenses');
  };

  const salesCount = invoices.filter(i => i.type === 'sale').length;
  const quotesCount = invoices.filter(i => i.type === 'quotation').length;
  const challansCount = invoices.filter(i => i.type === 'delivery_challan').length;
  const purchasesCount = invoices.filter(i => i.type === 'purchase').length;

  // Automated Daily Backup triggered on Login / App startup
  useEffect(() => {
    if (slots && slots.length > 0) {
      const res = checkAndTriggerDailyAutoBackup(slots, activeSlotId);
      setDailyBackupResult(res);
      if (res.triggered) {
        setShowBackupToast(true);
        const timer = setTimeout(() => setShowBackupToast(false), 6000);
        return () => clearTimeout(timer);
      }
    }
  }, []);

  // Global Keyboard Shortcut Manager
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT');

      // Alt + H: Toggle Hotkeys Reference Modal
      if (e.altKey && e.key.toLowerCase() === 'h') {
        e.preventDefault();
        setIsHotkeysModalOpen(prev => !prev);
        return;
      }

      // Ctrl + B: Open Busy 21 Data Hub
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        setActiveTab('busy21_data');
        return;
      }

      // Ctrl + N: New Sale Bill
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        handleOpenNewInvoice('sale');
        return;
      }

      // Ctrl + P: New Purchase Bill
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        handleOpenNewInvoice('purchase');
        return;
      }

      // Ctrl + E: Add Expense
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        setActiveTab('expenses');
        return;
      }

      // Direct Navigation Hotkeys (Alt + Number / Key)
      if (e.altKey && !isInput) {
        if (e.key === '1') { e.preventDefault(); setActiveTab('dashboard'); return; }
        if (e.key === '2') { e.preventDefault(); setActiveTab('parties'); return; }
        if (e.key === '3') { e.preventDefault(); setActiveTab('inventory'); return; }
        if (e.key === '4') { e.preventDefault(); setActiveTab('sales'); return; }
        if (e.key === '5') { e.preventDefault(); setActiveTab('purchases'); return; }
        if (e.key === '6') { e.preventDefault(); setActiveTab('expenses'); return; }
        if (e.key === '7') { e.preventDefault(); setActiveTab('ledger'); return; }
        if (e.key === '8') { e.preventDefault(); setActiveTab('monthly_reports'); return; }
        if (e.key === '9') { e.preventDefault(); setActiveTab('settings'); return; }
        if (e.key === '0') { e.preventDefault(); setActiveTab('busy21_data'); return; }
        if (e.key.toLowerCase() === 'i') { e.preventDefault(); setActiveTab('item_ledger'); return; }
        if (e.key.toLowerCase() === 'l') { e.preventDefault(); setActiveTab('party_ledger'); return; }
        if (e.key.toLowerCase() === 'r') { e.preventDefault(); setActiveTab('reports'); return; }
        if (e.key.toLowerCase() === 'm') { e.preventDefault(); setActiveTab('sms_notifications'); return; }
      }

      // Escape: Dismiss overlays & modals
      if (e.key === 'Escape') {
        if (isHotkeysModalOpen) {
          setIsHotkeysModalOpen(false);
        } else if (isInvoiceModalOpen) {
          setIsInvoiceModalOpen(false);
        } else if (isPrintModalOpen) {
          setIsPrintModalOpen(false);
        } else if (isBackupModalOpen) {
          setIsBackupModalOpen(false);
        } else if (isUnlockModalOpen) {
          setIsUnlockModalOpen(false);
        } else if (activeTab !== 'dashboard' && !isInput) {
          setActiveTab('dashboard');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isHotkeysModalOpen, isInvoiceModalOpen, isPrintModalOpen, isBackupModalOpen, isUnlockModalOpen, activeTab]);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans relative">
      {showStartupAnimation && (
        <StartupAnimation
          onComplete={() => setShowStartupAnimation(false)}
          backupStatus={dailyBackupResult}
        />
      )}

      {/* Automated Daily Backup Notification Toast */}
      {showBackupToast && dailyBackupResult?.triggered && (
        <div className="fixed bottom-5 right-5 z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className="bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-emerald-500/40 flex items-center gap-3 max-w-md">
            <div className="h-9 w-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="flex-1 pr-2">
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold text-emerald-300 uppercase tracking-wider">Automated Daily Backup</h4>
                <span className="text-[10px] px-1.5 py-0.2 bg-emerald-950 text-emerald-300 rounded font-mono">Today</span>
              </div>
              <p className="text-xs text-slate-200 mt-0.5">
                {dailyBackupResult.message || 'All critical invoices, items, and parties securely snapshotted in vault.'}
              </p>
            </div>
            <button
              onClick={() => setIsBackupModalOpen(true)}
              className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-bold transition-colors whitespace-nowrap"
            >
              View Vault
            </button>
            <button
              onClick={() => setShowBackupToast(false)}
              className="text-slate-400 hover:text-white p-1"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Top Vyapar Style Header */}
      <Header
        onOpenNewInvoice={handleOpenNewInvoice}
        onOpenNewExpense={handleOpenNewExpense}
        onNavigateToSettings={() => setActiveTab('settings')}
        onOpenBackupModal={() => setIsBackupModalOpen(true)}
        onOpenBusy21Sync={() => setActiveTab('busy21_data')}
        onOpenHotkeysModal={() => setIsHotkeysModalOpen(true)}
        onOpenSubscription={() => setActiveTab('subscription')}
        onPromptSlotUnlock={(slot) => {
          setTargetUnlockSlot(slot);
          setIsUnlockModalOpen(true);
        }}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      {/* Main Container: Sidebar + Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Navigation Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onPromptSlotUnlock={(slot) => {
            setTargetUnlockSlot(slot);
            setIsUnlockModalOpen(true);
          }}
          partiesCount={parties.length}
          itemsCount={items.length}
          salesCount={salesCount}
          quotationsCount={quotesCount}
          challansCount={challansCount}
          purchasesCount={purchasesCount}
        />

        {/* Main Workspace Content */}
        <main className="flex-1 overflow-y-auto bg-slate-100 p-4 sm:p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {activeTab === 'dashboard' && (
              <DashboardView
                onOpenNewInvoice={handleOpenNewInvoice}
                onOpenNewExpense={handleOpenNewExpense}
                onSelectSale={handleEditInvoice}
                onPrintInvoice={handlePrintInvoice}
                onNavigateToTab={(tab) => setActiveTab(tab)}
              />
            )}

            {activeTab === 'sales' && (
              <SalesView
                onOpenNewSale={() => handleOpenNewInvoice('sale')}
                onEditSale={handleEditInvoice}
                onPrintSale={handlePrintInvoice}
              />
            )}

            {activeTab === 'quotations' && (
              <QuotationsView
                onOpenNewQuotation={() => handleOpenNewInvoice('quotation')}
                onEditQuotation={handleEditInvoice}
                onPrintQuotation={handlePrintInvoice}
              />
            )}

            {activeTab === 'delivery_challans' && (
              <DeliveryChallansView
                onOpenNewChallan={() => handleOpenNewInvoice('delivery_challan')}
                onEditChallan={handleEditInvoice}
                onPrintChallan={handlePrintInvoice}
              />
            )}

            {activeTab === 'purchases' && (
              <PurchasesView
                onOpenNewPurchase={() => handleOpenNewInvoice('purchase')}
                onEditPurchase={handleEditInvoice}
                onPrintPurchase={handlePrintInvoice}
              />
            )}

            {activeTab === 'inventory' && <InventoryView />}

            {activeTab === 'parties' && <PartiesView />}

            {activeTab === 'expenses' && <ExpensesView />}

            {activeTab === 'ledger' && <LedgerView />}

            {activeTab === 'reports' && <ReportsView />}

            {activeTab === 'monthly_reports' && <MonthlyReportsView />}

            {activeTab === 'item_ledger' && <ItemLedgerView />}

            {activeTab === 'party_ledger' && <PartyLedgerView />}

            {activeTab === 'sms_notifications' && <SmsNotificationsView />}

            {activeTab === 'orders_workflow' && <OrdersWorkflowView />}

            {activeTab === 'brs' && <BRSView />}

            {activeTab === 'fy_closing' && <FYClosingView />}

            {activeTab === 'schemes' && <SchemesView />}

            {activeTab === 'eway' && <EWayView />}

            {activeTab === 'busy21_data' && (
              <Busy21DataSyncView onNavigateTab={(tab) => setActiveTab(tab as any)} />
            )}

            {activeTab === 'subscription' && (
              <SubscriptionView />
            )}

            {activeTab === 'settings' && <SettingsView />}
          </div>
        </main>
      </div>

      {/* Core Invoice / Quotation / Purchase Creator Modal */}
      <InvoiceModal
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        type={invoiceModalType}
        invoiceToEdit={invoiceToEdit}
        onSaved={handleInvoiceSaved}
      />

      {/* Professional Tax Invoice Printable View & PDF Modal */}
      <InvoicePrintModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        invoice={invoiceToPrint}
      />

      {/* Complete Data Backup & Restore Modal */}
      <BackupRestoreModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
      />

      {/* Subscription & Payment Modal */}
      <SubscriptionModal
        isOpen={isSubscriptionModalOpen}
        onClose={() => setIsSubscriptionModalOpen(false)}
        subscription={subscription}
        onUpdateSubscription={updateSubscription}
      />

      {/* Company Password Unlock Modal */}
      <CompanyUnlockModal
        isOpen={isUnlockModalOpen}
        targetSlot={targetUnlockSlot}
        onClose={() => {
          setIsUnlockModalOpen(false);
          setTargetUnlockSlot(null);
        }}
        onSuccess={(unlockedId) => {
          unlockSlot(unlockedId);
        }}
      />

      {/* Global Hotkeys Panel Modal (Alt+H) */}
      <HotkeysModal
        isOpen={isHotkeysModalOpen}
        onClose={() => setIsHotkeysModalOpen(false)}
        onNavigate={(tab) => setActiveTab(tab)}
        onOpenNewSale={() => handleOpenNewInvoice('sale')}
        onOpenNewPurchase={() => handleOpenNewInvoice('purchase')}
        onOpenNewExpense={handleOpenNewExpense}
        onOpenBusy21Sync={() => setActiveTab('busy21_data')}
      />

      {/* Offline Mode Status Indicator */}
      <OfflineIndicator />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainApp />
    </AppProvider>
  );
}
