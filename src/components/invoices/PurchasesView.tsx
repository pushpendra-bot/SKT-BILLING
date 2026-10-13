import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Invoice } from '../../types';
import { formatINR } from '../../utils/gstUtils';
import {
  Plus,
  Search,
  Printer,
  Trash2,
  Edit2,
  ShoppingCart,
  ShieldCheck,
  Download,
  FileSpreadsheet,
} from 'lucide-react';
import {
  generateBusy21VouchersExcel,
  generateBusy21VouchersCsv,
  downloadBinaryFile,
  downloadFile,
} from '../../utils/busy21Data';

interface PurchasesViewProps {
  onOpenNewPurchase: () => void;
  onEditPurchase: (invoice: Invoice) => void;
  onPrintPurchase: (invoice: Invoice) => void;
}

export const PurchasesView: React.FC<PurchasesViewProps> = ({
  onOpenNewPurchase,
  onEditPurchase,
  onPrintPurchase,
}) => {
  const { invoices, parties, items, deleteInvoice, activeSlotId } = useApp();
  const [searchTerm, setSearchTerm] = useState('');

  const purchases = invoices.filter(inv => inv.type === 'purchase');

  const handleExportPurchasesExcel = () => {
    const buffer = generateBusy21VouchersExcel(purchases, parties, items);
    downloadBinaryFile(buffer, `Purchase_Register_All_Details_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleExportPurchasesCsv = () => {
    const csv = generateBusy21VouchersCsv(purchases, parties, items);
    downloadFile(csv, `Purchase_Register_All_Details_${new Date().toISOString().split('T')[0]}.csv`, 'text/csv');
  };

  const filteredPurchases = purchases.filter(inv => {
    return (
      inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.partyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (inv.partyGstin && inv.partyGstin.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  const totalPurchase = purchases.reduce((acc, p) => acc + p.grandTotal, 0);
  const totalITC = purchases.reduce((acc, p) => acc + p.totalTax, 0);

  const handleDelete = (id: string, num: string) => {
    if (confirm(`Delete Purchase Bill #${num}? Inventory stock will be rolled back.`)) {
      deleteInvoice(id);
    }
  };

  return (
    <div className="space-y-4 font-sans">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Purchase Bills</h1>
          <p className="text-xs text-slate-500">
            GST purchase register with Name of the Party, Date, Invoice/Bill No, and GST Type breakdown
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleExportPurchasesExcel}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition-all active:scale-95 cursor-pointer"
            title="Export all purchase bills with complete party & item details to MS-Excel (.xlsx)"
          >
            <FileSpreadsheet className="h-4 w-4" />
            <span>Export Excel</span>
          </button>

          <button
            type="button"
            onClick={handleExportPurchasesCsv}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-xs font-bold border border-emerald-200 transition-all active:scale-95 cursor-pointer"
            title="Export all purchase bills to CSV spreadsheet"
          >
            <Download className="h-4 w-4 text-emerald-600" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={onOpenNewPurchase}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="h-4 w-4 stroke-[2.5]" />
            <span>+ Add Purchase Bill</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200">
          <span className="text-[11px] font-medium text-slate-500">Total Inward Purchases</span>
          <p className="text-lg font-bold text-slate-900 font-mono tabular-nums mt-0.5">
            {formatINR(totalPurchase)}
          </p>
          <span className="text-[10px] text-slate-400">{purchases.length} purchase bills recorded in Slot {activeSlotId}</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200">
          <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
            <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />
            Eligible Input Tax Credit (ITC)
          </span>
          <p className="text-lg font-bold text-blue-600 font-mono tabular-nums mt-0.5">
            {formatINR(totalITC)}
          </p>
          <span className="text-[10px] text-blue-600">Available to offset against GST sales liability</span>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white p-3 rounded-xl border border-slate-200">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search by vendor bill number, supplier name or GSTIN..."
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
          />
        </div>
      </div>

      {/* Busy 21 Clean Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-700 border-b border-slate-200 text-[11px] font-bold">
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Bill #</th>
                <th className="py-2.5 px-3 min-w-[200px]">Name of the Party</th>
                <th className="py-2.5 px-3">GST Type</th>
                <th className="py-2.5 px-3 text-right">Taxable Val</th>
                <th className="py-2.5 px-3 text-right">ITC (Tax)</th>
                <th className="py-2.5 px-3 text-right">Total Bill (₹)</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3 text-center w-28">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredPurchases.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-14 text-center text-slate-400">
                    <ShoppingCart className="h-10 w-10 mx-auto mb-2 text-slate-300" />
                    <p className="font-bold text-slate-700 text-sm">No purchase bills in Slot {activeSlotId} yet</p>
                    <p className="text-xs text-slate-500 mt-1 mb-3">Record vendor bills with party name, date, bill no, and GST type.</p>
                    <button
                      onClick={onOpenNewPurchase}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all active:scale-95"
                    >
                      <Plus className="h-4 w-4 stroke-[2.5]" />
                      <span>Add Purchase Bill</span>
                    </button>
                  </td>
                </tr>
              ) : (
                filteredPurchases.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 px-3 font-mono text-slate-700 tabular-nums">{p.date}</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-blue-700">{p.invoiceNumber}</td>
                    <td className="py-2.5 px-3 font-bold text-slate-900">{p.partyName}</td>
                    <td className="py-2.5 px-3 text-[11px] font-semibold text-slate-700">
                      {p.gstType || (p.isInterState ? 'Inter-State (IGST)' : 'Intra-State (CGST + SGST)')}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-600">
                      {formatINR(p.totalTaxable)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-600">
                      {formatINR(p.totalTax)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums font-bold text-slate-900">
                      {formatINR(p.grandTotal)}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                          p.status === 'Paid'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => onPrintPurchase(p)}
                          className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
                          title="Print Purchase Bill"
                        >
                          <Printer className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => onEditPurchase(p)}
                          className="p-1 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded transition-colors"
                          title="Edit Purchase Bill"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(p.id, p.invoiceNumber)}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded transition-colors"
                          title="Delete Bill"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
