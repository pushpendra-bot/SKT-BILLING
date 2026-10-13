import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Calendar, Users, FileText, Printer, Download, Search, CheckCircle, Clock, AlertCircle } from 'lucide-react';

export const MonthlyReportsView: React.FC = () => {
  const { invoices, parties } = useApp();

  const currentDate = new Date();
  const [selectedPartyId, setSelectedPartyId] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<string>(String(currentDate.getMonth() + 1).padStart(2, '0'));
  const [selectedYear, setSelectedYear] = useState<string>(String(currentDate.getFullYear()));

  const months = [
    { value: '01', label: 'January' },
    { value: '02', label: 'February' },
    { value: '03', label: 'March' },
    { value: '04', label: 'April' },
    { value: '05', label: 'May' },
    { value: '06', label: 'June' },
    { value: '07', label: 'July' },
    { value: '08', label: 'August' },
    { value: '09', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' },
  ];

  const years = ['2024', '2025', '2026', '2027', '2028'];

  // Filter sale invoices for the selected year and month
  const saleInvoices = invoices.filter(inv => {
    if (inv.type !== 'sale') return false;
    if (!inv.date) return false;
    const [year, month] = inv.date.split('-');
    return year === selectedYear && month === selectedMonth;
  });

  // Further filter by party if selected
  const filteredInvoices = selectedPartyId
    ? saleInvoices.filter(inv => inv.partyId === selectedPartyId)
    : saleInvoices;

  // Calculate overall totals for filtered invoices
  const totalBilled = filteredInvoices.reduce((sum, i) => sum + i.grandTotal, 0);
  const totalPaid = filteredInvoices.reduce((sum, i) => sum + (i.paidAmount || 0), 0);
  const totalUnpaid = filteredInvoices.reduce((sum, i) => sum + (i.balanceDue !== undefined ? i.balanceDue : (i.grandTotal - (i.paidAmount || 0))), 0);

  // If no party selected, group by party for summary
  const partySummaryMap = new Map<string, { partyName: string; gstin: string; count: number; billed: number; paid: number; unpaid: number }>();
  
  if (!selectedPartyId) {
    saleInvoices.forEach(inv => {
      const pId = inv.partyId || 'unknown';
      const existing = partySummaryMap.get(pId) || {
        partyName: inv.partyName || 'Walk-in Customer',
        gstin: inv.partyGstin || 'N/A',
        count: 0,
        billed: 0,
        paid: 0,
        unpaid: 0,
      };
      existing.count += 1;
      existing.billed += inv.grandTotal;
      existing.paid += (inv.paidAmount || 0);
      existing.unpaid += (inv.balanceDue !== undefined ? inv.balanceDue : (inv.grandTotal - (inv.paidAmount || 0)));
      partySummaryMap.set(pId, existing);
    });
  }

  const partySummaries = Array.from(partySummaryMap.values());

  const selectedPartyObj = parties.find(p => p.id === selectedPartyId);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header & Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 no-print">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Monthly Business Reports</h1>
            <p className="text-sm text-slate-500 mt-1">
              View monthly bill-wise breakdown, payments received, and pending balances by party or across all parties.
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

        {/* Filter Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Party Name (Optional)
            </label>
            <select
              value={selectedPartyId}
              onChange={(e) => setSelectedPartyId(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
            >
              <option value="">All Parties (Overview)</option>
              {parties.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.type.toUpperCase()})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Month
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
            >
              {months.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Financial Year
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
            >
              {years.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Billed Amount</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">₹{totalBilled.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</h3>
            <p className="text-xs text-slate-500 mt-1">{filteredInvoices.length} Sale Bills Found</p>
          </div>
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center font-bold">
            <FileText className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Amount Paid (Received)</p>
            <h3 className="text-2xl font-bold text-emerald-600 mt-1">₹{totalPaid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</h3>
            <p className="text-xs text-emerald-600 mt-1">Successfully Collected</p>
          </div>
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center font-bold">
            <CheckCircle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Amount Unpaid (Due)</p>
            <h3 className="text-2xl font-bold text-rose-600 mt-1">₹{totalUnpaid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</h3>
            <p className="text-xs text-rose-600 mt-1">Pending Balance</p>
          </div>
          <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center font-bold">
            <AlertCircle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Report Content Container */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden print:border-none print:shadow-none">
        {/* Printable Report Title Header */}
        <div className="p-6 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {selectedPartyId ? `Statement for: ${selectedPartyObj?.name || 'Selected Party'}` : 'All Parties Monthly Summary'}
              </h2>
              <p className="text-sm text-slate-600 mt-0.5">
                Period: {months.find(m => m.value === selectedMonth)?.label} {selectedYear}
              </p>
            </div>
            <div className="text-right text-xs text-slate-500">
              Generated on: {new Date().toLocaleDateString('en-IN')}
            </div>
          </div>
        </div>

        {selectedPartyId ? (
          /* Detailed Bill-wise table for Specific Party */
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 text-xs uppercase tracking-wider font-semibold border-b border-slate-200">
                  <th className="py-3 px-4">Bill No</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Items Count</th>
                  <th className="py-3 px-4 text-right">Total Amount (₹)</th>
                  <th className="py-3 px-4 text-right">Paid (₹)</th>
                  <th className="py-3 px-4 text-right">Balance Due (₹)</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm">
                {filteredInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500">
                      No sale bills found for this party in {months.find(m => m.value === selectedMonth)?.label} {selectedYear}.
                    </td>
                  </tr>
                ) : (
                  filteredInvoices.map(inv => {
                    const balance = inv.balanceDue !== undefined ? inv.balanceDue : (inv.grandTotal - (inv.paidAmount || 0));
                    return (
                      <tr key={inv.id} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-mono font-medium text-slate-900">{inv.invoiceNumber}</td>
                        <td className="py-3 px-4 text-slate-600">{inv.date}</td>
                        <td className="py-3 px-4 text-slate-600">{inv.items.length} items</td>
                        <td className="py-3 px-4 text-right font-bold text-slate-900">₹{inv.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        <td className="py-3 px-4 text-right text-emerald-600 font-medium">₹{(inv.paidAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        <td className="py-3 px-4 text-right text-rose-600 font-medium">₹{balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        <td className="py-3 px-4 text-center">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            inv.status === 'Paid' ? 'bg-emerald-100 text-emerald-800' :
                            inv.status === 'Partially Paid' ? 'bg-amber-100 text-amber-800' :
                            'bg-rose-100 text-rose-800'
                          }`}>
                            {inv.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        ) : (
          /* All Parties Summary Table */
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 text-xs uppercase tracking-wider font-semibold border-b border-slate-200">
                  <th className="py-3 px-4">Party Name</th>
                  <th className="py-3 px-4">GSTIN</th>
                  <th className="py-3 px-4 text-center">Bills Count</th>
                  <th className="py-3 px-4 text-right">Total Amount (₹)</th>
                  <th className="py-3 px-4 text-right">Paid (₹)</th>
                  <th className="py-3 px-4 text-right">Unpaid (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm">
                {partySummaries.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500">
                      No transactions recorded in {months.find(m => m.value === selectedMonth)?.label} {selectedYear}.
                    </td>
                  </tr>
                ) : (
                  partySummaries.map((summary, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-semibold text-slate-900">{summary.partyName}</td>
                      <td className="py-3 px-4 font-mono text-xs text-slate-600">{summary.gstin}</td>
                      <td className="py-3 px-4 text-center text-slate-600">{summary.count}</td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900">₹{summary.billed.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      <td className="py-3 px-4 text-right text-emerald-600 font-medium">₹{summary.paid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      <td className="py-3 px-4 text-right text-rose-600 font-medium">₹{summary.unpaid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
