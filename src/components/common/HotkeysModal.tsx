import React, { useState, useMemo } from 'react';
import {
  Keyboard,
  X,
  Search,
  Sparkles,
  Receipt,
  ShoppingCart,
  Wallet,
  ArrowRight,
  Database,
  BarChart3,
  Users,
  Package,
  Layers,
  Settings,
  Calendar,
  MessageSquare,
  FileSpreadsheet,
  Check,
} from 'lucide-react';
import { NavTab } from '../layout/Sidebar';

interface HotkeysModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: NavTab) => void;
  onOpenNewSale: () => void;
  onOpenNewPurchase: () => void;
  onOpenNewExpense: () => void;
  onOpenBusy21Sync: () => void;
}

interface ShortcutItem {
  id: string;
  category: 'actions' | 'navigation' | 'reports';
  keys: string[];
  title: string;
  description: string;
  actionText?: string;
  handler?: () => void;
}

export const HotkeysModal: React.FC<HotkeysModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onOpenNewSale,
  onOpenNewPurchase,
  onOpenNewExpense,
  onOpenBusy21Sync,
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'actions' | 'navigation' | 'reports'>('all');

  const shortcuts: ShortcutItem[] = useMemo(() => [
    // Core Actions
    {
      id: 'hotkey-help',
      category: 'actions',
      keys: ['Alt', 'H'],
      title: 'Global Hotkeys Reference',
      description: 'Open this cheat sheet overlay from anywhere in the application',
      actionText: 'You are here',
    },
    {
      id: 'new-sale',
      category: 'actions',
      keys: ['Ctrl', 'N'],
      title: 'New Sale Tax Invoice',
      description: 'Launch the GST invoice creator to generate customer tax bills instantly',
      actionText: 'Create Sale',
      handler: () => {
        onClose();
        onOpenNewSale();
      },
    },
    {
      id: 'new-purchase',
      category: 'actions',
      keys: ['Ctrl', 'P'],
      title: 'New Purchase Bill',
      description: 'Open vendor purchase bill voucher entry screen',
      actionText: 'Create Purchase',
      handler: () => {
        onClose();
        onOpenNewPurchase();
      },
    },
    {
      id: 'new-expense',
      category: 'actions',
      keys: ['Ctrl', 'E'],
      title: 'Quick Expense Entry',
      description: 'Navigate to Expenses and record business outflows',
      actionText: 'Add Expense',
      handler: () => {
        onClose();
        onOpenNewExpense();
      },
    },
    {
      id: 'busy-sync',
      category: 'actions',
      keys: ['Ctrl', 'B'],
      title: 'Busy 21 Data Export & Import',
      description: 'Open full Busy 21 Excel (.xlsx), XML & CSV bidirectional data import/export hub',
      actionText: 'Open Import / Export',
      handler: () => {
        onClose();
        onOpenBusy21Sync();
      },
    },
    {
      id: 'esc-back',
      category: 'actions',
      keys: ['Esc'],
      title: 'Close Modal / Back to Dashboard',
      description: 'Close any open modal or dismiss current popup dialog',
      actionText: 'Dismiss',
      handler: onClose,
    },

    // Navigation Shortcuts
    {
      id: 'nav-dash',
      category: 'navigation',
      keys: ['Alt', '1'],
      title: 'Dashboard Overview',
      description: 'Real-time sales, purchases, bank balance and receivables overview',
      actionText: 'Jump to View',
      handler: () => {
        onClose();
        onNavigate('dashboard');
      },
    },
    {
      id: 'nav-parties',
      category: 'navigation',
      keys: ['Alt', '2'],
      title: 'Parties & Address Book',
      description: 'View customers, suppliers, GSTINs, and live outstanding balances',
      actionText: 'Jump to View',
      handler: () => {
        onClose();
        onNavigate('parties');
      },
    },
    {
      id: 'nav-inventory',
      category: 'navigation',
      keys: ['Alt', '3'],
      title: 'Items & Inventory',
      description: 'Stock management, prices, tax rates, and low-stock alerts',
      actionText: 'Jump to View',
      handler: () => {
        onClose();
        onNavigate('inventory');
      },
    },
    {
      id: 'nav-sales',
      category: 'navigation',
      keys: ['Alt', '4'],
      title: 'Sale Bills Register',
      description: 'Comprehensive register of all sales invoices and credit status',
      actionText: 'Jump to View',
      handler: () => {
        onClose();
        onNavigate('sales');
      },
    },
    {
      id: 'nav-purchases',
      category: 'navigation',
      keys: ['Alt', '5'],
      title: 'Purchase Bills Register',
      description: 'Inward inventory bills, vendor payables, and Input Tax Credit',
      actionText: 'Jump to View',
      handler: () => {
        onClose();
        onNavigate('purchases');
      },
    },
    {
      id: 'nav-expenses',
      category: 'navigation',
      keys: ['Alt', '6'],
      title: 'Expenses Manager',
      description: 'Track daily office, logistics, rent, and miscellaneous costs',
      actionText: 'Jump to View',
      handler: () => {
        onClose();
        onNavigate('expenses');
      },
    },
    {
      id: 'nav-ledger',
      category: 'navigation',
      keys: ['Alt', '7'],
      title: 'General Ledger',
      description: 'Double-entry audit trail and running party balances',
      actionText: 'Jump to View',
      handler: () => {
        onClose();
        onNavigate('ledger');
      },
    },
    {
      id: 'nav-monthly',
      category: 'navigation',
      keys: ['Alt', '8'],
      title: 'Monthly Party Reports',
      description: 'Filter bills by party name, month, and year with paid/unpaid totals',
      actionText: 'Jump to View',
      handler: () => {
        onClose();
        onNavigate('monthly_reports');
      },
    },
    {
      id: 'nav-settings',
      category: 'navigation',
      keys: ['Alt', '9'],
      title: 'Business Profiles & Settings',
      description: 'Switch and configure firm GSTIN, bank info, and print themes',
      actionText: 'Jump to View',
      handler: () => {
        onClose();
        onNavigate('settings');
      },
    },
    {
      id: 'nav-busy21',
      category: 'navigation',
      keys: ['Alt', '0'],
      title: 'Busy 21 Data Hub',
      description: 'Directly jump to the Busy 21 import and export screen',
      actionText: 'Jump to View',
      handler: () => {
        onClose();
        onNavigate('busy21_data');
      },
    },

    // Reports & Analysis
    {
      id: 'report-item-ledger',
      category: 'reports',
      keys: ['Alt', 'I'],
      title: 'Item Ledger Report',
      description: 'Trace all bills where a specific item was traded between dates',
      actionText: 'View Report',
      handler: () => {
        onClose();
        onNavigate('item_ledger');
      },
    },
    {
      id: 'report-party-ledger',
      category: 'reports',
      keys: ['Alt', 'L'],
      title: 'Party Ledger Report',
      description: 'Detailed statement of all bills, payments, and balances for any party',
      actionText: 'View Report',
      handler: () => {
        onClose();
        onNavigate('party_ledger');
      },
    },
    {
      id: 'report-gst',
      category: 'reports',
      keys: ['Alt', 'R'],
      title: 'GST & Financial Reports',
      description: 'GSTR-1, GSTR-3B, Profit & Loss statement, and Balance Sheet',
      actionText: 'View Reports',
      handler: () => {
        onClose();
        onNavigate('reports');
      },
    },
    {
      id: 'report-sms',
      category: 'reports',
      keys: ['Alt', 'M'],
      title: 'SMS Alerts & Logs',
      description: 'Automated client SMS dispatch for new bills and payment receipts',
      actionText: 'View SMS Logs',
      handler: () => {
        onClose();
        onNavigate('sms_notifications');
      },
    },
  ], [onClose, onNavigate, onOpenNewSale, onOpenNewPurchase, onOpenNewExpense, onOpenBusy21Sync]);

  const filteredShortcuts = useMemo(() => {
    return shortcuts.filter(s => {
      const matchesCategory = selectedCategory === 'all' || s.category === selectedCategory;
      const q = search.toLowerCase().trim();
      if (!q) return matchesCategory;

      const matchesQuery = 
        s.title.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.keys.some(k => k.toLowerCase().includes(q));

      return matchesCategory && matchesQuery;
    });
  }, [shortcuts, selectedCategory, search]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 font-sans animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-rose-950 px-6 py-4 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-600/30 rounded-xl border border-rose-500/40 text-rose-300">
              <Keyboard className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black tracking-tight">Global Hotkeys & Shortcuts</h2>
                <span className="text-[10px] font-bold bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Alt + H
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Speed up your accounting workflow with high-velocity keyboard accelerators
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
            title="Close (Esc)"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Filter Bar & Search */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/70 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search shortcut (e.g. Sale, Alt, Esc)..."
              autoFocus
              className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none font-medium"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 text-xs"
              >
                Clear
              </button>
            )}
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            {[
              { id: 'all', label: 'All Shortcuts' },
              { id: 'actions', label: 'Actions' },
              { id: 'navigation', label: 'Navigation' },
              { id: 'reports', label: 'Reports' },
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedCategory(tab.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                  selectedCategory === tab.id
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Shortcuts List */}
        <div className="p-6 overflow-y-auto space-y-3 divide-y divide-slate-100">
          {filteredShortcuts.length === 0 ? (
            <div className="text-center py-12 text-slate-400 space-y-2">
              <Keyboard className="h-10 w-10 mx-auto text-slate-300" />
              <p className="text-sm font-semibold text-slate-600">No shortcuts found</p>
              <p className="text-xs">Try searching for &quot;Sale&quot;, &quot;Purchase&quot;, &quot;Alt&quot; or clear the filter.</p>
            </div>
          ) : (
            filteredShortcuts.map((s, idx) => (
              <div
                key={s.id}
                className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 group hover:bg-slate-50/80 -mx-3 px-3 py-2.5 rounded-xl transition-colors ${
                  idx === 0 ? '' : 'pt-3'
                }`}
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 group-hover:text-rose-600 transition-colors">
                      {s.title}
                    </span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold uppercase ${
                      s.category === 'actions'
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : s.category === 'navigation'
                        ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}>
                      {s.category}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed max-w-lg">
                    {s.description}
                  </p>
                </div>

                {/* Keyboard Badges & Execution Button */}
                <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                  <div className="flex items-center gap-1 font-mono">
                    {s.keys.map((k, kIdx) => (
                      <React.Fragment key={kIdx}>
                        {kIdx > 0 && <span className="text-slate-400 text-xs font-sans">+</span>}
                        <kbd className="px-2 py-1 bg-slate-100 border border-slate-300 border-b-2 text-slate-800 rounded-md text-[11px] font-bold shadow-2xs tracking-wide">
                          {k}
                        </kbd>
                      </React.Fragment>
                    ))}
                  </div>

                  {s.handler && (
                    <button
                      type="button"
                      onClick={s.handler}
                      className="px-2.5 py-1 bg-slate-900 hover:bg-rose-600 text-white rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 active:scale-95 shadow-2xs"
                    >
                      <span>{s.actionText || 'Run'}</span>
                      <ArrowRight className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer info */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-3 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">Pro Tip:</span>
            <span>You can press <kbd className="px-1.5 py-0.5 bg-slate-200 rounded font-mono text-[10px]">Alt + H</kbd> anytime to pull up this reference guide.</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg font-bold text-xs transition-colors"
          >
            Close (Esc)
          </button>
        </div>
      </div>
    </div>
  );
};
