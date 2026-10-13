import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  LayoutDashboard,
  Users,
  Package,
  Receipt,
  ShoppingCart,
  Wallet,
  BookOpen,
  BarChart3,
  Settings,
  FileCheck2,
  Truck,
  Calendar,
  ArrowRightLeft,
  FileSpreadsheet,
  RefreshCw,
  Tag,
  FileText,
  Lock,
  Phone,
  Mail,
  Headphones,
  MessageSquare,
  Crown,
} from 'lucide-react';
import { BusinessSlotData } from '../../types';
import { isSubscriptionActive } from '../../utils/subscriptionUtils';

export type NavTab = 
  | 'dashboard'
  | 'parties'
  | 'inventory'
  | 'sales'
  | 'quotations'
  | 'delivery_challans'
  | 'purchases'
  | 'expenses'
  | 'ledger'
  | 'reports'
  | 'monthly_reports'
  | 'item_ledger'
  | 'party_ledger'
  | 'orders_workflow'
  | 'brs'
  | 'fy_closing'
  | 'schemes'
  | 'eway'
  | 'sms_notifications'
  | 'busy21_data'
  | 'subscription'
  | 'settings';

interface SidebarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  onPromptSlotUnlock?: (slot: BusinessSlotData) => void;
  partiesCount: number;
  itemsCount: number;
  salesCount: number;
  quotationsCount: number;
  challansCount: number;
  purchasesCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  onPromptSlotUnlock,
  partiesCount,
  itemsCount,
  salesCount,
  quotationsCount,
  challansCount,
  purchasesCount,
}) => {
  const { profile, activeSlotId, slots, setActiveSlotId, unlockedSlotIds, subscription } = useApp();
  const subscriptionActive = isSubscriptionActive(subscription);

  const restrictedTabs: NavTab[] = [
    'reports', 'monthly_reports', 'item_ledger', 'party_ledger',
    'orders_workflow', 'brs', 'fy_closing', 'sms_notifications',
    'schemes', 'eway', 'busy21_data'
  ];

  const handleNavClick = (id: NavTab) => {
    if (restrictedTabs.includes(id) && !subscriptionActive) {
      alert('Subscription required! Please take a subscription or redeem a coupon to access GST & Financial Reports, Ledgers, SMS, Schemes, Order Workflow, and Busy 21 features.');
      setActiveTab('subscription');
      return;
    }
    setActiveTab(id);
  };

  const handleSlotClick = (slotNum: number) => {
    const target = slots.find(s => s.slotId === slotNum);
    if (!target) return;
    if (target.slotId === activeSlotId) return;

    if (target.password && !unlockedSlotIds.includes(target.slotId)) {
      if (onPromptSlotUnlock) {
        onPromptSlotUnlock(target);
      } else {
        alert('This slot is password protected.');
      }
    } else {
      setActiveSlotId(slotNum);
    }
  };

  const navItems = [
    {
      id: 'dashboard' as NavTab,
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      id: 'parties' as NavTab,
      label: 'Parties',
      icon: Users,
      badge: partiesCount,
    },
    {
      id: 'inventory' as NavTab,
      label: 'Items / Inventory',
      icon: Package,
      badge: itemsCount,
    },
    {
      id: 'sales' as NavTab,
      label: 'Sale Bills',
      icon: Receipt,
      badge: salesCount,
    },
    {
      id: 'quotations' as NavTab,
      label: 'Quotations',
      icon: FileCheck2,
      badge: quotationsCount,
    },
    {
      id: 'delivery_challans' as NavTab,
      label: 'Delivery Challan',
      icon: Truck,
      badge: challansCount,
    },
    {
      id: 'purchases' as NavTab,
      label: 'Purchase Bills',
      icon: ShoppingCart,
      badge: purchasesCount,
    },
    {
      id: 'expenses' as NavTab,
      label: 'Expenses',
      icon: Wallet,
    },
    {
      id: 'ledger' as NavTab,
      label: 'General Ledger',
      icon: BookOpen,
    },
    {
      id: 'reports' as NavTab,
      label: 'GST & Financial Reports',
      icon: BarChart3,
    },
    {
      id: 'monthly_reports' as NavTab,
      label: 'Monthly Party Reports',
      icon: Calendar,
    },
    {
      id: 'item_ledger' as NavTab,
      label: 'Item Ledger Report',
      icon: Package,
    },
    {
      id: 'party_ledger' as NavTab,
      label: 'Party Ledger Report',
      icon: Users,
    },
    {
      id: 'orders_workflow' as NavTab,
      label: 'Order Workflow',
      icon: ArrowRightLeft,
    },
    {
      id: 'brs' as NavTab,
      label: 'Bank Reconciliation',
      icon: FileSpreadsheet,
    },
    {
      id: 'fy_closing' as NavTab,
      label: 'FY Closing & Carry-Forward',
      icon: RefreshCw,
    },
    {
      id: 'sms_notifications' as NavTab,
      label: 'SMS Notifications',
      icon: MessageSquare,
    },
    {
      id: 'schemes' as NavTab,
      label: 'Schemes & Discounts',
      icon: Tag,
    },
    {
      id: 'eway' as NavTab,
      label: 'E-Way Bill & E-Invoice',
      icon: FileText,
    },
    {
      id: 'busy21_data' as NavTab,
      label: 'Busy 21 Import & Export',
      icon: ArrowRightLeft,
    },
    {
      id: 'subscription' as NavTab,
      label: 'Subscription (₹1000/yr)',
      icon: Crown,
    },
    {
      id: 'settings' as NavTab,
      label: `${slots.length} Business Profiles`,
      icon: Settings,
    },
  ];

  return (
    <aside className="w-60 bg-white border-r border-slate-200 flex flex-col shrink-0 min-h-[calc(100vh-53px)] select-none no-print">
      {/* Active Business Slot Widget */}
      <div className="p-3 border-b border-slate-100 bg-slate-50/60">
        <div className="flex items-center justify-between text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-1">
          <span>Active Company</span>
          <span className="font-mono text-rose-600 font-bold">Slot {activeSlotId}/{slots.length}</span>
        </div>
        <div className="text-xs font-bold text-slate-900 truncate">
          {profile.businessName || `Business Slot ${activeSlotId}`}
        </div>
        <div className="grid grid-cols-6 gap-1 mt-2">
          {slots.map(slotData => {
            const slotNum = slotData.slotId;
            const isProtected = Boolean(slotData.password);
            const isCurrent = slotNum === activeSlotId;

            return (
              <button
                key={slotNum}
                onClick={() => handleSlotClick(slotNum)}
                className={`flex-1 py-1 text-[10px] font-bold rounded transition-all relative flex items-center justify-center gap-0.5 ${
                  isCurrent
                    ? 'bg-rose-600 text-white shadow-2xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
                title={`Switch to Business Profile Slot ${slotNum}${isProtected ? ' (Password Protected)' : ''}`}
              >
                <span>S{slotNum}</span>
                {isProtected && (
                  <Lock className={`h-2.5 w-2.5 ${isCurrent ? 'text-amber-200' : 'text-amber-600'}`} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-3 flex-1 overflow-y-auto">
        <div className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase px-3 py-1">
          Menu
        </div>
        <nav className="space-y-0.5 mt-1">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const isRestricted = restrictedTabs.includes(item.id) && !subscriptionActive;

            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-colors text-left ${
                  isActive
                    ? 'bg-rose-50 text-rose-700 font-semibold'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <Icon
                    className={`h-4 w-4 shrink-0 ${
                      isActive ? 'text-rose-600' : 'text-slate-400'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                  {isRestricted && (
                    <span title="Subscription required">
                      <Lock className="h-3 w-3 text-amber-600 shrink-0 ml-1" />
                    </span>
                  )}
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full tabular-nums ${
                      isActive
                        ? 'bg-rose-200 text-rose-800'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Customer Care Sidebar Card */}
      <div className="p-3 mx-3 mb-2 bg-gradient-to-br from-indigo-50 to-rose-50 rounded-xl border border-indigo-200/70 text-xs">
        <div className="flex items-center gap-1.5 font-bold text-slate-900 text-[11px] mb-1">
          <Headphones className="h-3.5 w-3.5 text-indigo-600" />
          <span>Customer Care Support</span>
        </div>
        <p className="text-[10px] text-slate-500 mb-1.5">Chatack Enterprises Helpline</p>
        <div className="space-y-1 text-[11px] font-mono">
          <a
            href="tel:8278644090"
            className="flex items-center gap-1 text-emerald-700 font-bold hover:underline"
          >
            <Phone className="h-3 w-3" />
            <span>8278644090</span>
          </a>
          <a
            href="tel:9983854821"
            className="flex items-center gap-1 text-indigo-700 font-bold hover:underline"
          >
            <Phone className="h-3 w-3" />
            <span>9983854821</span>
          </a>
          <a
            href="mailto:chatackenterprises@gmail.com"
            className="flex items-center gap-1 text-slate-600 hover:text-rose-600 truncate text-[10px]"
            title="chatackenterprises@gmail.com"
          >
            <Mail className="h-3 w-3 shrink-0" />
            <span className="truncate">chatackenterprises@gmail.com</span>
          </a>
        </div>
      </div>

      {/* Bottom Compliance Badge */}
      <div className="p-3 mx-3 mb-3 bg-slate-50 rounded-lg border border-slate-200 text-[11px] text-slate-600">
        <div className="font-semibold text-slate-800 mb-0.5 flex items-center justify-between">
          <span>GST Rule 46 Compliant</span>
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
        </div>
        <p className="text-[10px] text-slate-500 leading-tight">
          Intra/Inter-State Tax Splitting, HSN/SAC code tracking & E-Way ready.
        </p>
      </div>
    </aside>
  );
};

