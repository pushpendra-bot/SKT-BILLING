import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { formatINR } from '../../utils/gstUtils';
import { 
  Plus, 
  Search, 
  Building2, 
  FileText, 
  ShoppingCart, 
  Receipt, 
  SlidersHorizontal,
  ChevronDown,
  Check,
  Briefcase,
  Truck,
  Database,
  ExternalLink,
  Sparkles,
  Lock,
  Crown,
  Phone,
  Clock,
  Keyboard,
  ArrowRightLeft,
} from 'lucide-react';
import { InvoiceType, BusinessSlotData } from '../../types';
import { calculateTrialInfo } from '../../utils/subscriptionUtils';

interface HeaderProps {
  onOpenNewInvoice: (type: InvoiceType) => void;
  onOpenNewExpense: () => void;
  onNavigateToSettings: () => void;
  onOpenBackupModal: () => void;
  onOpenBusy21Sync?: () => void;
  onOpenHotkeysModal?: () => void;
  onOpenSubscription?: () => void;
  onPromptSlotUnlock?: (slot: BusinessSlotData) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenNewInvoice,
  onOpenNewExpense,
  onNavigateToSettings,
  onOpenBackupModal,
  onOpenBusy21Sync,
  onOpenHotkeysModal,
  onOpenSubscription,
  onPromptSlotUnlock,
  searchQuery,
  setSearchQuery,
}) => {
  const {
    profile,
    parties,
    invoices,
    slots,
    activeSlotId,
    setActiveSlotId,
    unlockedSlotIds,
    subscription,
  } = useApp();
  const [isSlotDropdownOpen, setIsSlotDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleSelectSlot = (slot: BusinessSlotData) => {
    setIsSlotDropdownOpen(false);
    if (slot.slotId === activeSlotId) return;

    if (slot.password && !unlockedSlotIds.includes(slot.slotId)) {
      if (onPromptSlotUnlock) {
        onPromptSlotUnlock(slot);
      } else {
        alert('This slot is password protected. Please unlock it from settings.');
      }
    } else {
      setActiveSlotId(slot.slotId);
    }
  };

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsSlotDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Calculate To Receive & To Pay
  const toReceive = parties
    .filter(p => p.type === 'customer')
    .reduce((acc, p) => acc + (p.currentBalance > 0 ? p.currentBalance : 0), 0);

  const toPay = parties
    .filter(p => p.type === 'supplier')
    .reduce((acc, p) => acc + (p.currentBalance > 0 ? p.currentBalance : 0), 0);

  const currentSlot = slots.find(s => s.slotId === activeSlotId) || slots[0];

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 no-print">
      {/* Top Branding & Quick Actions Row */}
      <div className="px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* Left: App Wordmark & 5 Business Profile Slot Switcher */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-rose-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
              SKT
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 text-base tracking-tight">SKT BILLING</span>
                <span className="text-[11px] font-semibold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                  GST PRO
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Multi-Firm GST Billing & Accounting
              </p>
            </div>
          </div>

          {/* Business Profile Slot Switcher Dropdown */}
          <div className="relative ml-2" ref={dropdownRef}>
            <button
              onClick={() => setIsSlotDropdownOpen(!isSlotDropdownOpen)}
              className="flex items-center gap-2 px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 transition-colors shadow-2xs max-w-[240px] md:max-w-[280px]"
              title={`Switch between ${slots.length} Business Profile Slots`}
            >
              <Briefcase className="h-3.5 w-3.5 text-rose-600 shrink-0" />
              <div className="text-left truncate">
                <span className="text-[10px] text-slate-500 font-medium block">
                  Slot {activeSlotId} of {slots.length}
                </span>
                <span className="truncate block font-bold text-slate-900 leading-tight">
                  {profile.businessName || `Business Slot ${activeSlotId}`}
                </span>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400 shrink-0 ml-1" />
            </button>

            {/* Dropdown Menu */}
            {isSlotDropdownOpen && (
              <div className="absolute left-0 mt-1 w-72 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95">
                <div className="px-3 py-1.5 border-b border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    {slots.length} Business Profile Slots
                  </span>
                  <button
                    onClick={() => {
                      setIsSlotDropdownOpen(false);
                      onNavigateToSettings();
                    }}
                    className="text-[11px] text-rose-600 hover:text-rose-700 font-semibold"
                  >
                    Edit All
                  </button>
                </div>

                <div className="py-1">
                  {slots.map(slot => {
                    const isSelected = slot.slotId === activeSlotId;
                    return (
                      <button
                        key={slot.slotId}
                        onClick={() => handleSelectSlot(slot)}
                        className={`w-full px-3 py-2 text-left flex items-center justify-between transition-colors ${
                          isSelected
                            ? 'bg-rose-50 text-rose-900 font-semibold'
                            : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="truncate pr-2">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-200 text-slate-700 font-mono font-bold">
                              Slot {slot.slotId}
                            </span>
                            {slot.password && (
                              <span title="Password Protected Slot" className="text-amber-600">
                                <Lock className="h-3 w-3" />
                              </span>
                            )}
                            <span className="text-xs truncate font-bold text-slate-900">
                              {slot.profile.businessName || `Business Slot ${slot.slotId}`}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 mt-0.5 truncate font-mono">
                            {slot.profile.gstin ? `GST: ${slot.profile.gstin}` : 'No GSTIN set yet'} · {slot.parties.length} parties
                          </p>
                        </div>
                        {isSelected && (
                          <Check className="h-4 w-4 text-rose-600 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Center: Universal Search */}
        <div className="flex-1 max-w-sm mx-2 hidden lg:block">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search party name, bill #, phone or item..."
              className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white transition-colors"
            />
          </div>
        </div>

        {/* Right: Key Vyapar Quick Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Quick Balance Indicators */}
          <div className="hidden xl:flex items-center gap-3 px-3 py-1 bg-slate-50 rounded-lg border border-slate-200 text-xs">
            <div>
              <span className="text-slate-500 text-[11px]">To Receive:</span>{' '}
              <span className="font-semibold text-emerald-600 font-mono tabular-nums">{formatINR(toReceive)}</span>
            </div>
            <div className="w-px h-4 bg-slate-300"></div>
            <div>
              <span className="text-slate-500 text-[11px]">To Pay:</span>{' '}
              <span className="font-semibold text-rose-600 font-mono tabular-nums">{formatINR(toPay)}</span>
            </div>
          </div>

          {/* Sale Bill Button */}
          <button
            onClick={() => onOpenNewInvoice('sale')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-sm hover:shadow transition-all whitespace-nowrap active:scale-95"
            title="Create Sale Bill"
          >
            <Plus className="h-4 w-4 stroke-[2.5]" />
            <span>Sale Bill</span>
          </button>

          {/* Purchase Bill Button */}
          <button
            onClick={() => onOpenNewInvoice('purchase')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm hover:shadow transition-all whitespace-nowrap active:scale-95"
            title="Add Purchase Bill"
          >
            <ShoppingCart className="h-3.5 w-3.5" />
            <span>Purchase Bill</span>
          </button>

          {/* Quotation Button */}
          <button
            onClick={() => onOpenNewInvoice('quotation')}
            className="hidden md:flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium border border-slate-200 transition-colors whitespace-nowrap"
            title="Create Quotation"
          >
            <FileText className="h-3.5 w-3.5 text-slate-500" />
            <span>Quotation</span>
          </button>

          {/* Delivery Challan Button */}
          <button
            onClick={() => onOpenNewInvoice('delivery_challan')}
            className="hidden lg:flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-xs font-semibold border border-emerald-200 transition-colors whitespace-nowrap"
            title="Issue Delivery Challan"
          >
            <Truck className="h-3.5 w-3.5 text-emerald-600" />
            <span>Challan</span>
          </button>

          {/* Add Expense Button */}
          <button
            onClick={onOpenNewExpense}
            className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium border border-slate-200 transition-colors whitespace-nowrap"
            title="Record Business Expense"
          >
            <Receipt className="h-3.5 w-3.5 text-slate-500" />
            <span>Expense</span>
          </button>

          {/* Backup & Restore Button */}
          <button
            onClick={onOpenBackupModal}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold border border-slate-200 transition-colors whitespace-nowrap active:scale-95"
            title="Secure Data Backup & Restore (JSON Download / Upload)"
          >
            <Database className="h-3.5 w-3.5 text-rose-600" />
            <span className="hidden md:inline">Backup</span>
          </button>

          {/* Busy 21 Data Sync Button */}
          {onOpenBusy21Sync && (
            <button
              onClick={onOpenBusy21Sync}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold border border-indigo-200 transition-colors whitespace-nowrap active:scale-95"
              title="Busy 21 Data Export & Import (Ctrl+B)"
            >
              <ArrowRightLeft className="h-3.5 w-3.5 text-indigo-600" />
              <span className="hidden lg:inline">Busy 21 Import/Export</span>
            </button>
          )}

          {/* Global Hotkeys Button */}
          {onOpenHotkeysModal && (
            <button
              onClick={onOpenHotkeysModal}
              className="flex items-center gap-1.5 px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold border border-slate-200 transition-colors whitespace-nowrap active:scale-95"
              title="Global Hotkeys Reference Panel (Alt+H)"
            >
              <Keyboard className="h-3.5 w-3.5 text-slate-600" />
              <span className="hidden xl:inline">Hotkeys (Alt+H)</span>
            </button>
          )}

          {/* Subscription Option Button */}
          {onOpenSubscription && (() => {
            const trialInfo = calculateTrialInfo(subscription);
            return (
              <button
                onClick={onOpenSubscription}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-2xs whitespace-nowrap active:scale-95 ${
                  subscription.isCreatorFree
                    ? 'bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-300'
                    : subscription.status === 'active'
                    ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-300'
                }`}
                title="7 Days Free Trial · Then ₹1,000 / Year · For Subscription Contact 9983854821"
              >
                <Crown className="h-3.5 w-3.5 text-amber-600" />
                <span className="hidden sm:inline">
                  {subscription.isCreatorFree
                    ? 'Creator VIP Free'
                    : subscription.status === 'active'
                    ? `Subscription left for ${trialInfo.daysRemaining} days`
                    : trialInfo.isExpired
                    ? 'Subscription Expired'
                    : `Trial left for ${trialInfo.daysRemaining} days`}
                </span>
                <span className="sm:hidden">Plan</span>
              </button>
            );
          })()}

          {/* Settings & Tools */}
          <button
            onClick={onNavigateToSettings}
            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            title="5 Business Profiles, Customer Care & Settings"
          >
            <SlidersHorizontal className="h-4 w-4" />
          </button>

          {/* Developer & Creator: Pushpendra Singh Raika with Link to https://skt-intelligence.ai.studio/ */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200 ml-1">
            <div className="text-right hidden 2xl:block leading-tight">
              <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-tight">Developer & Creator</span>
              <span className="text-xs font-bold text-slate-900 block">Pushpendra Singh Raika</span>
            </div>

            <a
              href="https://skt-intelligence.ai.studio/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gradient-to-r from-rose-600 via-pink-600 to-indigo-600 hover:from-rose-700 hover:to-indigo-700 text-white rounded-lg text-xs font-bold shadow-xs hover:shadow transition-all whitespace-nowrap active:scale-95 group"
              title="Creator: Pushpendra Singh Raika — Explore more AI innovations at SKT Intelligence (https://skt-intelligence.ai.studio/)"
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-300 animate-pulse" />
              <span className="hidden sm:inline">More from Creator</span>
              <span className="sm:hidden">Creator</span>
              <ExternalLink className="h-3 w-3 opacity-90 group-hover:translate-x-0.5 transition-transform" />
            </a>
          </div>
        </div>
      </div>
    </header>
  );
};

