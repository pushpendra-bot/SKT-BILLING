import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatINR } from '../../utils/gstUtils';
import { InvoiceType, Invoice } from '../../types';
import {
  TrendingUp,
  Receipt,
  ShoppingCart,
  Users,
  Package,
  ArrowUpRight,
  ArrowDownLeft,
  AlertTriangle,
  Plus,
  Printer,
  FileCheck2,
  Zap,
  X,
  ArrowRightLeft,
  Upload,
} from 'lucide-react';

interface DashboardViewProps {
  onOpenNewInvoice: (type: InvoiceType) => void;
  onOpenNewExpense: () => void;
  onSelectSale: (invoice: Invoice) => void;
  onPrintInvoice: (invoice: Invoice) => void;
  onNavigateToTab: (tab: any) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onOpenNewInvoice,
  onOpenNewExpense,
  onSelectSale,
  onPrintInvoice,
  onNavigateToTab,
}) => {
  const { profile, parties, items, invoices, expenses, activeSlotId, slots } = useApp();
  const [isQuickActionOpen, setIsQuickActionOpen] = useState(false);

  const sales = invoices.filter(i => i.type === 'sale');
  const purchases = invoices.filter(i => i.type === 'purchase');
  const quotes = invoices.filter(i => i.type === 'quotation');

  const totalSales = sales.reduce((acc, s) => acc + s.grandTotal, 0);
  const totalPurchases = purchases.reduce((acc, p) => acc + p.grandTotal, 0);
  const totalExpenses = expenses.reduce((acc, e) => acc + e.totalAmount, 0);

  const toReceive = parties
    .filter(p => p.type === 'customer')
    .reduce((acc, p) => acc + (p.currentBalance > 0 ? p.currentBalance : 0), 0);

  const toPay = parties
    .filter(p => p.type === 'supplier')
    .reduce((acc, p) => acc + (p.currentBalance > 0 ? p.currentBalance : 0), 0);

  const totalStockValue = items.reduce((acc, i) => acc + i.currentStock * i.purchasePrice, 0);
  const lowStockItems = items.filter(i => i.currentStock <= i.minStockAlert);

  const recentInvoices = invoices.slice(0, 6);

  return (
    <div className="space-y-5">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-rose-950 text-white rounded-2xl p-5 shadow-sm border border-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-rose-400 bg-rose-950/80 px-2 py-0.5 rounded border border-rose-800">
                SLOT {activeSlotId} OF {slots.length}
              </span>
              <span className="text-xs text-slate-400">FY 2026-27</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">
              {profile.businessName || `Business Profile Slot ${activeSlotId}`}
            </h1>
            <p className="text-xs text-slate-300 mt-0.5 flex flex-wrap items-center gap-2">
              <span>GSTIN: <span className="font-mono text-white font-semibold">{profile.gstin || 'Not Configured (Click Settings)'}</span></span>
              <span>·</span>
              <span>{profile.city ? `${profile.city}, ` : ''}{profile.state} (Code: {profile.stateCode})</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenNewInvoice('sale')}
              className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold shadow-md transition-all active:scale-95"
            >
              <Plus className="h-4 w-4 stroke-[2.5]" />
              <span>+ Create Sale Bill</span>
            </button>
            <button
              onClick={() => onOpenNewInvoice('purchase')}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold shadow-md transition-all active:scale-95"
            >
              <Plus className="h-4 w-4 stroke-[2.5]" />
              <span>+ Purchase</span>
            </button>
          </div>
        </div>
      </div>

      {/* Busy 21 Import & Export Fast Bar */}
      <div className="bg-white rounded-xl p-3 border border-indigo-100 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <ArrowRightLeft className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-900">Busy 21 Data Bridge</span>
              <span className="text-[10px] font-semibold bg-indigo-50 text-indigo-700 px-1.5 py-0.2 rounded border border-indigo-200">
                Excel (.xlsx) & XML
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Import all Accounts, Stock & Bills from Busy 21, or export to Busy 21 Excel / XML
            </p>
          </div>
        </div>
        <button
          onClick={() => onNavigateToTab('busy21_data')}
          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95"
        >
          <Upload className="h-3.5 w-3.5" />
          <span>Import / Export Busy 21</span>
        </button>
      </div>

      {/* Primary KPI Grid (Vyapar Style) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Total Sales */}
        <div
          onClick={() => onNavigateToTab('sales')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Sales (Turnover)</span>
            <div className="h-7 w-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <Receipt className="h-4 w-4" />
            </div>
          </div>
          <p className="text-xl font-extrabold text-slate-900 font-mono tabular-nums mt-1">
            {formatINR(totalSales)}
          </p>
          <div className="flex items-center gap-1 mt-1 text-[11px] text-slate-500">
            <span>{sales.length} invoices issued</span>
            <ArrowUpRight className="h-3 w-3 text-emerald-500 inline" />
          </div>
        </div>

        {/* You'll Receive */}
        <div
          onClick={() => onNavigateToTab('parties')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">You'll Receive (Receivables)</span>
            <div className="h-7 w-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ArrowDownLeft className="h-4 w-4" />
            </div>
          </div>
          <p className="text-xl font-extrabold text-emerald-600 font-mono tabular-nums mt-1">
            {formatINR(toReceive)}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">From pending customer bills</span>
        </div>

        {/* You'll Pay */}
        <div
          onClick={() => onNavigateToTab('parties')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">You'll Pay (Payables)</span>
            <div className="h-7 w-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <ArrowUpRight className="h-4 w-4" />
            </div>
          </div>
          <p className="text-xl font-extrabold text-rose-600 font-mono tabular-nums mt-1">
            {formatINR(toPay)}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">To vendors & raw materials</span>
        </div>

        {/* Inventory Stock Value */}
        <div
          onClick={() => onNavigateToTab('inventory')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Stock Valuation (Cost)</span>
            <div className="h-7 w-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Package className="h-4 w-4" />
            </div>
          </div>
          <p className="text-xl font-extrabold text-slate-900 font-mono tabular-nums mt-1">
            {formatINR(totalStockValue)}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">Across {items.length} inventory items</span>
        </div>
      </div>

      {/* Second Row: Quick Actions Bar & Low Stock Warning */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Quick Launchpad (8 cols) */}
        <div className="lg:col-span-8 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Quick Accounting & Billing Actions
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <button
              onClick={() => onOpenNewInvoice('sale')}
              className="p-3 rounded-lg border border-rose-200 bg-rose-50/50 hover:bg-rose-50 text-left transition-all active:scale-95"
            >
              <div className="h-8 w-8 rounded-lg bg-rose-600 text-white flex items-center justify-center mb-2">
                <Receipt className="h-4 w-4" />
              </div>
              <span className="font-bold text-xs text-slate-900 block">+ Add Sale</span>
              <span className="text-[10px] text-slate-500">GST Tax Invoice</span>
            </button>

            <button
              onClick={() => onOpenNewInvoice('purchase')}
              className="p-3 rounded-lg border border-blue-200 bg-blue-50/50 hover:bg-blue-50 text-left transition-all active:scale-95"
            >
              <div className="h-8 w-8 rounded-lg bg-blue-600 text-white flex items-center justify-center mb-2">
                <ShoppingCart className="h-4 w-4" />
              </div>
              <span className="font-bold text-xs text-slate-900 block">+ Add Purchase</span>
              <span className="text-[10px] text-slate-500">Record Vendor Bill</span>
            </button>

            <button
              onClick={() => onOpenNewInvoice('quotation')}
              className="p-3 rounded-lg border border-amber-200 bg-amber-50/50 hover:bg-amber-50 text-left transition-all active:scale-95"
            >
              <div className="h-8 w-8 rounded-lg bg-amber-600 text-white flex items-center justify-center mb-2">
                <FileCheck2 className="h-4 w-4" />
              </div>
              <span className="font-bold text-xs text-slate-900 block">+ Quotation</span>
              <span className="text-[10px] text-slate-500">Commercial Quote</span>
            </button>

            <button
              onClick={onOpenNewExpense}
              className="p-3 rounded-lg border border-purple-200 bg-purple-50/50 hover:bg-purple-50 text-left transition-all active:scale-95"
            >
              <div className="h-8 w-8 rounded-lg bg-purple-600 text-white flex items-center justify-center mb-2">
                <TrendingUp className="h-4 w-4" />
              </div>
              <span className="font-bold text-xs text-slate-900 block">+ Add Expense</span>
              <span className="text-[10px] text-slate-500">Rent, Salary, Bills</span>
            </button>
          </div>
        </div>

        {/* Low Stock Alerts (4 cols) */}
        <div className="lg:col-span-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                Inventory Reorder Alert
              </span>
              <span className="text-[11px] font-bold text-rose-600">{lowStockItems.length} items</span>
            </div>

            {lowStockItems.length === 0 ? (
              <p className="text-xs text-slate-500 py-4">All stock levels are optimal.</p>
            ) : (
              <div className="space-y-2 mt-2">
                {lowStockItems.slice(0, 3).map(it => (
                  <div
                    key={it.id}
                    className="p-2 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between text-xs"
                  >
                    <div className="truncate max-w-[170px]">
                      <span className="font-bold text-slate-900 block truncate">{it.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono">Min: {it.minStockAlert} {it.unit}</span>
                    </div>
                    <span className="font-mono font-bold text-rose-600 text-xs">
                      {it.currentStock} {it.unit}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => onNavigateToTab('inventory')}
            className="w-full text-center text-xs font-semibold text-rose-600 hover:text-rose-700 mt-3 pt-2 border-t border-slate-100"
          >
            Manage Stock & Adjustments →
          </button>
        </div>
      </div>

      {/* Recent Transactions Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Recent GST Transactions
            </h2>
            <p className="text-[11px] text-slate-500">Sales, Quotations and Purchases</p>
          </div>
          <button
            onClick={() => onNavigateToTab('sales')}
            className="text-xs font-semibold text-rose-600 hover:text-rose-700"
          >
            View All Sales →
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 text-[11px] font-semibold">
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3">Bill / Inv #</th>
                <th className="py-2.5 px-3">Party Name</th>
                <th className="py-2.5 px-3 text-right">Taxable Val</th>
                <th className="py-2.5 px-3 text-right">Total GST</th>
                <th className="py-2.5 px-3 text-right">Amount (₹)</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3 text-center w-20">Print</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {recentInvoices.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <Receipt className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-slate-700 text-xs">No transactions in Slot {activeSlotId} yet</p>
                    <p className="text-[11px] text-slate-500 mt-0.5 mb-2">Create your first sale invoice or purchase bill to start tracking business books.</p>
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => onOpenNewInvoice('sale')}
                        className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-2xs"
                      >
                        + Create Sale Invoice
                      </button>
                      <button
                        onClick={() => onOpenNewInvoice('purchase')}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-2xs"
                      >
                        + Add Purchase Bill
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                recentInvoices.map(inv => (
                  <tr key={inv.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 px-3 font-mono text-slate-600 tabular-nums">{inv.date}</td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                          inv.type === 'sale'
                            ? 'bg-rose-50 text-rose-700'
                            : inv.type === 'purchase'
                            ? 'bg-blue-50 text-blue-700'
                            : inv.type === 'delivery_challan'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {inv.type === 'sale' ? 'Sale' : inv.type === 'purchase' ? 'Purchase' : inv.type === 'delivery_challan' ? 'Challan' : 'Quotation'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{inv.invoiceNumber}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-800">{inv.partyName}</td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-600">
                      {formatINR(inv.totalTaxable)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-600">
                      {formatINR(inv.totalTax)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums font-bold text-slate-900">
                      {formatINR(inv.grandTotal)}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                          inv.status === 'Paid'
                            ? 'bg-emerald-50 text-emerald-700'
                            : inv.status === 'Partially Paid'
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-rose-50 text-rose-700'
                        }`}
                      >
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        onClick={() => onPrintInvoice(inv)}
                        className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
                        title="Print Invoice"
                      >
                        <Printer className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Floating Quick Action Button (FAB) */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end">
        {isQuickActionOpen && (
          <div className="mb-3 bg-slate-900 text-white rounded-2xl shadow-2xl border border-slate-700 p-2 w-64 space-y-1.5 animate-in fade-in slide-in-from-bottom-3 duration-200">
            <div className="px-3 py-2 border-b border-slate-800 flex items-center justify-between">
              <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5" /> Quick Actions
              </span>
              <button
                onClick={() => setIsQuickActionOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            <button
              onClick={() => {
                setIsQuickActionOpen(false);
                onNavigateToTab('parties');
              }}
              className="w-full text-left px-3 py-2 hover:bg-slate-800 rounded-xl text-xs font-semibold flex items-center gap-2 text-slate-200 transition-colors"
            >
              <Users className="h-4 w-4 text-emerald-400" />
              <span>+ Add New Party / Customer</span>
            </button>

            <button
              onClick={() => {
                setIsQuickActionOpen(false);
                onNavigateToTab('inventory');
              }}
              className="w-full text-left px-3 py-2 hover:bg-slate-800 rounded-xl text-xs font-semibold flex items-center gap-2 text-slate-200 transition-colors"
            >
              <Package className="h-4 w-4 text-indigo-400" />
              <span>+ Add New Product / Item</span>
            </button>

            <button
              onClick={() => {
                setIsQuickActionOpen(false);
                onOpenNewExpense();
              }}
              className="w-full text-left px-3 py-2 hover:bg-slate-800 rounded-xl text-xs font-semibold flex items-center gap-2 text-slate-200 transition-colors"
            >
              <Receipt className="h-4 w-4 text-amber-400" />
              <span>+ Record New Expense</span>
            </button>

            <button
              onClick={() => {
                setIsQuickActionOpen(false);
                onOpenNewInvoice('sale');
              }}
              className="w-full text-left px-3 py-2 hover:bg-slate-800 rounded-xl text-xs font-semibold flex items-center gap-2 text-slate-200 transition-colors"
            >
              <Plus className="h-4 w-4 text-rose-400" />
              <span>+ Create Sale Invoice</span>
            </button>

            <button
              onClick={() => {
                setIsQuickActionOpen(false);
                onOpenNewInvoice('purchase');
              }}
              className="w-full text-left px-3 py-2 hover:bg-slate-800 rounded-xl text-xs font-semibold flex items-center gap-2 text-slate-200 transition-colors"
            >
              <ShoppingCart className="h-4 w-4 text-blue-400" />
              <span>+ Create Purchase Bill</span>
            </button>
          </div>
        )}

        <button
          onClick={() => setIsQuickActionOpen(!isQuickActionOpen)}
          className="flex items-center gap-2 px-5 py-3.5 bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white rounded-full shadow-2xl font-bold text-xs transition-all transform hover:scale-105 active:scale-95 border border-white/20 group"
          title="Quick Actions"
        >
          {isQuickActionOpen ? (
            <>
              <X className="h-5 w-5" />
              <span>Close</span>
            </>
          ) : (
            <>
              <Zap className="h-5 w-5 text-amber-300 animate-pulse group-hover:rotate-12 transition-transform" />
              <span>Quick Action</span>
              <span className="ml-1 w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
