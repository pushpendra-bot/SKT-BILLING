import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatINR } from '../../utils/gstUtils';
import { Users, Search, Printer, Calendar, FileText } from 'lucide-react';

export const PartyLedgerView: React.FC = () => {
  const { invoices, parties } = useApp();

  const [searchPartyName, setSearchPartyName] = useState<string>('');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');

  // Filter invoices for this party and date range
  const partyInvoices = invoices.filter(inv => {
    if (searchPartyName.trim()) {
      const pName = inv.partyName || '';
      if (!pName.toLowerCase().includes(searchPartyName.toLowerCase().trim())) {
        return false;
      }
    }

    if (fromDate && inv.date < fromDate) return false;
    if (toDate && inv.date > toDate) return false;

    return true;
  });

  const totalBilled = partyInvoices.reduce((sum, i) => sum + i.grandTotal, 0);
  const totalPaid = partyInvoices.reduce((sum, i) => sum + (i.paidAmount || 0), 0);
  const totalRemaining = partyInvoices.reduce((sum, i) => sum + (i.balanceDue !== undefined ? i.balanceDue : (i.grandTotal - (i.paidAmount || 0))), 0);

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
              <Users className="w-7 h-7 text-rose-600" />
              Party Ledger Report
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Enter party name and date range to view all bills made with that party, total amount, paid amount, and remaining balance due.
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
              Party Name / Search
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={searchPartyName}
                onChange={(e) => setSearchPartyName(e.target.value)}
                placeholder="Type party name..."
                className="w-full bg-white border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
                list="parties-list"
              />
              <datalist id="parties-list">
                {parties.map(p => (
                  <option key={p.id} value={p.name} />
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
          <span className="text-xs font-semibold text-slate-500 uppercase">Total Billed Amount</span>
          <p className="text-2xl font-bold text-slate-900 mt-1 font-mono">{formatINR(totalBilled)}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase">Total Amount Paid</span>
          <p className="text-2xl font-bold text-emerald-600 mt-1 font-mono">
            {formatINR(totalPaid)}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase">Total Remaining (Due)</span>
          <p className="text-2xl font-bold text-rose-600 mt-1 font-mono">
            {formatINR(totalRemaining)}
          </p>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden print:border-none print:shadow-none">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="font-bold text-slate-900 text-base">
            {searchPartyName ? `Bills for Party: "${searchPartyName}"` : 'All Party Bills & Transactions'}
          </h2>
          <span className="text-xs text-slate-500">
            {fromDate || toDate ? `Period: ${fromDate || 'Start'} to ${toDate || 'Present'}` : 'All Time'}
          </span>
        </div>

        {partyInvoices.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-base font-medium">No bills found matching this party name and date criteria.</p>
            <p className="text-xs text-slate-400 mt-1">Try typing another party name or adjusting date filters.</p>
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
                  <th className="py-3 px-4 text-right">Total Amount</th>
                  <th className="py-3 px-4 text-right">Paid</th>
                  <th className="py-3 px-4 text-right">Remaining (Due)</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {partyInvoices.map((inv) => {
                  const paid = inv.paidAmount || 0;
                  const remaining = inv.balanceDue !== undefined ? inv.balanceDue : (inv.grandTotal - paid);
                  return (
                    <tr key={inv.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-mono">{inv.date}</td>
                      <td className="py-3 px-4 font-bold text-slate-900 font-mono">{inv.invoiceNumber}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                          inv.type === 'sale' ? 'bg-emerald-100 text-emerald-800' :
                          inv.type === 'purchase' ? 'bg-indigo-100 text-indigo-800' :
                          'bg-amber-100 text-amber-800'
                        }`}>
                          {inv.type.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-900">{inv.partyName || 'Cash / Walk-in'}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">{formatINR(inv.grandTotal)}</td>
                      <td className="py-3 px-4 text-right font-mono text-emerald-700">{formatINR(paid)}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-rose-600">{formatINR(remaining)}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          inv.status === 'Paid' ? 'bg-emerald-100 text-emerald-800' :
                          inv.status === 'Partially Paid' ? 'bg-amber-100 text-amber-800' :
                          'bg-rose-100 text-rose-800'
                        }`}>
                          {inv.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
