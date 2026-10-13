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
  ArrowRight,
  Truck,
  CheckCircle2,
  FileSpreadsheet,
  Download,
} from 'lucide-react';
import {
  generateBusy21VouchersExcel,
  generateBusy21VouchersCsv,
  downloadBinaryFile,
  downloadFile,
} from '../../utils/busy21Data';

interface DeliveryChallansViewProps {
  onOpenNewChallan: () => void;
  onEditChallan: (invoice: Invoice) => void;
  onPrintChallan: (invoice: Invoice) => void;
}

export const DeliveryChallansView: React.FC<DeliveryChallansViewProps> = ({
  onOpenNewChallan,
  onEditChallan,
  onPrintChallan,
}) => {
  const { invoices, parties, items, convertChallanToSale, deleteInvoice, activeSlotId } = useApp();
  const [searchTerm, setSearchTerm] = useState('');

  const challans = invoices.filter(inv => inv.type === 'delivery_challan');

  const handleExportChallansExcel = () => {
    const buffer = generateBusy21VouchersExcel(challans, parties, items);
    downloadBinaryFile(buffer, `Delivery_Challans_All_Details_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleExportChallansCsv = () => {
    const csv = generateBusy21VouchersCsv(challans, parties, items);
    downloadFile(csv, `Delivery_Challans_All_Details_${new Date().toISOString().split('T')[0]}.csv`, 'text/csv');
  };

  const filteredChallans = challans.filter(inv => {
    return (
      inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.partyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (inv.partyGstin && inv.partyGstin.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  const totalChallanValue = challans.reduce((acc, c) => acc + c.grandTotal, 0);

  const handleConvert = (challanId: string, challanNum: string) => {
    if (confirm(`Convert Delivery Challan #${challanNum} into a formal Sale Bill?`)) {
      const sale = convertChallanToSale(challanId);
      if (sale) {
        alert(`Successfully converted into Sale Bill #${sale.invoiceNumber}! You can view it under Sale Bills.`);
      }
    }
  };

  const handleDelete = (id: string, num: string) => {
    if (confirm(`Delete Delivery Challan #${num}?`)) {
      deleteInvoice(id);
    }
  };

  return (
    <div className="space-y-4 font-sans">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Delivery Challans</h1>
          <p className="text-xs text-slate-500">
            GST delivery challan register with complete Party details, Line Items, and Despatch records
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleExportChallansExcel}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition-all active:scale-95 cursor-pointer"
            title="Export all delivery challans with complete party & item details to MS-Excel (.xlsx)"
          >
            <FileSpreadsheet className="h-4 w-4" />
            <span>Export Excel</span>
          </button>

          <button
            type="button"
            onClick={handleExportChallansCsv}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-xs font-bold border border-emerald-200 transition-all active:scale-95 cursor-pointer"
            title="Export all delivery challans to CSV"
          >
            <Download className="h-4 w-4 text-emerald-600" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={onOpenNewChallan}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="h-4 w-4 stroke-[2.5]" />
            <span>+ Add Delivery Challan</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200">
          <span className="text-[11px] font-medium text-slate-500">Total Goods Dispatched on Challan</span>
          <p className="text-lg font-bold text-slate-900 font-mono tabular-nums mt-0.5">
            {formatINR(totalChallanValue)}
          </p>
          <span className="text-[10px] text-slate-400">{challans.length} delivery challans issued</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200">
          <span className="text-[11px] font-medium text-slate-500">Converted to Sale Bills</span>
          <p className="text-lg font-bold text-emerald-600 font-mono tabular-nums mt-0.5">
            {challans.filter(c => c.status === 'Converted').length} Challans
          </p>
          <span className="text-[10px] text-emerald-600">Billed to customers</span>
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
            placeholder="Search by challan number or party name..."
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
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
                <th className="py-2.5 px-3">Challan #</th>
                <th className="py-2.5 px-3 min-w-[200px]">Name of the Party</th>
                <th className="py-2.5 px-3">GST Type</th>
                <th className="py-2.5 px-3 text-right">Taxable Val</th>
                <th className="py-2.5 px-3 text-right">Tax Amt</th>
                <th className="py-2.5 px-3 text-right">Total (₹)</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3 text-center w-36">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredChallans.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-14 text-center text-slate-400">
                    <Truck className="h-10 w-10 mx-auto mb-2 text-slate-300" />
                    <p className="font-bold text-slate-700 text-sm">No delivery challans issued in Slot {activeSlotId} yet</p>
                    <p className="text-xs text-slate-500 mt-1 mb-3">Create delivery challan with party name, date, challan no, and GST type.</p>
                    <button
                      onClick={onOpenNewChallan}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all active:scale-95"
                    >
                      <Plus className="h-4 w-4 stroke-[2.5]" />
                      <span>Add Delivery Challan</span>
                    </button>
                  </td>
                </tr>
              ) : (
                filteredChallans.map(c => (
                  <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 px-3 font-mono text-slate-700 tabular-nums">{c.date}</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-emerald-700">{c.invoiceNumber}</td>
                    <td className="py-2.5 px-3 font-bold text-slate-900">{c.partyName}</td>
                    <td className="py-2.5 px-3 text-[11px] font-semibold text-slate-700">
                      {c.gstType || (c.isInterState ? 'Inter-State (IGST)' : 'Intra-State (CGST + SGST)')}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-600">
                      {formatINR(c.totalTaxable)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-600">
                      {formatINR(c.totalTax)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums font-bold text-slate-900">
                      {formatINR(c.grandTotal)}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                          c.status === 'Converted'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        {c.status === 'Converted' ? 'Billed' : 'Dispatched'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {c.status !== 'Converted' && (
                          <button
                            onClick={() => handleConvert(c.id, c.invoiceNumber)}
                            className="flex items-center gap-1 px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded text-[11px] font-bold transition-colors"
                            title="Convert into Sale Bill"
                          >
                            <span>Bill</span>
                            <ArrowRight className="h-3 w-3" />
                          </button>
                        )}
                        <button
                          onClick={() => onPrintChallan(c)}
                          className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
                          title="Print Challan"
                        >
                          <Printer className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => onEditChallan(c)}
                          className="p-1 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded transition-colors"
                          title="Edit Challan"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(c.id, c.invoiceNumber)}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded transition-colors"
                          title="Delete Challan"
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
