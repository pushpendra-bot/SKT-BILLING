import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatINR } from '../../utils/gstUtils';
import { Package, Search, Printer, Calendar, FileText } from 'lucide-react';

export const ItemLedgerView: React.FC = () => {
  const { invoices, items } = useApp();

  const [searchItemName, setSearchItemName] = useState<string>('');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');

  // Find matching invoices that contain this item
  const matchingInvoices = invoices.filter(inv => {
    if (searchItemName.trim()) {
      const hasItem = inv.items.some(it =>
        it.itemName.toLowerCase().includes(searchItemName.toLowerCase().trim())
      );
      if (!hasItem) return false;
    }

    if (fromDate && inv.date < fromDate) return false;
    if (toDate && inv.date > toDate) return false;

    return true;
  });

  // Extract item specific rows across matching invoices for detailed analysis
  const itemRows: Array<{
    invoiceId: string;
    invoiceNumber: string;
    date: string;
    partyName: string;
    type: string;
    itemName: string;
    quantity: number;
    unit: string;
    price: number;
    totalAmount: number;
  }> = [];

  matchingInvoices.forEach(inv => {
    inv.items.forEach(it => {
      if (!searchItemName.trim() || it.itemName.toLowerCase().includes(searchItemName.toLowerCase().trim())) {
        itemRows.push({
          invoiceId: inv.id,
          invoiceNumber: inv.invoiceNumber,
          date: inv.date,
          partyName: inv.partyName || 'Walk-in / Cash',
          type: inv.type,
          itemName: it.itemName,
          quantity: it.quantity,
          unit: it.unit,
          price: it.price,
          totalAmount: it.totalAmount,
        });
      }
    });
  });

  const totalQuantityUsed = itemRows.reduce((sum, r) => sum + r.quantity, 0);
  const totalValueUsed = itemRows.reduce((sum, r) => sum + r.totalAmount, 0);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header & Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 no-print">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Package className="w-7 h-7 text-rose-600" />
              Item Ledger Report
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Type or select an item name and date range to view all bills and transactions in which the item was used.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition text-sm font-medium shadow-sm"
            >
              <Printer className="w-4 h-4" />
              Print / Save PDF
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Item Name / Search
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={searchItemName}
                onChange={(e) => setSearchItemName(e.target.value)}
                placeholder="Type item name (e.g. Cement, Steel)..."
                className="w-full bg-white border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
                list="items-list"
              />
              <datalist id="items-list">
                {items.map(it => (
                  <option key={it.id} value={it.name} />
                ))}
              </datalist>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              From Date
            </label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              To Date
            </label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase">Matching Bills / Records</span>
          <p className="text-2xl font-bold text-slate-900 mt-1 font-mono">{itemRows.length}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase">Total Quantity Used</span>
          <p className="text-2xl font-bold text-rose-600 mt-1 font-mono">
            {totalQuantityUsed.toLocaleString()}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase">Total Item Value</span>
          <p className="text-2xl font-bold text-emerald-600 mt-1 font-mono">
            {formatINR(totalValueUsed)}
          </p>
        </div>
      </div>

      {/* Bills / Usage Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden print:border-none print:shadow-none">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="font-bold text-slate-900 text-base">
            {searchItemName ? `Bills for Item: "${searchItemName}"` : 'All Item Bills & Transactions'}
          </h2>
          <span className="text-xs text-slate-500">
            {fromDate || toDate ? `Period: ${fromDate || 'Start'} to ${toDate || 'Present'}` : 'All Time'}
          </span>
        </div>

        {itemRows.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-base font-medium">No bills found matching this item and date criteria.</p>
            <p className="text-xs text-slate-400 mt-1">Try typing another item name or adjusting date filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Invoice No</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Party Name</th>
                  <th className="py-3 px-4">Item Name</th>
                  <th className="py-3 px-4 text-right">Qty</th>
                  <th className="py-3 px-4">Unit</th>
                  <th className="py-3 px-4 text-right">Rate</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {itemRows.map((row, idx) => (
                  <tr key={`${row.invoiceId}-${idx}`} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-mono">{row.date}</td>
                    <td className="py-3 px-4 font-bold text-slate-900 font-mono">{row.invoiceNumber}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                        row.type === 'sale' ? 'bg-emerald-100 text-emerald-800' :
                        row.type === 'purchase' ? 'bg-indigo-100 text-indigo-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {row.type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-900">{row.partyName}</td>
                    <td className="py-3 px-4 font-semibold text-slate-950">{row.itemName}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold">{row.quantity}</td>
                    <td className="py-3 px-4 text-slate-500 uppercase">{row.unit}</td>
                    <td className="py-3 px-4 text-right font-mono">{formatINR(row.price)}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">{formatINR(row.totalAmount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
