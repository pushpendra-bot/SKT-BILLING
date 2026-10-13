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
  Receipt,
  Download,
  FileSpreadsheet,
} from 'lucide-react';
import {
  generateBusy21VouchersExcel,
  generateBusy21VouchersCsv,
  downloadBinaryFile,
  downloadFile,
} from '../../utils/busy21Data';

interface SalesViewProps {
  onOpenNewSale: () => void;
  onEditSale: (invoice: Invoice) => void;
  onPrintSale: (invoice: Invoice) => void;
}

export const SalesView: React.FC<SalesViewProps> = ({
  onOpenNewSale,
  onEditSale,
  onPrintSale,
}) => {
  const { invoices, parties, items, deleteInvoice, activeSlotId } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Paid' | 'Unpaid' | 'Partially Paid'>('All');

  // Filter only sales
  const sales = invoices.filter(inv => inv.type === 'sale');

  const handleExportSalesExcel = () => {
    const buffer = generateBusy21VouchersExcel(sales, parties, items);
    downloadBinaryFile(buffer, `Sales_Register_All_Details_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleExportSalesCsv = () => {
    const csv = generateBusy21VouchersCsv(sales, parties, items);
    downloadFile(csv, `Sales_Register_All_Details_${new Date().toISOString().split('T')[0]}.csv`, 'text/csv');
  };

  const filteredSales = sales.filter(inv => {
    const matchesSearch =
      inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.partyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (inv.partyGstin && inv.partyGstin.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'All' || inv.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const totalSaleAmount = sales.reduce((acc, s) => acc + s.grandTotal, 0);
  const totalReceived = sales.reduce((acc, s) => acc + s.paidAmount, 0);
  const totalPending = sales.reduce((acc, s) => acc + s.balanceDue, 0);

  const handleDelete = (id: string, num: string) => {
    if (confirm(`Are you sure you want to delete Sale Bill #${num}?`)) {
      deleteInvoice(id);
    }
  };

  return (
    <div className="space-y-4 font-sans">
      {/* Top Header & Metrics */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Sale Bills</h1>
          <p className="text-xs text-slate-500">
            GST sales register with Name of the Party, Date, Invoice No, and GST Type breakdown
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleExportSalesExcel}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition-all active:scale-95 cursor-pointer"
            title="Export all sales bills with complete party & item details to MS-Excel (.xlsx)"
          >
            <FileSpreadsheet className="h-4 w-4" />
            <span>Export Excel</span>
          </button>

          <button
            type="button"
            onClick={handleExportSalesCsv}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-xs font-bold border border-emerald-200 transition-all active:scale-95 cursor-pointer"
            title="Export all sales bills to CSV spreadsheet"
          >
            <Download className="h-4 w-4 text-emerald-600" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={onOpenNewSale}
            className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="h-4 w-4 stroke-[2.5]" />
            <span>+ Add Sale Bill</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200">
          <span className="text-[11px] font-medium text-slate-500">Total Sales Turnover</span>
          <p className="text-lg font-bold text-slate-900 font-mono tabular-nums mt-0.5">
            {formatINR(totalSaleAmount)}
          </p>
          <span className="text-[10px] text-slate-400">{sales.length} sale bills generated</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200">
          <span className="text-[11px] font-medium text-slate-500">Amount Received</span>
          <p className="text-lg font-bold text-emerald-600 font-mono tabular-nums mt-0.5">
            {formatINR(totalReceived)}
          </p>
          <span className="text-[10px] text-emerald-600">Collected into Cash / Bank</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200">
          <span className="text-[11px] font-medium text-slate-500">Balance Pending</span>
          <p className="text-lg font-bold text-rose-600 font-mono tabular-nums mt-0.5">
            {formatINR(totalPending)}
          </p>
          <span className="text-[10px] text-rose-600">Receivable from buyers</span>
        </div>
      </div>

      {/* Table Search & Filter Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search by party name, invoice number, or GSTIN..."
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg text-xs">
          {(['All', 'Paid', 'Partially Paid', 'Unpaid'] as const).map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${
                statusFilter === st
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Busy 21 Clean Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-700 border-b border-slate-200 text-[11px] font-bold">
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Invoice #</th>
                <th className="py-2.5 px-3 min-w-[200px]">Name of the Party</th>
                <th className="py-2.5 px-3">GST Type</th>
                <th className="py-2.5 px-3 text-right">Taxable Val</th>
                <th className="py-2.5 px-3 text-right">Tax Amt</th>
                <th className="py-2.5 px-3 text-right">Total (₹)</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3 text-center w-28">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-14 text-center text-slate-400">
                    <Receipt className="h-10 w-10 mx-auto mb-2 text-slate-300" />
                    <p className="font-bold text-slate-700 text-sm">No sale bills created in Slot {activeSlotId} yet</p>
                    <p className="text-xs text-slate-500 mt-1 mb-3">Create clean sale bills with party name, date, invoice no, and GST type.</p>
                    <button
                      onClick={onOpenNewSale}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all active:scale-95"
                    >
                      <Plus className="h-4 w-4 stroke-[2.5]" />
                      <span>Add Sale Bill</span>
                    </button>
                  </td>
                </tr>
              ) : (
                filteredSales.map(inv => (
                  <tr key={inv.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 px-3 font-mono text-slate-700 tabular-nums">{inv.date}</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-rose-700">{inv.invoiceNumber}</td>
                    <td className="py-2.5 px-3 font-bold text-slate-900">{inv.partyName}</td>
                    <td className="py-2.5 px-3 text-[11px] font-semibold text-slate-700">
                      {inv.gstType || (inv.isInterState ? 'Inter-State (IGST)' : 'Intra-State (CGST + SGST)')}
                    </td>
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
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : inv.status === 'Partially Paid'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => onPrintSale(inv)}
                          className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
                          title="Print / PDF Invoice"
                        >
                          <Printer className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => onEditSale(inv)}
                          className="p-1 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded transition-colors"
                          title="Edit Bill"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(inv.id, inv.invoiceNumber)}
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
